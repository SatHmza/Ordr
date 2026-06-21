import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MenuEditor from '@/components/dashboard/MenuEditor'
import type { Restaurant, CategoryWithItems } from '@/lib/supabase/types'

export default async function MenuPage() {
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

  const { data: rawCategories } = await supabase
    .from('categories')
    .select('*, items(*)')
    .eq('restaurant_id', restaurant.id)
    .order('position', { ascending: true })

  const categories = ((rawCategories ?? []) as CategoryWithItems[]).map(cat => ({
    ...cat,
    items: (cat.items ?? []).sort((a, b) => a.position - b.position),
  }))

  return <MenuEditor restaurant={restaurant} initialCategories={categories} />
}
