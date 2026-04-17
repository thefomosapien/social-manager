import { createClient } from '@/lib/supabase/server'
import { Brand } from '@/types'
import Dashboard from '@/components/Dashboard'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('brands')
    .select('*')
    .order('created_at', { ascending: true })

  const brands = (data as Brand[]) ?? []

  return <Dashboard brands={brands} />
}
