'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2, Loader2, UserX } from 'lucide-react'
import { toast } from 'sonner'
import { customerService } from '@/lib/services'
import { applyCascadingDiscount } from '@/lib/calculations'
import { PageHeader } from '@/components/shared/PageHeader'
import { CustomerDiscount, ProductType } from '@/types'

/* -------------------------------------------------------------------------- */
/*  Loading skeleton                                                          */
/* -------------------------------------------------------------------------- */

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <Loader2 className="size-6 w-6 animate-spin" style={{ color: 'var(--muted-foreground)' }} />
      <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Memuat data pelanggan...</span>
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
        style={{ backgroundColor: 'oklch(0.96 0.02 250)' }}
      >
        <UserX className="size-6" style={{ color: 'oklch(0.5 0.18 250)' }} />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
          Pelanggan tidak ditemukan
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
          Data pelanggan mungkin sudah dihapus atau ID tidak valid
        </p>
      </div>
      <Link href="/pelanggan">
        <Button variant="outline" size="sm">
          Kembali ke Daftar
        </Button>
      </Link>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Section card (dashboard-style)                                            */
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
        boxShadow: `0 1px 0 0 oklch(0.96 0.02 250) inset, 0 1px 3px color-mix(in oklch, var(--foreground) 6%, transparent)`,
      }}
    >
      {/* top accent line */}
      <div
        className="h-[3px] mx-5 mt-5 rounded-full"
        style={{ background: 'linear-gradient(90deg, oklch(0.55 0.18 250), oklch(0.45 0.18 320))' }}
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
          <span className="text-[10px] font-bold px-1 py-px rounded" style={{ backgroundColor: 'oklch(0.95 0.02 250)', color: 'oklch(0.5 0.18 250)' }}>
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

export default function PelangganEditPage() {
  const router = useRouter()
  const params = useParams()

  const [name, setName] = useState('')
  const [bonusThreshold, setBonusThreshold] = useState('')
  const [lmDiscounts, setLmDiscounts] = useState<CustomerDiscount[]>([])
  const [brDiscounts, setBrDiscounts] = useState<CustomerDiscount[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [entityName, setEntityName] = useState('')

  useEffect(() => {
    if (params.id) {
      customerService.getById(params.id as string).then(customer => {
        if (customer) {
          setName(customer.name)
          setEntityName(customer.name)
          setBonusThreshold(String(customer.bonusThreshold))
          setLmDiscounts(customer.discounts.filter(d => d.type === 'LM'))
          setBrDiscounts(customer.discounts.filter(d => d.type === 'BR'))
        } else {
          setNotFound(true)
        }
        setLoading(false)
      })
    }
  }, [params.id])

  const addDiscount = (type: ProductType) => {
    const discounts = type === 'LM' ? lmDiscounts : brDiscounts
    const newDiscount: CustomerDiscount = {
      id: `temp-${crypto.randomUUID()}`,
      customerId: params.id as string,
      type,
      stepOrder: discounts.length + 1,
      percentage: 0,
    }
    if (type === 'LM') {
      setLmDiscounts([...lmDiscounts, newDiscount])
    } else {
      setBrDiscounts([...brDiscounts, newDiscount])
    }
  }

  const updateDiscount = (type: ProductType, index: number, value: number) => {
    const discounts = type === 'LM' ? [...lmDiscounts] : [...brDiscounts]
    discounts[index] = { ...discounts[index], percentage: value }
    if (type === 'LM') {
      setLmDiscounts(discounts)
    } else {
      setBrDiscounts(discounts)
    }
  }

  const removeDiscount = (type: ProductType, index: number) => {
    const discounts = type === 'LM' ? [...lmDiscounts] : [...brDiscounts]
    discounts.splice(index, 1)
    discounts.forEach((d, i) => { d.stepOrder = i + 1 })
    if (type === 'LM') {
      setLmDiscounts(discounts)
    } else {
      setBrDiscounts(discounts)
    }
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!name.trim()) newErrors.name = 'Nama wajib diisi'
    if (bonusThreshold === '' || Number(bonusThreshold) < 0) newErrors.bonusThreshold = 'Ambang bonus harus valid'

    lmDiscounts.forEach((d, i) => {
      if (d.percentage < 0 || d.percentage > 100) {
        newErrors[`lm_${i}`] = 'Diskon harus 0–100%'
      }
    })
    brDiscounts.forEach((d, i) => {
      if (d.percentage < 0 || d.percentage > 100) {
        newErrors[`br_${i}`] = 'Diskon harus 0–100%'
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setIsSubmitting(true)
    try {
      const allDiscounts = [
        ...lmDiscounts.map((d, i) => ({ ...d, stepOrder: i + 1 })),
        ...brDiscounts.map((d, i) => ({ ...d, stepOrder: i + 1 })),
      ]

      await customerService.update(params.id as string, {
        name,
        bonusThreshold: Number(bonusThreshold),
        discounts: allDiscounts,
      })
      toast.success('Pelanggan berhasil diperbarui')
      router.push('/pelanggan')
    } catch {
      toast.error('Gagal memperbarui pelanggan')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderDiscountEditor = (type: ProductType, discounts: CustomerDiscount[]) => (
    <div className="space-y-3">
      {discounts.length === 0 ? (
        <p className="text-xs italic py-4 text-center" style={{ color: 'var(--muted-foreground)' }}>
          Belum ada diskon. Klik tombol di bawah untuk menambahkan.
        </p>
      ) : (
        <div className="space-y-2.5">
          {discounts.map((discount, index) => (
            <div
              key={discount.id}
              className="flex items-center gap-2.5 p-2.5 rounded-lg"
              style={{ backgroundColor: 'var(--muted)' }}
            >
              <span className="text-[11px] font-semibold w-16 shrink-0" style={{ color: 'var(--muted-foreground)' }}>
                Langkah {index + 1}
              </span>
              <Input
                type="number"
                min={0}
                max={100}
                value={discount.percentage}
                onChange={(e) => updateDiscount(type, index, Number(e.target.value))}
                className="w-24 text-sm"
              />
              <span className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>%</span>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => removeDiscount(type, index)}
                className="ml-auto shrink-0"
              >
                <Trash2 className="size-3.5" style={{ color: 'var(--destructive)' }} />
              </Button>
              {errors[`${type.toLowerCase()}_${index}`] && (
                <p className="text-[11px] font-medium w-full" style={{ color: 'var(--destructive)' }}>
                  {errors[`${type.toLowerCase()}_${index}`]}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
      {discounts.length > 0 && (
        <div className="p-3 rounded-lg" style={{ backgroundColor: 'oklch(0.96 0.02 250)' }}>
          <p className="text-[11px] font-semibold mb-1" style={{ color: 'oklch(0.5 0.18 250)' }}>
            Contoh perhitungan:
          </p>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            Harga Base Rp 100.000 → Rp{' '}
            {applyCascadingDiscount(100000, discounts.map(d => d.percentage)).toLocaleString('id-ID')}
          </p>
        </div>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => addDiscount(type)}
        className="w-full mt-2"
      >
        <Plus className="size-3.5" />
        Tambah Langkah
      </Button>
    </div>
  )

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-6">
          <PageHeader
            title="Edit Pelanggan"
            subtitle="Memuat..."
            accent="blue"
            badge="Edit"
            backHref="/pelanggan"
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
            title="Edit Pelanggan"
            subtitle="Data tidak ditemukan"
            accent="blue"
            badge="Edit"
            backHref="/pelanggan"
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
          title="Edit Pelanggan"
          subtitle={entityName ? `Mengedit: ${entityName}` : 'Perbarui informasi pelanggan'}
          accent="blue"
          badge="Edit"
          backHref="/pelanggan"
        />

        {/* Basic Info */}
        <SectionCard title="Informasi Dasar">
          <div className="space-y-4">
            <FormField label="Nama Pelanggan" required error={errors.name}>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masukkan nama pelanggan"
              />
            </FormField>

            <FormField
              label="Ambang Batas Bonus"
              hint="Jumlah omzet minimal (Rp) untuk mendapatkan bonus"
              error={errors.bonusThreshold}
            >
              <Input
                id="bonusThreshold"
                type="number"
                min={0}
                value={bonusThreshold}
                onChange={(e) => setBonusThreshold(e.target.value)}
                placeholder="Contoh: 10000000"
              />
            </FormField>
          </div>
        </SectionCard>

        {/* Discount tiers */}
        <SectionCard title="Diskon Bertingkat">
          <Tabs defaultValue="lm">
            <TabsList>
              <TabsTrigger value="lm">Diskon LM</TabsTrigger>
              <TabsTrigger value="br">Diskon BR</TabsTrigger>
            </TabsList>
            <TabsContent value="lm" className="mt-4">
              <p className="text-[11px] mb-3" style={{ color: 'var(--muted-foreground)' }}>
                Diskon diterapkan secara berurutan (cascading) — langkah pertama applied ke harga produk, langkah kedua applied ke hasilnya.
              </p>
              {renderDiscountEditor('LM', lmDiscounts)}
            </TabsContent>
            <TabsContent value="br" className="mt-4">
              <p className="text-[11px] mb-3" style={{ color: 'var(--muted-foreground)' }}>
                Diskon BR menggunakan sistem yang sama dengan LM tapi dengan daftar harga berbeda.
              </p>
              {renderDiscountEditor('BR', brDiscounts)}
            </TabsContent>
          </Tabs>
        </SectionCard>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-1">
          <Link href="/pelanggan">
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