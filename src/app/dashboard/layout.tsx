import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardSidebar from '@/components/dashboard/Sidebar'
import type { Restaurant } from '@/lib/supabase/types'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data } = await supabase
    .from('restaurants')
    .select('*')
    .eq('owner_id', user.id)
    .single()

  const restaurant = data as Restaurant | null

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DashboardSidebar restaurant={restaurant} />
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  )
}
