'use client'

import Link from 'next/link'
import { type LucideIcon } from 'lucide-react'

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  actionHref,
  actionLabel,
  variant = 'default',
}: {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  actionHref?: string
  actionLabel?: string
  variant?: 'default' | 'compact'
}) {
  const isCompact = variant === 'compact'
  const pyClass = isCompact ? 'py-10' : 'py-16'
  const iconSizeClass = isCompact ? 'size-7' : 'size-8'

  return (
    <div className={`flex flex-col items-center justify-center text-center ${pyClass} px-4`}>
      {/* Icon box */}
      <div
        className={`${iconSizeClass} rounded-2xl flex items-center justify-center mb-4`}
        style={{
          background: 'linear-gradient(135deg, oklch(0.96 0.02 250), oklch(0.94 0.04 280))',
          border: '1px solid color-mix(in oklch, var(--border) 60%, transparent)',
        }}
      >
        <Icon className={iconSizeClass.replace('size-', 'size-')} style={{ color: 'oklch(0.55 0.18 250)' }} />
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="mt-1.5 text-sm max-w-sm" style={{ color: 'var(--muted-foreground)' }}>
          {description}
        </p>
      )}

      {/* Action */}
      {action ? (
        <div className="mt-5">{action}</div>
      ) : actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="mt-5 inline-flex items-center justify-center px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{
            background: 'linear-gradient(135deg, oklch(0.55 0.18 250), oklch(0.45 0.18 250))',
            boxShadow: '0 4px 12px -4px oklch(0.55 0.18 250 / 0.45)',
          }}
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  )
}