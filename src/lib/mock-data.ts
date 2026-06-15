import { Customer, Product, Transaction, TransactionItem, ProductType } from '@/types'

export const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'Toko Berkah',
    bonusThreshold: 10000000,
    discounts: [
      { id: 'd1', customerId: '1', type: 'LM', stepOrder: 1, percentage: 20 },
      { id: 'd2', customerId: '1', type: 'LM', stepOrder: 2, percentage: 20 },
      { id: 'd3', customerId: '1', type: 'LM', stepOrder: 3, percentage: 10 },
      { id: 'd4', customerId: '1', type: 'BR', stepOrder: 1, percentage: 15 },
      { id: 'd5', customerId: '1', type: 'BR', stepOrder: 2, percentage: 10 },
    ],
    createdAt: new Date('2025-01-01'),
    deletedAt: null,
  },
  {
    id: '2',
    name: 'Minimarket Jaya',
    bonusThreshold: 15000000,
    discounts: [
      { id: 'd6', customerId: '2', type: 'LM', stepOrder: 1, percentage: 25 },
      { id: 'd7', customerId: '2', type: 'LM', stepOrder: 2, percentage: 15 },
      { id: 'd8', customerId: '2', type: 'BR', stepOrder: 1, percentage: 20 },
      { id: 'd9', customerId: '2', type: 'BR', stepOrder: 2, percentage: 10 },
      { id: 'd10', customerId: '2', type: 'BR', stepOrder: 3, percentage: 5 },
    ],
    createdAt: new Date('2025-02-15'),
    deletedAt: null,
  },
  {
    id: '3',
    name: 'Warung Sejahtera',
    bonusThreshold: 5000000,
    discounts: [
      { id: 'd11', customerId: '3', type: 'LM', stepOrder: 1, percentage: 10 },
      { id: 'd12', customerId: '3', type: 'BR', stepOrder: 1, percentage: 10 },
    ],
    createdAt: new Date('2025-03-10'),
    deletedAt: null,
  },
]

export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Product LM A',
    costPrice: 50000,
    basePrice: 100000,
    type: 'LM',
    createdAt: new Date('2025-01-01'),
    deletedAt: null,
  },
  {
    id: '2',
    name: 'Product LM B',
    costPrice: 75000,
    basePrice: 120000,
    type: 'LM',
    createdAt: new Date('2025-01-01'),
    deletedAt: null,
  },
  {
    id: '3',
    name: 'Product BR A',
    costPrice: 60000,
    basePrice: 110000,
    type: 'BR',
    createdAt: new Date('2025-01-01'),
    deletedAt: null,
  },
  {
    id: '4',
    name: 'Product BR B',
    costPrice: 40000,
    basePrice: 80000,
    type: 'BR',
    createdAt: new Date('2025-01-01'),
    deletedAt: null,
  },
]

const createTransactionItems = (
  transactionId: string,
  items: Array<{ productId: string; qty: number; appliedPrice: number; costPrice: number; basePrice: number; productName: string; productType: ProductType }>
): TransactionItem[] =>
  items.map((item, index) => ({
    id: `${transactionId}-item-${index}`,
    transactionId,
    productId: item.productId,
    productName: item.productName,
    productType: item.productType,
    productCostPrice: item.costPrice,
    productBasePrice: item.basePrice,
    qty: item.qty,
    appliedPrice: item.appliedPrice,
    calculatedOmzet: item.appliedPrice * item.qty,
    calculatedProfit: (item.appliedPrice - item.costPrice) * item.qty,
  }))

export const mockTransactions: Transaction[] = [
  {
    id: '1',
    date: new Date('2026-06-01'),
    bonNumber: 'BON-001',
    customerId: '1',
    ongkir: 200000,
    description: 'Pengiriman pertama',
    isBonus: false,
    status: 'LUNAS',
    paymentDate: new Date('2026-06-05'),
    items: createTransactionItems('1', [
      { productId: '1', qty: 10, appliedPrice: 57600, costPrice: 50000, basePrice: 100000, productName: 'Product LM A', productType: 'LM' },
      { productId: '3', qty: 5, appliedPrice: 83250, costPrice: 60000, basePrice: 110000, productName: 'Product BR A', productType: 'BR' },
    ]),
    createdAt: new Date('2026-06-01'),
  },
  {
    id: '2',
    date: new Date('2026-06-10'),
    bonNumber: 'BON-002',
    customerId: '1',
    ongkir: 150000,
    description: 'Pengiriman kedua',
    isBonus: false,
    status: 'PIUTANG',
    paymentDate: null,
    items: createTransactionItems('2', [
      { productId: '2', qty: 8, appliedPrice: 69120, costPrice: 75000, basePrice: 120000, productName: 'Product LM B', productType: 'LM' },
      { productId: '4', qty: 12, appliedPrice: 61200, costPrice: 40000, basePrice: 80000, productName: 'Product BR B', productType: 'BR' },
    ]),
    createdAt: new Date('2026-06-10'),
  },
  {
    id: '3',
    date: new Date('2026-05-15'),
    bonNumber: 'BON-003',
    customerId: '2',
    ongkir: 300000,
    description: 'Pengiriman Mei',
    isBonus: false,
    status: 'LUNAS',
    paymentDate: new Date('2026-05-20'),
    items: createTransactionItems('3', [
      { productId: '1', qty: 20, appliedPrice: 57600, costPrice: 50000, basePrice: 100000, productName: 'Product LM A', productType: 'LM' },
    ]),
    createdAt: new Date('2026-05-15'),
  },
  {
    id: '4',
    date: new Date('2026-06-12'),
    bonNumber: 'BON-004',
    customerId: '3',
    ongkir: 100000,
    description: 'Pengiriman Juni',
    isBonus: false,
    status: 'PIUTANG',
    paymentDate: null,
    items: createTransactionItems('4', [
      { productId: '3', qty: 15, appliedPrice: 89100, costPrice: 60000, basePrice: 110000, productName: 'Product BR A', productType: 'BR' },
      { productId: '4', qty: 10, appliedPrice: 72000, costPrice: 40000, basePrice: 80000, productName: 'Product BR B', productType: 'BR' },
    ]),
    createdAt: new Date('2026-06-12'),
  },
]
