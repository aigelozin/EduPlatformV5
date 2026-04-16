import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { checkAccess } from '@/lib/access/checkAccess'
import { db } from '@/lib/db/client'
import { z } from 'zod'
import type { ApiResponse } from '@/types'

const ReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  text_ru: z.string().max(2000).optional(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const reviews = await db.review.findMany({
      where: { product_id: params.id, is_visible: true },
      include: { user: { select: { id: true, name: true, avatar_url: true } } },
      orderBy: { created_at: 'desc' },
      take: 50,
    })
    return NextResponse.json({ data: reviews, error: null })
  } catch {
    return NextResponse.json({ data: [], error: null })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const user = await requireAuth()

    const access = await checkAccess(user.id, params.id)
    if (!access.hasAccess) {
      return NextResponse.json(
        { data: null, error: 'Только покупатели могут оставлять отзывы' },
        { status: 403 }
      )
    }

    const body: unknown = await req.json()
    const parsed = ReviewSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.errors[0]?.message ?? 'Некорректные данные' },
        { status: 400 }
      )
    }

    // Проверяем, нет ли уже отзыва от этого пользователя (уникальный constraint)
    const existing = await db.review.findUnique({
      where: { user_id_product_id: { user_id: user.id, product_id: params.id } },
    })
    if (existing) {
      return NextResponse.json(
        { data: null, error: 'Вы уже оставили отзыв на этот продукт' },
        { status: 409 }
      )
    }

    const review = await db.review.create({
      data: {
        user_id: user.id,
        product_id: params.id,
        rating: parsed.data.rating,
        text_ru: parsed.data.text_ru,
      },
      include: { user: { select: { id: true, name: true, avatar_url: true } } },
    })

    // Уведомляем преподавателя о новом отзыве
    const product = await db.product.findUnique({
      where: { id: params.id },
      select: { creator_id: true, title_ru: true },
    })
    if (product) {
      await db.notification.create({
        data: {
          user_id: product.creator_id,
          type: 'system',
          title_ru: 'Новый отзыв',
          body_ru: `Новый отзыв на «${product.title_ru}» — ${parsed.data.rating} ★`,
        },
      })
    }

    return NextResponse.json({ data: review, error: null }, { status: 201 })
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ data: null, error: 'Необходима авторизация' }, { status: 401 })
    }
    return NextResponse.json({ data: null, error: 'Ошибка сервера' }, { status: 500 })
  }
}
