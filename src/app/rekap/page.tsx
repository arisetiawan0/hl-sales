'use client'

import { useState, useEffect, useMemo } from "react"
import { AppShell } from "@/components/layout/AppShell"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, Filter, Gift, BarChart3, Loader2, TrendingUp, DollarSign, FileText } from "lucide-react"
import {
  customerService,
  transactionService,
} from "@/lib/services"
import {
  formatCurrency,
  calculateTransactionTotals,
  calculateTransactionPiutang,
  calculateTransactionPaid,
  calculateAccumulatedPaidOmzet,
  calculateBonusesGranted,
  calculateBonusSummary,
} from "@/lib/calculations"
import { Customer, Transaction, RecapData, ProductType } from "@/types"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { RecapPdf } from "@/components/pdf/RecapPdf"
import { downloadPdf } from "@/lib/pdf-utils"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatCard } from "@/components/shared/StatCard"
import { SectionCard } from "@/components/shared/SectionCard"
import { InfoRow } from "@/components/shared/InfoRow"
import { StatusBadge, BonusPill } from "@/components/shared/StatusBadge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function RekapPage() {
  const [recapType, setRecapType] = useState<"all" | "customer" | "type">("all")
  const [selectedCustomer, setSelectedCustomer] = useState<string>("all")
  const [selectedMonth, setSelectedMonth] = useState<string>("all")
  const [selectedYear, setSelectedYear] = useState<string>("all")
  const [loading, setLoading] = useState(true)

  const [customers, setCustomers] = useState<Customer[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])

  useEffect(() => {
    Promise.all([customerService.getAll(), transactionService.getAll()])
      .then(([c, t]) => { setCustomers(c); setTransactions(t) })
      .finally(() => setLoading(false))
  }, [])

  const getAvailableMonths = () => {
    const months = new Set<string>()
    transactions.forEach((t) => {
      months.add(format(new Date(t.date), "yyyy-MM"))
    })
    return Array.from(months).sort().reverse()
  }

  const getAvailableYears = () => {
    const years = new Set<number>()
    transactions.forEach((t) => {
      years.add(new Date(t.date).getFullYear())
    })
    return Array.from(years).sort().reverse()
  }

  const recapData = useMemo<RecapData[]>(() => {
    let filtered = [...transactions]

    if (selectedCustomer !== "all") {
      filtered = filtered.filter((t) => t.customerId === selectedCustomer)
    }

    if (selectedMonth !== "all") {
      filtered = filtered.filter((t) => {
        const d = new Date(t.date)
        return format(d, "yyyy-MM") === selectedMonth
      })
    }

    if (selectedYear !== "all") {
      filtered = filtered.filter((t) => {
        const d = new Date(t.date)
        return d.getFullYear() === Number(selectedYear)
      })
    }

    if (recapType === "customer") {
      const grouped = new Map<string, RecapData>()
      filtered.forEach((t) => {
        const existing = grouped.get(t.customerId) || {
          customerId: t.customerId,
          customerName: customers.find((c) => c.id === t.customerId)?.name,
          totalOmzetLM: 0,
          totalOmzetBR: 0,
          totalOmzet: 0,
          totalProfit: 0,
          totalPiutang: 0,
          totalPaid: 0,
        }

        const { totalOmzet, totalProfit } = calculateTransactionTotals(
          t.items,
          t.ongkir,
          t.status,
          t.isBonus,
        )

        existing.totalOmzet += totalOmzet
        existing.totalProfit += totalProfit
        existing.totalPaid += calculateTransactionPaid(t.items, t.ongkir, t.status, t.isBonus)
        existing.totalPiutang += calculateTransactionPiutang(t.items, t.ongkir, t.status, t.isBonus)

        t.items.forEach((item) => {
          if (t.status === "LUNAS" && !t.isBonus && item.productType === "LM") {
            existing.totalOmzetLM += item.calculatedOmzet
          }
          if (t.status === "LUNAS" && !t.isBonus && item.productType === "BR") {
            existing.totalOmzetBR += item.calculatedOmzet
          }
        })

        grouped.set(t.customerId, existing)
      })
      return Array.from(grouped.values())
    } else if (recapType === "type") {
      const grouped = new Map<ProductType, RecapData>()
      const types: ProductType[] = ["LM", "BR"]
      types.forEach((type) => {
        grouped.set(type, {
          type,
          totalOmzetLM: 0,
          totalOmzetBR: 0,
          totalOmzet: 0,
          totalProfit: 0,
          totalPiutang: 0,
          totalPaid: 0,
        })
      })

      filtered.forEach((t) => {
        t.items.forEach((item) => {
          if (t.isBonus || t.status !== "LUNAS") return

          const recap = grouped.get(item.productType)!
          recap.totalOmzet += item.calculatedOmzet
          recap.totalProfit += item.calculatedProfit
          if (item.productType === "LM") {
            recap.totalOmzetLM += item.calculatedOmzet
          } else {
            recap.totalOmzetBR += item.calculatedOmzet
          }
        })

        const piutang = calculateTransactionPiutang(t.items, t.ongkir, t.status, t.isBonus)
        const paid = calculateTransactionPaid(t.items, t.ongkir, t.status, t.isBonus)

        if (piutang > 0 || paid > 0) {
          t.items.forEach((item) => {
            if (t.isBonus) return
            grouped.get(item.productType)![
              piutang > 0 ? "totalPiutang" : "totalPaid"
            ] += (piutang > 0 ? piutang : paid) / t.items.length
          })
        }
      })

      return Array.from(grouped.values())
    } else {
      const totalOmzetLM = filtered.reduce((sum, t) => {
        if (t.status !== "LUNAS" || t.isBonus) return sum
        return sum + t.items.filter((item) => item.productType === "LM").reduce((s, i) => s + i.calculatedOmzet, 0)
      }, 0)
      const totalOmzetBR = filtered.reduce((sum, t) => {
        if (t.status !== "LUNAS" || t.isBonus) return sum
        return sum + t.items.filter((item) => item.productType === "BR").reduce((s, i) => s + i.calculatedOmzet, 0)
      }, 0)
      const totalProfit = filtered.reduce((sum, t) => {
        const { totalProfit } = calculateTransactionTotals(t.items, t.ongkir, t.status, t.isBonus)
        return sum + totalProfit
      }, 0)
      const totalPaid = filtered.reduce(
        (sum, t) => sum + calculateTransactionPaid(t.items, t.ongkir, t.status, t.isBonus),
        0,
      )
      const totalPiutang = filtered.reduce(
        (sum, t) => sum + calculateTransactionPiutang(t.items, t.ongkir, t.status, t.isBonus),
        0,
      )

      return [
        {
          totalOmzetLM,
          totalOmzetBR,
          totalOmzet: totalOmzetLM + totalOmzetBR,
          totalProfit,
          totalPiutang,
          totalPaid,
        },
      ]
    }
  }, [
    transactions,
    customers,
    recapType,
    selectedCustomer,
    selectedMonth,
    selectedYear,
  ])

  // KPI totals
  const totalOmzetAll = recapData.reduce((sum, r) => sum + r.totalOmzet, 0)
  const totalProfitAll = recapData.reduce((sum, r) => sum + r.totalProfit, 0)
  const totalPiutangAll = recapData.reduce((sum, r) => sum + r.totalPiutang, 0)
  const totalPaidAll = recapData.reduce((sum, r) => sum + r.totalPaid, 0)
  const totalTxCount = recapData.length

  const handleDownloadPDF = () => {
    const title = recapType === 'customer' ? 'Rekap Per Pelanggan' : recapType === 'type' ? 'Rekap Per Tipe' : 'Rekap Keseluruhan'
    downloadPdf(
      <RecapPdf
        title={title}
        data={recapData}
        filters={{
          customer: selectedCustomer !== 'all' ? customers.find(c => c.id === selectedCustomer)?.name : undefined,
          month: selectedMonth !== 'all' ? selectedMonth : undefined,
          year: selectedYear !== 'all' ? selectedYear : undefined,
        }}
      />,
      `rekap-hl-sales-${format(new Date(), 'yyyy-MM-dd')}.pdf`
    )
  }

  const monthOptions = getAvailableMonths()
  const yearOptions = getAvailableYears()

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--muted-foreground)" }} />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="space-y-5">
        {/* Header */}
        <PageHeader
          title="Rekap & Laporan"
          subtitle="Ringkasan transaksi berdasarkan filter"
          accent="slate"
          badge="Laporan"
           actions={
            <Button size="sm" variant="ghost" className="gap-1.5 text-white hover:bg-white/20" onClick={handleDownloadPDF}>
              <Download className="size-4" />
              <span className="hidden sm:inline">Download PDF</span>
            </Button>
          }
        />

        {/* Filters */}
        <SectionCard
          title="Filter"
          icon={Filter}
          iconAccent="slate"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
                Tipe Rekap
              </label>
              <Select value={recapType} onValueChange={(v) => setRecapType(v as "all" | "customer" | "type")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Keseluruhan</SelectItem>
                  <SelectItem value="customer">Per Pelanggan</SelectItem>
                  <SelectItem value="type">Per Tipe Produk</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {recapType === "customer" && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
                  Pelanggan
                </label>
                <Select value={selectedCustomer} onValueChange={(v) => setSelectedCustomer(v || "all")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Pelanggan</SelectItem>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
                Bulan
              </label>
              <Select value={selectedMonth} onValueChange={(v) => setSelectedMonth(v || "all")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Bulan</SelectItem>
                  {monthOptions.map((month) => {
                    const [y, m] = month.split("-")
                    const date = new Date(Number(y), Number(m) - 1)
                    return (
                      <SelectItem key={month} value={month}>
                        {format(date, "MMMM yyyy", { locale: id })}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
                Tahun
              </label>
              <Select value={selectedYear} onValueChange={(v) => setSelectedYear(v || "all")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tahun</SelectItem>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </SectionCard>

        {/* KPI stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Omzet"
            value={formatCurrency(totalOmzetAll)}
            icon={TrendingUp}
            description="Omzet lunas"
            accent="violet"
            spark={[]}
          />
          <StatCard
            title="Total Laba"
            value={formatCurrency(totalProfitAll)}
            icon={DollarSign}
            description="Profit HL"
            accent="green"
            spark={[]}
          />
          <StatCard
            title="Total Piutang"
            value={formatCurrency(totalPiutangAll)}
            icon={Loader2}
            description="Belum lunas"
            accent="amber"
            spark={[]}
          />
          <StatCard
            title="Total Transaksi"
            value={totalTxCount}
            icon={FileText}
            description={`${recapData.length} baris data`}
            accent="blue"
            spark={[]}
          />
        </div>

        {/* Results table */}
        <SectionCard
          title="Hasil Rekap"
          icon={BarChart3}
          iconAccent="blue"
          action={
            <span className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
              {recapData.length} {recapType === "customer" ? "pelanggan" : recapType === "type" ? "tipe" : "baris"}
            </span>
          }
        >
          <div className="rounded-xl ring-1 ring-foreground/[0.06] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: "var(--muted)" }}>
                  {recapType === "customer" && (
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Pelanggan</th>
                  )}
                  {recapType === "type" && (
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Tipe</th>
                  )}
                  <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Omzet LM</th>
                  <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Omzet BR</th>
                  <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Total Omzet</th>
                  <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Laba HL</th>
                  <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Piutang</th>
                  <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Sudah Dibayar</th>
                </tr>
              </thead>
              <tbody>
                {recapData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
                      Tidak ada data
                    </td>
                  </tr>
                ) : (
                  recapData.map((recap, index) => (
                    <tr
                      key={index}
                      className="border-t last:border-0 transition-colors duration-100 hover:bg-muted/50"
                      style={{ borderColor: "var(--border)" }}
                    >
                      {recapType === "customer" && (
                        <td className="px-4 py-3 text-sm font-medium">{recap.customerName || "—"}</td>
                      )}
                      {recapType === "type" && (
                        <td className="px-4 py-3">
                          <StatusBadge variant={recap.type === "LM" ? "success" : "info"}>{recap.type}</StatusBadge>
                        </td>
                      )}
                      <td className="px-4 py-3 text-sm text-right tabular-nums">{formatCurrency(recap.totalOmzetLM)}</td>
                      <td className="px-4 py-3 text-sm text-right tabular-nums">{formatCurrency(recap.totalOmzetBR)}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium tabular-nums">{formatCurrency(recap.totalOmzet)}</td>
                      <td className="px-4 py-3 text-sm text-right tabular-nums" style={{ color: "var(--success)" }}>{formatCurrency(recap.totalProfit)}</td>
                      <td className="px-4 py-3 text-sm text-right tabular-nums" style={{ color: "var(--warning)" }}>{formatCurrency(recap.totalPiutang)}</td>
                      <td className="px-4 py-3 text-sm text-right tabular-nums">{formatCurrency(recap.totalPaid)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* Bonus log */}
        <SectionCard title="Bonus Log" icon={Gift} iconAccent="violet">
          <div className="space-y-3">
            {customers
              .filter(c => c.bonusThreshold > 0)
              .map(c => {
                const customerTransactions = transactions.filter(t => t.customerId === c.id)
                const acc = calculateAccumulatedPaidOmzet(customerTransactions)
                const granted = calculateBonusesGranted(customerTransactions)
                const summary = calculateBonusSummary(acc, c.bonusThreshold, granted)
                if (granted === 0 && summary.bonusAvailable === 0) return null
                return (
                  <div
                    key={c.id}
                    className="flex items-center justify-between gap-4 rounded-xl px-4 py-3 ring-1 ring-foreground/[0.06] transition-colors hover:bg-muted/50"
                    style={{ backgroundColor: "var(--card)" }}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{c.name}</p>
                        <BonusPill />
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                        Ambang: {formatCurrency(c.bonusThreshold)}
                      </p>
                    </div>
                    <div className="flex items-center gap-6 text-xs">
                      <div className="text-right">
                        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Tersedia</p>
                        <p className="text-sm font-bold" style={{ color: "oklch(0.45 0.18 300)" }}>{summary.bonusAvailable}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Diberikan</p>
                        <p className="text-sm font-bold">{granted}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Carry-over</p>
                        <p className="text-sm font-medium tabular-nums">{formatCurrency(summary.bonusCarryOver)}</p>
                      </div>
                    </div>
                  </div>
                )
              })
              .filter(Boolean)}
            {customers.filter(c => c.bonusThreshold > 0).length === 0 && (
              <p className="text-sm text-center py-4" style={{ color: "var(--muted-foreground)" }}>
                Belum ada pelanggan dengan ambang bonus
              </p>
            )}
          </div>
        </SectionCard>
      </div>
    </AppShell>
  )
}