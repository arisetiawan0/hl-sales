'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, User, Menu, Gift, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/auth/AuthProvider'
import { notificationService } from '@/lib/services'
import { BonusNotification } from '@/types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function Header({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const { logout } = useAuth()
  const router = useRouter()
  const [notifications, setNotifications] = useState<BonusNotification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    notificationService
      .getBonusNotifications()
      .then(setNotifications)
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false))
  }, [])

  const totalAvailable = notifications.reduce((sum, n) => sum + n.available, 0)

  return (
    <header className="flex h-16 items-center justify-between border-b px-6" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="mr-2"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-4.5 w-4.5" />
        </Button>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>HL Internal Finance</h2>
      </div>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className="relative inline-flex items-center justify-center size-9 rounded-lg transition-colors cursor-pointer"
                style={{ color: 'var(--muted-foreground)' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--muted)'; e.currentTarget.style.color = 'var(--foreground)' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--muted-foreground)' }}
              >
                <Bell className="h-4.5 w-4.5" />
                {!loading && totalAvailable > 0 && (
                  <span
                    className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold text-white"
                    style={{ backgroundColor: 'oklch(0.55 0.18 25)' }}
                  >
                    {totalAvailable > 9 ? '9+' : totalAvailable}
                  </span>
                )}
              </button>
            }
          />
          <DropdownMenuContent align="end" className="w-72">
            <div className="px-2 py-1.5 text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>Notifikasi Bonus</div>
            <DropdownMenuSeparator />
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin" style={{ color: 'var(--muted-foreground)' }} />
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-2 py-6 text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>
                Tidak ada bonus yang tersedia
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto py-1">
                {notifications.map((n) => (
                  <DropdownMenuItem
                    key={n.customer.id}
                    onClick={() => router.push(`/pelanggan/${n.customer.id}`)}
                    className="flex cursor-pointer items-center justify-between px-2 py-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Gift className="h-4 w-4 shrink-0" style={{ color: 'oklch(0.45 0.18 300)' }} />
                      <span className="truncate text-sm font-medium">{n.customer.name}</span>
                    </div>
                    <span
                      className="ml-2 shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold text-white"
                      style={{ backgroundColor: 'oklch(0.45 0.18 300)' }}
                    >
                      {n.available}
                    </span>
                  </DropdownMenuItem>
                ))}
              </div>
            )}
            {notifications.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  Total bonus tersedia: {totalAvailable}
                </div>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className="inline-flex items-center justify-center size-9 rounded-lg transition-colors cursor-pointer"
                style={{ color: 'var(--muted-foreground)' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--muted)'; e.currentTarget.style.color = 'var(--foreground)' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--muted-foreground)' }}
              />
            }
          >
            <User className="h-4.5 w-4.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <div className="px-2 py-1.5 text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>Admin</div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
