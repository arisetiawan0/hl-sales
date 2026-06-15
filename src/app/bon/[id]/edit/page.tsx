'use client'

/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2, Gift, Loader2, FileX, CheckCircle2, AlertCircle, PackageX } from 'lucide-react'
import { toast } from 'sonner'
import { customerService, productService, transactionService } from '@/lib/services'
import {
  getDiscountedPrice,
  calculateLineOmzet,
  calculateLineProfit,
  formatCurrency,
  calculateAccumulatedPaidOmzet,
  calculateBonusesGranted,
  calculateBonusAvailable,
} from '@/lib/calculations'
import { PageHeader } from '@/components/shared/PageHeader'
import { Customer, Product, TransactionItem } from '@/types'
import { format } from 'date-fns'

/* -------------------------------------------------------------------------- */
/*  Types & helpers                                                           */
/* -------------------------------------------------------------------------- */

interface LineItem {
  id: string
  productId: string
  qty: number
  appliedPrice: number
  calculatedOmzet: number
  calculatedProfit: number
}

/* -------------------------------------------------------------------------- */
/*  Loading skeleton                                                          */
/* -------------------------------------------------------------------------- */

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <Loader2 className="size-6 w-6 animate-spin" style={{ color: 'var(--muted-foreground)' }} />
      <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Memuat data bon...</span>
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
        style={{ backgroundColor: 'oklch(0.96 0.03 145)' }}
      >
        <FileX className="size-6" style={{ color: 'oklch(0.5 0.16 145)' }} />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
          Bon tidak ditemukan
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
          Transaksi mungkin sudah dihapus atau ID tidak valid
        </p>
      </div>
      <Link href="/bon">
        <Button variant="outline" size="sm">
          Kembali ke Daftar
        </Button>
      </Link>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Section card (dashboard-style, green accent)                              */
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
        boxShadow: `0 1px 0 0 oklch(0.96 0.03 145) inset, 0 1px 3px color-mix(in oklch, var(--foreground) 6%, transparent)`,
      }}
    >
      {/* top accent line — green */}
      <div
        className="h-[3px] mx-5 mt-5 rounded-full"
        style={{ background: 'linear-gradient(90deg, oklch(0.7 0.16 145), oklch(0.55 0.16 175))' }}
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
          <span className="text-[10px] font-bold px-1 py-px rounded" style={{ backgroundColor: 'oklch(0.95 0.03 145)', color: 'oklch(0.5 0.16 145)' }}>
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

export default function BonEditPage() {
  const router = useRouter()
  const params = useParams()

  const [date, setDate] = useState('')
  const [bonNumber, setBonNumber] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [ongkir, setOngkir] = useState('')
  const [description, setDescription] = useState('')
  const [isBonus, setIsBonus] = useState(false)
  const [status, setStatus] = useState<'PIUTANG' | 'LUNAS'>('PIUTANG')
  const [items, setItems] = useState<LineItem[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [entityName, setEntityName] = useState('')

  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [bonusAvailable, setBonusAvailable] = useState(0)

  useEffect(() => {
    Promise.all([customerService.getAll(), productService.getAll()])
      .then(([c, p]) => { setCustomers(c); setProducts(p) })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (params.id) {
      transactionService.getById(params.id as string).then(transaction => {
        if (transaction) {
          setDate(format(new Date(transaction.date), 'yyyy-MM-dd'))
          setBonNumber(transaction.bonNumber)
          setEntityName(transaction.bonNumber)
          setCustomerId(transaction.customerId)
          setOngkir(String(transaction.ongkir))
          setDescription(transaction.description)
          setIsBonus(transaction.isBonus)
          setStatus(transaction.status)
          setItems(transaction.items.map(item => ({
            id: item.id,
            productId: item.productId,
            qty: item.qty,
            appliedPrice: item.appliedPrice,
            calculatedOmzet: item.calculatedOmzet,
            calculatedProfit: item.calculatedProfit,
          })))
        } else {
          setNotFound(true)
        }
        setLoading(false)
      })
    }
  }, [params.id])

  useEffect(() => {
    if (customerId) {
      customerService.getById(customerId).then(c => setSelectedCustomer(c || null))
    } else {
      setSelectedCustomer(null)
    }
  }, [customerId])

  useEffect(() => {
    if (!selectedCustomer || selectedCustomer.bonusThreshold <= 0) {
      setBonusAvailable(0)
      return
    }
    transactionService.getByCustomerId(selectedCustomer.id).then(customerTransactions => {
      const accumulated = calculateAccumulatedPaidOmzet(customerTransactions)
      const granted = calculateBonusesGranted(customerTransactions)
      setBonusAvailable(calculateBonusAvailable(accumulated, selectedCustomer.bonusThreshold, granted))
    })
  }, [selectedCustomer])

  useEffect(() => {
    if (selectedCustomer && items.length > 0) {
      const updatedItems = items.map(item => {
        const product = products.find(p => p.id === item.productId)
        if (!product) return item
        const appliedPrice = getDiscountedPrice(
          product.basePrice,
          selectedCustomer.discounts,
          product.type
        )
        return {
          ...item,
          appliedPrice,
          calculatedOmzet: isBonus ? 0 : calculateLineOmzet(appliedPrice, item.qty),
          calculatedProfit: isBonus ? 0 : calculateLineProfit(appliedPrice, product.costPrice, item.qty),
        }
      })
      setItems(updatedItems)
    }
  }, [selectedCustomer, products, isBonus])

  const addItem = () => {
    const newItem: LineItem = {
      id: `item-${Date.now()}`,
      productId: '',
      qty: 1,
      appliedPrice: 0,
      calculatedOmzet: 0,
      calculatedProfit: 0,
    }
    setItems([...items, newItem])
  }

  const updateItem = (id: string, field: keyof LineItem, value: string | number) => {
    setItems(items.map(item => {
      if (item.id !== id) return item

      const updatedItem = { ...item, [field]: value }

      if (field === 'productId' || field === 'qty') {
        const product = products.find(p => p.id === (field === 'productId' ? value : item.productId))
        const qty = field === 'qty' ? Number(value) : item.qty

        if (product && selectedCustomer) {
          const appliedPrice = getDiscountedPrice(
            product.basePrice,
            selectedCustomer.discounts,
            product.type
          )
          updatedItem.appliedPrice = appliedPrice
          updatedItem.calculatedOmzet = isBonus ? 0 : calculateLineOmzet(appliedPrice, qty)
          updatedItem.calculatedProfit = isBonus ? 0 : calculateLineProfit(appliedPrice, product.costPrice, qty)
        }
      }

      return updatedItem
    }))
  }

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  const totalOmzet = items.reduce((sum, item) => sum + item.calculatedOmzet, 0)
  const totalTagihan = totalOmzet + Number(ongkir || 0)

  const validate = async () => {
    const newErrors: Record<string, string> = {}
    if (!bonNumber.trim()) newErrors.bonNumber = 'Nomor Bon wajib diisi'
    if (await transactionService.checkBonNumberExists(bonNumber, params.id as string)) {
      newErrors.bonNumber = 'Nomor Bon sudah ada'
    }
    if (!customerId) newErrors.customerId = 'Pelanggan wajib dipilih'
    if (items.length === 0) newErrors.items = 'Minimal satu produk'
    items.forEach((item, i) => {
      if (!item.productId) newErrors[`item_${i}_product`] = 'Produk wajib dipilih'
      if (item.qty < 1) newErrors[`item_${i}_qty`] = 'Qty minimal 1'
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!(await validate())) return
    setIsSubmitting(true)
    try {
      const transactionItems: TransactionItem[] = items.map(item => {
        const product = products.find(p => p.id === item.productId)
        return {
          id: item.id,
          transactionId: params.id as string,
          productId: item.productId,
          productName: product?.name || '',
          productType: product?.type || 'LM',
          productCostPrice: product?.costPrice || 0,
          productBasePrice: product?.basePrice || 0,
          qty: item.qty,
          appliedPrice: item.appliedPrice,
          calculatedOmzet: item.calculatedOmzet,
          calculatedProfit: item.calculatedProfit,
        }
      })

      await transactionService.update(params.id as string, {
        date: new Date(date),
        bonNumber,
        customerId,
        ongkir: Number(ongkir || 0),
        description,
        isBonus,
        status,
        paymentDate: status === 'LUNAS' ? new Date() : null,
        items: transactionItems,
      })
      toast.success('Bon berhasil diperbarui')
      router.push(`/bon/${params.id}`)
    } catch {
      toast.error('Gagal memperbarui bon')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-6">
          <PageHeader
            title="Edit Bon"
            subtitle="Memuat..."
            accent="green"
            badge="Edit"
            backHref="/bon"
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
            title="Edit Bon"
            subtitle="Data tidak ditemukan"
            accent="green"
            badge="Edit"
            backHref="/bon"
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
          title="Edit Bon"
          subtitle={entityName ? `Mengedit: ${entityName}` : 'Perbarui transaksi'}
          accent="green"
          badge="Edit"
          backHref={`/bon/${params.id}`}
        />

        {/* Bon Info */}
        <SectionCard title="Informasi Bon">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Tanggal">
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </FormField>

              <FormField label="Nomor Bon" required error={errors.bonNumber}>
                <Input
                  id="bonNumber"
                  value={bonNumber}
                  onChange={(e) => setBonNumber(e.target.value)}
                  placeholder="Contoh: BON-005"
                />
              </FormField>
            </div>

            <FormField label="Pelanggan" required error={errors.customerId}>
              <Select value={customerId} onValueChange={(v) => setCustomerId(v || '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih pelanggan" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Ongkir (Rp)" hint="Biaya pengiriman — ditambahkan ke total tagihan">
              <Input
                id="ongkir"
                type="number"
                min={0}
                value={ongkir}
                onChange={(e) => setOngkir(e.target.value)}
                placeholder="0"
              />
            </FormField>

            <FormField label="Deskripsi" hint="Catatan tambahan bersifat opsional">
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Catatan tambahan..."
              />
            </FormField>

            {/* Flags row */}
            <div className="flex flex-wrap items-center gap-4">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isBonus}
                  onChange={(e) => setIsBonus(e.target.checked)}
                  className="size-4 rounded"
                />
                <span className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>Bon Bonus</span>
              </label>

              {selectedCustomer && bonusAvailable > 0 && (
                <div
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                  style={{ backgroundColor: 'oklch(0.95 0.03 300)', color: 'oklch(0.5 0.18 300)' }}
                >
                  <Gift className="size-3.5" />
                  {bonusAvailable} bonus tersedia
                </div>
              )}

              <div className="flex items-center gap-2 ml-auto">
                <span className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>Status:</span>
                <Select value={status} onValueChange={(v) => setStatus(v as 'PIUTANG' | 'LUNAS')}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PIUTANG">
                      <span className="inline-flex items-center gap-1.5">
                        <AlertCircle className="size-3.5" style={{ color: 'var(--warning)' }} />
                        Piutang
                      </span>
                    </SelectItem>
                    <SelectItem value="LUNAS">
                      <span className="inline-flex items-center gap-1.5">
                        <CheckCircle2 className="size-3.5" style={{ color: 'var(--success)' }} />
                        Lunas
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Products */}
        <SectionCard
          title="Produk"
          action={
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="size-3.5" />
              Tambah
            </Button>
          }
        >
          <div className="space-y-4">
            {errors.items && (
              <p className="text-[11px] font-medium" style={{ color: 'var(--destructive)' }}>{errors.items}</p>
            )}

            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <div
                  className="flex size-12 items-center justify-center rounded-full"
                  style={{ backgroundColor: 'var(--muted)' }}
                >
                  <PackageX className="size-5" style={{ color: 'var(--muted-foreground)' }} />
                </div>
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  Belum ada produk
                </p>
                <p className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                  Klik tombol &quot;Tambah&quot; di atas untuk menambahkan produk
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item, index) => {
                  const product = products.find(p => p.id === item.productId)
                  return (
                    <div
                      key={item.id}
                      className="overflow-hidden rounded-xl p-4 space-y-3"
                      style={{
                        backgroundColor: 'var(--muted)',
                        boxShadow: '0 1px 0 0 oklch(0.96 0.03 145) inset',
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-[11px] font-bold px-2 py-0.5 rounded-md"
                            style={{ backgroundColor: 'oklch(0.96 0.03 145)', color: 'oklch(0.45 0.15 145)' }}
                          >
                            #{index + 1}
                          </span>
                          <span className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>
                            {product ? product.name : 'Pilih produk'}
                          </span>
                          {product && (
                            <span
                              className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                              style={{ backgroundColor: 'oklch(0.93 0.02 250)', color: 'oklch(0.5 0.15 250)' }}
                            >
                              {product.type}
                            </span>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="size-3.5" style={{ color: 'var(--destructive)' }} />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <FormField label="Produk" required error={errors[`item_${index}_product`]}>
                          <Select value={item.productId} onValueChange={(v) => updateItem(item.id, 'productId', v || '')}>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih..." />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map(p => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.name} ({p.type})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormField>

                        <FormField label="Qty" required error={errors[`item_${index}_qty`]}>
                          <Input
                            type="number"
                            min={1}
                            value={item.qty}
                            onChange={(e) => updateItem(item.id, 'qty', Number(e.target.value))}
                          />
                        </FormField>

                        <FormField label="Harga Diskon">
                          <Input
                            value={item.appliedPrice > 0 ? formatCurrency(item.appliedPrice) : '—'}
                            disabled
                            className="bg-transparent"
                          />
                        </FormField>

                        <FormField label="Omzet">
                          <Input
                            value={item.calculatedOmzet > 0 ? formatCurrency(item.calculatedOmzet) : '—'}
                            disabled
                            className="bg-transparent"
                          />
                        </FormField>
                      </div>

                      {selectedCustomer && product && item.appliedPrice > 0 && (
                        <div className="text-[11px] px-2.5 py-2 rounded-md" style={{ backgroundColor: 'var(--card)' }}>
                          <span style={{ color: 'var(--muted-foreground)' }}>Diskon {product.type}: </span>
                          <span style={{ color: 'oklch(0.5 0.15 145)' }} className="font-medium">
                            {selectedCustomer.discounts
                              .filter(d => d.type === product.type)
                              .sort((a, b) => a.stepOrder - b.stepOrder)
                              .map(d => `${d.percentage}%`)
                              .join(' → ')}{' '}
                          </span>
                          <span style={{ color: 'var(--muted-foreground)' }}>→ {formatCurrency(item.appliedPrice)}</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Totals */}
            {items.length > 0 && (
              <div
                className="border-t pt-4 space-y-2"
                style={{ borderColor: 'color-mix(in oklch, var(--border) 60%, transparent)' }}
              >
                <div className="flex items-center justify-between text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  <span>Total Omzet:</span>
                  <span className="font-semibold tabular-nums" style={{ color: 'var(--foreground)' }}>
                    {formatCurrency(totalOmzet)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  <span>Ongkir:</span>
                  <span className="tabular-nums">{formatCurrency(Number(ongkir || 0))}</span>
                </div>
                <div
                  className="flex items-center justify-between text-base font-bold pt-2"
                  style={{ color: 'var(--foreground)' }}
                >
                  <span>Total Tagihan:</span>
                  <span className="tabular-nums">{formatCurrency(totalTagihan)}</span>
                </div>
              </div>
            )}
          </div>
        </SectionCard>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-1">
          <Link href={`/bon/${params.id as string}`}>
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