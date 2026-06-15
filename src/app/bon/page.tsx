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

  // Compute stats
  const stats = useMemo(() => {
    const total = transactions.length
    const lunas = transactions.filter((t) => t.status === 'LUNAS').length
    const piutang = transactions.filter((t) => t.status === 'PIUTANG').length
    const totalOmzet = transactions.reduce((sum, t) => {
      const { totalOmzet } = calculateTransactionTotals(t.items, t.ongkir, t.status, t.isBonus)
      return sum + totalOmzet
    }, 0)

    return [
      { label: 'Total Transaksi', value: total, icon: FileText },
      { label: 'Lunas', value: lunas, icon: CheckCircle2 },
      { label: 'Piutang', value: piutang, icon: AlertCircle },
      { label: 'Total Omzet', value: formatCurrency(totalOmzet), icon: FileText },
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
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--muted-foreground)' }} />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Bon (Transaksi)"
          subtitle="Kelola transaksi penjualan HL Sales"
          badge="Bon"
          accent="green"
          stats={stats}
          actions={
            <Link href="/bon/tambah">
              <Button size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm">
                <FileText className="mr-1.5 h-4 w-4" />
                Buat Bon Baru
              </Button>
            </Link>
          }
        />

        {/* Filter bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Input
              placeholder="Cari nomor bon atau pelanggan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterStatus} onValueChange={(v) => v && setFilterStatus(v)}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="PIUTANG">Piutang</SelectItem>
              <SelectItem value="LUNAS">Lunas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: 'var(--card)' }}>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">No</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Tanggal</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Nomor Bon</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Pelanggan</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Status</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Total</TableHead>
                <TableHead className="text-right text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="h-8 w-8" style={{ color: 'var(--muted-foreground)' }} />
                      <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>
                        {search || filterStatus !== 'all' ? 'Transaksi tidak ditemukan' : 'Belum ada data transaksi'}
                      </p>
                      {!search && filterStatus === 'all' && (
                        <Link href="/bon/tambah">
                          <Button variant="link" size="sm">Buat transaksi pertama</Button>
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
                    <TableRow key={transaction.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="text-sm text-muted-foreground">{index + 1}</TableCell>
                      <TableCell className="text-sm">{format(new Date(transaction.date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell className="font-medium">{transaction.bonNumber}</TableCell>
                      <TableCell className="text-sm">{customer?.name || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <StatusBadge variant={transactionStatusVariant(transaction.status)}>
                            {transaction.status}
                          </StatusBadge>
                          {transaction.isBonus && <BonusPill />}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-medium">{formatCurrency(totalTagihan)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/bon/${transaction.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/bon/${transaction.id}/edit`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteDialog({ open: true, id: transaction.id })}
                          >
                            <Trash2 className="h-4 w-4" />
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
                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Hapus
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  )
}