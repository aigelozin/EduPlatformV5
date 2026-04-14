import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import type { PaginatedResponse, ProductCard } from '@/types'

export async function GET(req: NextRequest): Promise<NextResponse<PaginatedResponse<ProductCard>>> {
  const { searchParams } = req.nextUrl
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const perPage = Math.min(24, parseInt(searchParams.get('per_page') ?? '12', 10))
  const category = searchParams.get('category')
  const type = searchParams.get('type')
  const q = searchParams.get('q')

  const where = {
    is_active: true,
    moderation_status: 'approved' as const,
    ...(category && { category: { slug: category } }),
    ...(type && { type: type as never }),
    ...(q && {
      OR: [
        { title_ru: { contains: q, mode: 'insensitive' as const } },
        { description_ru: { contains: q, mode: 'insensitive' as const } },
      ],
    }),
  }

  const [total, products] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      select: {
        id: true,
        slug: true,
        type: true,
        title_ru: true,
        price: true,
        sale_price: true,
        thumbnail_url: true,
        category: { select: { name_ru: true, slug: true } },
        _count: { select: { reviews: true, purchases: true } },
      },
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ])

  return NextResponse.json({
    data: products,
    error: null,
    meta: {
      total,
      page,
      per_page: perPage,
      total_pages: Math.ceil(total / perPage),
    },
  })
}
