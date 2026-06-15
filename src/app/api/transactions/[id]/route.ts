import { NextRequest, NextResponse } from 'next/server'
import { prisma, withRetry } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const transaction = await withRetry(() =>
      prisma.transaction.findUnique({
        where: { id },
        include: { items: true, customer: true },
      })
    )
    if (!transaction) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(transaction)
  } catch (error) {
    console.error('GET /api/transactions/[id] error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    if (body.items) {
      await withRetry(() => prisma.transactionItem.deleteMany({ where: { transactionId: id } }))
    }
    const transaction = await withRetry(() =>
      prisma.transaction.update({
        where: { id },
        data: {
          date: body.date ? new Date(body.date) : undefined,
          bonNumber: body.bonNumber,
          customerId: body.customerId,
          ongkir: body.ongkir,
          description: body.description,
          isBonus: body.isBonus,
          status: body.status,
          paymentDate: body.paymentDate ? new Date(body.paymentDate) : null,
          items: body.items ? {
            create: body.items.map((item: {
              productId: string; productName: string; productType: string;
              productCostPrice: number; productBasePrice: number;
              qty: number; appliedPrice: number; calculatedOmzet: number; calculatedProfit: number;
            }) => ({
              productId: item.productId, productName: item.productName, productType: item.productType,
              productCostPrice: item.productCostPrice, productBasePrice: item.productBasePrice,
              qty: item.qty, appliedPrice: item.appliedPrice,
              calculatedOmzet: item.calculatedOmzet, calculatedProfit: item.calculatedProfit,
            })),
          } : undefined,
        },
        include: { items: true },
      })
    )
    return NextResponse.json(transaction)
  } catch (error) {
    console.error('PUT /api/transactions/[id] error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await withRetry(() => prisma.transaction.delete({ where: { id } }))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/transactions/[id] error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
