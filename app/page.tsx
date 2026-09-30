import Link from 'next/link'
import { db } from '../lib/supabase'
import { returnLoan } from './actions'

export const dynamic = 'force-dynamic'

export default async function Dashboard() {
  const { data: loans } = await db
    .from('loans')
    .select('id, borrower_name, borrower_department, borrower_phone, due_date, loan_items(items(code, name))')
    .eq('status', 'aktif')
    .order('due_date')
  const today = new Date().toISOString().slice(0, 10)

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Barang yang sedang dipinjam</h1>
        <Link href="/pinjam" className="rounded-xl bg-teal-800 px-6 py-4 text-lg font-medium text-white active:bg-teal-900">
          Pinjam barang
        </Link>
      </div>

      {!loans?.length && (
        <p className="mt-10 text-slate-600">Belum ada peminjaman aktif. Tekan "Pinjam barang" untuk mencatat yang pertama.</p>
      )}

      <ul className="mt-6 space-y-3">
        {loans?.map((l: any) => {
          const late = l.due_date < today
          return (
            <li key={l.id} className="rounded-xl border border-slate-300 bg-white p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-medium">{l.borrower_name} <span className="text-slate-500">({l.borrower_department})</span></p>
                  <p className="text-sm text-slate-600">{l.loan_items.map((li: any) => `${li.items.code} ${li.items.name}`).join(', ')}</p>
                  <p className={`mt-1 text-sm ${late ? 'font-medium text-red-700' : 'text-slate-600'}`}>
                    {late ? 'Terlambat, jatuh tempo ' : 'Kembali paling lambat '}{l.due_date}
                  </p>
                  <a className="text-sm text-teal-800 underline" href={`https://wa.me/${l.borrower_phone.replace(/\D/g, '').replace(/^0/, '62')}`}>Hubungi via WhatsApp</a>
                </div>
                <form action={returnLoan}>
                  <input type="hidden" name="id" value={l.id} />
                  <button className="rounded-xl border border-teal-800 px-5 py-3 font-medium text-teal-900 active:bg-teal-50">Tandai kembali</button>
                </form>
              </div>
            </li>
          )
        })}
      </ul>
    </main>
  )
}
