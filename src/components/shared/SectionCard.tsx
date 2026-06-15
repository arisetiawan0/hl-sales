'use client'

import type { LucideIcon } from 'lucide-react'

/* -------------------------------------------------------------------------- */
/*  Icon accent gradients                                                     */
/* -------------------------------------------------------------------------- */

type IconAccent = 'blue' | 'green' | 'amber' | 'violet' | 'cyan' | 'slate'

const iconGradients: Record<IconAccent, string> = {
  blue:   'linear-gradient(135deg, oklch(0.55 0.18 250), oklch(0.45 0.2 285))',
  green:  'linear-gradient(135deg, oklch(0.6 0.18 145), oklch(0.5 0.16 165))',
  amber:  'linear-gradient(135deg, oklch(0.65 0.18 60), oklch(0.55 0.18 35))',
  violet: 'linear-gradient(135deg, oklch(0.55 0.18 300), oklch(0.45 0.2 295))',
  cyan:   'linear-gradient(135deg, oklch(0.55 0.15 220), oklch(0.45 0.15 215))',
  slate:  'linear-gradient(135deg, oklch(0.5 0.04 280), oklch(0.4 0.04 250))',
}

/* -------------------------------------------------------------------------- */
/*  SectionCard                                                               */
/* -------------------------------------------------------------------------- */

export function SectionCard({
  title,
  description,
  icon: Icon,
  iconAccent = 'blue',
  action,
  children,
  className = '',
  contentClassName = '',
  variant = 'default',
}: {
  title: string
  description?: string
  icon: LucideIcon
  iconAccent?: IconAccent
  action?: React.ReactNode
  children?: React.ReactNode
  className?: string
  contentClassName?: string
  variant?: 'default' | 'flat'
}) {
  const isFlat = variant === 'flat'

  return (
    <div
      className={`
        rounded-2xl overflow-hidden
        ${!isFlat ? 'ring-1 ring-foreground/[0.06]' : ''}
        ${className}
      `}
      style={isFlat ? undefined : { backgroundColor: 'var(--card)' }}
    >
      {/* Header */}
      <div
        className={`
          flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 p-5 sm:p-6
          ${!isFlat ? 'ring-1 ring-foreground/[0.06]' : ''}
        `}
        style={{ backgroundColor: isFlat ? 'transparent' : 'var(--card)' }}
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className="size-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: iconGradients[iconAccent] }}
          >
            <Icon className="size-3.5 text-white" />
          </div>

          {/* Title + description */}
          <div className="min-w-0">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
              {title}
            </h3>
            {description && (
              <p className="mt-0.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Action */}
        {action && <div className="flex items-center shrink-0">{action}</div>}
      </div>

      {/* Content */}
      {children && (
        <div className={contentClassName}>{children}</div>
      )}
    </div>
  )
}