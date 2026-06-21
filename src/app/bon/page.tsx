'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge, transactionStatusVariant, BonusPill } from '@/components/shared/StatusBadge'
import { FileText, Edit, Trash2, Eye, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { transactionService, customerService } from '@/lib/services'
import { formatCurrency, calculateTransactionTotals } from '@/lib/calculations'
import { format } from 'date-fns'
import { Customer, Transaction } from '@/types'

export default function BonPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string | null }>({
    open: false,
    id: null,
  })
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    Promise.all([transactionService.getAll(), customerService.getAll()])
      .then(([t, c]) => { setTransactions(t); setCustomers(c) })
      .finally(() => setLoading(false))
  }, [])

  const filteredTransactions = transactions.filter((t) => {
    const customer = customers.find(c => c.id === t.customerId)
    const matchesSearch =
      t.bonNumber.toLowerCase().includes(search.toLowerCase()) ||
      customer?.name.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const stats = useMemo(() => {
    const total = transactions.length
    const lunas = transactions.filter((t) => t.status === 'LUNAS').length
    const piutang = transactions.filter((t) => t.status === 'PIUTANG').length
    const totalOmzet = transactions.reduce((sum, t) => {
      const { totalOmzet } = calculateTransactionTotals(t.items, t.ongkir, t.status, t.isBonus)
      return sum + totalOmzet
    }, 0)

    return [
      { label: 'Total', value: total, icon: FileText },
      { label: 'Lunas', value: lunas, icon: CheckCircle2 },
      { label: 'Piutang', value: piutang, icon: AlertCircle },
      { label: 'Omzet', value: formatCurrency(totalOmzet), icon: FileText },
    ]
  }, [transactions])

  const handleDelete = async () => {
    if (deleteDialog.id) {
      setIsDeleting(true)
      try {
        await transactionService.delete(deleteDialog.id)
        setTransactions(await transactionService.getAll())
        setDeleteDialog({ open: false, id: null })
        toast.success('Transaksi berhasil dihapus')
      } catch {
        toast.error('Gagal menghapus transaksi')
      } finally {
        setIsDeleting(false)
      }
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--muted-foreground)' }} />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader
          title="Bon (Transaksi)"
          subtitle="Kelola transaksi penjualan HL Sales"
          badge="Bon"
          accent="green"
          stats={stats}
          actions={
            <Link href="/bon/tambah">
              <Button size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm text-xs">
                <FileText className="mr-1.5 size-3.5" />
                Buat Bon
              </Button>
            </Link>
          }
        />

        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-xs">
            <Input
              placeholder="Cari bon atau pelanggan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 text-xs"
            />
          </div>
          <Select value={filterStatus} onValueChange={(v) => v && setFilterStatus(v)}>
            <SelectTrigger className="w-32 h-9 text-xs">
              <SelectValue placeholder="Semua" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              <SelectItem value="PIUTANG">Piutang</SelectItem>
              <SelectItem value="LUNAS">Lunas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-xl border overflow-x-auto" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
          <Table className="min-w-[700px]">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[10px] uppercase tracking-wider font-semibold h-10">No</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider font-semibold h-10">Tanggal</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider font-semibold h-10">Nomor Bon</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider font-semibold h-10">Pelanggan</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider font-semibold h-10">Status</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider font-semibold h-10">Total</TableHead>
                <TableHead className="text-right text-[10px] uppercase tracking-wider font-semibold h-10">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10">
                    <div className="flex flex-col items-center gap-1.5">
                      <FileText className="size-6" style={{ color: 'var(--muted-foreground)' }} />
                      <p className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                        {search || filterStatus !== 'all' ? 'Transaksi tidak ditemukan' : 'Belum ada data transaksi'}
                      </p>
                      {!search && filterStatus === 'all' && (
                        <Link href="/bon/tambah">
                          <Button variant="link" size="sm" className="text-xs">Buat transaksi pertama</Button>
                        </Link>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((transaction, index) => {
                  const customer = customers.find(c => c.id === transaction.customerId)
                  const { totalTagihan } = calculateTransactionTotals(
                    transaction.items,
                    transaction.ongkir,
                    transaction.status,
                    transaction.isBonus
                  )
                  return (
                    <TableRow key={transaction.id}>
                      <TableCell className="text-xs text-muted-foreground">{index + 1}</TableCell>
                      <TableCell className="text-xs">{format(new Date(transaction.date), 'dd/MM/yy')}</TableCell>
                      <TableCell className="text-xs font-medium">{transaction.bonNumber}</TableCell>
                      <TableCell className="text-xs">{customer?.name || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <StatusBadge variant={transactionStatusVariant(transaction.status)}>
                            <span className="text-[10px]">{transaction.status}</span>
                          </StatusBadge>
                          {transaction.isBonus && <BonusPill />}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-medium tabular-nums">{formatCurrency(totalTagihan)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-0.5">
                          <Link href={`/bon/${transaction.id}`}>
                            <Button variant="ghost" size="icon" className="size-7">
                              <Eye className="size-3.5" />
                            </Button>
                          </Link>
                          <Link href={`/bon/${transaction.id}/edit`}>
                            <Button variant="ghost" size="icon" className="size-7">
                              <Edit className="size-3.5" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-destructive hover:text-destructive"
                            onClick={() => setDeleteDialog({ open: true, id: transaction.id })}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Hapus Transaksi</DialogTitle>
              <DialogDescription>
                Transaksi akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialog({ open: false, id: null })}>
                Batal
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting && <Loader2 className="mr-2 size-4 animate-spin" />}
                Hapus
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  )
}
