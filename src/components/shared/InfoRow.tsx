'use client'

import { cn } from '@/lib/utils'

export function InfoRow({
  label,
  value,
  mono = false,
  highlight = false,
  accent,
}: {
  label: string
  value: React.ReactNode
  mono?: boolean
  highlight?: boolean
  accent?: 'green' | 'amber' | 'violet'
}) {
  const accentColor = accent
    ? accent === 'green'
      ? 'var(--success)'
      : accent === 'amber'
        ? 'var(--warning)'
        : 'oklch(0.45 0.18 300)'
    : undefined

  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span
        className="text-xs"
        style={{ color: 'var(--muted-foreground)' }}
      >
        {label}
      </span>
      <span
        className={cn(
          'text-sm font-medium text-right',
          mono && 'tabular-nums font-mono',
          highlight && 'font-bold',
        )}
        style={accentColor ? { color: accentColor } : { color: 'var(--foreground)' }}
      >
        {value}
      </span>
    </div>
  )
}