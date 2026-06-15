import { Customer, Product, Transaction } from '@/types'
import { mockCustomers, mockProducts, mockTransactions } from './mock-data'

const KEYS = {
  customers: 'hl-customers',
  products: 'hl-products',
  transactions: 'hl-transactions',
} as const

function reviveCustomer(raw: Customer): Customer {
  return {
    ...raw,
    createdAt: new Date(raw.createdAt),
    deletedAt: raw.deletedAt ? new Date(raw.deletedAt) : null,
  }
}

function reviveProduct(raw: Product): Product {
  return {
    ...raw,
    createdAt: new Date(raw.createdAt),
    deletedAt: raw.deletedAt ? new Date(raw.deletedAt) : null,
  }
}

function reviveTransaction(raw: Transaction): Transaction {
  return {
    ...raw,
    date: new Date(raw.date),
    paymentDate: raw.paymentDate ? new Date(raw.paymentDate) : null,
    createdAt: new Date(raw.createdAt),
  }
}

export function loadCustomers(): Customer[] {
  if (typeof window === 'undefined') return [...mockCustomers]
  try {
    const stored = localStorage.getItem(KEYS.customers)
    if (!stored) return [...mockCustomers]
    return (JSON.parse(stored) as Customer[]).map(reviveCustomer)
  } catch {
    return [...mockCustomers]
  }
}

export function saveCustomers(customers: Customer[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(KEYS.customers, JSON.stringify(customers))
  } catch {
    // storage full or unavailable
  }
}

export function loadProducts(): Product[] {
  if (typeof window === 'undefined') return [...mockProducts]
  try {
    const stored = localStorage.getItem(KEYS.products)
    if (!stored) return [...mockProducts]
    return (JSON.parse(stored) as Product[]).map(reviveProduct)
  } catch {
    return [...mockProducts]
  }
}

export function saveProducts(products: Product[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(KEYS.products, JSON.stringify(products))
  } catch {
    // storage full or unavailable
  }
}

export function loadTransactions(): Transaction[] {
  if (typeof window === 'undefined') return [...mockTransactions]
  try {
    const stored = localStorage.getItem(KEYS.transactions)
    if (!stored) return [...mockTransactions]
    return (JSON.parse(stored) as Transaction[]).map(reviveTransaction)
  } catch {
    return [...mockTransactions]
  }
}

export function saveTransactions(transactions: Transaction[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(KEYS.transactions, JSON.stringify(transactions))
  } catch {
    // storage full or unavailable
  }
}

export function clearAllData(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(KEYS.customers)
  localStorage.removeItem(KEYS.products)
  localStorage.removeItem(KEYS.transactions)
}

export function resetToMockData(): void {
  saveCustomers([...mockCustomers])
  saveProducts([...mockProducts])
  saveTransactions([...mockTransactions])
}
