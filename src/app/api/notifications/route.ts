import { NextResponse } from 'next/server'
import { prisma, withRetry } from '@/lib/prisma'
import { Transaction } from '@/types'
import {
  calculateAccumulatedPaidOmzet,
  calculateBonusesGranted,
  calculateBonusAvailable,
} from '@/lib/calculations'

export async function GET() {
  try {
    const [customers, transactions] = await withRetry(() =>
      Promise.all([
        prisma.customer.findMany({
          where: { deletedAt: null },
          include: { discounts: { orderBy: { stepOrder: 'asc' } } },
          orderBy: { createdAt: 'asc' },
        }),
        prisma.transaction.findMany({
          include: { items: true },
          orderBy: { date: 'desc' },
        }),
      ])
    )

    const transactionsList = transactions as unknown as Transaction[]

    const notifications = customers
      .map((customer) => {
        const customerTransactions = transactionsList.filter(
          (t) => t.customerId === customer.id
        )
        const accumulated = calculateAccumulatedPaidOmzet(customerTransactions)
        const granted = calculateBonusesGranted(customerTransactions)
        const available = calculateBonusAvailable(
          accumulated,
          customer.bonusThreshold,
          granted
        )

        return {
          customer,
          accumulated,
          granted,
          available,
        }
      })
      .filter((n) => n.available > 0)

    return NextResponse.json(notifications)
  } catch (error) {
    console.error('GET /api/notifications error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
