import { db } from '../../lib/supabase'
import RiwayatClient, { CompletedLoanData } from './riwayat-client'

export const dynamic = 'force-dynamic'

export default async function RiwayatPage() {
  const { data: rawLoans } = await db
    .from('loans')
    .select(`
      id,
      borrower_name,
      borrower_department,
      borrower_phone,
      loan_date,
      due_date,
      return_date,
      signature_out_url,
      signature_in_url,
      notes,
      loan_items (
        condition_out,
        condition_in,
        items (
          code,
          name,
          category
        )
      )
    `)
    .eq('status', 'selesai')
    .order('return_date', { ascending: false })

  const loans: CompletedLoanData[] = await Promise.all(
    (rawLoans ?? []).map(async (l: any) => {
      let notesData: any = null
      let photoOutSignedUrl: string | null = null
      let photoInSignedUrl: string | null = null
      let signatureSignedUrl: string | null = null

      try {
        if (l.notes) {
          notesData = JSON.parse(l.notes)
          if (notesData?.photo_out_url) {
            const { data } = await db.storage.from('signatures').createSignedUrl(notesData.photo_out_url, 3600)
            photoOutSignedUrl = data?.signedUrl ?? null
          }
          if (notesData?.photo_in_url) {
            const { data } = await db.storage.from('signatures').createSignedUrl(notesData.photo_in_url, 3600)
            photoInSignedUrl = data?.signedUrl ?? null
          }
        }
      } catch {
        notesData = { legacy: l.notes }
      }

      if (l.signature_out_url) {
        const { data } = await db.storage.from('signatures').createSignedUrl(l.signature_out_url, 3600)
        signatureSignedUrl = data?.signedUrl ?? null
      }

      return {
        id: l.id,
        borrower_name: l.borrower_name,
        borrower_department: l.borrower_department,
        borrower_phone: l.borrower_phone,
        loan_date: l.loan_date,
        due_date: l.due_date,
        return_date: l.return_date,
        signatureSignedUrl,
        photoOutSignedUrl,
        photoInSignedUrl,
        notesData,
        loan_items: l.loan_items ?? [],
      }
    })
  )

  return <RiwayatClient loans={loans} />
}
