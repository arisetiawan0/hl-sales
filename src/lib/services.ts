import { Customer, Product, Transaction, TransactionStatus, BonusNotification } from '@/types'

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`API ${res.status}: ${text || res.statusText}`)
  }
  return res.json()
}

// Customer Service
export const customerService = {
  getAll: async (): Promise<Customer[]> => fetchJson('/api/customers'),
  getAllForSelection: async (): Promise<Customer[]> => fetchJson('/api/customers'),
  getById: async (id: string): Promise<Customer | undefined> => {
    try { return await fetchJson(`/api/customers/${id}`) } catch { return undefined }
  },
  create: async (data: Omit<Customer, 'id' | 'createdAt' | 'deletedAt'>): Promise<Customer> =>
    fetchJson('/api/customers', { method: 'POST', body: JSON.stringify(data) }),
  update: async (id: string, data: Partial<Customer>): Promise<Customer | null> => {
    try { return await fetchJson(`/api/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }) } catch { return null }
  },
  softDelete: async (id: string): Promise<boolean> => {
    try { await fetchJson(`/api/customers/${id}`, { method: 'DELETE' }); return true } catch { return false }
  },
}

// Product Service
export const productService = {
  getAll: async (): Promise<Product[]> => fetchJson('/api/products'),
  getAllForSelection: async (): Promise<Product[]> => fetchJson('/api/products'),
  getById: async (id: string): Promise<Product | undefined> => {
    try { return await fetchJson(`/api/products/${id}`) } catch { return undefined }
  },
  create: async (data: Omit<Product, 'id' | 'createdAt' | 'deletedAt'>): Promise<Product> =>
    fetchJson('/api/products', { method: 'POST', body: JSON.stringify(data) }),
  update: async (id: string, data: Partial<Product>): Promise<Product | null> => {
    try { return await fetchJson(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }) } catch { return null }
  },
  softDelete: async (id: string): Promise<boolean> => {
    try { await fetchJson(`/api/products/${id}`, { method: 'DELETE' }); return true } catch { return false }
  },
}

// Notification Service
export const notificationService = {
  getBonusNotifications: async (): Promise<BonusNotification[]> =>
    fetchJson('/api/notifications'),
}

// Transaction Service
export const transactionService = {
  getAll: async (): Promise<Transaction[]> => fetchJson('/api/transactions'),
  getById: async (id: string): Promise<Transaction | undefined> => {
    try { return await fetchJson(`/api/transactions/${id}`) } catch { return undefined }
  },
  getByCustomerId: async (customerId: string): Promise<Transaction[]> =>
    fetchJson(`/api/transactions?customerId=${customerId}`),
  create: async (data: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> =>
    fetchJson('/api/transactions', { method: 'POST', body: JSON.stringify(data) }),
  update: async (id: string, data: Partial<Transaction>): Promise<Transaction | null> => {
    try { return await fetchJson(`/api/transactions/${id}`, { method: 'PUT', body: JSON.stringify(data) }) } catch { return null }
  },
  delete: async (id: string): Promise<boolean> => {
    try { await fetchJson(`/api/transactions/${id}`, { method: 'DELETE' }); return true } catch { return false }
  },
  updateStatus: async (id: string, status: TransactionStatus, paymentDate: Date): Promise<Transaction | null> => {
    try {
      return await fetchJson(`/api/transactions/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status, paymentDate: paymentDate.toISOString() }),
      })
    } catch { return null }
  },
  bulkUpdateStatus: async (ids: string[], status: TransactionStatus, paymentDate: Date): Promise<void> => {
    await fetchJson('/api/transactions/bulk-update', {
      method: 'PUT',
      body: JSON.stringify({ ids, status, paymentDate: paymentDate.toISOString() }),
    })
  },
  checkBonNumberExists: async (bonNumber: string, excludeId?: string): Promise<boolean> => {
    const transactions = await fetchJson<Transaction[]>('/api/transactions')
    return transactions.some(t => t.bonNumber === bonNumber && t.id !== excludeId)
  },
}
