'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CurrencyInput } from '@/components/ui/currency-input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, PackageX } from 'lucide-react'
import { toast } from 'sonner'
import { productService } from '@/lib/services'
import { PageHeader } from '@/components/shared/PageHeader'
import { formatCurrency } from '@/lib/calculations'
import { ProductType } from '@/types'

/* -------------------------------------------------------------------------- */
/*  Loading skeleton                                                          */
/* -------------------------------------------------------------------------- */

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <Loader2 className="size-6 w-6 animate-spin" style={{ color: 'var(--muted-foreground)' }} />
      <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Memuat data produk...</span>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Not found state                                                           */
/* -------------------------------------------------------------------------- */

function NotFoundState() {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <div
        className="flex size-14 items-center justify-center rounded-full"
        style={{ backgroundColor: 'oklch(0.96 0.03 300)' }}
      >
        <PackageX className="size-6" style={{ color: 'oklch(0.5 0.18 300)' }} />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
          Produk tidak ditemukan
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
          Data produk mungkin sudah dihapus atau ID tidak valid
        </p>
      </div>
      <Link href="/produk">
        <Button variant="outline" size="sm">
          Kembali ke Daftar
        </Button>
      </Link>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Section card (dashboard-style, violet accent)                             */
/* -------------------------------------------------------------------------- */

function SectionCard({
  title,
  children,
  action,
}: {
  title: string
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div
      className="overflow-hidden rounded-2xl"
      style={{
        backgroundColor: 'var(--card)',
        boxShadow: `0 1px 0 0 oklch(0.96 0.03 300) inset, 0 1px 3px color-mix(in oklch, var(--foreground) 6%, transparent)`,
      }}
    >
      {/* top accent line — violet */}
      <div
        className="h-[3px] mx-5 mt-5 rounded-full"
        style={{ background: 'linear-gradient(90deg, oklch(0.6 0.18 300), oklch(0.45 0.2 330))' }}
      />
      <div className="px-5 pb-5 pt-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
            {title}
          </h2>
          {action}
        </div>
        {children}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Form field                                                                */
/* -------------------------------------------------------------------------- */

function FormField({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Label className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>
          {label}
        </Label>
        {required && (
          <span className="text-[10px] font-bold px-1 py-px rounded" style={{ backgroundColor: 'oklch(0.95 0.03 300)', color: 'oklch(0.5 0.18 300)' }}>
            WAJIB
          </span>
        )}
      </div>
      {children}
      {hint && !error && (
        <p className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>{hint}</p>
      )}
      {error && (
        <p className="text-[11px] font-medium" style={{ color: 'var(--destructive)' }}>{error}</p>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function ProdukEditPage() {
  const router = useRouter()
  const params = useParams()

  const [name, setName] = useState('')
  const [costPrice, setCostPrice] = useState('')
  const [basePrice, setBasePrice] = useState('')
  const [type, setType] = useState<ProductType>('LM')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [entityName, setEntityName] = useState('')

  useEffect(() => {
    if (params.id) {
      productService.getById(params.id as string).then(product => {
        if (product) {
          setName(product.name)
          setEntityName(product.name)
          setCostPrice(String(product.costPrice))
          setBasePrice(String(product.basePrice))
          setType(product.type)
        } else {
          setNotFound(true)
        }
        setLoading(false)
      })
    }
  }, [params.id])

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
      await productService.update(params.id as string, {
        name,
        costPrice: Number(costPrice),
        basePrice: Number(basePrice),
        type,
      })
      toast.success('Produk berhasil diperbarui')
      router.push('/produk')
    } catch {
      toast.error('Gagal memperbarui produk')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show profit preview
  const profit = Number(basePrice) - Number(costPrice)
  const profitPct = Number(costPrice) > 0 ? ((profit / Number(costPrice)) * 100).toFixed(1) : null

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-6">
          <PageHeader
            title="Edit Produk"
            subtitle="Memuat..."
            accent="violet"
            badge="Edit"
            backHref="/produk"
          />
          <LoadingState />
        </div>
      </AppShell>
    )
  }

  if (notFound) {
    return (
      <AppShell>
        <div className="space-y-6">
          <PageHeader
            title="Edit Produk"
            subtitle="Data tidak ditemukan"
            accent="violet"
            badge="Edit"
            backHref="/produk"
          />
          <NotFoundState />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <form onSubmit={handleSubmit} className="space-y-5">
        <PageHeader
          title="Edit Produk"
          subtitle={entityName ? `Mengedit: ${entityName}` : 'Perbarui informasi produk'}
          accent="violet"
          badge="Edit"
          backHref="/produk"
        />

        <SectionCard title="Informasi Produk">
          <div className="space-y-4">
            <FormField label="Nama Produk" required error={errors.name}>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masukkan nama produk"
              />
            </FormField>

            <FormField label="Tipe Produk" required>
              <Select value={type} onValueChange={(v) => setType(v as ProductType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LM">LM</SelectItem>
                  <SelectItem value="BR">BR</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField
              label="Harga Modal (Rp)"
              hint="Harga pokok produk — hanya untuk kalkulasi laba, tidak mempengaruhi harga diskon"
              error={errors.costPrice}
            >
              <CurrencyInput
                id="costPrice"
                value={costPrice}
                onValueChange={setCostPrice}
                placeholder="Contoh: 50.000"
              />
            </FormField>

            <FormField
              label="Harga Jual (Rp)"
              required
              hint="Harga daftar sebelum diskon diterapkan ke pelanggan"
              error={errors.basePrice}
            >
              <CurrencyInput
                id="basePrice"
                value={basePrice}
                onValueChange={setBasePrice}
                placeholder="Contoh: 100.000"
              />
            </FormField>

            {/* Profit preview */}
            {Number(basePrice) > 0 && Number(costPrice) > 0 && (
              <div
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ backgroundColor: 'oklch(0.96 0.03 145)' }}
              >
                <div>
                  <p className="text-[11px] font-semibold" style={{ color: 'oklch(0.45 0.15 145)' }}>
                    Estimasi Laba per Unit
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                    {formatCurrency(Number(basePrice))} − {formatCurrency(Number(costPrice))}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold" style={{ color: 'oklch(0.45 0.15 145)' }}>
                    {formatCurrency(profit)}
                  </p>
                  {profitPct && (
                    <p className="text-[11px] font-medium" style={{ color: 'oklch(0.5 0.15 145)' }}>
                      +{profitPct}%
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </SectionCard>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-1">
          <Link href="/produk">
            <Button type="button" variant="outline">
              Batal
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </div>
      </form>
    </AppShell>
  )
}