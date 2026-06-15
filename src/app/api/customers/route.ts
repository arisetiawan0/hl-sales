import { NextRequest, NextResponse } from 'next/server'
import { prisma, withRetry } from '@/lib/prisma'

export async function GET() {
  try {
    const customers = await withRetry(() =>
      prisma.customer.findMany({
        where: { deletedAt: null },
        include: { discounts: { orderBy: { stepOrder: 'asc' } } },
        orderBy: { createdAt: 'asc' },
      })
    )
    return NextResponse.json(customers)
  } catch (error) {
    console.error('GET /api/customers error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const customer = await withRetry(() =>
      prisma.customer.create({
        data: {
          name: body.name,
          bonusThreshold: body.bonusThreshold || 0,
          discounts: {
            create: body.discounts?.map((d: { type: string; stepOrder: number; percentage: number }) => ({
              type: d.type,
              stepOrder: d.stepOrder,
              percentage: d.percentage,
            })) || [],
          },
        },
        include: { discounts: true },
      })
    )
    return NextResponse.json(customer)
  } catch (error) {
    console.error('POST /api/customers error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
