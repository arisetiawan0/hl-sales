'use client'

/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect, useCallback } from "react"
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
  Check,
  Loader2,
  Info,
  Calculator,
  Package,
  ArrowLeft,
} from "lucide-react"
import { toast } from "sonner"
import { transactionService } from "@/lib/services"
import { formatCurrency, calculateTransactionTotals } from "@/lib/calculations"
import { Customer, Transaction } from "@/types"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { PageHeader } from "@/components/shared/PageHeader"
import { SectionCard } from "@/components/shared/SectionCard"
import { InfoRow } from "@/components/shared/InfoRow"
import { StatusBadge, BonusPill, transactionStatusVariant } from "@/components/shared/StatusBadge"

export default function BonDetailPage() {
  const params = useParams()
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [settleDialog, setSettleDialog] = useState(false)
  const [isSettling, setIsSettling] = useState(false)
  const [paymentDate, setPaymentDate] = useState(format(new Date(), "yyyy-MM-dd"))

  const reloadTransaction = useCallback(async () => {
    if (params.id) {
      const trans = await transactionService.getById(params.id as string)
      setTransaction(trans || null)
      // The API already includes the customer relation — no extra round-trip needed.
      setCustomer(trans?.customer ?? null)
    }
  }, [params.id])

  useEffect(() => {
    reloadTransaction().finally(() => setLoading(false))
  }, [reloadTransaction])

  const handleSettle = async () => {
    if (!transaction) return
    setIsSettling(true)
    try {
      await transactionService.updateStatus(transaction.id, "LUNAS", new Date(paymentDate))
      await reloadTransaction()
      setSettleDialog(false)
      toast.success("Transaksi berhasil dilunaskan")
    } catch {
      toast.error("Gagal melunaskan transaksi")
    } finally {
      setIsSettling(false)
    }
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

  if (!transaction) {
    return (
      <AppShell>
        <div className="text-center py-8" style={{ color: "var(--muted-foreground)" }}>
          Transaksi tidak ditemukan
        </div>
      </AppShell>
    )
  }

  const { totalOmzet, totalTagihan, totalProfit } = calculateTransactionTotals(
    transaction.items,
    transaction.ongkir,
    transaction.status,
    transaction.isBonus,
  )

  const isLunas = transaction.status === "LUNAS"
  const statusVariant = transactionStatusVariant(transaction.status)

  return (
    <AppShell>
      <div className="space-y-5">
        {/* Header */}
        <PageHeader
          title={transaction.bonNumber}
          subtitle={customer ? `${customer.name} · ${format(new Date(transaction.date), 'dd MMMM yyyy', { locale: id })}` : format(new Date(transaction.date), 'dd MMMM yyyy', { locale: id })}
          accent="green"
          badge={transaction.isBonus ? "Bonus" : "Bon"}
          backHref="/bon"
          stats={[
            { icon: Calculator, label: "Total Tagihan", value: formatCurrency(totalTagihan) },
            { icon: Calculator, label: "Laba HL", value: formatCurrency(totalProfit) },
            { icon: Info, label: "Status", value: isLunas ? "LUNAS" : "PIUTANG" },
            { icon: Info, label: "Tanggal", value: format(new Date(transaction.date), 'dd MMM yyyy') },
          ]}
           actions={
            <>
              {transaction.status === "PIUTANG" && (
                <Button size="sm" className="gap-1.5" onClick={() => setSettleDialog(true)}>
                  <Check className="size-4" />
                  Lunaskan
                </Button>
              )}
              <Link href={`/bon/${transaction.id}/edit`}>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Edit className="size-4" />
                  <span className="hidden sm:inline">Edit</span>
                </Button>
              </Link>
            </>
          }
        />

        {/* Two-column grid */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Info card */}
          <SectionCard title="Informasi Bon" icon={Info} iconAccent="blue">
            <div className="space-y-0 divide-y divide-border">
              <InfoRow label="Tanggal" value={format(new Date(transaction.date), "dd MMMM yyyy")} />
              <InfoRow label="Nomor Bon" value={<span className="font-medium">{transaction.bonNumber}</span>} />
              <InfoRow label="Pelanggan" value={customer?.name || "—"} />
              <InfoRow
                label="Status"
                value={<StatusBadge variant={statusVariant}>{transaction.status}</StatusBadge>}
              />
              {transaction.isBonus && <InfoRow label="Tipe" value={<BonusPill />} />}
              {transaction.paymentDate && (
                <InfoRow label="Tanggal Bayar" value={format(new Date(transaction.paymentDate), "dd MMMM yyyy")} />
              )}
              {transaction.description && (
                <InfoRow label="Deskripsi" value={transaction.description} />
              )}
            </div>
          </SectionCard>

          {/* Summary card */}
          <SectionCard title="Ringkasan" icon={Calculator} iconAccent="green">
            <div className="space-y-0 divide-y divide-border">
              <InfoRow label="Total Omzet" value={<span className="font-medium">{formatCurrency(totalOmzet)}</span>} mono />
              <InfoRow label="Ongkir" value={formatCurrency(transaction.ongkir)} mono />
              <InfoRow
                label="Total Tagihan"
                value={<span className="font-bold text-base">{formatCurrency(totalTagihan)}</span>}
                mono
                highlight
              />
              {!transaction.isBonus && (
                <InfoRow
                  label="Laba HL"
                  value={formatCurrency(totalProfit)}
                  mono
                  accent="green"
                />
              )}
            </div>
          </SectionCard>
        </div>

        {/* Products list */}
        <SectionCard title="Daftar Produk" icon={Package} iconAccent="violet">
          <div className="rounded-xl ring-1 ring-foreground/[0.06] overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr style={{ backgroundColor: "var(--muted)" }}>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>No</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Produk</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Tipe</th>
                  <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Qty</th>
                  <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Harga Diskon</th>
                  <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Omzet</th>
                </tr>
              </thead>
              <tbody>
                {transaction.items.map((item, index) => (
                  <tr
                    key={item.id}
                    className="border-t last:border-0 transition-colors duration-100 hover:bg-muted/50"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <td className="px-4 py-3 text-sm">{index + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium">{item.productName || "—"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge variant={item.productType === "LM" ? "success" : "info"}>
                        {item.productType}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3 text-sm text-right tabular-nums">{item.qty}</td>
                    <td className="px-4 py-3 text-sm text-right tabular-nums">{formatCurrency(item.appliedPrice)}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium tabular-nums">{formatCurrency(item.calculatedOmzet)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* Settle dialog */}
        <Dialog open={settleDialog} onOpenChange={setSettleDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Lunaskan Transaksi</DialogTitle>
              <DialogDescription>
                Set transaksi ini ke status Lunas. Omzet dan laba akan diakui.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tanggal Pelunasan</label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSettleDialog(false)}>Batal</Button>
              <Button onClick={handleSettle} disabled={isSettling}>
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