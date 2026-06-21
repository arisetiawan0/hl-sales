'use client'

import type { LucideIcon } from 'lucide-react'

type IconAccent = 'blue' | 'green' | 'amber' | 'violet' | 'cyan' | 'slate'

const iconColors: Record<IconAccent, string> = {
  blue: 'oklch(0.45 0.18 250)',
  green: 'oklch(0.45 0.16 145)',
  amber: 'oklch(0.55 0.18 60)',
  violet: 'oklch(0.45 0.20 295)',
  cyan: 'oklch(0.45 0.15 215)',
  slate: 'oklch(0.40 0.04 250)',
}

export function SectionCard({
  title,
  description,
  icon: Icon,
  iconAccent = 'blue',
  action,
  children,
  className = '',
  contentClassName = '',
}: {
  title: string
  description?: string
  icon: LucideIcon
  iconAccent?: IconAccent
  action?: React.ReactNode
  children?: React.ReactNode
  className?: string
  contentClassName?: string
}) {
  return (
    <div
      className={`rounded-xl ring-1 overflow-hidden ${className}`}
      style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-2.5">
          <div
            className="flex size-7 items-center justify-center rounded-md"
            style={{ backgroundColor: `${iconColors[iconAccent]}15` }}
          >
            <Icon className="size-3.5" style={{ color: iconColors[iconAccent] }} />
          </div>
          <div>
            <h3 className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>{title}</h3>
            {description && (
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{description}</p>
            )}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children && <div className={contentClassName}>{children}</div>}
    </div>
  )
}
