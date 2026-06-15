'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/shared'
import { SectionCard } from '@/components/shared'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Package } from 'lucide-react'
import { toast } from 'sonner'
import { productService } from '@/lib/services'
import { ProductType } from '@/types'

export default function ProdukFormPage() {
  const router = useRouter()
  const params = useParams()
  const isEdit = Boolean(params.id)

  const [name, setName] = useState('')
  const [costPrice, setCostPrice] = useState('')
  const [basePrice, setBasePrice] = useState('')
  const [type, setType] = useState<ProductType>('LM')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isEdit && params.id) {
      productService.getById(params.id as string).then(product => {
        if (product) {
          setName(product.name)
          setCostPrice(String(product.costPrice))
          setBasePrice(String(product.basePrice))
          setType(product.type)
        } else {
          router.push('/produk')
        }
      })
    }
  }, [isEdit, params.id, router])

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!name.trim()) newErrors.name = 'Nama wajib diisi'
    if (costPrice === '' || Number(costPrice) < 0) newErrors.costPrice = 'Harga modal harus valid'
    if (basePrice === '' || Number(basePrice) < 0) newErrors.basePrice = 'Harga jual harus valid'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setIsSubmitting(true)
    try {
      if (isEdit && params.id) {
        await productService.update(params.id as string, {
          name,
          costPrice: Number(costPrice),
          basePrice: Number(basePrice),
          type,
        })
        toast.success('Produk berhasil diperbarui')
      } else {
        await productService.create({
          name,
          costPrice: Number(costPrice),
          basePrice: Number(basePrice),
          type,
        })
        toast.success('Produk berhasil ditambahkan')
      }
      router.push('/produk')
    } catch {
      toast.error(isEdit ? 'Gagal memperbarui produk' : 'Gagal menambahkan produk')
    } finally {
      setIsSubmitting(false)
    }
  }

  const cost = Number(costPrice) || 0
  const base = Number(basePrice) || 0
  const profit = base - cost
  const profitMargin = base > 0 ? ((profit / base) * 100).toFixed(1) : '0'

  return (
    <AppShell>
      <form onSubmit={handleSubmit} className="space-y-5">
        <PageHeader
          title={isEdit ? 'Edit Produk' : 'Tambah Produk'}
          subtitle={isEdit ? 'Ubah data produk yang sudah ada' : 'Tambahkan produk baru ke katalog'}
          accent="violet"
          badge="Produk"
          backHref="/produk"
        />

        <SectionCard
          title="Informasi Produk"
          description="Data utama produk"
          icon={Package}
          iconAccent="violet"
        >
          <div className="px-5 pb-5 sm:px-6 sm:pb-6 space-y-5">
            {/* Nama */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
                Nama Produk *
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masukkan nama produk"
                className="text-sm"
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>

            {/* Tipe */}
            <div className="space-y-2">
              <Label htmlFor="type" className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
                Tipe Produk *
              </Label>
              <Select value={type} onValueChange={(v) => setType(v as ProductType)}>
                <SelectTrigger id="type" className="w-40 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LM">LM</SelectItem>
                  <SelectItem value="BR">BR</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Harga Modal */}
            <div className="space-y-2">
              <Label htmlFor="costPrice" className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
                Harga Modal (Rp)
              </Label>
              <Input
                id="costPrice"
                type="number"
                min="0"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                placeholder="contoh: 50000"
                className="text-sm max-w-48"
              />
              {errors.costPrice && <p className="text-xs text-destructive">{errors.costPrice}</p>}
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                Harga pokok produk — hanya用于 kalkulasi laba, tidak afectan harga jual
              </p>
            </div>

            {/* Harga Jual */}
            <div className="space-y-2">
              <Label htmlFor="basePrice" className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
                Harga Jual (Rp) *
              </Label>
              <Input
                id="basePrice"
                type="number"
                min="0"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                placeholder="contoh: 100000"
                className="text-sm max-w-48"
              />
              {errors.basePrice && <p className="text-xs text-destructive">{errors.basePrice}</p>}
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                Harga daftar sebelum diskon pelanggan diterapkan
              </p>
            </div>

            {/* Kalkulasi Laba */}
            {(cost > 0 || base > 0) && (
              <div
                className="rounded-xl p-4 space-y-1.5"
                style={{
                  background: 'linear-gradient(135deg, oklch(0.96 0.03 145), oklch(0.95 0.04 175))',
                  border: '1px solid oklch(0.85 0.1 145)',
                }}
              >
                <div className="flex items-center gap-2">
                  <Package className="size-4" style={{ color: 'oklch(0.5 0.16 145)' }} />
                  <p className="text-xs font-semibold" style={{ color: 'oklch(0.45 0.15 145)' }}>
                    Kalkulasi Laba
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Laba per unit:</span>
                  <span
                    className="text-sm font-bold tabular-nums"
                    style={{ color: profit >= 0 ? 'oklch(0.45 0.15 145)' : 'oklch(0.5 0.2 25)' }}
                  >
                    Rp {profit.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Margin:</span>
                  <span className="text-sm font-semibold tabular-nums" style={{ color: 'var(--foreground)' }}>
                    {profitMargin}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </SectionCard>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => { router.push('/produk') }}
            className="cursor-pointer"
          >
            Batal
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="cursor-pointer text-white shadow-lg"
            style={{
              background: 'linear-gradient(135deg, oklch(0.55 0.18 300), oklch(0.45 0.2 295))',
              border: 'none',
            }}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Menyimpan...' : (isEdit ? 'Simpan Perubahan' : 'Tambah Produk')}
          </Button>
        </div>
      </form>
    </AppShell>
  )
}