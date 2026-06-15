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
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Package, Edit, Trash2, Loader2, Tag } from 'lucide-react'
import { toast } from 'sonner'
import { productService } from '@/lib/services'
import { formatCurrency } from '@/lib/calculations'
import { Product } from '@/types'

export default function ProdukPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string | null }>({
    open: false,
    id: null,
  })
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    productService.getAll().then(setProducts).finally(() => setLoading(false))
  }, [])

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchesType = filterType === 'all' || p.type === filterType
    return matchesSearch && matchesType
  })

  // Compute stats
  const stats = useMemo(() => {
    const activeProducts = products.filter((p) => !p.deletedAt)
    const typeLM = activeProducts.filter((p) => p.type === 'LM').length
    const typeBR = activeProducts.filter((p) => p.type === 'BR').length
    const avgPrice = activeProducts.length > 0
      ? activeProducts.reduce((sum, p) => sum + p.basePrice, 0) / activeProducts.length
      : 0

    return [
      { label: 'Total Produk', value: activeProducts.length, icon: Package },
      { label: 'Tipe LM', value: typeLM, icon: Tag },
      { label: 'Tipe BR', value: typeBR, icon: Tag },
      { label: 'Rata-rata Harga', value: formatCurrency(avgPrice), icon: Package },
    ]
  }, [products])

  const handleDelete = async () => {
    if (deleteDialog.id) {
      setIsDeleting(true)
      try {
        await productService.softDelete(deleteDialog.id)
        setProducts(await productService.getAll())
        setDeleteDialog({ open: false, id: null })
        toast.success('Produk berhasil dihapus')
      } catch {
        toast.error('Gagal menghapus produk')
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
          title="Produk"
          subtitle="Kelola katalog produk HL Sales"
          badge="Produk"
          accent="violet"
          stats={stats}
          actions={
            <Link href="/produk/tambah">
              <Button size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm">
                <Package className="mr-1.5 h-4 w-4" />
                Tambah Produk
              </Button>
            </Link>
          }
        />

        {/* Filter bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Input
              placeholder="Cari produk..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterType} onValueChange={(v) => v && setFilterType(v)}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Semua Tipe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Tipe</SelectItem>
              <SelectItem value="LM">LM</SelectItem>
              <SelectItem value="BR">BR</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: 'var(--card)' }}>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">No</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Nama</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Tipe</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Harga Modal</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Harga Jual</TableHead>
                <TableHead className="text-right text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="h-8 w-8" style={{ color: 'var(--muted-foreground)' }} />
                      <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>
                        {search || filterType !== 'all' ? 'Produk tidak ditemukan' : 'Belum ada data produk'}
                      </p>
                      {!search && filterType === 'all' && (
                        <Link href="/produk/tambah">
                          <Button variant="link" size="sm">Tambah produk pertama</Button>
                        </Link>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product, index) => (
                  <TableRow key={product.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="text-sm text-muted-foreground">{index + 1}</TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                      <StatusBadge variant={product.type === 'LM' ? 'info' : 'violet'}>
                        {product.type}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="text-sm">{formatCurrency(product.costPrice)}</TableCell>
                    <TableCell className="text-sm font-medium">{formatCurrency(product.basePrice)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/produk/${product.id}/edit`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteDialog({ open: true, id: product.id })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Hapus Produk</DialogTitle>
              <DialogDescription>
                Produk akan disembunyikan dari pilihan baru, tetapi riwayat transaksi tetap tersimpan.
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