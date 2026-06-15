'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/shared'
import { SectionCard } from '@/components/shared'
import { Plus, Trash2, Loader2, User, Percent, Sparkles, Calculator } from 'lucide-react'
import { toast } from 'sonner'
import { customerService } from '@/lib/services'
import { applyCascadingDiscount } from '@/lib/calculations'
import { CustomerDiscount, ProductType } from '@/types'

export default function PelangganFormPage() {
  const params = useParams()
  const isEdit = Boolean(params.id)

  const [name, setName] = useState('')
  const [bonusThreshold, setBonusThreshold] = useState('')
  const [lmDiscounts, setLmDiscounts] = useState<CustomerDiscount[]>([])
  const [brDiscounts, setBrDiscounts] = useState<CustomerDiscount[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isEdit && params.id) {
      customerService.getById(params.id as string).then(customer => {
        if (customer) {
          setName(customer.name)
          setBonusThreshold(String(customer.bonusThreshold))
          setLmDiscounts(customer.discounts.filter(d => d.type === 'LM'))
          setBrDiscounts(customer.discounts.filter(d => d.type === 'BR'))
        }
      })
    }
  }, [isEdit, params.id])

  const addDiscount = (type: ProductType) => {
    const discounts = type === 'LM' ? lmDiscounts : brDiscounts
    const newDiscount: CustomerDiscount = {
      id: `temp-${crypto.randomUUID()}`,
      customerId: params.id as string || '',
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
        newErrors[`lm_${i}`] = 'Diskon harus 0-100'
      }
    })
    brDiscounts.forEach((d, i) => {
      if (d.percentage < 0 || d.percentage > 100) {
        newErrors[`br_${i}`] = 'Diskon harus 0-100'
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

      if (isEdit && params.id) {
        await customerService.update(params.id as string, {
          name,
          bonusThreshold: Number(bonusThreshold),
          discounts: allDiscounts,
        })
        toast.success('Pelanggan berhasil diperbarui')
      } else {
        await customerService.create({
          name,
          bonusThreshold: Number(bonusThreshold),
          discounts: allDiscounts,
        })
        toast.success('Pelanggan berhasil ditambahkan')
      }
      window.location.href = '/pelanggan'
    } catch {
      toast.error(isEdit ? 'Gagal memperbarui pelanggan' : 'Gagal menambahkan pelanggan')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderDiscountEditor = (type: ProductType, discounts: CustomerDiscount[]) => {
    const totalDiscount = applyCascadingDiscount(100000, discounts.map(d => d.percentage))
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addDiscount(type)}
            className="cursor-pointer"
          >
            <Plus className="mr-2 h-4 w-4" />
            Tambah Langkah
          </Button>
        </div>

        {discounts.length === 0 ? (
          <p className="text-sm italic py-4 text-center" style={{ color: 'var(--muted-foreground)' }}>
            Belum ada diskon
          </p>
        ) : (
          <div className="space-y-3">
            {discounts.map((discount, index) => (
              <div key={discount.id} className="flex items-center gap-3">
                <span
                  className="text-sm font-medium w-24 shrink-0"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  Langkah {index + 1}
                </span>
                <div className="relative w-28">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={discount.percentage}
                    onChange={(e) => updateDiscount(type, index, Number(e.target.value))}
                    className="pr-8"
                  />
                  <span
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm"
                    style={{ color: 'var(--muted-foreground)' }}
                  >
                    %
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeDiscount(type, index)}
                  className="cursor-pointer text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                {errors[`${type.toLowerCase()}_${index}`] && (
                  <p className="text-sm text-destructive">{errors[`${type.toLowerCase()}_${index}`]}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {discounts.length > 0 && (
          <div
            className="rounded-xl p-4 space-y-2"
            style={{
              background: 'linear-gradient(135deg, oklch(0.96 0.03 300), oklch(0.95 0.04 280))',
              border: '1px solid oklch(0.85 0.1 300)',
            }}
          >
            <div className="flex items-center gap-2">
              <Calculator className="size-4" style={{ color: 'oklch(0.5 0.18 300)' }} />
              <p className="text-xs font-semibold" style={{ color: 'oklch(0.5 0.18 300)' }}>
                Contoh Perhitungan
              </p>
            </div>
            <p className="text-sm" style={{ color: 'var(--foreground)' }}>
              Harga Base <span className="font-semibold">Rp 100.000</span> →{' '}
              <span className="font-bold" style={{ color: 'oklch(0.45 0.18 300)' }}>
                Rp {totalDiscount.toLocaleString('id-ID')}
              </span>
            </p>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Diskon diterapkan secara berurutan (cascading)
            </p>
          </div>
        )}
      </div>
    )
  }

  return (
    <AppShell>
      <form onSubmit={handleSubmit} className="space-y-5">
        <PageHeader
          title={isEdit ? 'Edit Pelanggan' : 'Tambah Pelanggan'}
          subtitle={isEdit ? 'Ubah data pelanggan yang sudah ada' : 'Tambahkan pelanggan baru ke sistem'}
          accent="blue"
          badge="Pelanggan"
          backHref="/pelanggan"
        />

        <SectionCard
          title="Informasi Dasar"
          description="Data utama pelanggan"
          icon={User}
          iconAccent="blue"
        >
          <div className="px-5 pb-5 sm:px-6 sm:pb-6 space-y-5">
            {/* Nama */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
                Nama Pelanggan *
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masukkan nama lengkap pelanggan"
                className="text-sm"
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>

            {/* Bonus Threshold */}
            <div className="space-y-2">
              <Label htmlFor="bonusThreshold" className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
                Ambang Batas Bonus (Rp)
              </Label>
              <Input
                id="bonusThreshold"
                type="number"
                min="0"
                value={bonusThreshold}
                onChange={(e) => setBonusThreshold(e.target.value)}
                placeholder="contoh: 10000000"
                className="text-sm max-w-48"
              />
              {errors.bonusThreshold && <p className="text-xs text-destructive">{errors.bonusThreshold}</p>}
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                Jumlah omzet minimal pelanggan untuk mendapatkan bonus
              </p>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Diskon Bertingkat"
          description="Diskon LM dan BR diterapkan secara berurutan (cascading)"
          icon={Percent}
          iconAccent="violet"
        >
          <div className="px-5 pb-5 sm:px-6 sm:pb-6 space-y-5">
            {/* LM Discounts */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span
                  className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md"
                  style={{
                    backgroundColor: 'oklch(0.93 0.02 250)',
                    color: 'oklch(0.5 0.18 250)',
                  }}
                >
                  Diskon LM
                </span>
              </div>
              {renderDiscountEditor('LM', lmDiscounts)}
            </div>

            <div
              className="h-px"
              style={{ backgroundColor: 'var(--border)' }}
            />

            {/* BR Discounts */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span
                  className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md"
                  style={{
                    backgroundColor: 'oklch(0.93 0.03 300)',
                    color: 'oklch(0.5 0.18 300)',
                  }}
                >
                  Diskon BR
                </span>
              </div>
              {renderDiscountEditor('BR', brDiscounts)}
            </div>
          </div>
        </SectionCard>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => { window.location.href = '/pelanggan' }}
            className="cursor-pointer"
          >
            Batal
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="cursor-pointer text-white shadow-lg"
            style={{
              background: 'linear-gradient(135deg, oklch(0.55 0.18 250), oklch(0.45 0.18 250))',
              border: 'none',
            }}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Menyimpan...' : (isEdit ? 'Simpan Perubahan' : 'Tambah Pelanggan')}
          </Button>
        </div>
      </form>
    </AppShell>
  )
}