'use client'

import Link from 'next/link'
import { ArrowLeft, type LucideIcon } from 'lucide-react'

/* -------------------------------------------------------------------------- */
/*  Accent presets                                                            */
/* -------------------------------------------------------------------------- */

type AccentKey = 'blue' | 'green' | 'amber' | 'violet' | 'cyan' | 'slate'

const accentGradients: Record<AccentKey, string> = {
  blue:   'linear-gradient(135deg, oklch(0.45 0.18 250) 0%, oklch(0.5 0.2 285) 50%, oklch(0.45 0.18 320) 100%)',
  green:  'linear-gradient(135deg, oklch(0.5 0.16 145) 0%, oklch(0.5 0.16 175) 100%)',
  amber:  'linear-gradient(135deg, oklch(0.55 0.18 65) 0%, oklch(0.55 0.2 35) 100%)',
  violet: 'linear-gradient(135deg, oklch(0.5 0.18 300) 0%, oklch(0.45 0.2 330) 100%)',
  cyan:   'linear-gradient(135deg, oklch(0.5 0.15 220) 0%, oklch(0.5 0.18 250) 100%)',
  slate:  'linear-gradient(135deg, oklch(0.35 0.03 250) 0%, oklch(0.3 0.03 280) 100%)',
}

const accentOrbs: Record<AccentKey, { a: string; b: string }> = {
  blue:   { a: 'oklch(0.65 0.22 285 / 0.5)',  b: 'oklch(0.6 0.22 250 / 0.45)' },
  green:  { a: 'oklch(0.65 0.18 175 / 0.5)',  b: 'oklch(0.6 0.18 145 / 0.45)' },
  amber:  { a: 'oklch(0.65 0.2 35 / 0.5)',    b: 'oklch(0.6 0.18 65 / 0.45)' },
  violet: { a: 'oklch(0.65 0.2 330 / 0.5)',   b: 'oklch(0.6 0.2 300 / 0.45)' },
  cyan:   { a: 'oklch(0.65 0.18 250 / 0.5)',  b: 'oklch(0.6 0.15 220 / 0.45)' },
  slate:  { a: 'oklch(0.55 0.04 280 / 0.45)', b: 'oklch(0.5 0.04 250 / 0.4)' },
}

/* -------------------------------------------------------------------------- */
/*  Mini stat (used inside hero)                                              */
/* -------------------------------------------------------------------------- */

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
    <div
      className="rounded-xl p-3 backdrop-blur-md ring-1 ring-white/15"
      style={{ backgroundColor: 'color-mix(in oklch, white 12%, transparent)' }}
    >
      <Icon className="size-4 text-white/90" />
      <p className="mt-1.5 text-base font-bold text-white tabular-nums leading-none">
        {value}
      </p>
      <p className="mt-1 text-[10px] uppercase tracking-wider font-semibold text-white/70">
        {label}
      </p>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  PageHeader                                                                */
/* -------------------------------------------------------------------------- */

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
  const orb = accentOrbs[accent]

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-6 sm:p-7"
      style={{ background: accentGradients[accent] }}
    >
      {/* decorative orbs */}
      <div
        className="absolute -top-24 -right-24 size-72 rounded-full blur-3xl pointer-events-none"
        style={{ backgroundColor: orb.a }}
      />
      <div
        className="absolute -bottom-32 -left-16 size-80 rounded-full blur-3xl pointer-events-none"
        style={{ backgroundColor: orb.b }}
      />
      {/* grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative flex flex-col gap-5">
        {/* top row: badge + actions */}
        {(badge || actions) && (
          <div className="flex items-start justify-between gap-3">
            {badge ? (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm ring-1 ring-white/20">
                <span className="text-[11px] font-semibold text-white tracking-wide uppercase">
                  {badge}
                </span>
              </div>
            ) : (
              <div />
            )}
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        )}

        {/* title row */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <div className="max-w-xl">
            {backHref && (
              <Link
                href={backHref}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/80 hover:text-white transition-colors mb-3"
              >
                <ArrowLeft className="size-3" />
                Kembali
              </Link>
            )}
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1.5 text-sm text-white/80 max-w-md">{subtitle}</p>
            )}
          </div>

          {/* inline stats */}
          {stats && stats.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 lg:gap-3">
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
