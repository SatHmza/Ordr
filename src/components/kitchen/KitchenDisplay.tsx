'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { OrderWithItems } from '@/lib/supabase/types'
import { formatPrice } from '@/lib/utils'
import { ChefHat, Bell } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_ORDER = ['pending', 'confirmed', 'preparing', 'ready'] as const
type ActiveStatus = typeof STATUS_ORDER[number]

const STATUS_LABEL: Record<ActiveStatus, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  preparing: 'En préparation',
  ready: 'Prêt ✓',
}

const STATUS_NEXT: Record<ActiveStatus, string> = {
  pending: 'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
  ready: 'served',
}

const STATUS_BTN: Record<ActiveStatus, string> = {
  pending: '✓ Confirmer',
  confirmed: '→ Préparer',
  preparing: '✓ Prêt',
  ready: '✓ Servi',
}

const STATUS_COLOR: Record<ActiveStatus, string> = {
  pending: 'border-yellow-400 bg-yellow-50',
  confirmed: 'border-blue-400 bg-blue-50',
  preparing: 'border-orange-400 bg-orange-50',
  ready: 'border-green-400 bg-green-50',
}

const STATUS_HEADER: Record<ActiveStatus, string> = {
  pending: 'bg-yellow-400',
  confirmed: 'bg-blue-400',
  preparing: 'bg-orange-400',
  ready: 'bg-green-400',
}

interface Props {
  restaurantId: string
}

export default function KitchenDisplay({ restaurantId }: Props) {
  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchOrders = useCallback(async () => {
    const { data } = await supabase
      .from('orders')
      .select(`*, order_items(*, items(*)), tables(*)`)
      .eq('restaurant_id', restaurantId)
      .in('status', ['pending', 'confirmed', 'preparing', 'ready'])
      .order('created_at', { ascending: true })

    setOrders((data as OrderWithItems[]) ?? [])
    setLoading(false)
  }, [restaurantId])

  useEffect(() => {
    fetchOrders()

    const channel = supabase
      .channel(`kitchen-${restaurantId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `restaurant_id=eq.${restaurantId}`,
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          toast('🔔 Nouvelle commande !', { icon: '🍽️', duration: 4000 })
        }
        fetchOrders()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [restaurantId, fetchOrders])

  const advanceStatus = async (orderId: string, currentStatus: ActiveStatus) => {
    const nextStatus = STATUS_NEXT[currentStatus]
    await supabase.from('orders').update({ status: nextStatus, updated_at: new Date().toISOString() }).eq('id', orderId)
    if (nextStatus === 'served') {
      setOrders(prev => prev.filter(o => o.id !== orderId))
    } else {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: nextStatus as any } : o))
    }
  }

  const cancelOrder = async (orderId: string) => {
    await supabase.from('orders').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', orderId)
    setOrders(prev => prev.filter(o => o.id !== orderId))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <ChefHat className="text-white animate-pulse" size={48} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <ChefHat className="text-orange-400" size={28} />
        <h1 className="text-white text-2xl font-bold">Cuisine</h1>
        <span className="bg-orange-400 text-white rounded-full px-3 py-0.5 text-sm font-bold ml-auto">
          {orders.length} commande{orders.length !== 1 ? 's' : ''}
        </span>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500 gap-3">
          <Bell size={48} />
          <p className="text-xl">Aucune commande en attente</p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
          {orders.map(order => {
            const status = order.status as ActiveStatus
            return (
              <div key={order.id}
                className={`break-inside-avoid rounded-2xl border-2 overflow-hidden ${STATUS_COLOR[status]}`}
              >
                {/* Card header */}
                <div className={`${STATUS_HEADER[status]} px-4 py-2 flex justify-between items-center`}>
                  <span className="font-bold text-white text-sm">{(order as any).tables?.label ?? 'Table'}</span>
                  <span className="text-white text-xs font-medium">{STATUS_LABEL[status]}</span>
                </div>

                {/* Time */}
                <div className="px-4 pt-2 text-xs text-gray-500">
                  {new Date(order.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </div>

                {/* Items */}
                <div className="px-4 py-3 space-y-1">
                  {order.order_items.map(oi => (
                    <div key={oi.id} className="flex justify-between text-sm">
                      <span className="font-medium text-gray-800">
                        {oi.quantity}× {(oi as any).items?.name_fr ?? (oi as any).items?.name_ar ?? '—'}
                      </span>
                      {oi.note && <span className="text-gray-500 text-xs italic truncate ml-2">{oi.note}</span>}
                    </div>
                  ))}
                </div>

                {/* Order note */}
                {order.note && (
                  <div className="mx-4 mb-2 px-3 py-2 bg-white/50 rounded-lg text-xs text-gray-600 italic">
                    📝 {order.note}
                  </div>
                )}

                {/* Total */}
                <div className="px-4 pb-2 text-sm font-semibold text-gray-700">
                  Total: {formatPrice(order.total)}
                </div>

                {/* Actions */}
                <div className="px-4 pb-4 flex gap-2">
                  <button
                    onClick={() => advanceStatus(order.id, status)}
                    className="flex-1 bg-white text-gray-800 font-bold py-2 rounded-xl text-sm shadow hover:shadow-md active:scale-95 transition-all"
                  >
                    {STATUS_BTN[status]}
                  </button>
                  <button
                    onClick={() => cancelOrder(order.id)}
                    className="px-3 py-2 bg-red-100 text-red-600 rounded-xl text-sm font-medium hover:bg-red-200 active:scale-95 transition-all"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
