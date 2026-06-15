export type ProductType = 'LM' | 'BR'
export type TransactionStatus = 'PIUTANG' | 'LUNAS'

export interface Customer {
  id: string
  name: string
  bonusThreshold: number
  discounts: CustomerDiscount[]
  createdAt: Date
  deletedAt: Date | null
}

export interface CustomerDiscount {
  id: string
  customerId: string
  type: ProductType
  stepOrder: number
  percentage: number
}

export interface Product {
  id: string
  name: string
  costPrice: number
  basePrice: number
  type: ProductType
  createdAt: Date
  deletedAt: Date | null
}

export interface Transaction {
  id: string
  date: Date
  bonNumber: string
  customerId: string
  customer?: Customer
  ongkir: number
  description: string
  isBonus: boolean
  status: TransactionStatus
  paymentDate: Date | null
  items: TransactionItem[]
  createdAt: Date
}

export interface TransactionItem {
  id: string
  transactionId: string
  productId: string
  product?: Product
  productName: string
  productType: ProductType
  productCostPrice: number
  productBasePrice: number
  qty: number
  appliedPrice: number
  calculatedOmzet: number
  calculatedProfit: number
}

export interface TransactionWithCalculations extends Transaction {
  totalOmzet: number
  totalTagihan: number
  totalProfit: number
}

export interface CustomerMonthlyStats {
  month: string
  year: number
  transactions: Transaction[]
  totalPiutang: number
  totalPaid: number
  totalOmzetLM: number
  totalOmzetBR: number
  totalOmzet: number
  totalProfit: number
}

export interface RecapData {
  customerId?: string
  customerName?: string
  type?: ProductType
  totalOmzetLM: number
  totalOmzetBR: number
  totalOmzet: number
  totalProfit: number
  totalPiutang: number
  totalPaid: number
}

export interface DashboardStats {
  totalCustomers: number
  totalPiutang: number
  totalOmzetBulanIni: number
  totalProfitBulanIni: number
  recentTransactions: Transaction[]
}

export interface BonusNotification {
  customer: Customer
  accumulated: number
  granted: number
  available: number
}
