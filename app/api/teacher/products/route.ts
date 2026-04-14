import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/session'
import { db } from '@/lib/db/client'
import type { ApiResponse, PaginatedResponse } from '@/types'
import { z } from 'zod'

const CreateProductSchema = z.object({
  slug: z.string().min(3).max(100),
  type: z.enum(['lesson', 'course', 'bundle', 'livestream', 'digital_book', 'physical_book', 'souvenir', 'apparel', 'subscription_plan']),
  title_ru: z.string().min(3).max(200),
  description_ru: z.string().max(5000).optional(),
  price: z.number().int().min(0),
  sale_price: z.number().int().min(0).optional(),
  category_id: z.string().cuid().optional(),
  thumbnail_url: z.string().url().optional(),
})

// GET /api/teacher/products — список продуктов преподавателя (ТОЛЬКО СВОИ)
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const user = await requireRole('teacher', 'admin')
    const { searchParams } = req.nextUrl
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const perPage = 20

    const where = {
      // Критическая изоляция: только продукты этого преподавателя
      creator_id: user.role === 'admin' ? undefined : user.id,
    }

    const [total, products] = await Promise.all([
      db.product.count({ where }),
      db.product.findMany({
        where,
        include: {
          category: { select: { name_ru: true, slug: true } },
          _count: { select: { purchases: true, reviews: true, lessons: true } },
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
    ])

    return NextResponse.json({
      data: products,
      error: null,
      meta: { total, page, per_page: perPage, total_pages: Math.ceil(total / perPage) },
    } satisfies PaginatedResponse<unknown>)
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'UNAUTHORIZED') return NextResponse.json({ data: null, error: 'Необходима авторизация' }, { status: 401 })
      if (err.message === 'FORBIDDEN') return NextResponse.json({ data: null, error: 'Доступ запрещён' }, { status: 403 })
    }
    return NextResponse.json({ data: null, error: 'Ошибка сервера' }, { status: 500 })
  }
}

// POST /api/teacher/products — создать продукт
export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const user = await requireRole('teacher', 'admin')
    const body = await req.json()
    const parsed = CreateProductSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.errors[0]?.message ?? 'Некорректные данные' },
        { status: 400 }
      )
    }

    const product = await db.product.create({
      data: {
        ...parsed.data,
        creator_id: user.id,  // всегда текущий пользователь
        moderation_status: 'pending',
        is_active: false,
      },
    })

    return NextResponse.json({ data: product, error: null }, { status: 201 })
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'UNAUTHORIZED') return NextResponse.json({ data: null, error: 'Необходима авторизация' }, { status: 401 })
      if (err.message === 'FORBIDDEN') return NextResponse.json({ data: null, error: 'Доступ запрещён' }, { status: 403 })
    }
    return NextResponse.json({ data: null, error: 'Ошибка сервера' }, { status: 500 })
  }
}
