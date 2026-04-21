import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import type { ApiResponse } from '@/types'

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const limit = Math.min(50, parseInt(searchParams.get('limit') ?? '12', 10))
    const category = searchParams.get('category') ?? undefined
    const q = searchParams.get('q') ?? undefined

    const where = {
      is_active: true,
      moderation_status: 'approved' as const,
      ...(category && { category: { slug: category } }),
      ...(q && { title_ru: { contains: q } }),
    }

    const [total, products] = await Promise.all([
      db.product.count({ where }),
      db.product.findMany({
        where,
        select: {
          id: true, slug: true, type: true, title_ru: true,
          price: true, sale_price: true, thumbnail_url: true,
          category: { select: { name_ru: true, slug: true } },
          creator: { select: { name: true } },
          _count: { select: { reviews: true, purchases: true } },
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    return NextResponse.json({ data: products, meta: { total, page, limit }, error: null })
  } catch {
    return NextResponse.json({ data: null, error: 'Ошибка сервера' }, { status: 500 })
  }
}
