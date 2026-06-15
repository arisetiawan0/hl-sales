'use client'

import { useState } from 'react'
import { TrendingUp, TrendingDown, type LucideIcon } from 'lucide-react'

/* -------------------------------------------------------------------------- */
/*  Sparkline                                                                 */
/* -------------------------------------------------------------------------- */

function Sparkline({
  values,
  color,
  labels,
  formatValue,
}: {
  values: number[]
  color: string
  labels?: string[]
  formatValue?: (v: number) => string
}) {
  const [hovered, setHovered] = useState<number | null>(null)
  const max = Math.max(...values, 1)
  const fmt = formatValue ?? ((v: number) => String(v))

  return (
    <div
      className="relative flex items-end gap-[3px] h-9"
      onMouseLeave={() => setHovered(null)}
    >
      {hovered !== null && values[hovered] !== undefined && (
        <div
          className="absolute -top-9 px-2 py-1 rounded-md text-[10px] font-semibold whitespace-nowrap pointer-events-none z-10"
          style={{
            left: `${((hovered + 0.5) / values.length) * 100}%`,
            transform: 'translateX(-50%)',
            backgroundColor: 'var(--foreground)',
            color: 'var(--background)',
            animation: 'fade-up 120ms ease-out',
          }}
        >
          {labels?.[hovered] && (
            <span className="block text-[9px] opacity-70 uppercase tracking-wider">
              {labels[hovered]}
            </span>
          )}
          {fmt(values[hovered])}
        </div>
      )}
      {values.map((v, i) => {
        const isLast = i === values.length - 1
        const isHovered = hovered === i
        const baseOpacity = isLast ? 1 : 0.35 + (i / values.length) * 0.55
        return (
          <div
            key={i}
            className="w-[6px] rounded-sm cursor-pointer"
            style={{
              height: `${Math.max(8, (v / max) * 100)}%`,
              backgroundColor: color,
              opacity: isHovered ? 1 : baseOpacity,
              transform: isHovered ? 'scaleY(1.08)' : 'scaleY(1)',
              transformOrigin: 'bottom',
              boxShadow: isHovered
                ? `0 -3px 8px -1px ${color}`
                : isLast
                  ? `0 -2px 6px -2px ${color}`
                  : 'none',
              animation: `bar-rise 600ms cubic-bezier(0.34, 1.3, 0.64, 1) ${i * 40}ms both`,
              transition: 'opacity 150ms ease, transform 150ms ease, box-shadow 150ms ease',
            }}
            onMouseEnter={() => setHovered(i)}
          />
        )
      })}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Accent map                                                                */
/* -------------------------------------------------------------------------- */

export type StatAccent = 'blue' | 'green' | 'amber' | 'violet' | 'cyan'

export const accentMap: Record<StatAccent, { from: string; to: string; soft: string; ring: string; text: string; glow: string }> = {
  blue:   { from: 'oklch(0.55 0.18 250)', to: 'oklch(0.45 0.18 250)', soft: 'oklch(0.96 0.02 250)', ring: 'oklch(0.85 0.08 250)',  text: 'oklch(0.42 0.18 250)', glow: 'oklch(0.55 0.18 250 / 0.25)' },
  green:  { from: 'oklch(0.7  0.16 145)', to: 'oklch(0.55 0.16 145)', soft: 'oklch(0.96 0.03 145)', ring: 'oklch(0.85 0.10 145)',  text: 'oklch(0.45 0.15 145)', glow: 'oklch(0.6  0.18 145 / 0.25)' },
  amber:  { from: 'oklch(0.78 0.16 75)',  to: 'oklch(0.65 0.18 60)',  soft: 'oklch(0.97 0.03 75)',  ring: 'oklch(0.88 0.10 75)',   text: 'oklch(0.5  0.16 65)',  glow: 'oklch(0.7  0.16 75  / 0.25)' },
  violet: { from: 'oklch(0.6  0.18 300)', to: 'oklch(0.45 0.2  295)', soft: 'oklch(0.96 0.03 300)', ring: 'oklch(0.85 0.10 300)',  text: 'oklch(0.45 0.18 300)', glow: 'oklch(0.55 0.18 300 / 0.25)' },
  cyan:   { from: 'oklch(0.7  0.13 220)', to: 'oklch(0.55 0.15 215)', soft: 'oklch(0.96 0.02 220)', ring: 'oklch(0.85 0.08 220)',  text: 'oklch(0.45 0.15 220)', glow: 'oklch(0.6  0.15 220 / 0.25)' },
}

/* -------------------------------------------------------------------------- */
/*  StatCard                                                                  */
/* -------------------------------------------------------------------------- */

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  trendValue,
  accent,
  spark,
  sparkLabels,
  sparkFormat,
}: {
  title: string
  value: string | number
  icon: LucideIcon
  description: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  accent: StatAccent
  spark?: number[]
  sparkLabels?: string[]
  sparkFormat?: (v: number) => string
}) {
  const a = accentMap[accent]

  return (
    <div
      className="group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 cursor-default ring-1 ring-foreground/[0.06] hover:ring-foreground/[0.12] hover:-translate-y-0.5 hover:shadow-xl"
      style={{
        backgroundColor: 'var(--card)',
        boxShadow: `0 1px 0 0 ${a.soft} inset`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 18px 40px -20px ${a.glow}, 0 1px 0 0 ${a.soft} inset`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = `0 1px 0 0 ${a.soft} inset`
      }}
    >
      <div
        className="absolute inset-x-0 top-0 h-[3px]"
        style={{ background: `linear-gradient(90deg, ${a.from}, ${a.to})` }}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2 min-w-0">
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.08em]"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {title}
          </p>
          <p
            className="text-[26px] font-bold tracking-tight leading-none tabular-nums"
            style={{ color: 'var(--foreground)' }}
          >
            {value}
          </p>
        </div>
        <div
          className="flex size-11 shrink-0 items-center justify-center rounded-xl ring-1"
          style={{
            background: `linear-gradient(135deg, ${a.from}, ${a.to})`,
            boxShadow: `0 8px 20px -8px ${a.glow}`,
            // @ts-expect-error CSS custom property
            '--tw-ring-color': a.ring,
          }}
        >
          <Icon className="size-5 text-white" />
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {trend && trend !== 'neutral' && (
            <span
              className="inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-md"
              style={{
                color: trend === 'up' ? 'var(--success)' : 'var(--destructive)',
                backgroundColor: trend === 'up' ? 'var(--success-light)' : 'oklch(0.95 0.03 25)',
              }}
            >
              {trend === 'up' ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
              {trendValue}
            </span>
          )}
          <span className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>
            {description}
          </span>
        </div>
        {spark && spark.length > 0 && (
          <Sparkline
            values={spark}
            color={a.from}
            labels={sparkLabels}
            formatValue={sparkFormat}
          />
        )}
      </div>
    </div>
  )
}
