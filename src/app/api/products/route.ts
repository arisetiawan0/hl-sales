import { NextRequest, NextResponse } from 'next/server'
import { prisma, withRetry } from '@/lib/prisma'

export async function GET() {
  try {
    const products = await withRetry(() =>
      prisma.product.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'asc' },
      })
    )
    return NextResponse.json(products)
  } catch (error) {
    console.error('GET /api/products error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const product = await withRetry(() =>
      prisma.product.create({
        data: { name: body.name, costPrice: body.costPrice, basePrice: body.basePrice, type: body.type },
      })
    )
    return NextResponse.json(product)
  } catch (error) {
    console.error('POST /api/products error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
