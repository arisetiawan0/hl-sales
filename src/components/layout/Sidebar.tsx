'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/components/auth/AuthProvider'
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  BarChart3,
  LogOut,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Pelanggan', href: '/pelanggan', icon: Users },
  { name: 'Produk', href: '/produk', icon: Package },
  { name: 'Bon', href: '/bon', icon: FileText },
  { name: 'Rekap', href: '/rekap', icon: BarChart3 },
]

export function Sidebar({ isOpen = true }: { isOpen?: boolean }) {
  const pathname = usePathname()
  const { logout } = useAuth()

  return (
    <div
      className={cn(
        'flex h-full flex-col transition-all duration-300 ease-in-out',
        isOpen ? 'w-64' : 'w-16'
      )}
      style={{ backgroundColor: 'var(--sidebar)' }}
    >
      <div className="flex h-16 items-center px-4" style={{ justifyContent: isOpen ? 'flex-start' : 'center' }}>
        <div className="flex size-8 items-center justify-center rounded-lg" style={{ backgroundColor: 'var(--sidebar-primary)' }}>
          <span className="text-sm font-bold" style={{ color: 'var(--sidebar-primary-foreground)' }}>HL</span>
        </div>
        {isOpen && (
          <h1 className="ml-3 text-lg font-semibold" style={{ color: 'var(--sidebar-foreground)' }}>HL Sales</h1>
        )}
      </div>
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'shadow-sm'
                  : 'hover:translate-x-0.5',
                !isOpen && 'justify-center px-0'
              )}
              style={isActive ? {
                backgroundColor: 'var(--sidebar-accent)',
                color: 'var(--sidebar-accent-foreground)',
              } : {
                color: 'color-mix(in oklch, var(--sidebar-foreground) 70%, transparent)',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'var(--sidebar-accent)'
                  e.currentTarget.style.color = 'var(--sidebar-accent-foreground)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = 'color-mix(in oklch, var(--sidebar-foreground) 70%, transparent)'
                }
              }}
              title={isOpen ? undefined : item.name}
            >
              <item.icon className="h-4.5 w-4.5 flex-shrink-0" />
              {isOpen && <span>{item.name}</span>}
            </Link>
          )
        })}
      </nav>
      <div
        className={cn(
          'p-4 transition-all duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        style={{ borderTop: '1px solid var(--sidebar-border)' }}
      >
        <button
          onClick={logout}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
            !isOpen && 'justify-center px-0'
          )}
          style={{ color: 'color-mix(in oklch, var(--sidebar-foreground) 70%, transparent)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--sidebar-accent)'
            e.currentTarget.style.color = 'var(--sidebar-accent-foreground)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = 'color-mix(in oklch, var(--sidebar-foreground) 70%, transparent)'
          }}
          title={isOpen ? undefined : 'Keluar'}
        >
          <LogOut className="h-4.5 w-4.5 flex-shrink-0" />
          {isOpen && <span>Keluar</span>}
        </button>
      </div>
    </div>
  )
}
