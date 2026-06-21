import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import MenuPage from '@/components/menu/MenuPage'
import type { Restaurant, Table, CategoryWithItems } from '@/lib/supabase/types'

interface Props {
  params: Promise<{ token: string }>
}

export default async function ScanPage({ params }: Props) {
  const { token } = await params
  const supabase = await createClient()

  const { data: rawTable } = await supabase
    .from('tables')
    .select('*, restaurants(*)')
    .eq('qr_token', token)
    .eq('is_active', true)
    .single()

  const table = rawTable as any
  if (!table || !table.restaurants) return notFound()

  const restaurant = table.restaurants as Restaurant
  const safeTable = table as Table

  const { data: rawCategories } = await supabase
    .from('categories')
    .select('*, items(*)')
    .eq('restaurant_id', restaurant.id)
    .eq('is_visible', true)
    .order('position', { ascending: true })

  const categories = ((rawCategories ?? []) as CategoryWithItems[]).map(cat => ({
    ...cat,
    items: (cat.items ?? [])
      .filter((item: any) => item.is_visible && item.is_available)
      .sort((a: any, b: any) => a.position - b.position),
  }))

  return (
    <MenuPage
      restaurant={restaurant}
      table={safeTable}
      categories={categories}
    />
  )
}
