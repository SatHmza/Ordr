'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, UtensilsCrossed, QrCode, LogOut, ChefHat } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Restaurant } from '@/lib/supabase/types'

interface Props {
  restaurant: Restaurant | null
}

const NAV = [
  { href: '/dashboard', label: 'Vue d\'ensemble', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/menu', label: 'Menu', icon: UtensilsCrossed, exact: false },
  { href: '/dashboard/tables', label: 'Tables & QR', icon: QrCode, exact: false },
]

export default function DashboardSidebar({ restaurant }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-white border-r border-gray-100 min-h-screen">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <QrCode className="text-white" size={16} />
            </div>
            <span className="font-bold text-gray-900">MenuQR</span>
          </div>
          {restaurant && (
            <p className="text-xs text-gray-400 mt-2 truncate">{restaurant.name}</p>
          )}
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href)
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            )
          })}

          {restaurant && (
            <Link href={`/kitchen/${restaurant.id}`} target="_blank"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <ChefHat size={18} />
              Cuisine ↗
            </Link>
          )}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <button onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-500 w-full transition-colors"
          >
            <LogOut size={18} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 flex">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link key={href} href={href}
              className={`flex-1 flex flex-col items-center py-3 gap-1 text-xs font-medium transition-colors ${
                active ? 'text-orange-500' : 'text-gray-400'
              }`}
            >
              <Icon size={20} />
              {label}
            </Link>
          )
        })}
        <button onClick={logout}
          className="flex-1 flex flex-col items-center py-3 gap-1 text-xs font-medium text-gray-400"
        >
          <LogOut size={20} />
          Sortir
        </button>
      </div>
    </>
  )
}
