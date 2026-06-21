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

export function Sidebar({ isOpen = true, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname()
  const { logout } = useAuth()

  const handleNavClick = () => {
    onClose?.()
  }

  return (
    <div
      className={cn(
        'flex h-full flex-col transition-all duration-300 ease-in-out',
        isOpen ? 'w-60' : 'w-16'
      )}
      style={{ backgroundColor: 'var(--sidebar)' }}
    >
      <div className="flex h-14 items-center px-4" style={{ justifyContent: isOpen ? 'flex-start' : 'center' }}>
        <div className="flex size-8 items-center justify-center rounded-lg" style={{ backgroundColor: 'var(--sidebar-primary)' }}>
          <span className="text-xs font-bold tracking-wider" style={{ color: 'var(--sidebar-primary-foreground)' }}>HL</span>
        </div>
        {isOpen && (
          <h1 className="ml-3 text-sm font-semibold tracking-tight" style={{ color: 'var(--sidebar-foreground)' }}>HL Sales</h1>
        )}
      </div>
      <nav className="flex-1 space-y-0.5 px-3 py-3">
        {navigation.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={handleNavClick}
              className={cn(
                'relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                !isOpen && 'justify-center px-0'
              )}
              style={isActive ? {
                backgroundColor: 'var(--sidebar-accent)',
                color: 'var(--sidebar-accent-foreground)',
              } : {
                color: 'color-mix(in oklch, var(--sidebar-foreground) 65%, transparent)',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'color-mix(in oklch, var(--sidebar-accent) 50%, transparent)'
                  e.currentTarget.style.color = 'var(--sidebar-accent-foreground)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = 'color-mix(in oklch, var(--sidebar-foreground) 65%, transparent)'
                }
              }}
              title={isOpen ? undefined : item.name}
            >
              {isActive && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full"
                  style={{ backgroundColor: 'var(--sidebar-primary)' }}
                />
              )}
              <item.icon className="size-4 flex-shrink-0" />
              {isOpen && <span>{item.name}</span>}
            </Link>
          )
        })}
      </nav>
      <div
        className={cn(
          'p-3 transition-all duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        style={{ borderTop: '1px solid var(--sidebar-border)' }}
      >
        <button
          onClick={() => { logout(); handleNavClick(); }}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
            !isOpen && 'justify-center px-0'
          )}
          style={{ color: 'color-mix(in oklch, var(--sidebar-foreground) 65%, transparent)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'color-mix(in oklch, var(--sidebar-accent) 50%, transparent)'
            e.currentTarget.style.color = 'var(--sidebar-accent-foreground)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = 'color-mix(in oklch, var(--sidebar-foreground) 65%, transparent)'
          }}
          title={isOpen ? undefined : 'Keluar'}
        >
          <LogOut className="size-4 flex-shrink-0" />
          {isOpen && <span>Keluar</span>}
        </button>
      </div>
    </div>
  )
}
