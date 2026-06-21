'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/layout/AppShell'
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
  CheckCircle2,
  AlertCircle,
  Wallet,
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

function formatCompact(amount: number): string {
  if (!amount) return 'Rp 0'
  if (amount >= 1_000_000_000) return `Rp ${(amount / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (amount >= 1_000_000) return `Rp ${(amount / 1_000_000).toFixed(1).replace(/\.0$/, '')}jt`
  if (amount >= 1_000) return `Rp ${(amount / 1_000).toFixed(0)}rb`
  return `Rp ${amount}`
}

type Accent = 'blue' | 'green' | 'amber' | 'violet'

const accentStyles: Record<Accent, { bg: string; icon: string; ring: string; text: string }> = {
  blue: { bg: 'oklch(0.96 0.02 250)', icon: 'oklch(0.45 0.18 250)', ring: 'oklch(0.85 0.08 250)', text: 'oklch(0.42 0.18 250)' },
  green: { bg: 'oklch(0.96 0.03 145)', icon: 'oklch(0.45 0.16 145)', ring: 'oklch(0.85 0.10 145)', text: 'oklch(0.40 0.15 145)' },
  amber: { bg: 'oklch(0.97 0.03 75)', icon: 'oklch(0.55 0.18 60)', ring: 'oklch(0.88 0.10 75)', text: 'oklch(0.50 0.16 65)' },
  violet: { bg: 'oklch(0.96 0.03 300)', icon: 'oklch(0.45 0.20 295)', ring: 'oklch(0.85 0.10 300)', text: 'oklch(0.42 0.18 300)' },
}

function StatCard({
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
  icon: React.ComponentType<{ className?: string }>
  description: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  accent: Accent
}) {
  const a = accentStyles[accent]

  return (
    <div
      className="rounded-xl p-4 ring-1 transition-shadow duration-200 hover:shadow-md"
      style={{ backgroundColor: 'var(--card)', borderColor: a.ring }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5 min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
            {title}
          </p>
          <p className="text-xl font-bold tracking-tight tabular-nums" style={{ color: 'var(--foreground)' }}>
            {value}
          </p>
        </div>
        <div
          className="flex size-9 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: a.bg }}
        >
          <Icon className="size-4" />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1.5">
        {trend && trend !== 'neutral' && (
          <span
            className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded"
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

function ActivityTimeline({ transactions, customers }: { transactions: Transaction[]; customers: Customer[] }) {
  const recent = transactions
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  if (recent.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="flex size-10 items-center justify-center rounded-full mb-2" style={{ backgroundColor: 'var(--muted)' }}>
          <Clock className="size-4" style={{ color: 'var(--muted-foreground)' }} />
        </div>
        <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Belum ada aktivitas</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Transaksi akan muncul di sini</p>
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

        return (
          <div
            key={t.id}
            className="flex items-center gap-3 py-2.5 transition-colors -mx-2 px-2 rounded-lg"
            style={{
              borderBottom: i < recent.length - 1 ? '1px solid var(--border)' : 'none',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--muted)' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
          >
            <div
              className="flex size-9 shrink-0 items-center justify-center rounded-lg text-center"
              style={{ backgroundColor: isLunas ? 'var(--success-light)' : 'var(--warning-light)' }}
            >
              <div>
                <span className="text-xs font-bold leading-none tabular-nums" style={{ color: isLunas ? 'var(--success)' : 'var(--warning)' }}>
                  {format(d, 'dd')}
                </span>
                <span className="block text-[8px] font-semibold uppercase" style={{ color: isLunas ? 'var(--success)' : 'var(--warning)' }}>
                  {format(d, 'MMM', { locale: localeID })}
                </span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold truncate" style={{ color: 'var(--foreground)' }}>
                  {t.bonNumber}
                </span>
                {isLunas ? (
                  <CheckCircle2 className="size-3 shrink-0" style={{ color: 'var(--success)' }} />
                ) : (
                  <AlertCircle className="size-3 shrink-0" style={{ color: 'var(--warning)' }} />
                )}
              </div>
              <span className="text-[11px] truncate block" style={{ color: 'var(--muted-foreground)' }}>
                {customer?.name ?? '-'}
              </span>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs font-bold tabular-nums" style={{ color: 'var(--foreground)' }}>
                {formatCurrency(totalTagihan)}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function QuickAction({
  href,
  title,
  desc,
  icon: Icon,
  color,
}: {
  href: string
  title: string
  desc: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}) {
  return (
    <Link href={href} className="block group">
      <div
        className="flex items-center gap-3 rounded-lg p-3 transition-all duration-150 ring-1 hover:shadow-sm"
        style={{
          backgroundColor: 'var(--muted)',
          borderColor: 'var(--border)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = color
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border)'
        }}
      >
        <div
          className="flex size-8 shrink-0 items-center justify-center rounded-md"
          style={{ backgroundColor: `${color}15`, color }}
        >
          <Icon className="size-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>{title}</p>
          <p className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>{desc}</p>
        </div>
        <ArrowRight className="size-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" style={{ color: 'var(--muted-foreground)' }} />
      </div>
    </Link>
  )
}

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

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--muted-foreground)' }} />
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

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div
          className="rounded-xl p-4 sm:p-5 ring-1"
          style={{
            background: 'linear-gradient(135deg, oklch(0.45 0.18 250) 0%, oklch(0.5 0.2 285) 50%, oklch(0.45 0.18 320) 100%)',
            borderColor: 'transparent',
          }}
        >
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs font-semibold text-white/70 uppercase tracking-wider">Dashboard</p>
              <h1 className="mt-1 text-lg sm:text-xl font-bold text-white tracking-tight">
                Ringkasan Hari Ini
              </h1>
              <p className="mt-0.5 text-xs text-white/60">
                {format(now, 'EEEE, dd MMMM yyyy', { locale: localeID })}
              </p>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Pelanggan', value: activeCustomers.length.toString(), icon: Users },
                { label: 'Transaksi', value: currentMonthTransactions.length.toString(), icon: FileText },
                { label: 'Omzet', value: formatCompact(currentOmzet), icon: Wallet },
                { label: 'Bonus', value: customersWithBonus.reduce((s, b) => s + b.available, 0).toString(), icon: Gift },
              ].map((s) => (
                <div key={s.label} className="rounded-lg p-2 sm:p-2.5 bg-white/10 ring-1 ring-white/15">
                  <s.icon className="size-3.5 text-white/80" />
                  <p className="mt-1 text-xs sm:text-sm font-bold text-white tabular-nums">{s.value}</p>
                  <p className="text-[8px] sm:text-[9px] uppercase tracking-wider font-medium text-white/60">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Pelanggan"
            value={activeCustomers.length}
            icon={Users}
            description="Pelanggan aktif"
            accent="blue"
          />
          <StatCard
            title="Piutang"
            value={formatCurrency(totalPiutang)}
            icon={DollarSign}
            description={`${piutangCount} transaksi`}
            trend={piutangCount > 0 ? 'down' : 'neutral'}
            trendValue={piutangCount > 0 ? `${piutangCount}` : undefined}
            accent="amber"
          />
          <StatCard
            title="Transaksi"
            value={currentMonthTransactions.length}
            icon={FileText}
            description="Bulan ini"
            trend={transactionTrend !== 0 ? (transactionTrend > 0 ? 'up' : 'down') : 'neutral'}
            trendValue={transactionTrend !== 0 ? `${Math.abs(Math.round(transactionTrend))}%` : undefined}
            accent="green"
          />
          <StatCard
            title="Omzet"
            value={formatCurrency(currentOmzet)}
            icon={TrendingUp}
            description="Dari Lunas"
            trend={omzetTrend !== 0 ? (omzetTrend > 0 ? 'up' : 'down') : 'neutral'}
            trendValue={omzetTrend !== 0 ? `${Math.abs(Math.round(omzetTrend))}%` : undefined}
            accent="violet"
          />
        </div>

        {/* Content grid */}
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            {/* Activity */}
            <div className="rounded-xl p-5 ring-1" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="size-4" style={{ color: 'var(--muted-foreground)' }} />
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Aktivitas Terbaru</h3>
                </div>
                <Link href="/bon" className="text-xs font-medium hover:underline" style={{ color: 'var(--primary)' }}>
                  Semua
                </Link>
              </div>
              <ActivityTimeline transactions={transactions} customers={customers} />
            </div>
          </div>

          <div className="space-y-4">
            {/* Quick actions */}
            <div className="rounded-xl p-4 ring-1" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
              <h3 className="text-xs font-semibold mb-3" style={{ color: 'var(--foreground)' }}>Aksi Cepat</h3>
              <div className="space-y-2">
                <QuickAction
                  href="/bon/tambah"
                  title="Buat Transaksi"
                  desc="Catat bon baru"
                  icon={Plus}
                  color="oklch(0.45 0.18 250)"
                />
                <QuickAction
                  href="/pelanggan/tambah"
                  title="Tambah Pelanggan"
                  desc="Daftarkan pelanggan baru"
                  icon={UserPlus}
                  color="oklch(0.45 0.16 145)"
                />
                <QuickAction
                  href="/produk/tambah"
                  title="Tambah Produk"
                  desc="Tambah produk baru"
                  icon={Package}
                  color="oklch(0.45 0.18 300)"
                />
              </div>
            </div>

            {/* Bonus */}
            {customersWithBonus.length > 0 && (
              <div
                className="rounded-xl p-4 ring-1"
                style={{
                  background: 'linear-gradient(135deg, oklch(0.5 0.18 250) 0%, oklch(0.4 0.22 300) 100%)',
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Gift className="size-4 text-white" />
                  <div>
                    <h3 className="text-sm font-semibold text-white">Bonus Tersedia</h3>
                    <p className="text-[10px] text-white/60">{customersWithBonus.length} pelanggan</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {customersWithBonus.slice(0, 4).map(({ customer, available }) => (
                    <div
                      key={customer.id}
                      className="flex items-center justify-between rounded-lg px-3 py-2 bg-white/10 ring-1 ring-white/10"
                    >
                      <span className="text-xs font-medium text-white truncate">{customer.name}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/20 text-white">
                        {available}x
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
