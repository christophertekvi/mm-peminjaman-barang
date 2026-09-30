import { db } from '../../lib/supabase'
import LoanForm from './form'

export const dynamic = 'force-dynamic'

export default async function Pinjam() {
  const { data: items } = await db.from('items').select('id, code, name').eq('status', 'tersedia').order('code')
  return <LoanForm items={items ?? []} />
}
