import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TableManager from '@/components/dashboard/TableManager'
import type { Restaurant, Table } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

export default async function TablesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data } = await supabase
    .from('restaurants')
    .select('*')
    .eq('owner_id', user.id)
    .single()

  const restaurant = data as Restaurant | null
  if (!restaurant) return redirect('/dashboard')

  const { data: rawTables } = await supabase
    .from('tables')
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .order('created_at', { ascending: true })

  return <TableManager restaurant={restaurant} initialTables={(rawTables ?? []) as Table[]} />
}
