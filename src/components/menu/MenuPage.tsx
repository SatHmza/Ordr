'use client'

import { useState, useCallback } from 'react'
import { ShoppingCart, X, Plus, Minus, Globe, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { CategoryWithItems, Item, Restaurant, Table } from '@/lib/supabase/types'
import { formatPrice, getLangName, getLangDesc } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

type Lang = 'fr' | 'ar' | 'en'

const LABELS: Record<Lang, Record<string, string>> = {
  fr: {
    cart: 'Panier', empty: 'Votre panier est vide', note: 'Note pour la cuisine (optionnel)',
    order: 'Commander', ordered: 'Commande envoyée !', total: 'Total',
    close: 'Fermer', unavailable: 'Non disponible', viewCart: 'Voir le panier',
    ordering: 'Commande en cours...', confirmMsg: 'Votre commande a été envoyée. Le serveur arrive !',
  },
  ar: {
    cart: 'السلة', empty: 'سلتك فارغة', note: 'ملاحظة للمطبخ (اختياري)',
    order: 'تأكيد الطلب', ordered: 'تم إرسال طلبك!', total: 'المجموع',
    close: 'إغلاق', unavailable: 'غير متوفر', viewCart: 'عرض السلة',
    ordering: 'جاري الطلب...', confirmMsg: 'تم استلام طلبك. النادل في الطريق!',
  },
  en: {
    cart: 'Cart', empty: 'Your cart is empty', note: 'Note for the kitchen (optional)',
    order: 'Place Order', ordered: 'Order Sent!', total: 'Total',
    close: 'Close', unavailable: 'Unavailable', viewCart: 'View Cart',
    ordering: 'Placing order...', confirmMsg: 'Your order was received. The waiter is on the way!',
  },
}

interface CartItem {
  item: Item
  quantity: number
  note: string
}

interface Props {
  restaurant: Restaurant
  table: Table
  categories: CategoryWithItems[]
}

export default function MenuPage({ restaurant, table, categories }: Props) {
  const defaultLang = (restaurant.default_lang as Lang) ?? 'fr'
  const [lang, setLang] = useState<Lang>(defaultLang)
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [orderNote, setOrderNote] = useState('')
  const [ordered, setOrdered] = useState(false)
  const [placing, setPlacing] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string>(categories[0]?.id ?? '')
  const [langOpen, setLangOpen] = useState(false)

  const t = LABELS[lang]
  const isRTL = lang === 'ar'

  const addToCart = useCallback((item: Item) => {
    setCart(prev => {
      const existing = prev.find(c => c.item.id === item.id)
      if (existing) return prev.map(c => c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c)
      return [...prev, { item, quantity: 1, note: '' }]
    })
    toast.success(getLangName(item as any, lang) + ' ajouté', { duration: 1200 })
  }, [lang])

  const updateQty = (itemId: string, delta: number) => {
    setCart(prev =>
      prev
        .map(c => c.item.id === itemId ? { ...c, quantity: c.quantity + delta } : c)
        .filter(c => c.quantity > 0)
    )
  }

  const cartTotal = cart.reduce((sum, c) => sum + c.item.price * c.quantity, 0)
  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0)

  const placeOrder = async () => {
    if (cart.length === 0 || placing) return
    setPlacing(true)
    const supabase = createClient()

    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        restaurant_id: restaurant.id,
        table_id: table.id,
        note: orderNote || null,
        total: cartTotal,
        status: 'pending',
      })
      .select()
      .single()

    if (error || !order) {
      toast.error('Erreur lors de la commande. Réessayez.')
      setPlacing(false)
      return
    }

    await supabase.from('order_items').insert(
      cart.map(c => ({
        order_id: order.id,
        item_id: c.item.id,
        quantity: c.quantity,
        unit_price: c.item.price,
        note: c.note || null,
      }))
    )

    setOrdered(true)
    setCart([])
    setCartOpen(false)
    setPlacing(false)
  }

  if (ordered) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center bg-white px-6 text-center ${isRTL ? 'rtl' : ''}`}>
        <div className="text-6xl mb-6">✅</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">{t.ordered}</h1>
        <p className="text-gray-500 text-lg mb-8">{t.confirmMsg}</p>
        <p className="text-gray-400 text-sm">{table.label}</p>
        <button
          onClick={() => setOrdered(false)}
          className="mt-8 px-6 py-3 bg-orange-500 text-white rounded-full font-semibold"
        >
          {lang === 'fr' ? 'Commander autre chose' : lang === 'ar' ? 'طلب شيء آخر' : 'Order more'}
        </button>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-white ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {restaurant.logo_url && (
              <Image src={restaurant.logo_url} alt={restaurant.name} width={36} height={36}
                className="rounded-full object-cover w-9 h-9" />
            )}
            <div>
              <h1 className="font-bold text-gray-900 text-base leading-tight">{restaurant.name}</h1>
              <p className="text-xs text-gray-400">{table.label}</p>
            </div>
          </div>

          {/* Language picker */}
          <div className="relative">
            <button
              onClick={() => setLangOpen(o => !o)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-gray-200 text-sm font-medium text-gray-600"
            >
              <Globe size={14} />
              {lang.toUpperCase()}
              <ChevronDown size={12} />
            </button>
            {langOpen && (
              <div className="absolute right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden z-50">
                {(['fr', 'ar', 'en'] as Lang[]).map(l => (
                  <button key={l} onClick={() => { setLang(l); setLangOpen(false) }}
                    className={`block w-full px-4 py-2 text-sm text-left hover:bg-gray-50 ${lang === l ? 'font-bold text-orange-500' : 'text-gray-700'}`}
                  >
                    {l === 'fr' ? 'Français' : l === 'ar' ? 'العربية' : 'English'}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id)
                document.getElementById(`cat-${cat.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors flex-shrink-0 ${
                activeCategory === cat.id
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {getLangName(cat as any, lang)}
            </button>
          ))}
        </div>
      </div>

      {/* Menu items */}
      <div className="pb-32">
        {categories.map(cat => (
          <div key={cat.id} id={`cat-${cat.id}`} className="scroll-mt-32">
            <h2 className="px-4 pt-6 pb-3 text-lg font-bold text-gray-800 sticky top-[114px] bg-white z-10">
              {getLangName(cat as any, lang)}
            </h2>
            <div className="divide-y divide-gray-50">
              {cat.items.map(item => {
                const cartItem = cart.find(c => c.item.id === item.id)
                const name = getLangName(item as any, lang)
                const desc = getLangDesc(item as any, lang)
                return (
                  <div key={item.id} className="flex gap-3 px-4 py-4 items-center">
                    {item.image_url && (
                      <div className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
                        <Image src={item.image_url} alt={name} fill className="object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm leading-tight">{name}</p>
                      {desc && <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{desc}</p>}
                      <p className="text-orange-500 font-bold mt-1 text-sm">{formatPrice(item.price, restaurant.currency)}</p>
                    </div>
                    <div className="flex-shrink-0">
                      {cartItem ? (
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateQty(item.id, -1)}
                            className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                            <Minus size={14} />
                          </button>
                          <span className="w-5 text-center font-bold text-sm">{cartItem.quantity}</span>
                          <button onClick={() => updateQty(item.id, 1)}
                            className="w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center">
                            <Plus size={14} />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => addToCart(item)}
                          className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-sm active:scale-95 transition-transform">
                          <Plus size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Cart FAB */}
      {cartCount > 0 && (
        <div className="fixed bottom-6 left-4 right-4 z-40">
          <button
            onClick={() => setCartOpen(true)}
            className="w-full bg-orange-500 text-white rounded-2xl py-4 px-5 flex items-center justify-between shadow-lg active:scale-98 transition-transform"
          >
            <span className="bg-orange-400 rounded-lg w-7 h-7 flex items-center justify-center font-bold text-sm">{cartCount}</span>
            <span className="font-semibold">{t.viewCart}</span>
            <span className="font-bold">{formatPrice(cartTotal, restaurant.currency)}</span>
          </button>
        </div>
      )}

      {/* Cart drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setCartOpen(false)} />
          <div className="relative bg-white rounded-t-3xl max-h-[85vh] flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-lg">{t.cart}</h2>
              <button onClick={() => setCartOpen(false)} className="p-1 text-gray-400">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {cart.map(c => (
                <div key={c.item.id} className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-sm text-gray-900">{getLangName(c.item as any, lang)}</p>
                    <p className="text-orange-500 text-sm font-semibold">{formatPrice(c.item.price * c.quantity, restaurant.currency)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQty(c.item.id, -1)}
                      className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                      <Minus size={12} />
                    </button>
                    <span className="w-5 text-center font-bold text-sm">{c.quantity}</span>
                    <button onClick={() => updateQty(c.item.id, 1)}
                      className="w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center">
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              ))}

              <textarea
                value={orderNote}
                onChange={e => setOrderNote(e.target.value)}
                placeholder={t.note}
                rows={2}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>

            <div className="px-5 py-4 border-t border-gray-100">
              <div className="flex justify-between mb-4">
                <span className="font-semibold text-gray-700">{t.total}</span>
                <span className="font-bold text-orange-500 text-lg">{formatPrice(cartTotal, restaurant.currency)}</span>
              </div>
              <button
                onClick={placeOrder}
                disabled={placing}
                className="w-full bg-orange-500 text-white py-4 rounded-2xl font-bold text-base disabled:opacity-60"
              >
                {placing ? t.ordering : t.order}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
