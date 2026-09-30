'use server'
import { revalidatePath } from 'next/cache'
import { db } from '../lib/supabase'

export type LoanInput = {
  name: string
  dept: string
  phone: string
  due: string
  itemIds: string[]
  signature: string
  checklistOut?: string[]
  photoOut?: string // Base64 image
  notesOut?: string
}

export async function createLoan(input: LoanInput): Promise<{ error?: string }> {
  try {
    // 1. Upload signature
    const sigPath = `out/${crypto.randomUUID()}.png`
    const png = Buffer.from(input.signature.split(',')[1], 'base64')
    const upSig = await db.storage.from('signatures').upload(sigPath, png, { contentType: 'image/png' })
    if (upSig.error) return { error: `Upload tanda tangan gagal: ${upSig.error.message}` }

    // 2. Upload pre-loan photo if present
    let photoOutPath: string | null = null
    if (input.photoOut && input.photoOut.includes(',')) {
      const mimeMatch = input.photoOut.match(/^data:([^;]+);base64,/)
      const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg'
      const ext = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg'
      photoOutPath = `photos/out/${crypto.randomUUID()}.${ext}`
      const photoBuf = Buffer.from(input.photoOut.split(',')[1], 'base64')
      const upPhoto = await db.storage.from('signatures').upload(photoOutPath, photoBuf, { contentType: mime })
      if (upPhoto.error) {
        console.error('Photo upload error:', upPhoto.error)
        // Non-blocking fallback or error: we will still proceed if signature is valid, but record error if needed
      }
    }

    const notesData = {
      checklist_out: input.checklistOut ?? [],
      photo_out_url: photoOutPath,
      notes_out: input.notesOut ?? '',
      checklist_in: null,
      photo_in_url: null,
      notes_in: '',
    }

    const { data: loan, error } = await db
      .from('loans')
      .insert({
        borrower_name: input.name,
        borrower_department: input.dept,
        borrower_phone: input.phone,
        due_date: input.due,
        signature_out_url: sigPath,
        notes: JSON.stringify(notesData),
      })
      .select('id')
      .single()
    if (error) return { error: error.message }

    const conditionText = input.notesOut ? `Kondisi: ${input.notesOut}` : 'Kondisi awal terverifikasi baik'
    const rows = input.itemIds.map((item_id) => ({
      loan_id: loan.id,
      item_id,
      condition_out: conditionText,
    }))
    const li = await db.from('loan_items').insert(rows)
    if (li.error) return { error: li.error.message }

    await db.from('items').update({ status: 'dipinjam' }).in('id', input.itemIds)
    revalidatePath('/')
    return {}
  } catch (err: any) {
    return { error: err.message || 'Terjadi kesalahan sistem' }
  }
}

export type ReturnLoanInput = {
  id: string
  checklistIn?: string[]
  photoIn?: string // Base64 image
  notesIn?: string
}

export async function completeReturnLoan(input: ReturnLoanInput): Promise<{ error?: string }> {
  try {
    const { id } = input

    // 1. Upload post-loan photo if present
    let photoInPath: string | null = null
    if (input.photoIn && input.photoIn.includes(',')) {
      const mimeMatch = input.photoIn.match(/^data:([^;]+);base64,/)
      const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg'
      const ext = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg'
      photoInPath = `photos/in/${crypto.randomUUID()}.${ext}`
      const photoBuf = Buffer.from(input.photoIn.split(',')[1], 'base64')
      const upPhoto = await db.storage.from('signatures').upload(photoInPath, photoBuf, { contentType: mime })
      if (upPhoto.error) {
        console.error('Post-loan photo upload error:', upPhoto.error)
      }
    }

    // 2. Fetch existing loan to merge notes
    const { data: existingLoan } = await db.from('loans').select('notes').eq('id', id).single()
    let parsedNotes: any = {}
    try {
      if (existingLoan?.notes) {
        parsedNotes = JSON.parse(existingLoan.notes)
      }
    } catch {
      parsedNotes = { legacy_notes: existingLoan?.notes }
    }

    parsedNotes.checklist_in = input.checklistIn ?? []
    if (photoInPath) {
      parsedNotes.photo_in_url = photoInPath
    }
    parsedNotes.notes_in = input.notesIn ?? ''

    // 3. Update loan record
    const { error: loanErr } = await db
      .from('loans')
      .update({
        status: 'selesai',
        return_date: new Date().toISOString().slice(0, 10),
        notes: JSON.stringify(parsedNotes),
      })
      .eq('id', id)
    if (loanErr) return { error: loanErr.message }

    // 4. Update items status back to 'tersedia'
    const { data: loanItems } = await db.from('loan_items').select('item_id').eq('loan_id', id)
    if (loanItems && loanItems.length > 0) {
      const itemIds = loanItems.map((r) => r.item_id)
      await db.from('items').update({ status: 'tersedia' }).in('id', itemIds)

      const conditionInText = input.notesIn ? `Kembali: ${input.notesIn}` : 'Kembali dalam kondisi baik'
      await db
        .from('loan_items')
        .update({ condition_in: conditionInText })
        .eq('loan_id', id)
    }

    revalidatePath('/')
    revalidatePath('/riwayat')
    return {}
  } catch (err: any) {
    return { error: err.message || 'Gagal memproses pengembalian' }
  }
}

// Fallback legacy action
export async function returnLoan(formData: FormData) {
  const id = String(formData.get('id'))
  await completeReturnLoan({ id })
}

export type NewItemInput = {
  code: string
  name: string
  category: string
  brand?: string
  serialNumber?: string
  condition?: string
  notes?: string
}

export async function createItem(input: NewItemInput): Promise<{ error?: string }> {
  try {
    const code = input.code.trim().toUpperCase()
    const name = input.name.trim()
    if (!code) return { error: 'Kode barang wajib diisi' }
    if (!name) return { error: 'Nama barang wajib diisi' }

    // Check if code already exists
    const { data: existing } = await db.from('items').select('id').eq('code', code).maybeSingle()
    if (existing) {
      return { error: `Barang dengan kode "${code}" sudah terdaftar.` }
    }

    const { error } = await db.from('items').insert({
      code,
      name,
      category: input.category || 'Umum',
      brand: input.brand?.trim() || null,
      serial_number: input.serialNumber?.trim() || null,
      condition: input.condition || 'baik',
      status: 'tersedia',
      notes: input.notes?.trim() || null,
    })

    if (error) return { error: error.message }

    revalidatePath('/barang')
    revalidatePath('/pinjam')
    revalidatePath('/')
    return {}
  } catch (err: any) {
    return { error: err.message || 'Gagal menambahkan barang' }
  }
}

export async function updateItemStatus(id: string, status: 'tersedia' | 'perawatan' | 'hilang'): Promise<{ error?: string }> {
  try {
    const { error } = await db.from('items').update({ status }).eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/barang')
    revalidatePath('/pinjam')
    return {}
  } catch (err: any) {
    return { error: err.message || 'Gagal mengubah status barang' }
  }
}


