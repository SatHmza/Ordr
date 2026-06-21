import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TrendingUp, ShoppingBag, Table2, Clock } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import Link from 'next/link'
import type { Restaurant } from '@/lib/supabase/types'

export default async function DashboardHome() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data } = await supabase
    .from('restaurants')
    .select('*')
    .eq('owner_id', user.id)
    .single()

  const restaurant = data as Restaurant | null

  if (!restaurant) {
    return (
      <div className="p-6 md:p-10">
        <h1 className="text-2xl font-bold mb-4">Bienvenue sur MenuQR</h1>
        <p className="text-gray-500">Votre compte restaurant n'est pas encore configuré. Contactez le support.</p>
      </div>
    )
  }

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { data: rawOrders } = await supabase
    .from('orders')
    .select('*, order_items(*, items(name_fr)), tables(label)')
    .eq('restaurant_id', restaurant.id)
    .gte('created_at', todayStart.toISOString())
    .neq('status', 'cancelled')
    .order('created_at', { ascending: false })

  const todayOrders = (rawOrders ?? []) as any[]
  const totalRevenue = todayOrders.reduce((sum: number, o: any) => sum + Number(o.total), 0)
  const orderCount = todayOrders?.length ?? 0

  const { data: tables } = await supabase
    .from('tables')
    .select('id')
    .eq('restaurant_id', restaurant.id)
    .eq('is_active', true)

  const tableCount = tables?.length ?? 0

  const { data: activeOrders } = await supabase
    .from('orders')
    .select('id')
    .eq('restaurant_id', restaurant.id)
    .in('status', ['pending', 'confirmed', 'preparing', 'ready'])

  const activeOrderCount = activeOrders?.length ?? 0

  const stats = [
    { label: "Commandes aujourd'hui", value: orderCount, icon: ShoppingBag, color: 'bg-blue-50 text-blue-600' },
    { label: 'Chiffre d\'affaires', value: formatPrice(totalRevenue, restaurant.currency), icon: TrendingUp, color: 'bg-green-50 text-green-600' },
    { label: 'Tables configurées', value: tableCount, icon: Table2, color: 'bg-purple-50 text-purple-600' },
    { label: 'Commandes en cours', value: activeOrderCount, icon: Clock, color: 'bg-orange-50 text-orange-600' },
  ]

  return (
    <div className="p-5 md:p-8 pb-24 md:pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{restaurant.name}</h1>
        <p className="text-gray-400 text-sm mt-0.5">Vue d&apos;ensemble — aujourd&apos;hui</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              <Icon size={20} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-400 mt-0.5 leading-tight">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-8">
        <Link href={`/kitchen/${restaurant.id}`} target="_blank"
          className="bg-gray-900 text-white rounded-2xl p-4 font-semibold text-sm flex items-center gap-2"
        >
          🍳 Ouvrir cuisine
        </Link>
        <Link href="/dashboard/tables"
          className="bg-orange-500 text-white rounded-2xl p-4 font-semibold text-sm flex items-center gap-2"
        >
          📱 Générer QR
        </Link>
      </div>

      <div>
        <h2 className="text-base font-bold text-gray-800 mb-3">Commandes récentes</h2>
        {(todayOrders ?? []).length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
            <p className="text-gray-400">Aucune commande aujourd&apos;hui</p>
          </div>
        ) : (
          <div className="space-y-3">
            {(todayOrders ?? []).slice(0, 10).map(order => (
              <div key={order.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm text-gray-900">{(order as any).tables?.label ?? 'Table'}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {(order as any).order_items?.map((oi: any) => `${oi.quantity}× ${oi.items?.name_fr ?? '—'}`).join(', ')}
                  </p>
                  <p className="text-xs text-gray-300 mt-0.5">
                    {new Date(order.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-orange-500">{formatPrice(order.total, restaurant.currency)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    order.status === 'served' ? 'bg-green-100 text-green-700' :
                    order.status === 'ready' ? 'bg-green-50 text-green-600' :
                    order.status === 'preparing' ? 'bg-orange-50 text-orange-600' :
                    order.status === 'confirmed' ? 'bg-blue-50 text-blue-600' :
                    'bg-yellow-50 text-yellow-700'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
