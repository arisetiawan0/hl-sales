'use client'

/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { AppShell } from "@/components/layout/AppShell"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Edit,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  Gift,
  Download,
  Loader2,
  Receipt,
} from "lucide-react"
import { toast } from "sonner"
import { customerService, transactionService } from "@/lib/services"
import {
  formatCurrency,
  calculateTransactionTotals,
  calculateTransactionPiutang,
  calculateTransactionPaid,
  calculateAccumulatedPaidOmzet,
  calculateBonusesGranted,
  calculateBonusSummary,
} from "@/lib/calculations"
import { Customer, Transaction, CustomerMonthlyStats } from "@/types"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { CustomerPdf } from "@/components/pdf/CustomerPdf"
import { downloadPdf } from "@/lib/pdf-utils"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatCard } from "@/components/shared/StatCard"
import { SectionCard } from "@/components/shared/SectionCard"
import { StatusBadge, BonusPill, transactionStatusVariant } from "@/components/shared/StatusBadge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function PelangganDetailPage() {
  const params = useParams()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState<string>("")
  const [monthlyStats, setMonthlyStats] = useState<CustomerMonthlyStats | null>(null)
  const [settleDialog, setSettleDialog] = useState(false)
  const [isSettling, setIsSettling] = useState(false)
  const [settlePaymentDate, setSettlePaymentDate] = useState(format(new Date(), "yyyy-MM-dd"))

  useEffect(() => {
    if (params.id) {
      Promise.all([
        customerService.getById(params.id as string),
        transactionService.getByCustomerId(params.id as string),
      ]).then(([cust, trans]) => {
        setCustomer(cust || null)
        setTransactions(trans)
        if (trans.length > 0) {
          const latest = trans[0]
          setSelectedMonth(format(new Date(latest.date), "yyyy-MM"))
        }
      }).finally(() => setLoading(false))
    }
  }, [params.id])

  useEffect(() => {
    if (selectedMonth && transactions.length > 0) {
      const [year, month] = selectedMonth.split("-").map(Number)
      const filtered = transactions.filter((t) => {
        const d = new Date(t.date)
        return d.getFullYear() === year && d.getMonth() === month - 1
      })

      const stats: CustomerMonthlyStats = {
        month: format(new Date(year, month - 1), "MMMM", { locale: id }),
        year,
        transactions: filtered,
        totalPiutang: filtered.reduce(
          (sum, t) => sum + calculateTransactionPiutang(t.items, t.ongkir, t.status, t.isBonus),
          0,
        ),
        totalPaid: filtered.reduce(
          (sum, t) => sum + calculateTransactionPaid(t.items, t.ongkir, t.status, t.isBonus),
          0,
        ),
        totalOmzetLM: filtered.reduce((sum, t) => {
          return sum + t.items.filter((i) => i.productType === "LM").reduce((s, i) => s + i.calculatedOmzet, 0)
        }, 0),
        totalOmzetBR: filtered.reduce((sum, t) => {
          return sum + t.items.filter((i) => i.productType === "BR").reduce((s, i) => s + i.calculatedOmzet, 0)
        }, 0),
        totalOmzet: filtered.reduce((sum, t) => {
          const { totalOmzet } = calculateTransactionTotals(t.items, t.ongkir, t.status, t.isBonus)
          return sum + totalOmzet
        }, 0),
        totalProfit: filtered.reduce((sum, t) => {
          const { totalProfit } = calculateTransactionTotals(t.items, t.ongkir, t.status, t.isBonus)
          return sum + totalProfit
        }, 0),
      }
      setMonthlyStats(stats)
    }
  }, [selectedMonth, transactions])

  const handleSettleMonth = async () => {
    if (!monthlyStats) return
    setIsSettling(true)
    try {
      const ids = monthlyStats.transactions
        .filter((t) => t.status === "PIUTANG")
        .map((t) => t.id)
      await transactionService.bulkUpdateStatus(ids, "LUNAS", new Date(settlePaymentDate))
      const trans = await transactionService.getByCustomerId(params.id as string)
      setTransactions(trans)
      setSettleDialog(false)
      toast.success("Semua transaksi berhasil dilunaskan")
    } catch {
      toast.error("Gagal melunaskan transaksi")
    } finally {
      setIsSettling(false)
    }
  }

  const getAvailableMonths = () => {
    const months = new Set<string>()
    transactions.forEach((t) => {
      months.add(format(new Date(t.date), "yyyy-MM"))
    })
    return Array.from(months).sort().reverse()
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--muted-foreground)" }} />
        </div>
      </AppShell>
    )
  }

  if (!customer) {
    return (
      <AppShell>
        <div className="text-center py-8" style={{ color: "var(--muted-foreground)" }}>
          Pelanggan tidak ditemukan
        </div>
      </AppShell>
    )
  }

  const accumulated = calculateAccumulatedPaidOmzet(transactions)
  const granted = calculateBonusesGranted(transactions)
  const bonusSummary = customer.bonusThreshold > 0
    ? calculateBonusSummary(accumulated, customer.bonusThreshold, granted)
    : null
  const hasBonus = customer.bonusThreshold > 0

  // Compute totals across all time for header stats
  const totalPiutangAll = transactions.reduce(
    (sum, t) => sum + calculateTransactionPiutang(t.items, t.ongkir, t.status, t.isBonus),
    0
  )
  const totalPaidAll = transactions.reduce(
    (sum, t) => sum + calculateTransactionPaid(t.items, t.ongkir, t.status, t.isBonus),
    0
  )
  const totalOmzetAll = transactions.reduce((sum, t) => {
    if (t.status !== "LUNAS" || t.isBonus) return sum
    const { totalOmzet } = calculateTransactionTotals(t.items, t.ongkir, t.status, t.isBonus)
    return sum + totalOmzet
  }, 0)

  const monthOptions = getAvailableMonths()

  return (
    <AppShell>
      <div className="space-y-5">
        {/* Header */}
        <PageHeader
          title={customer.name}
          subtitle="Profil pelanggan dan ringkasan transaksi"
          accent="blue"
          badge="Pelanggan"
          backHref="/pelanggan"
          stats={[
            { icon: DollarSign, label: "Total Piutang", value: formatCurrency(totalPiutangAll) },
            { icon: CheckCircle2, label: "Total Paid", value: formatCurrency(totalPaidAll) },
            { icon: TrendingUp, label: "Total Omzet", value: formatCurrency(totalOmzetAll) },
            { icon: Gift, label: "Bonus Tersedia", value: bonusSummary?.bonusAvailable ?? "—" },
          ]}
           actions={
            <>
              {monthlyStats && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-white hover:bg-white/20"
                  onClick={() => {
                    const monthStr = format(new Date(monthlyStats.year, monthOptions.indexOf(selectedMonth)), 'MMMM')
                    downloadPdf(
                      <CustomerPdf
                        customerName={customer.name}
                        month={monthStr}
                        year={monthlyStats.year}
                        stats={monthlyStats}
                      />,
                      `detail-pelanggan-${customer.name.toLowerCase().replace(/\s+/g, '-')}-${selectedMonth}.pdf`
                    )
                  }}
                >
                  <Download className="size-4" />
                  <span className="hidden sm:inline">PDF</span>
                </Button>
              )}
              <Link href={`/pelanggan/${customer.id}/edit`}>
                <Button size="sm" className="gap-1.5">
                  <Edit className="size-4" />
                  <span className="hidden sm:inline">Edit</span>
                </Button>
              </Link>
            </>
          }
        />

        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Piutang"
            value={formatCurrency(monthlyStats?.totalPiutang || 0)}
            icon={DollarSign}
            description="Piutang bulan ini"
            accent="amber"
          />
          <StatCard
            title="Total Paid"
            value={formatCurrency(monthlyStats?.totalPaid || 0)}
            icon={CheckCircle2}
            description="Sudah dibayar"
            accent="green"
          />
          <StatCard
            title="Total Omzet"
            value={formatCurrency(monthlyStats?.totalOmzet || 0)}
            icon={TrendingUp}
            description="Omzet lunas bulan ini"
            accent="violet"
          />
          <StatCard
            title="Bonus Tersedia"
            value={bonusSummary?.bonusAvailable ?? 0}
            icon={Gift}
            description="Bonus siap given"
            accent="cyan"
          />
        </div>

        {/* Bonus section */}
        {hasBonus && bonusSummary && (
          <SectionCard
            title="Bonus"
            icon={Gift}
            iconAccent="violet"
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 sm:p-5">
              <div className="rounded-xl p-3 ring-1" style={{ backgroundColor: "oklch(0.96 0.03 300)", borderColor: "oklch(0.90 0.06 300)" }}>
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "oklch(0.45 0.18 300)" }}>Tersedia</p>
                <p className="text-2xl font-bold mt-1 tabular-nums leading-none" style={{ color: "oklch(0.35 0.18 300)" }}>{bonusSummary.bonusAvailable}</p>
                <p className="text-[11px] mt-1.5" style={{ color: "oklch(0.55 0.10 300)" }}>bonus siap pakai</p>
              </div>
              <div className="rounded-xl p-3" style={{ backgroundColor: "var(--muted)" }}>
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Diberikan</p>
                <p className="text-2xl font-bold mt-1 tabular-nums leading-none">{granted}</p>
                <p className="text-[11px] mt-1.5" style={{ color: "var(--muted-foreground)" }}>total bonus tercatat</p>
              </div>
              <div className="rounded-xl p-3" style={{ backgroundColor: "var(--muted)" }}>
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Sisa Carry-over</p>
                <p className="text-sm font-bold mt-1 tabular-nums">{formatCurrency(bonusSummary.bonusCarryOver)}</p>
                <p className="text-[11px] mt-1.5" style={{ color: "var(--muted-foreground)" }}>menuju bonus berikutnya</p>
              </div>
              <div className="rounded-xl p-3" style={{ backgroundColor: "var(--muted)" }}>
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Ambang Bonus</p>
                <p className="text-sm font-bold mt-1 tabular-nums">{formatCurrency(customer.bonusThreshold)}</p>
                <p className="text-[11px] mt-1.5" style={{ color: "var(--muted-foreground)" }}>per bonus</p>
              </div>
            </div>
          </SectionCard>
        )}

        {/* Transactions section */}
        <SectionCard
          title="Transaksi per Bulan"
          icon={Receipt}
          iconAccent="blue"
          action={
            <div className="flex items-center gap-3">
              <Select value={selectedMonth} onValueChange={(v) => setSelectedMonth(v || "all")}>
                <SelectTrigger size="sm" className="w-44">
                  <SelectValue placeholder="Pilih bulan" />
                </SelectTrigger>
                <SelectContent>
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
              {monthlyStats && monthlyStats.totalPiutang > 0 && (
                <Button size="sm" onClick={() => setSettleDialog(true)}>
                  Lunaskan Bulan Ini
                </Button>
              )}
            </div>
          }
        >
          {monthlyStats && (
            <div className="space-y-4">
              {/* month summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl p-3" style={{ backgroundColor: "var(--muted)" }}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Omzet LM</p>
                  <p className="text-sm font-bold mt-1 tabular-nums">{formatCurrency(monthlyStats.totalOmzetLM)}</p>
                </div>
                <div className="rounded-xl p-3" style={{ backgroundColor: "var(--muted)" }}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Omzet BR</p>
                  <p className="text-sm font-bold mt-1 tabular-nums">{formatCurrency(monthlyStats.totalOmzetBR)}</p>
                </div>
                <div className="rounded-xl p-3" style={{ backgroundColor: "var(--muted)" }}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Total Laba HL</p>
                  <p className="text-sm font-bold mt-1 tabular-nums" style={{ color: "var(--success)" }}>{formatCurrency(monthlyStats.totalProfit)}</p>
                </div>
                <div className="rounded-xl p-3" style={{ backgroundColor: "var(--muted)" }}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Total Piutang</p>
                  <p className="text-sm font-bold mt-1 tabular-nums" style={{ color: "var(--warning)" }}>{formatCurrency(monthlyStats.totalPiutang)}</p>
                </div>
              </div>

              {/* transactions table */}
              <div className="rounded-xl ring-1 ring-foreground/[0.06] overflow-x-auto">
                <table className="w-full min-w-[500px]">
                  <thead>
                    <tr style={{ backgroundColor: "var(--muted)" }}>
                      <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Tanggal</th>
                      <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Nomor Bon</th>
                      <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Status</th>
                      <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Jumlah</th>
                      <th className="px-4 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyStats.transactions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
                          Tidak ada transaksi bulan ini
                        </td>
                      </tr>
                    ) : (
                      monthlyStats.transactions.map((transaction) => {
                        const { totalTagihan } = calculateTransactionTotals(transaction.items, transaction.ongkir, transaction.status, transaction.isBonus)
                        const statusVariant = transactionStatusVariant(transaction.status)
                        return (
                          <tr
                            key={transaction.id}
                            className="border-t last:border-0 transition-colors duration-100 hover:bg-muted/50"
                            style={{ borderColor: "var(--border)" }}
                          >
                            <td className="px-4 py-3 text-sm">
                              {format(new Date(transaction.date), "dd MMM yyyy")}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium">
                              {transaction.bonNumber}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <StatusBadge variant={statusVariant}>{transaction.status}</StatusBadge>
                                {transaction.isBonus && <BonusPill />}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-medium tabular-nums">
                              {formatCurrency(totalTagihan)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Link href={`/bon/${transaction.id}`}>
                                <Button variant="ghost" size="sm">Detail</Button>
                              </Link>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </SectionCard>

        {/* Settle dialog */}
        <Dialog open={settleDialog} onOpenChange={setSettleDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Lunaskan Bulan Ini</DialogTitle>
              <DialogDescription>
                Semua transaksi Piutang di bulan {monthlyStats?.month} {monthlyStats?.year} akan dilunaskan.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tanggal Pelunasan</label>
                <input
                  type="date"
                  value={settlePaymentDate}
                  onChange={(e) => setSettlePaymentDate(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSettleDialog(false)}>Batal</Button>
              <Button onClick={handleSettleMonth} disabled={isSettling}>
                {isSettling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Konfirmasi Pelunasan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  )
}