import { db } from '../../lib/supabase'
import BarangClient, { ItemData } from './barang-client'

export const dynamic = 'force-dynamic'

export default async function BarangPage() {
  const { data: items } = await db
    .from('items')
    .select('*')
    .order('code', { ascending: true })

  return <BarangClient initialItems={(items as ItemData[]) ?? []} />
}
