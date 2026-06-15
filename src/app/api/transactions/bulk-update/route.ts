import { NextRequest, NextResponse } from 'next/server'
import { prisma, withRetry } from '@/lib/prisma'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { ids, status, paymentDate } = body
    await withRetry(() =>
      prisma.transaction.updateMany({
        where: { id: { in: ids } },
        data: { status, paymentDate: paymentDate ? new Date(paymentDate) : new Date() },
      })
    )
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('PUT /api/transactions/bulk-update error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
