'use client'

import { TrendingUp, TrendingDown, type LucideIcon } from 'lucide-react'

export type StatAccent = 'blue' | 'green' | 'amber' | 'violet' | 'cyan'

const accentStyles: Record<StatAccent, { bg: string; icon: string; ring: string }> = {
  blue: { bg: 'oklch(0.96 0.02 250)', icon: 'oklch(0.45 0.18 250)', ring: 'oklch(0.85 0.08 250)' },
  green: { bg: 'oklch(0.96 0.03 145)', icon: 'oklch(0.45 0.16 145)', ring: 'oklch(0.85 0.10 145)' },
  amber: { bg: 'oklch(0.97 0.03 75)', icon: 'oklch(0.55 0.18 60)', ring: 'oklch(0.88 0.10 75)' },
  violet: { bg: 'oklch(0.96 0.03 300)', icon: 'oklch(0.45 0.20 295)', ring: 'oklch(0.85 0.10 300)' },
  cyan: { bg: 'oklch(0.96 0.02 220)', icon: 'oklch(0.45 0.15 215)', ring: 'oklch(0.85 0.08 220)' },
}

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  trendValue,
  accent,
}: {
  title: string
  value: string | number
  icon: LucideIcon
  description: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  accent: StatAccent
}) {
  const a = accentStyles[accent]

  return (
    <div
      className="rounded-xl p-4 ring-1 transition-shadow duration-200 hover:shadow-md"
      style={{ backgroundColor: 'var(--card)', borderColor: a.ring }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5 min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
            {title}
          </p>
          <p className="text-lg font-bold tracking-tight tabular-nums" style={{ color: 'var(--foreground)' }}>
            {value}
          </p>
        </div>
        <div
          className="flex size-8 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: a.bg }}
        >
          <Icon className="size-3.5" style={{ color: a.icon }} />
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        {trend && trend !== 'neutral' && (
          <span
            className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1 py-0.5 rounded"
            style={{
              color: trend === 'up' ? 'var(--success)' : 'var(--destructive)',
              backgroundColor: trend === 'up' ? 'var(--success-light)' : 'oklch(0.95 0.03 25)',
            }}
          >
            {trend === 'up' ? <TrendingUp className="size-2.5" /> : <TrendingDown className="size-2.5" />}
            {trendValue}
          </span>
        )}
        <span className="text-[11px] truncate" style={{ color: 'var(--muted-foreground)' }}>
          {description}
        </span>
      </div>
    </div>
  )
}
