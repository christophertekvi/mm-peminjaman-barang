'use server'
import { revalidatePath } from 'next/cache'
import { db } from '../lib/supabase'

type LoanInput = {
  name: string
  dept: string
  phone: string
  due: string
  itemIds: string[]
  signature: string
}

export async function createLoan(input: LoanInput): Promise<{ error?: string }> {
  const path = `out/${crypto.randomUUID()}.png`
  const png = Buffer.from(input.signature.split(',')[1], 'base64')
  const up = await db.storage.from('signatures').upload(path, png, { contentType: 'image/png' })
  if (up.error) return { error: up.error.message }

  const { data: loan, error } = await db
    .from('loans')
    .insert({
      borrower_name: input.name,
      borrower_department: input.dept,
      borrower_phone: input.phone,
      due_date: input.due,
      signature_out_url: path,
    })
    .select('id')
    .single()
  if (error) return { error: error.message }

  const rows = input.itemIds.map((item_id) => ({ loan_id: loan.id, item_id, condition_out: 'baik' }))
  const li = await db.from('loan_items').insert(rows)
  if (li.error) return { error: li.error.message }

  await db.from('items').update({ status: 'dipinjam' }).in('id', input.itemIds)
  revalidatePath('/')
  return {}
}

export async function returnLoan(formData: FormData) {
  const id = String(formData.get('id'))
  const { data } = await db.from('loan_items').select('item_id').eq('loan_id', id)
  await db
    .from('loans')
    .update({ status: 'selesai', return_date: new Date().toISOString().slice(0, 10) })
    .eq('id', id)
  await db.from('items').update({ status: 'tersedia' }).in('id', (data ?? []).map((r) => r.item_id))
  revalidatePath('/')
}
