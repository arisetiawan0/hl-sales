'use client'

import { Badge } from '@/components/ui/badge'
import type { LucideIcon } from 'lucide-react'
import {
  CheckCircle2,
  AlertCircle,
  Gift,
  Sparkles,
  type LucideIcon as LucideIconType,
} from 'lucide-react'

/* -------------------------------------------------------------------------- */
/*  StatusBadge                                                               */
/* -------------------------------------------------------------------------- */

export type StatusVariant =
  | 'success'  // LUNAS, Aktif, Sudah Dibayar
  | 'warning'  // PIUTANG, Tertunda
  | 'info'     // Bonus, Promo
  | 'violet'   // Bonus gift
  | 'neutral'  // Default / info

type StatusConfig = {
  bg: string
  fg: string
  icon: LucideIconType
}

const configs: Record<StatusVariant, StatusConfig> = {
  success: {
    bg: 'var(--success-light)',
    fg: 'var(--success)',
    icon: CheckCircle2,
  },
  warning: {
    bg: 'var(--warning-light)',
    fg: 'var(--warning)',
    icon: AlertCircle,
  },
  info: {
    bg: 'var(--blue-50)',
    fg: 'oklch(0.45 0.18 250)',
    icon: Sparkles,
  },
  violet: {
    bg: 'oklch(0.95 0.03 300)',
    fg: 'oklch(0.45 0.18 300)',
    icon: Gift,
  },
  neutral: {
    bg: 'var(--muted)',
    fg: 'var(--muted-foreground)',
    icon: Sparkles,
  },
}

export function StatusBadge({
  variant,
  children,
  showIcon = true,
  className = '',
}: {
  variant: StatusVariant
  children: React.ReactNode
  showIcon?: boolean
  className?: string
}) {
  const c = configs[variant]
  const Icon = c.icon

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${className}`}
      style={{ backgroundColor: c.bg, color: c.fg }}
    >
      {showIcon && <Icon className="size-3" />}
      {children}
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/*  Convenience helpers                                                       */
/* -------------------------------------------------------------------------- */

/** Map transaction status to variant */
export function transactionStatusVariant(status: string): StatusVariant {
  if (status === 'LUNAS') return 'success'
  if (status === 'PIUTANG') return 'warning'
  return 'neutral'
}

/** Render a bonus pill */
export function BonusPill({ count }: { count?: number | string }) {
  return (
    <StatusBadge variant="violet" showIcon>
      {count !== undefined ? `Bonus ${count}` : 'Bonus'}
    </StatusBadge>
  )
}

/** Standard shadcn Badge with our color overrides */
export function ColorBadge({
  variant,
  children,
  className = '',
}: {
  variant: StatusVariant
  children: React.ReactNode
  className?: string
}) {
  const c = configs[variant]
  return (
    <Badge
      variant="outline"
      className={`text-[10px] font-semibold ${className}`}
      style={{
        backgroundColor: c.bg,
        color: c.fg,
        border: 'none',
      }}
    >
      {children}
    </Badge>
  )
}
