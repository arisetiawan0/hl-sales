'use client'

/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PageHeader } from '@/components/shared'
import { SectionCard } from '@/components/shared'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Plus,
  Trash2,
  Loader2,
  Gift,
  FileText,
  ShoppingCart,
  Sparkles,
} from 'lucide-react'
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
import { Customer, Product, TransactionItem } from '@/types'
import { format } from 'date-fns'

interface LineItem {
  id: string
  productId: string
  qty: number
  appliedPrice: number
  calculatedOmzet: number
  calculatedProfit: number
}

export default function BonFormPage() {
  const router = useRouter()

  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
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
    if (await transactionService.checkBonNumberExists(bonNumber)) {
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
          transactionId: '',
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

      await transactionService.create({
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
      toast.success('Bon berhasil dibuat')
      router.push('/bon')
    } catch {
      toast.error('Gagal membuat bon')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <form onSubmit={handleSubmit} className="space-y-5">
        <PageHeader
          title="Buat Bon Baru"
          subtitle="Catat transaksi penjualan baru"
          accent="green"
          badge="Bon"
          backHref="/bon"
        />

        {/* Info Bon */}
        <SectionCard
          title="Informasi Bon"
          description="Data umum transaksi"
          icon={FileText}
          iconAccent="green"
        >
          <div className="px-5 pb-5 sm:px-6 sm:pb-6 space-y-5">
            {/* Baris 1: Tanggal + Nomor Bon */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
                  Tanggal
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bonNumber" className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
                  Nomor Bon *
                </Label>
                <Input
                  id="bonNumber"
                  value={bonNumber}
                  onChange={(e) => setBonNumber(e.target.value)}
                  placeholder="contoh: BON-005"
                  className="text-sm"
                />
                {errors.bonNumber && <p className="text-xs text-destructive">{errors.bonNumber}</p>}
              </div>
            </div>

            {/* Baris 2: Pelanggan */}
            <div className="space-y-2">
              <Label htmlFor="customer" className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
                Pelanggan *
              </Label>
              <Select value={customerId} onValueChange={(v) => setCustomerId(v ?? '')}>
                <SelectTrigger id="customer" className="w-full text-sm">
                  <SelectValue placeholder="Pilih pelanggan" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(customer => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.customerId && <p className="text-xs text-destructive">{errors.customerId}</p>}
            </div>

            {/* Bonus Hint */}
            {selectedCustomer && bonusAvailable > 0 && (
              <div
                className="rounded-xl p-4 flex items-center gap-3"
                style={{
                  background: 'linear-gradient(135deg, oklch(0.96 0.03 145), oklch(0.95 0.04 175))',
                  border: '1px solid oklch(0.85 0.1 145)',
                }}
              >
                <div
                  className="size-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'linear-gradient(135deg, oklch(0.7 0.16 145), oklch(0.5 0.16 145))' }}
                >
                  <Gift className="size-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'oklch(0.45 0.15 145)' }}>
                    {bonusAvailable} Bonus Tersedia
                  </p>
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    {selectedCustomer.name} memenuhi syarat untuk bonus
                  </p>
                </div>
              </div>
            )}

            {/* Baris 3: Ongkir */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ongkir" className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
                  Ongkir (Rp)
                </Label>
                <Input
                  id="ongkir"
                  type="number"
                  min="0"
                  value={ongkir}
                  onChange={(e) => setOngkir(e.target.value)}
                  placeholder="0"
                  className="text-sm max-w-48"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status" className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
                  Status
                </Label>
                <Select
                  value={status}
                  onValueChange={(v) => setStatus(v as 'PIUTANG' | 'LUNAS')}
                >
                  <SelectTrigger id="status" className="w-40 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PIUTANG">Piutang</SelectItem>
                    <SelectItem value="LUNAS">Lunas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Deskripsi */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
                Deskripsi
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Catatan tambahan..."
                className="text-sm resize-none"
                rows={2}
              />
            </div>

            {/* Bon Bonus Toggle */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <div
                  className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
                  style={{
                    backgroundColor: isBonus
                      ? 'oklch(0.55 0.18 300)'
                      : 'oklch(0.88 0.05 250)',
                  }}
                  onClick={() => setIsBonus(!isBonus)}
                >
                  <div
                    className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform"
                    style={{
                      transform: isBonus ? 'translateX(20px)' : 'translateX(3px)',
                      transition: 'transform 200ms ease',
                    }}
                  />
                </div>
                <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                  Bon Bonus
                </span>
              </label>
              {isBonus && (
                <span
                  className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-md"
                  style={{
                    backgroundColor: 'oklch(0.93 0.03 300)',
                    color: 'oklch(0.5 0.18 300)',
                  }}
                >
                  Omzet = 0
                </span>
              )}
            </div>
          </div>
        </SectionCard>

        {/* Produk */}
        <SectionCard
          title="Produk"
          description="Tambahkan item yang dijual"
          icon={ShoppingCart}
          iconAccent="amber"
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addItem}
              className="cursor-pointer"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Tambah Produk
            </Button>
          }
        >
          <div className="px-5 pb-5 sm:px-6 sm:pb-6 space-y-4">
            {errors.items && (
              <p className="text-sm text-destructive">{errors.items}</p>
            )}

            {items.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-12 text-center rounded-xl"
                style={{ backgroundColor: 'var(--muted)' }}
              >
                <ShoppingCart className="size-8 mb-3" style={{ color: 'var(--muted-foreground)' }} />
                <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                  Belum ada produk
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                  Klik &quot;Tambah Produk&quot; untuk menambahkan item
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item, index) => {
                  const product = products.find(p => p.id === item.productId)
                  return (
                    <div
                      key={item.id}
                      className="rounded-xl p-4 space-y-4 transition-all duration-200 hover:shadow-md"
                      style={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid oklch(0.88 0.04 75)',
                      }}
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <span
                          className="text-xs font-bold uppercase tracking-wider"
                          style={{ color: 'oklch(0.5 0.16 65)' }}
                        >
                          Item {index + 1}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                          className="cursor-pointer text-destructive hover:text-destructive h-7 w-7"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {/* Produk */}
                        <div className="space-y-1.5 sm:col-span-2">
                          <Label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
                            Produk *
                          </Label>
                          <Select
                            value={item.productId}
                            onValueChange={(v) => updateItem(item.id, 'productId', v ?? '')}
                          >
                            <SelectTrigger className="text-sm w-full">
                              <SelectValue placeholder="Pilih produk" />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map(p => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.name} <span style={{ color: 'var(--muted-foreground)' }}>({p.type})</span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors[`item_${index}_product`] && (
                            <p className="text-xs text-destructive">{errors[`item_${index}_product`]}</p>
                          )}
                        </div>

                        {/* Qty */}
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
                            Qty *
                          </Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.qty}
                            onChange={(e) => updateItem(item.id, 'qty', Number(e.target.value))}
                            className="text-sm"
                          />
                          {errors[`item_${index}_qty`] && (
                            <p className="text-xs text-destructive">{errors[`item_${index}_qty`]}</p>
                          )}
                        </div>

                        {/* Applied Price */}
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
                            Harga Diskon
                          </Label>
                          <Input
                            value={formatCurrency(item.appliedPrice)}
                            disabled
                            className="text-sm bg-muted"
                          />
                        </div>
                      </div>

                      {/* Discount trail */}
                      {selectedCustomer && product && (
                        <div
                          className="rounded-lg px-3 py-2 text-xs"
                          style={{
                            backgroundColor: 'oklch(0.96 0.03 300 / 0.4)',
                            color: 'oklch(0.5 0.18 300)',
                          }}
                        >
                          <span className="font-medium">{product.type}</span>:{' '}
                          {selectedCustomer.discounts
                            .filter(d => d.type === product.type)
                            .sort((a, b) => a.stepOrder - b.stepOrder)
                            .map(d => `${d.percentage}%`)
                            .join(' → ') || 'tanpa diskon'}
                          {' '}
                          <span style={{ color: 'var(--muted-foreground)' }}>→</span>{' '}
                          <span className="font-semibold">{formatCurrency(item.appliedPrice)}</span>
                        </div>
                      )}

                      {/* Subtotals */}
                      <div
                        className="flex items-center justify-between rounded-lg px-3 py-2 text-xs"
                        style={{ backgroundColor: 'var(--muted)' }}
                      >
                        <span style={{ color: 'var(--muted-foreground)' }}>Omzet Item:</span>
                        <span className="font-semibold tabular-nums" style={{ color: 'var(--foreground)' }}>
                          {formatCurrency(item.calculatedOmzet)}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Totals */}
            {items.length > 0 && (
              <div
                className="rounded-xl p-4 space-y-2"
                style={{
                  backgroundColor: 'var(--muted)',
                  border: '1px solid var(--border)',
                }}
              >
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: 'var(--muted-foreground)' }}>Total Omzet:</span>
                  <span className="font-medium tabular-nums" style={{ color: 'var(--foreground)' }}>
                    {formatCurrency(totalOmzet)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: 'var(--muted-foreground)' }}>Ongkir:</span>
                  <span className="tabular-nums" style={{ color: 'var(--foreground)' }}>
                    {formatCurrency(Number(ongkir || 0))}
                  </span>
                </div>
                <div
                  className="flex items-center justify-between text-base font-bold pt-2"
                  style={{ borderTop: '1px solid var(--border)' }}
                >
                  <span style={{ color: 'var(--foreground)' }}>Total Tagihan:</span>
                  <span className="tabular-nums" style={{ color: 'oklch(0.5 0.16 145)' }}>
                    {formatCurrency(totalTagihan)}
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
            onClick={() => { router.push('/bon') }}
            className="cursor-pointer"
          >
            Batal
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="cursor-pointer text-white shadow-lg"
            style={{
              background: 'linear-gradient(135deg, oklch(0.55 0.16 145), oklch(0.45 0.16 145))',
              border: 'none',
            }}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Menyimpan...' : 'Simpan Bon'}
          </Button>
        </div>
      </form>
    </AppShell>
  )
}