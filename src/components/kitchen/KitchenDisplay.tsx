'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { OrderWithItems } from '@/lib/supabase/types'
import { formatPrice } from '@/lib/utils'
import { ChefHat, Bell, Clock } from 'lucide-react'
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

// Returns wait info based on elapsed minutes
function getWaitInfo(createdAt: string, now: number) {
  const elapsedMs = now - new Date(createdAt).getTime()
  const totalSeconds = Math.floor(elapsedMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  if (minutes < 2) {
    return {
      display,
      minutes,
      border: 'border-green-400',
      bg: 'bg-green-50',
      header: 'bg-green-500',
      timer: 'text-green-600 bg-green-100',
      dot: 'bg-green-400',
      label: '● Rapide',
    }
  }
  if (minutes < 6) {
    return {
      display,
      minutes,
      border: 'border-yellow-400',
      bg: 'bg-yellow-50',
      header: 'bg-yellow-500',
      timer: 'text-yellow-700 bg-yellow-100',
      dot: 'bg-yellow-400',
      label: '● Normal',
    }
  }
  if (minutes < 10) {
    return {
      display,
      minutes,
      border: 'border-orange-500',
      bg: 'bg-orange-50',
      header: 'bg-orange-500',
      timer: 'text-orange-700 bg-orange-100',
      dot: 'bg-orange-400',
      label: '⚠ Long',
    }
  }
  return {
    display,
    minutes,
    border: 'border-red-500',
    bg: 'bg-red-50',
    header: 'bg-red-500',
    timer: 'text-red-700 bg-red-100',
    dot: 'bg-red-500 animate-pulse',
    label: '🔴 Urgent',
  }
}

interface Props {
  restaurantId: string
}

export default function KitchenDisplay({ restaurantId }: Props) {
  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(Date.now())
  const supabase = createClient()

  // Tick every second to update all timers
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  const fetchOrders = useCallback(async () => {
    const { data } = await supabase
      .from('orders')
      .select(`*, order_items(*, items(*)), tables(*)`)
      .eq('restaurant_id', restaurantId)
      .in('status', ['pending', 'confirmed', 'preparing', 'ready'])
      .order('created_at', { ascending: true }) // longest wait first
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

  // Count by urgency for header summary
  const urgent = orders.filter(o => Math.floor((now - new Date(o.created_at).getTime()) / 60000) >= 10).length

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <ChefHat className="text-orange-400" size={28} />
        <h1 className="text-white text-2xl font-bold">Cuisine</h1>
        <div className="ml-auto flex items-center gap-2">
          {urgent > 0 && (
            <span className="bg-red-500 text-white rounded-full px-3 py-0.5 text-sm font-bold animate-pulse">
              🔴 {urgent} urgent{urgent > 1 ? 's' : ''}
            </span>
          )}
          <span className="bg-gray-700 text-white rounded-full px-3 py-0.5 text-sm font-bold">
            {orders.length} commande{orders.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-3 mb-5 flex-wrap">
        {[
          { dot: 'bg-green-400', label: '< 2 min' },
          { dot: 'bg-yellow-400', label: '2–6 min' },
          { dot: 'bg-orange-400', label: '6–10 min' },
          { dot: 'bg-red-500', label: '> 10 min' },
        ].map(({ dot, label }) => (
          <div key={label} className="flex items-center gap-1.5 text-xs text-gray-400">
            <span className={`w-2.5 h-2.5 rounded-full ${dot}`} />
            {label}
          </div>
        ))}
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
            const wait = getWaitInfo(order.created_at, now)
            return (
              <div key={order.id}
                className={`break-inside-avoid rounded-2xl border-2 overflow-hidden ${wait.border} ${wait.bg}`}
              >
                {/* Card header — color based on wait time */}
                <div className={`${wait.header} px-4 py-2 flex justify-between items-center`}>
                  <span className="font-bold text-white text-sm">
                    {(order as any).tables?.label ?? 'Table'}
                  </span>
                  <span className="text-white/80 text-xs font-medium">
                    {STATUS_LABEL[status]}
                  </span>
                </div>

                {/* Timer row */}
                <div className="px-4 pt-3 flex items-center justify-between">
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${wait.timer}`}>
                    <Clock size={11} />
                    {wait.display}
                  </div>
                  <span className={`text-xs font-semibold ${
                    wait.minutes >= 10 ? 'text-red-600' :
                    wait.minutes >= 6 ? 'text-orange-600' :
                    wait.minutes >= 2 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {wait.label}
                  </span>
                </div>

                {/* Items */}
                <div className="px-4 py-3 space-y-1">
                  {order.order_items.map(oi => (
                    <div key={oi.id} className="flex justify-between text-sm">
                      <span className="font-medium text-gray-800">
                        {oi.quantity}× {(oi as any).items?.name_fr ?? (oi as any).items?.name_ar ?? '—'}
                      </span>
                      {oi.note && (
                        <span className="text-gray-500 text-xs italic truncate ml-2">{oi.note}</span>
                      )}
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
