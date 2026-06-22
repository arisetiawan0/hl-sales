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

  const stats = useMemo(() => {
    const activeProducts = products.filter((p) => !p.deletedAt)
    const typeLM = activeProducts.filter((p) => p.type === 'LM').length
    const typeBR = activeProducts.filter((p) => p.type === 'BR').length
    const avgPrice = activeProducts.length > 0
      ? activeProducts.reduce((sum, p) => sum + p.basePrice, 0) / activeProducts.length
      : 0

    return [
      { label: 'Total', value: activeProducts.length, icon: Package },
      { label: 'LM', value: typeLM, icon: Tag },
      { label: 'BR', value: typeBR, icon: Tag },
      { label: 'Avg Harga', value: formatCurrency(avgPrice), icon: Package },
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
          <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--muted-foreground)' }} />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader
          title="Produk"
          subtitle="Kelola katalog produk HL Sales"
          badge="Produk"
          accent="violet"
          stats={stats}
          actions={
            <Link href="/produk/tambah">
              <Button size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm text-xs">
                <Package className="mr-1.5 size-3.5" />
                Tambah
              </Button>
            </Link>
          }
        />

        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-xs">
            <Input
              placeholder="Cari produk..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 text-xs"
            />
          </div>
          <Select
            value={filterType}
            onValueChange={(v) => v && setFilterType(v)}
            items={[
              { value: 'all', label: 'Semua' },
              { value: 'LM', label: 'LM' },
              { value: 'BR', label: 'BR' },
            ]}
          >
            <SelectTrigger className="w-28 h-9 text-xs">
              <SelectValue placeholder="Semua" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              <SelectItem value="LM">LM</SelectItem>
              <SelectItem value="BR">BR</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-xl border overflow-x-auto" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
          <Table className="min-w-[600px]">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[10px] uppercase tracking-wider font-semibold h-10">No</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider font-semibold h-10">Nama</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider font-semibold h-10">Tipe</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider font-semibold h-10">Harga Modal</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider font-semibold h-10">Harga Jual</TableHead>
                <TableHead className="text-right text-[10px] uppercase tracking-wider font-semibold h-10">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    <div className="flex flex-col items-center gap-1.5">
                      <Package className="size-6" style={{ color: 'var(--muted-foreground)' }} />
                      <p className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                        {search || filterType !== 'all' ? 'Produk tidak ditemukan' : 'Belum ada data produk'}
                      </p>
                      {!search && filterType === 'all' && (
                        <Link href="/produk/tambah">
                          <Button variant="link" size="sm" className="text-xs">Tambah produk pertama</Button>
                        </Link>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product, index) => (
                  <TableRow key={product.id}>
                    <TableCell className="text-xs text-muted-foreground">{index + 1}</TableCell>
                    <TableCell className="text-xs font-medium">{product.name}</TableCell>
                    <TableCell>
                      <StatusBadge variant={product.type === 'LM' ? 'info' : 'violet'}>
                        <span className="text-[10px]">{product.type}</span>
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="text-xs tabular-nums">{formatCurrency(product.costPrice)}</TableCell>
                    <TableCell className="text-xs font-medium tabular-nums">{formatCurrency(product.basePrice)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-0.5">
                        <Link href={`/produk/${product.id}/edit`}>
                          <Button variant="ghost" size="icon" className="size-7">
                            <Edit className="size-3.5" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-destructive hover:text-destructive"
                          onClick={() => setDeleteDialog({ open: true, id: product.id })}
                        >
                          <Trash2 className="size-3.5" />
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
