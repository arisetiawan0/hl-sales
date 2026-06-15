import { NextRequest, NextResponse } from 'next/server'
import { prisma, withRetry } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const where = customerId ? { customerId } : {}
    const transactions = await withRetry(() =>
      prisma.transaction.findMany({
        where,
        include: { items: true, customer: true },
        orderBy: { date: 'desc' },
      })
    )
    return NextResponse.json(transactions)
  } catch (error) {
    console.error('GET /api/transactions error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const transaction = await withRetry(() =>
      prisma.transaction.create({
        data: {
          date: new Date(body.date),
          bonNumber: body.bonNumber,
          customerId: body.customerId,
          ongkir: body.ongkir || 0,
          description: body.description || '',
          isBonus: body.isBonus || false,
          status: body.status || 'PIUTANG',
          paymentDate: body.paymentDate ? new Date(body.paymentDate) : null,
          items: {
            create: body.items?.map((item: {
              productId: string; productName: string; productType: string;
              productCostPrice: number; productBasePrice: number;
              qty: number; appliedPrice: number; calculatedOmzet: number; calculatedProfit: number;
            }) => ({
              productId: item.productId, productName: item.productName, productType: item.productType,
              productCostPrice: item.productCostPrice, productBasePrice: item.productBasePrice,
              qty: item.qty, appliedPrice: item.appliedPrice,
              calculatedOmzet: item.calculatedOmzet, calculatedProfit: item.calculatedProfit,
            })) || [],
          },
        },
        include: { items: true },
      })
    )
    return NextResponse.json(transaction)
  } catch (error) {
    console.error('POST /api/transactions error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
