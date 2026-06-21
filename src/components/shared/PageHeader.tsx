'use client'

import Link from 'next/link'
import { ArrowLeft, type LucideIcon } from 'lucide-react'

type AccentKey = 'blue' | 'green' | 'amber' | 'violet' | 'cyan' | 'slate'

const accentGradients: Record<AccentKey, string> = {
  blue:   'linear-gradient(135deg, oklch(0.45 0.18 250) 0%, oklch(0.5 0.2 285) 50%, oklch(0.45 0.18 320) 100%)',
  green:  'linear-gradient(135deg, oklch(0.5 0.16 145) 0%, oklch(0.5 0.16 175) 100%)',
  amber:  'linear-gradient(135deg, oklch(0.55 0.18 65) 0%, oklch(0.55 0.2 35) 100%)',
  violet: 'linear-gradient(135deg, oklch(0.5 0.18 300) 0%, oklch(0.45 0.2 330) 100%)',
  cyan:   'linear-gradient(135deg, oklch(0.5 0.15 220) 0%, oklch(0.5 0.18 250) 100%)',
  slate:  'linear-gradient(135deg, oklch(0.35 0.03 250) 0%, oklch(0.3 0.03 280) 100%)',
}

function MiniStat({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string | number
}) {
  return (
    <div className="rounded-lg p-2.5 bg-white/10 ring-1 ring-white/15">
      <Icon className="size-3.5 text-white/80" />
      <p className="mt-1 text-sm font-bold text-white tabular-nums leading-none">{value}</p>
      <p className="mt-0.5 text-[9px] uppercase tracking-wider font-medium text-white/60">{label}</p>
    </div>
  )
}

export type PageHeaderStat = {
  icon: LucideIcon
  label: string
  value: string | number
}

export function PageHeader({
  title,
  subtitle,
  accent = 'blue',
  badge,
  backHref,
  actions,
  stats,
}: {
  title: string
  subtitle?: string
  accent?: AccentKey
  badge?: string
  backHref?: string
  actions?: React.ReactNode
  stats?: PageHeaderStat[]
}) {
  return (
    <div
      className="rounded-xl p-5 ring-1"
      style={{ background: accentGradients[accent], borderColor: 'transparent' }}
    >
      <div className="relative flex flex-col gap-4">
        {(badge || actions) && (
          <div className="flex items-start justify-between gap-3">
            {badge ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold text-white/80 uppercase tracking-wider bg-white/10">
                {badge}
              </span>
            ) : <div />}
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        )}

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div className="max-w-xl">
            {backHref && (
              <Link
                href={backHref}
                className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-white/70 hover:text-white transition-colors mb-2"
              >
                <ArrowLeft className="size-3" />
                Kembali
              </Link>
            )}
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{title}</h1>
            {subtitle && <p className="mt-1 text-xs text-white/70 max-w-md">{subtitle}</p>}
          </div>

          {stats && stats.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {stats.map((s, i) => (
                <MiniStat key={i} icon={s.icon} label={s.label} value={s.value} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
