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
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Users, Edit, Trash2, Eye, Loader2, Gift, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import { customerService } from '@/lib/services'
import { formatCurrency } from '@/lib/calculations'
import { Customer } from '@/types'

export default function PelangganPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string | null }>({
    open: false,
    id: null,
  })
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    customerService.getAll().then(setCustomers).finally(() => setLoading(false))
  }, [])

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  // Compute stats
  const stats = useMemo(() => {
    const activeCustomers = customers.filter((c) => !c.deletedAt)
    const withBonus = activeCustomers.filter((c) => c.bonusThreshold > 0)
    const avgDiscount = activeCustomers.length > 0
      ? activeCustomers.reduce((sum, c) => {
          const lmDiscounts = c.discounts.filter(d => d.type === 'LM')
          const avg = lmDiscounts.length > 0
            ? lmDiscounts.reduce((s, d) => s + d.percentage, 0) / lmDiscounts.length
            : 0
          return sum + avg
        }, 0) / activeCustomers.length
      : 0

    return [
      { label: 'Total', value: activeCustomers.length, icon: Users },
      { label: 'Pelanggan Aktif', value: activeCustomers.length, icon: Users },
      { label: 'Dengan Bonus', value: withBonus.length, icon: Gift },
      { label: 'Rata-rata Disc LM', value: `${avgDiscount.toFixed(1)}%`, icon: TrendingUp },
    ]
  }, [customers])

  const handleDelete = async () => {
    if (deleteDialog.id) {
      setIsDeleting(true)
      try {
        await customerService.softDelete(deleteDialog.id)
        setCustomers(await customerService.getAll())
        setDeleteDialog({ open: false, id: null })
        toast.success('Pelanggan berhasil dihapus')
      } catch {
        toast.error('Gagal menghapus pelanggan')
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
          title="Pelanggan"
          subtitle="Kelola data pelanggan HL Sales"
          badge="Pelanggan"
          accent="blue"
          stats={stats}
          actions={
            <Link href="/pelanggan/tambah">
              <Button size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm">
                <Users className="mr-1.5 h-4 w-4" />
                Tambah Pelanggan
              </Button>
            </Link>
          }
        />

        {/* Filter bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Input
              placeholder="Cari pelanggan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: 'var(--card)' }}>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">No</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Nama</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Disc LM</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Disc BR</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Ambang Bonus</TableHead>
                <TableHead className="text-right text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="h-8 w-8" style={{ color: 'var(--muted-foreground)' }} />
                      <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>
                        {search ? 'Pelanggan tidak ditemukan' : 'Belum ada data pelanggan'}
                      </p>
                      {!search && (
                        <Link href="/pelanggan/tambah">
                          <Button variant="link" size="sm">Tambah pelanggan pertama</Button>
                        </Link>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer, index) => {
                  const lmDiscounts = customer.discounts
                    .filter(d => d.type === 'LM')
                    .sort((a, b) => a.stepOrder - b.stepOrder)
                    .map(d => `${d.percentage}%`)
                    .join(' → ')
                  const brDiscounts = customer.discounts
                    .filter(d => d.type === 'BR')
                    .sort((a, b) => a.stepOrder - b.stepOrder)
                    .map(d => `${d.percentage}%`)
                    .join(' → ')

                  return (
                    <TableRow key={customer.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="text-sm text-muted-foreground">{index + 1}</TableCell>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>
                        <StatusBadge variant={lmDiscounts ? 'info' : 'neutral'} showIcon={false}>
                          {lmDiscounts || '-'}
                        </StatusBadge>
                      </TableCell>
                      <TableCell>
                        <StatusBadge variant={brDiscounts ? 'violet' : 'neutral'} showIcon={false}>
                          {brDiscounts || '-'}
                        </StatusBadge>
                      </TableCell>
                      <TableCell>
                        {customer.bonusThreshold > 0 ? (
                          <span className="text-sm font-medium">{formatCurrency(customer.bonusThreshold)}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/pelanggan/${customer.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/pelanggan/${customer.id}/edit`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteDialog({ open: true, id: customer.id })}
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
              <DialogTitle>Hapus Pelanggan</DialogTitle>
              <DialogDescription>
                Pelanggan akan disembunyikan dari pilihan baru, tetapi semua transaksi historis tetap utuh.
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