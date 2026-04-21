import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import type { ApiResponse } from '@/types'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const { id } = params
    const product = await db.product.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
        is_active: true,
        moderation_status: 'approved',
      },
      include: {
        category: { select: { id: true, name_ru: true, slug: true } },
        creator: { select: { id: true, name: true, avatar_url: true, bio_ru: true } },
        lessons: {
          select: { id: true, title_ru: true, duration_sec: true, sort_order: true, is_free: true },
          orderBy: { sort_order: 'asc' },
        },
        _count: { select: { reviews: true, purchases: true } },
      },
    })

    if (!product) return NextResponse.json({ data: null, error: 'Продукт не найден' }, { status: 404 })
    return NextResponse.json({ data: product, error: null })
  } catch {
    return NextResponse.json({ data: null, error: 'Ошибка сервера' }, { status: 500 })
  }
}
