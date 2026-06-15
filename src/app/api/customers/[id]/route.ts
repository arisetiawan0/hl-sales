import { NextRequest, NextResponse } from 'next/server'
import { prisma, withRetry } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const customer = await withRetry(() =>
      prisma.customer.findUnique({
        where: { id },
        include: { discounts: { orderBy: { stepOrder: 'asc' } } },
      })
    )
    if (!customer) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json(customer)
  } catch (error) {
    console.error('GET /api/customers/[id] error:', error)
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
    await withRetry(() => prisma.customerDiscount.deleteMany({ where: { customerId: id } }))
    const customer = await withRetry(() =>
      prisma.customer.update({
        where: { id },
        data: {
          name: body.name,
          bonusThreshold: body.bonusThreshold,
          discounts: {
            create: body.discounts?.map((d: { type: string; stepOrder: number; percentage: number }) => ({
              type: d.type, stepOrder: d.stepOrder, percentage: d.percentage,
            })) || [],
          },
        },
        include: { discounts: true },
      })
    )
    return NextResponse.json(customer)
  } catch (error) {
    console.error('PUT /api/customers/[id] error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await withRetry(() =>
      prisma.customer.update({
        where: { id },
        data: { deletedAt: new Date() },
      })
    )
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/customers/[id] error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
