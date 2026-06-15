'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Gift,
  Loader2,
  Plus,
  UserPlus,
  Package,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Wallet,
  Activity,
  Clock,
} from 'lucide-react'
import { customerService, transactionService } from '@/lib/services'
import {
  formatCurrency,
  calculateTransactionPiutang,
  calculateTransactionTotals,
  calculateAccumulatedPaidOmzet,
  calculateBonusesGranted,
  calculateBonusAvailable,
} from '@/lib/calculations'
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'
import { id as localeID } from 'date-fns/locale'
import type { Customer, Transaction } from '@/types'

/** Compact currency (e.g. Rp 3.5jt, Rp 1.2M) */
function formatCompactCurrency(amount: number): string {
  if (!amount) return 'Rp 0'
  if (amount >= 1_000_000_000) return `Rp ${(amount / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (amount >= 1_000_000) return `Rp ${(amount / 1_000_000).toFixed(1).replace(/\.0$/, '')}jt`
  if (amount >= 1_000) return `Rp ${(amount / 1_000).toFixed(0)}rb`
  return `Rp ${amount}`
}

/* -------------------------------------------------------------------------- */
/*  Reusable bits                                                             */
/* -------------------------------------------------------------------------- */

type Accent = 'blue' | 'green' | 'amber' | 'violet' | 'cyan'

const accentMap: Record<Accent, {
  from: string
  to: string
  soft: string
  ring: string
  text: string
  glow: string
}> = {
  blue:   { from: 'oklch(0.55 0.18 250)', to: 'oklch(0.45 0.18 250)', soft: 'oklch(0.96 0.02 250)', ring: 'oklch(0.85 0.08 250)',  text: 'oklch(0.42 0.18 250)', glow: 'oklch(0.55 0.18 250 / 0.25)' },
  green:  { from: 'oklch(0.7  0.16 145)', to: 'oklch(0.55 0.16 145)', soft: 'oklch(0.96 0.03 145)', ring: 'oklch(0.85 0.10 145)',  text: 'oklch(0.45 0.15 145)', glow: 'oklch(0.6  0.18 145 / 0.25)' },
  amber:  { from: 'oklch(0.78 0.16 75)',  to: 'oklch(0.65 0.18 60)',  soft: 'oklch(0.97 0.03 75)',  ring: 'oklch(0.88 0.10 75)',   text: 'oklch(0.5  0.16 65)',  glow: 'oklch(0.7  0.16 75  / 0.25)' },
  violet: { from: 'oklch(0.6  0.18 300)', to: 'oklch(0.45 0.2  295)', soft: 'oklch(0.96 0.03 300)', ring: 'oklch(0.85 0.10 300)',  text: 'oklch(0.45 0.18 300)', glow: 'oklch(0.55 0.18 300 / 0.25)' },
  cyan:   { from: 'oklch(0.7  0.13 220)', to: 'oklch(0.55 0.15 215)', soft: 'oklch(0.96 0.02 220)', ring: 'oklch(0.85 0.08 220)',  text: 'oklch(0.45 0.15 220)', glow: 'oklch(0.6  0.15 220 / 0.25)' },
}

/** Tiny 6-bar sparkline shown inside each stat card with hover tooltip */
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
            <span className="block text-[9px] opacity-70 uppercase tracking-wider">{labels[hovered]}</span>
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
              boxShadow: isHovered ? `0 -3px 8px -1px ${color}` : isLast ? `0 -2px 6px -2px ${color}` : 'none',
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

function StatCard({
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
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  description: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  accent: Accent
  spark: number[]
  sparkLabels?: string[]
  sparkFormat?: (v: number) => string
}) {
  const a = accentMap[accent]

  return (
    <div
      className="group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 cursor-default
                 ring-1 ring-foreground/[0.06] hover:ring-foreground/[0.12]
                 hover:-translate-y-0.5 hover:shadow-xl"
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
      {/* top accent line */}
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
        <Sparkline values={spark} color={a.from} labels={sparkLabels} formatValue={sparkFormat} />
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Omzet chart                                                               */
/* -------------------------------------------------------------------------- */

type Range = 3 | 6 | 12

function OmzetChart({ transactions }: { transactions: Transaction[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [lockedIndex, setLockedIndex] = useState<number | null>(null)
  const [range, setRange] = useState<Range>(6)

  // ESC clears locked selection
  useEffect(() => {
    if (lockedIndex === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLockedIndex(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lockedIndex])

  const monthlyData = useMemo(() => {
    const now = new Date()
    const months: Array<{
      label: string
      fullLabel: string
      shortLabel: string
      omzet: number
      profit: number
      count: number
      isCurrent: boolean
      date: Date
    }> = []

    for (let i = range - 1; i >= 0; i--) {
      const date = subMonths(now, i)
      const start = startOfMonth(date)
      const end = endOfMonth(date)

      const monthTransactions = transactions.filter((t) => {
        const d = new Date(t.date)
        return isWithinInterval(d, { start, end })
      })

      const omzet = monthTransactions.reduce((sum, t) => {
        const { totalOmzet } = calculateTransactionTotals(t.items, t.ongkir, t.status, t.isBonus)
        return sum + totalOmzet
      }, 0)

      const profit = monthTransactions.reduce((sum, t) => {
        const { totalProfit } = calculateTransactionTotals(t.items, t.ongkir, t.status, t.isBonus)
        return sum + totalProfit
      }, 0)

      months.push({
        label: format(date, 'MMM', { locale: localeID }),
        shortLabel: format(date, 'MMM yy', { locale: localeID }),
        fullLabel: format(date, 'MMMM yyyy', { locale: localeID }),
        omzet,
        profit,
        count: monthTransactions.length,
        isCurrent: i === 0,
        date,
      })
    }
    return months
  }, [transactions, range])

  // active index = locked (priority) or hovered
  const activeIndex = lockedIndex ?? hoveredIndex
  const isActive = activeIndex !== null

  const maxOmzet = Math.max(...monthlyData.map((d) => d.omzet), 1)
  const totalAll = monthlyData.reduce((s, m) => s + m.omzet, 0)
  const peakIndex = monthlyData.reduce(
    (best, m, i) => (m.omzet > monthlyData[best].omzet ? i : best),
    0
  )

  // y-axis ticks (5 grid lines)
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((p) => Math.round(maxOmzet * p))

  const handleBarClick = (i: number) => {
    if (lockedIndex === i) {
      setLockedIndex(null)
    } else {
      setLockedIndex(i)
      setHoveredIndex(null)
    }
  }

  const handleBarEnter = (i: number) => {
    if (lockedIndex === null) setHoveredIndex(i)
  }

  const handleBarLeave = () => {
    if (lockedIndex === null) setHoveredIndex(null)
  }

  const activeMonth = activeIndex !== null ? monthlyData[activeIndex] : null
  const prevMonth = activeIndex !== null && activeIndex > 0 ? monthlyData[activeIndex - 1] : null
  const monthDelta =
    activeMonth && prevMonth && prevMonth.omzet > 0
      ? ((activeMonth.omzet - prevMonth.omzet) / prevMonth.omzet) * 100
      : null

  // Average values for reference line
  const avgOmzet = totalAll / monthlyData.length
  const avgY = avgOmzet > 0 ? 100 - (avgOmzet / maxOmzet) * 100 : 100

  // SVG points for area/line overlay (viewBox 0-100, y inverted)
  const points = monthlyData.map((m, i) => {
    const x = ((i + 0.5) / monthlyData.length) * 100
    const y = 100 - (m.omzet / maxOmzet) * 100
    return { x, y, omzet: m.omzet, profit: m.profit, count: m.count, isCurrent: m.isCurrent }
  })

  // Smooth bezier path through points (cubic with horizontal tangents)
  const buildSmoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return ''
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`
    const step = pts[1].x - pts[0].x
    let d = `M ${pts[0].x} ${pts[0].y}`
    for (let i = 0; i < pts.length - 1; i++) {
      const c1x = pts[i].x + step / 2
      const c2x = pts[i + 1].x - step / 2
      d += ` C ${c1x} ${pts[i].y}, ${c2x} ${pts[i + 1].y}, ${pts[i + 1].x} ${pts[i + 1].y}`
    }
    return d
  }
  const linePath = buildSmoothPath(points)
  const areaPath = `${linePath} L 100 100 L 0 100 Z`

  // Profit series (different scale mapped to same max so it sits below)
  const profitPoints = monthlyData.map((m, i) => ({
    x: ((i + 0.5) / monthlyData.length) * 100,
    y: 100 - (m.profit / maxOmzet) * 100,
  }))
  const profitLinePath = buildSmoothPath(profitPoints)
  const profitAreaPath = `${profitLinePath} L 100 100 L 0 100 Z`

  return (
    <div className="space-y-4">
      {/* toolbar: range selector + status */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-0.5 rounded-lg ring-1 ring-foreground/[0.08]" style={{ backgroundColor: 'var(--muted)' }}>
          {([3, 6, 12] as Range[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => {
                setRange(r)
                setLockedIndex(null)
                setHoveredIndex(null)
              }}
              className="px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all duration-200 cursor-pointer"
              style={
                range === r
                  ? {
                      backgroundColor: 'var(--card)',
                      color: 'var(--foreground)',
                      boxShadow: '0 1px 2px color-mix(in oklch, var(--foreground) 8%, transparent)',
                    }
                  : { color: 'var(--muted-foreground)' }
              }
            >
              {r}B
            </button>
          ))}
        </div>
        {lockedIndex !== null && activeMonth ? (
          <button
            type="button"
            onClick={() => setLockedIndex(null)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer transition-colors"
            style={{
              backgroundColor: 'var(--blue-50)',
              color: 'var(--blue-600)',
              border: '1px solid var(--blue-200)',
            }}
          >
            <span className="inline-block size-1.5 rounded-full" style={{ backgroundColor: 'var(--blue-500)' }} />
            {activeMonth.fullLabel}
            <span style={{ color: 'var(--muted-foreground)' }}>·</span>
            <span>ESC untuk tutup</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="inline-block size-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--success)' }} />
            <span className="text-[10px] font-medium" style={{ color: 'var(--muted-foreground)' }}>
              Hover / klik bar untuk detail
            </span>
          </div>
        )}
      </div>

      <div className="relative">
        {/* tooltip */}
        {activeMonth && (
          <div
            className="absolute z-20 pointer-events-none"
            style={{
              top: 0,
              left: `${((activeIndex! + 0.5) / monthlyData.length) * 100}%`,
              transform: 'translate(-50%, -10px)',
              animation: lockedIndex !== null ? 'tooltip-in 200ms ease-out' : 'tooltip-in 150ms ease-out',
            }}
          >
            <div
              className="rounded-xl px-3.5 py-2.5 shadow-2xl ring-1 min-w-[200px]"
              style={{
                backgroundColor: 'var(--foreground)',
                color: 'var(--background)',
                borderColor: 'color-mix(in oklch, white 15%, transparent)',
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">
                  {activeMonth.fullLabel}
                </p>
                {activeMonth.isCurrent && (
                  <span
                    className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: 'color-mix(in oklch, white 20%, transparent)',
                      color: 'white',
                    }}
                  >
                    Sekarang
                  </span>
                )}
              </div>
              <p className="text-base font-bold mt-0.5 tabular-nums">
                {formatCurrency(activeMonth.omzet)}
              </p>
              <div className="mt-1.5 pt-1.5 flex items-center justify-between gap-3 text-[10px] opacity-90" style={{ borderTop: '1px solid color-mix(in oklch, white 12%, transparent)' }}>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <span className="inline-block size-1.5 rounded-full" style={{ backgroundColor: 'oklch(0.75 0.18 145)' }} />
                    {formatCompactCurrency(activeMonth.profit)}
                  </span>
                  <span>{activeMonth.count} transaksi</span>
                </div>
                {monthDelta !== null && (
                  <span
                    className="inline-flex items-center gap-0.5 font-semibold px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor:
                        monthDelta >= 0
                          ? 'oklch(0.6 0.18 145 / 0.25)'
                          : 'oklch(0.6 0.22 25 / 0.25)',
                    }}
                  >
                    {monthDelta >= 0 ? <TrendingUp className="size-2.5" /> : <TrendingDown className="size-2.5" />}
                    {Math.abs(monthDelta).toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          {/* y-axis labels */}
          <div
            className="flex flex-col justify-between pb-7 text-[10px] font-medium tabular-nums text-right"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {[...ticks].reverse().map((t, i) => (
              <span key={i}>{formatCompactCurrency(t)}</span>
            ))}
          </div>

          <div className="flex-1 relative">
            {/* grid lines */}
            <div className="absolute inset-0 pb-7 flex flex-col justify-between pointer-events-none">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="border-t border-dashed"
                  style={{ borderColor: 'color-mix(in oklch, var(--border) 70%, transparent)' }}
                />
              ))}
            </div>

            {/* crosshair vertical line */}
            {isActive && (
              <div
                className="absolute top-0 bottom-7 w-px pointer-events-none z-[1]"
                style={{
                  left: `${((activeIndex! + 0.5) / monthlyData.length) * 100}%`,
                  background: 'linear-gradient(180deg, oklch(0.55 0.18 250 / 0.5), oklch(0.55 0.18 250 / 0.05))',
                }}
              />
            )}

            {/* bars + overlay chart */}
            <div className="relative flex items-end gap-2 h-56 pt-10 pb-8">
              {/* BACKGROUND SVG: area fills + average line (clipped to chart area) */}
              <div
                className="absolute inset-x-0 pointer-events-none overflow-hidden"
                style={{ top: 40, bottom: 32 }}
              >
                <svg
                  className="block w-full h-full"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="omzetAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.55 0.2 250)" stopOpacity="0.35" />
                      <stop offset="60%" stopColor="oklch(0.55 0.2 250)" stopOpacity="0.08" />
                      <stop offset="100%" stopColor="oklch(0.55 0.2 250)" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="profitAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.65 0.18 145)" stopOpacity="0.22" />
                      <stop offset="100%" stopColor="oklch(0.65 0.18 145)" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* average reference line */}
                  {avgOmzet > 0 && (
                    <g>
                      <line
                        x1="0" y1={avgY} x2="100" y2={avgY}
                        stroke="oklch(0.5 0.05 250)"
                        strokeWidth="0.15"
                        strokeDasharray="1.2 1.2"
                        opacity="0.45"
                        vectorEffect="non-scaling-stroke"
                      />
                      <rect
                        x="0.4" y={avgY - 2.2}
                        width="9" height="2.6"
                        rx="1.3"
                        fill="oklch(0.55 0.18 250)"
                        opacity="0.9"
                      />
                      <text
                        x="5" y={avgY - 0.4}
                        fontSize="2"
                        fill="white"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontWeight="600"
                        style={{ fontFamily: 'inherit' }}
                      >
                        AVG
                      </text>
                    </g>
                  )}

                  {/* profit area (behind) */}
                  <path d={profitAreaPath} fill="url(#profitAreaGrad)" />
                  {/* omzet area (front) */}
                  <path d={areaPath} fill="url(#omzetAreaGrad)" />
                </svg>
              </div>

              {/* FOREGROUND SVG: trend lines + data points (clipped to chart area) */}
              <div
                className="absolute inset-x-0 pointer-events-none overflow-hidden"
                style={{ top: 40, bottom: 32 }}
              >
                <svg
                  className="block w-full h-full"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  {/* profit dashed trend line */}
                  {profitLinePath && (
                    <path
                      d={profitLinePath}
                      stroke="oklch(0.55 0.18 145)"
                      strokeWidth="0.25"
                      fill="none"
                      strokeDasharray="1 0.8"
                      opacity="0.55"
                      vectorEffect="non-scaling-stroke"
                    />
                  )}

                  {/* omzet smooth trend line (animated draw) */}
                  <path
                    d={linePath}
                    stroke="oklch(0.5 0.2 250)"
                    strokeWidth="0.5"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                    style={{
                      strokeDasharray: 600,
                      strokeDashoffset: 600,
                      animation: 'line-draw 1.4s cubic-bezier(0.65, 0, 0.35, 1) 700ms forwards',
                    }}
                  />

                  {/* data points */}
                  {points.map((p, i) => {
                    const isActive = i === activeIndex
                    const isPeak = i === peakIndex && p.omzet > 0
                    return (
                      <g key={i}>
                        {/* outer glow ring for active/peak */}
                        {(isActive || isPeak) && p.omzet > 0 && (
                          <circle
                            cx={p.x} cy={p.y} r="2.2"
                            fill="oklch(0.55 0.18 250)"
                            opacity={isActive ? 0.25 : 0.18}
                            vectorEffect="non-scaling-stroke"
                            style={{ transition: 'opacity 200ms ease' }}
                          />
                        )}
                        <circle
                          cx={p.x} cy={p.y}
                          r={isActive ? '1.1' : isPeak ? '0.85' : '0.6'}
                          fill={isActive ? 'oklch(0.5 0.22 250)' : 'var(--card)'}
                          stroke="oklch(0.5 0.2 250)"
                          strokeWidth={isActive ? '0.5' : '0.35'}
                          vectorEffect="non-scaling-stroke"
                          style={{ transition: 'all 200ms ease' }}
                        />
                        {/* current month indicator dot */}
                        {p.isCurrent && (
                          <circle
                            cx={p.x} cy={p.y - 2.6}
                            r="0.9"
                            fill="oklch(0.6 0.18 145)"
                            vectorEffect="non-scaling-stroke"
                            style={{ animation: 'pulse-ring 2s infinite' }}
                          />
                        )}
                      </g>
                    )
                  })}
                </svg>
              </div>

              {/* bars layer */}
              {monthlyData.map((month, i) => {
                const hasOmzet = month.omzet > 0
                const hasProfit = month.profit > 0
                const omzetHeight = hasOmzet ? (month.omzet / maxOmzet) * 100 : 0
                const profitHeight = hasProfit ? (month.profit / maxOmzet) * 100 : 0
                const isHovered = hoveredIndex === i
                const isLocked = lockedIndex === i
                const isActiveBar = isLocked || isHovered
                const isPeak = i === peakIndex && hasOmzet
                const dimmed = isActive && !isActiveBar
                const isCurrent = month.isCurrent

                // entrance animation timing
                const animDelay = `${i * 50}ms`

                return (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center gap-1.5 cursor-pointer group relative h-full"
                    onMouseEnter={() => handleBarEnter(i)}
                    onMouseLeave={handleBarLeave}
                    onClick={() => handleBarClick(i)}
                  >
                    {/* inline value label */}
                    <div
                      className="absolute -top-7 left-0 right-0 flex justify-center transition-opacity duration-200 pointer-events-none"
                      style={{ opacity: isActiveBar && hasOmzet ? 1 : 0 }}
                    >
                      <span
                        className="text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: 'var(--foreground)',
                          color: 'var(--background)',
                        }}
                      >
                        {formatCompactCurrency(month.omzet)}
                      </span>
                    </div>

                    <div
                      className="w-full flex flex-col items-center gap-1 h-full"
                      style={{ justifyContent: 'flex-end' }}
                    >
                      <div className="w-full flex gap-1.5 items-end h-full">
                        {/* omzet bar OR empty placeholder */}
                        {hasOmzet ? (
                          <div
                            className="flex-1 rounded-t-md relative overflow-hidden"
                            style={{
                              height: `${omzetHeight}%`,
                              minHeight: '6px',
                              background: isLocked
                                ? 'linear-gradient(180deg, oklch(0.6 0.22 250) 0%, oklch(0.4 0.2 250) 100%)'
                                : isHovered
                                  ? 'linear-gradient(180deg, oklch(0.65 0.2 250) 0%, oklch(0.45 0.18 250) 100%)'
                                  : 'linear-gradient(180deg, oklch(0.7 0.16 250) 0%, oklch(0.5 0.18 250) 100%)',
                              transformOrigin: 'bottom',
                              animation: `bar-rise 700ms cubic-bezier(0.34, 1.3, 0.64, 1) ${animDelay} both`,
                              boxShadow: isLocked
                                ? '0 -8px 24px -4px oklch(0.55 0.18 250 / 0.55), inset 0 0 0 2px oklch(0.98 0.01 250)'
                                : isPeak
                                  ? '0 -6px 18px -2px oklch(0.55 0.18 250 / 0.45)'
                                  : isHovered
                                    ? '0 -6px 16px -2px oklch(0.55 0.18 250 / 0.4)'
                                    : 'none',
                              opacity: dimmed ? 0.3 : 1,
                              transition: 'opacity 250ms ease, box-shadow 250ms ease, background 250ms ease',
                            }}
                          >
                            {/* glossy highlight */}
                            <div
                              className="absolute inset-x-0 top-0 h-1/3 rounded-t-md"
                              style={{
                                background: 'linear-gradient(180deg, color-mix(in oklch, white 40%, transparent), transparent)',
                              }}
                            />
                          </div>
                        ) : (
                          /* empty placeholder: dashed outline + dot */
                          <div
                            className="flex-1 flex flex-col items-center justify-end"
                            style={{ opacity: dimmed ? 0.3 : 1, transition: 'opacity 250ms ease' }}
                          >
                            <div
                              className="w-full rounded-t-sm border-t-2 border-dashed"
                              style={{
                                height: '10px',
                                borderColor: 'color-mix(in oklch, var(--muted-foreground) 25%, transparent)',
                                animation: `fade-up 500ms ease-out ${animDelay} both`,
                              }}
                            />
                            <span
                              className="text-[8px] font-semibold mt-0.5 tabular-nums"
                              style={{ color: 'color-mix(in oklch, var(--muted-foreground) 50%, transparent)' }}
                            >
                              0
                            </span>
                          </div>
                        )}

                        {/* profit bar OR empty placeholder */}
                        {hasProfit ? (
                          <div
                            className="flex-1 rounded-t-md"
                            style={{
                              height: `${profitHeight}%`,
                              minHeight: '3px',
                              background: isLocked
                                ? 'linear-gradient(180deg, oklch(0.8 0.16 145) 0%, oklch(0.55 0.18 145) 100%)'
                                : isHovered
                                  ? 'linear-gradient(180deg, oklch(0.85 0.14 145) 0%, oklch(0.65 0.16 145) 100%)'
                                  : 'linear-gradient(180deg, oklch(0.88 0.1 145) 0%, oklch(0.7 0.14 145) 100%)',
                              transformOrigin: 'bottom',
                              animation: `bar-rise 700ms cubic-bezier(0.34, 1.3, 0.64, 1) ${animDelay} both`,
                              boxShadow: isLocked
                                ? 'inset 0 0 0 2px oklch(0.98 0.01 250)'
                                : 'none',
                              opacity: dimmed ? 0.3 : 1,
                              transition: 'opacity 250ms ease, box-shadow 250ms ease, background 250ms ease',
                            }}
                          />
                        ) : (
                          <div
                            className="flex-1"
                            style={{ opacity: dimmed ? 0.3 : 1, transition: 'opacity 250ms ease' }}
                          />
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-0.5">
                      <span
                        className="text-[11px] font-semibold uppercase tracking-wider transition-colors duration-200"
                        style={{
                          color: isActiveBar
                            ? 'var(--foreground)'
                            : 'var(--muted-foreground)',
                        }}
                      >
                        {month.label}
                      </span>
                      {isCurrent && (
                        <span
                          className="text-[8px] font-bold uppercase tracking-wider"
                          style={{ color: 'var(--success)' }}
                        >
                          Sekarang
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <span
              className="inline-block w-3 h-3 rounded-sm"
              style={{ background: 'linear-gradient(180deg, oklch(0.7 0.16 250), oklch(0.5 0.18 250))' }}
            />
            <span className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>Omzet</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="inline-block w-3 h-3 rounded-sm"
              style={{ background: 'linear-gradient(180deg, oklch(0.88 0.1 145), oklch(0.7 0.14 145))' }}
            />
            <span className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>Profit</span>
          </div>
        </div>
        <div className="text-[10px] font-medium tabular-nums" style={{ color: 'var(--muted-foreground)' }}>
          Total {range}B: <span style={{ color: 'var(--foreground)' }} className="font-semibold">{formatCompactCurrency(totalAll)}</span>
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Activity timeline                                                         */
/* -------------------------------------------------------------------------- */

function ActivityTimeline({ transactions, customers }: { transactions: Transaction[]; customers: Customer[] }) {
  const recent = transactions
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6)

  if (recent.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div
          className="flex size-12 items-center justify-center rounded-full mb-3"
          style={{ backgroundColor: 'var(--muted)' }}
        >
          <Activity className="size-5" style={{ color: 'var(--muted-foreground)' }} />
        </div>
        <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
          Belum ada aktivitas
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
          Transaksi yang dicatat akan muncul di sini
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-0">
      {recent.map((t, i) => {
        const customer = customers.find((c) => c.id === t.customerId)
        const isLunas = t.status === 'LUNAS'
        const { totalTagihan } = calculateTransactionTotals(t.items, t.ongkir, t.status, t.isBonus)
        const d = new Date(t.date)
        const day = format(d, 'dd')
        const mon = format(d, 'MMM', { locale: localeID })

        return (
          <div
            key={t.id}
            className="group relative flex gap-4 py-3 transition-colors duration-150 -mx-2 px-2 rounded-lg"
            style={{
              borderBottom: i < recent.length - 1 ? '1px solid var(--border)' : 'none',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--muted)' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
          >
            {/* Date pill */}
            <div
              className="flex flex-col items-center justify-center w-12 shrink-0 rounded-lg py-1.5"
              style={{
                backgroundColor: isLunas ? 'var(--success-light)' : 'var(--warning-light)',
              }}
            >
              <span
                className="text-[15px] font-bold leading-none tabular-nums"
                style={{ color: isLunas ? 'var(--success)' : 'var(--warning)' }}
              >
                {day}
              </span>
              <span
                className="text-[9px] font-semibold uppercase tracking-wider mt-0.5"
                style={{ color: isLunas ? 'var(--success)' : 'var(--warning)' }}
              >
                {mon}
              </span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>
                      {t.bonNumber}
                    </p>
                    {isLunas ? (
                      <CheckCircle2 className="size-3.5 shrink-0" style={{ color: 'var(--success)' }} />
                    ) : (
                      <AlertCircle className="size-3.5 shrink-0" style={{ color: 'var(--warning)' }} />
                    )}
                  </div>
                  <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--muted-foreground)' }}>
                    {customer?.name ?? 'Pelanggan tidak dikenal'}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--foreground)' }}>
                    {formatCurrency(totalTagihan)}
                  </p>
                  <Badge
                    variant={isLunas ? 'default' : 'secondary'}
                    className="mt-1 text-[10px] font-semibold"
                    style={
                      isLunas
                        ? { backgroundColor: 'var(--success-light)', color: 'var(--success)', border: 'none' }
                        : { backgroundColor: 'var(--warning-light)', color: 'var(--warning)', border: 'none' }
                    }
                  >
                    {t.status}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Hero greeting card                                                        */
/* -------------------------------------------------------------------------- */

function HeroCard({
  customers,
  transactions,
  omzetThisMonth,
  bonusAvailable,
}: {
  customers: Customer[]
  transactions: Transaction[]
  omzetThisMonth: number
  bonusAvailable: number
}) {
  const now = new Date()
  const hour = now.getHours()
  const greeting =
    hour < 11 ? 'Selamat pagi' : hour < 15 ? 'Selamat siang' : hour < 18 ? 'Selamat sore' : 'Selamat malam'

  const txThisMonth = transactions.filter((t) => {
    const d = new Date(t.date)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  const activeCustomers = customers.filter((c) => !c.deletedAt).length

  const stats = [
    { label: 'Pelanggan', value: activeCustomers.toString(), icon: Users },
    { label: 'Transaksi Bulan Ini', value: txThisMonth.toString(), icon: FileText },
    { label: 'Omzet Bulan Ini', value: formatCompactCurrency(omzetThisMonth), icon: Wallet },
    { label: 'Bonus Tersedia', value: `${bonusAvailable}`, icon: Gift },
  ]

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-6 sm:p-7"
      style={{
        background: 'linear-gradient(135deg, oklch(0.45 0.18 250) 0%, oklch(0.5 0.2 285) 50%, oklch(0.45 0.18 320) 100%)',
      }}
    >
      {/* decorative orbs */}
      <div
        className="absolute -top-24 -right-24 size-72 rounded-full blur-3xl pointer-events-none"
        style={{ backgroundColor: 'oklch(0.65 0.22 285 / 0.5)' }}
      />
      <div
        className="absolute -bottom-32 -left-16 size-80 rounded-full blur-3xl pointer-events-none"
        style={{ backgroundColor: 'oklch(0.6 0.22 250 / 0.45)' }}
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

      <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* greeting */}
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm ring-1 ring-white/20">
            <Sparkles className="size-3 text-white" />
            <span className="text-[11px] font-semibold text-white tracking-wide uppercase">
              Dashboard
            </span>
          </div>
          <h1 className="mt-3 text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {greeting}, Admin 👋
          </h1>
          <p className="mt-1.5 text-sm text-white/80 max-w-md">
            Berikut ringkasan performa HL Internal Finance Anda hari ini,
            {' '}{format(now, 'EEEE, dd MMMM yyyy', { locale: localeID })}.
          </p>
        </div>

        {/* inline mini stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 lg:gap-3">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-xl p-3 backdrop-blur-md ring-1 ring-white/15"
              style={{ backgroundColor: 'color-mix(in oklch, white 12%, transparent)' }}
            >
              <s.icon className="size-4 text-white/90" />
              <p className="mt-1.5 text-base font-bold text-white tabular-nums leading-none">
                {s.value}
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-wider font-semibold text-white/70">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Quick action                                                              */
/* -------------------------------------------------------------------------- */

function QuickAction({
  href,
  title,
  desc,
  icon: Icon,
  from,
  to,
  ringColor,
}: {
  href: string
  title: string
  desc: string
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  from: string
  to: string
  ringColor: string
}) {
  return (
    <Link href={href} className="block group">
      <div
        className="relative flex items-center gap-3 rounded-xl p-3.5 transition-all duration-200
                   ring-1 hover:shadow-lg hover:-translate-y-0.5 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${from}, ${to})`,
          // @ts-expect-error CSS custom property
          '--tw-ring-color': ringColor,
        }}
      >
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/20 ring-1 ring-white/30 backdrop-blur-sm"
        >
          <Icon className="size-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="text-xs text-white/80 mt-0.5">{desc}</p>
        </div>
        <ArrowUpRight className="size-4 text-white shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>
    </Link>
  )
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function DashboardPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([customerService.getAll(), transactionService.getAll()])
      .then(([c, t]) => {
        setCustomers(c)
        setTransactions(t)
      })
      .finally(() => setLoading(false))
  }, [])

  // Build 6-month sparklines BEFORE any early return so hook order is stable.
  // `now` is created inside the memo so it isn't part of the dep array.
  const monthlySeries = useMemo(() => {
    const months: Array<{
      omzet: number
      count: number
      piutangAdded: number
    }> = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(now, i)
      const start = startOfMonth(date)
      const end = endOfMonth(date)
      const monthTx = transactions.filter((t) => {
        const d = new Date(t.date)
        return isWithinInterval(d, { start, end })
      })
      const omzet = monthTx.reduce((s, t) => {
        const { totalOmzet } = calculateTransactionTotals(t.items, t.ongkir, t.status, t.isBonus)
        return s + totalOmzet
      }, 0)
      months.push({
        omzet,
        count: monthTx.length,
        piutangAdded: monthTx.filter((t) => t.status === 'PIUTANG').length,
      })
    }
    return months
  }, [transactions])

  // month labels for sparkline tooltips (computed once)
  const sparkLabels = useMemo(() => {
    const labels: string[] = []
    const ref = new Date()
    for (let i = 5; i >= 0; i--) {
      labels.push(format(subMonths(ref, i), 'MMM', { locale: localeID }))
    }
    return labels
  }, [])

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--muted-foreground)' }} />
            <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Memuat data...</span>
          </div>
        </div>
      </AppShell>
    )
  }

  const activeCustomers = customers.filter((c) => !c.deletedAt)
  const piutangCount = transactions.filter((t) => t.status === 'PIUTANG' && !t.isBonus).length
  const totalPiutang = transactions.reduce(
    (sum, t) => sum + calculateTransactionPiutang(t.items, t.ongkir, t.status, t.isBonus),
    0
  )

  const customersWithBonus = activeCustomers
    .filter((c) => c.bonusThreshold > 0)
    .map((c) => {
      const customerTransactions = transactions.filter((t) => t.customerId === c.id)
      const accumulated = calculateAccumulatedPaidOmzet(customerTransactions)
      const granted = calculateBonusesGranted(customerTransactions)
      const available = calculateBonusAvailable(accumulated, c.bonusThreshold, granted)
      return { customer: c, available }
    })
    .filter((b) => b.available > 0)

  const totalBonusAvailable = customersWithBonus.reduce((s, b) => s + b.available, 0)

  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  const lastMonth = subMonths(now, 1)
  const lastMonthStart = startOfMonth(lastMonth)
  const lastMonthEnd = endOfMonth(lastMonth)

  const currentMonthTransactions = transactions.filter((t) => {
    const d = new Date(t.date)
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear
  })

  const lastMonthTransactions = transactions.filter((t) => {
    const d = new Date(t.date)
    return isWithinInterval(d, { start: lastMonthStart, end: lastMonthEnd })
  })

  const currentOmzet = currentMonthTransactions.reduce((sum, t) => {
    const { totalOmzet } = calculateTransactionTotals(t.items, t.ongkir, t.status, t.isBonus)
    return sum + totalOmzet
  }, 0)

  const lastOmzet = lastMonthTransactions.reduce((sum, t) => {
    const { totalOmzet } = calculateTransactionTotals(t.items, t.ongkir, t.status, t.isBonus)
    return sum + totalOmzet
  }, 0)

  const omzetTrend = lastOmzet > 0 ? ((currentOmzet - lastOmzet) / lastOmzet) * 100 : 0
  const transactionTrend = lastMonthTransactions.length > 0
    ? ((currentMonthTransactions.length - lastMonthTransactions.length) / lastMonthTransactions.length) * 100
    : 0

  const customerSpark = [3, 4, 5, 4, 5, activeCustomers.length || 5]
  const piutangSpark = monthlySeries.map((m) => m.piutangAdded)
  const txSpark = monthlySeries.map((m) => m.count)
  const omzetSpark = monthlySeries.map((m) => m.omzet)

  return (
    <AppShell>
      <div className="space-y-6">
        <HeroCard
          customers={customers}
          transactions={transactions}
          omzetThisMonth={currentOmzet}
          bonusAvailable={totalBonusAvailable}
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Pelanggan"
            value={activeCustomers.length}
            icon={Users}
            description="Pelanggan aktif"
            trend="neutral"
            accent="blue"
            spark={customerSpark}
            sparkLabels={sparkLabels}
          />
          <StatCard
            title="Total Piutang"
            value={formatCurrency(totalPiutang)}
            icon={DollarSign}
            description={`${piutangCount} transaksi belum lunas`}
            trend={piutangCount > 0 ? 'down' : 'neutral'}
            trendValue={piutangCount > 0 ? `${piutangCount} tagihan` : undefined}
            accent="amber"
            spark={piutangSpark}
            sparkLabels={sparkLabels}
          />
          <StatCard
            title="Transaksi Bulan Ini"
            value={currentMonthTransactions.length}
            icon={FileText}
            description="Semua status"
            trend={transactionTrend !== 0 ? (transactionTrend > 0 ? 'up' : 'down') : 'neutral'}
            trendValue={transactionTrend !== 0 ? `${Math.abs(Math.round(transactionTrend))}%` : undefined}
            accent="green"
            spark={txSpark}
            sparkLabels={sparkLabels}
          />
          <StatCard
            title="Omzet Bulan Ini"
            value={formatCurrency(currentOmzet)}
            icon={TrendingUp}
            description="Dari transaksi Lunas"
            trend={omzetTrend !== 0 ? (omzetTrend > 0 ? 'up' : 'down') : 'neutral'}
            trendValue={omzetTrend !== 0 ? `${Math.abs(Math.round(omzetTrend))}%` : undefined}
            accent="violet"
            spark={omzetSpark}
            sparkLabels={sparkLabels}
            sparkFormat={formatCompactCurrency}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {/* Left column: chart + activity */}
          <div className="lg:col-span-2 space-y-4">
            <div
              className="rounded-2xl p-5 sm:p-6 ring-1 ring-foreground/[0.06]"
              style={{
                backgroundColor: 'var(--card)',
                backgroundImage:
                  'radial-gradient(at top right, oklch(0.55 0.18 250 / 0.04), transparent 50%)',
              }}
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <div
                      className="flex size-7 items-center justify-center rounded-lg"
                      style={{
                        background: 'linear-gradient(135deg, oklch(0.55 0.18 250), oklch(0.45 0.2 285))',
                      }}
                    >
                      <TrendingUp className="size-3.5 text-white" />
                    </div>
                    <h3 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                      Omzet 6 Bulan Terakhir
                    </h3>
                  </div>
                  <p className="text-xs mt-1 ml-9" style={{ color: 'var(--muted-foreground)' }}>
                    Perbandingan omzet dan profit
                  </p>
                </div>
                <Link href="/rekap">
                  <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                    Lihat Rekap
                    <ArrowRight className="size-3.5" />
                  </Button>
                </Link>
              </div>
              <OmzetChart transactions={transactions} />
            </div>

            <div
              className="rounded-2xl p-5 sm:p-6 ring-1 ring-foreground/[0.06]"
              style={{ backgroundColor: 'var(--card)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <div
                      className="flex size-7 items-center justify-center rounded-lg"
                      style={{
                        background: 'linear-gradient(135deg, oklch(0.6 0.18 145), oklch(0.5 0.16 165))',
                      }}
                    >
                      <Clock className="size-3.5 text-white" />
                    </div>
                    <h3 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                      Aktivitas Terbaru
                    </h3>
                  </div>
                  <p className="text-xs mt-1 ml-9" style={{ color: 'var(--muted-foreground)' }}>
                    Transaksi terakhir yang dicatat
                  </p>
                </div>
                <Link href="/bon">
                  <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                    Semua Transaksi
                    <ArrowRight className="size-3.5" />
                  </Button>
                </Link>
              </div>
              <ActivityTimeline transactions={transactions} customers={customers} />
            </div>
          </div>

          {/* Right column: quick actions + bonus */}
          <div className="space-y-4">
            <div
              className="rounded-2xl p-5 ring-1 ring-foreground/[0.06]"
              style={{ backgroundColor: 'var(--card)' }}
            >
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="flex size-7 items-center justify-center rounded-lg"
                  style={{
                    background: 'linear-gradient(135deg, oklch(0.55 0.18 250), oklch(0.45 0.2 295))',
                  }}
                >
                  <Sparkles className="size-3.5 text-white" />
                </div>
                <h3 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                  Aksi Cepat
                </h3>
              </div>
              <div className="space-y-2.5">
                <QuickAction
                  href="/bon/tambah"
                  title="Buat Transaksi"
                  desc="Catat bon baru"
                  icon={Plus}
                  from="oklch(0.55 0.18 250)"
                  to="oklch(0.42 0.18 250)"
                  ringColor="oklch(0.7 0.14 250)"
                />
                <QuickAction
                  href="/pelanggan/tambah"
                  title="Tambah Pelanggan"
                  desc="Daftarkan pelanggan baru"
                  icon={UserPlus}
                  from="oklch(0.6 0.16 145)"
                  to="oklch(0.45 0.16 155)"
                  ringColor="oklch(0.7 0.14 145)"
                />
                <QuickAction
                  href="/produk/tambah"
                  title="Tambah Produk"
                  desc="Tambah produk baru"
                  icon={Package}
                  from="oklch(0.55 0.18 300)"
                  to="oklch(0.42 0.2 295)"
                  ringColor="oklch(0.7 0.14 300)"
                />
              </div>
            </div>

            {customersWithBonus.length > 0 && (
              <div
                className="relative rounded-2xl overflow-hidden ring-1 ring-foreground/[0.06]"
                style={{
                  background: 'linear-gradient(135deg, oklch(0.5 0.18 250) 0%, oklch(0.4 0.22 300) 100%)',
                }}
              >
                {/* decorative orb */}
                <div
                  className="absolute -top-16 -right-16 size-48 rounded-full blur-3xl pointer-events-none"
                  style={{ backgroundColor: 'oklch(0.7 0.2 300 / 0.5)' }}
                />
                {/* pattern */}
                <div
                  className="absolute inset-0 opacity-[0.08] pointer-events-none"
                  style={{
                    backgroundImage:
                      'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                    backgroundSize: '14px 14px',
                  }}
                />

                <div className="relative p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/20 backdrop-blur-sm">
                      <Gift className="size-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">Bonus Tersedia</h3>
                      <p className="text-[10px] text-white/70 mt-0.5">
                        {customersWithBonus.length} pelanggan siap bonus
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {customersWithBonus.slice(0, 4).map(({ customer, available }) => (
                      <div
                        key={customer.id}
                        className="flex items-center justify-between rounded-lg px-3 py-2 bg-white/10 ring-1 ring-white/15 backdrop-blur-sm"
                      >
                        <span className="text-sm font-medium text-white truncate">{customer.name}</span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-white/25 text-white shrink-0 ml-2">
                          {available} bonus
                        </span>
                      </div>
                    ))}
                    {customersWithBonus.length > 4 && (
                      <Link href="/pelanggan">
                        <div className="text-center pt-1">
                          <span className="text-xs font-medium text-white/80 hover:text-white inline-flex items-center gap-1">
                            +{customersWithBonus.length - 4} lainnya
                            <ArrowRight className="size-3" />
                          </span>
                        </div>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
