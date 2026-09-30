import { db } from '../lib/supabase'
import DashboardClient, { LoanData } from './dashboard-client'

export const dynamic = 'force-dynamic'

export default async function Dashboard() {
  const { data: rawLoans } = await db
    .from('loans')
    .select('id, borrower_name, borrower_department, borrower_phone, due_date, signature_out_url, notes, loan_items(items(code, name))')
    .eq('status', 'aktif')
    .order('due_date')

  const today = new Date().toISOString().slice(0, 10)

  const loans: LoanData[] = await Promise.all(
    (rawLoans ?? []).map(async (l: any) => {
      let notesData: any = null
      let photoOutSignedUrl: string | null = null
      try {
        if (l.notes) {
          notesData = JSON.parse(l.notes)
          if (notesData?.photo_out_url) {
            const { data } = await db.storage.from('signatures').createSignedUrl(notesData.photo_out_url, 3600)
            photoOutSignedUrl = data?.signedUrl ?? null
          }
        }
      } catch {
        notesData = { legacy: l.notes }
      }
      return {
        ...l,
        notesData,
        photoOutSignedUrl,
      }
    })
  )

  return <DashboardClient initialLoans={loans} today={today} />
}
