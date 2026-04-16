import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db/client'
import type { ApiResponse } from '@/types'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const user = await requireAuth()
    const body = (await req.json()) as {
      reply_ru?: string
      is_visible?: boolean
    }

    const review = await db.review.findUnique({
      where: { id: params.id },
      include: { product: { select: { creator_id: true } } },
    })

    if (!review) {
      return NextResponse.json({ data: null, error: 'Отзыв не найден' }, { status: 404 })
    }

    if (user.role === 'admin') {
      // Admin может скрывать и отвечать
      const updated = await db.review.update({
        where: { id: params.id },
        data: {
          ...(body.is_visible !== undefined && { is_visible: body.is_visible }),
          ...(body.reply_ru !== undefined && {
            reply_ru: body.reply_ru,
            replied_at: new Date(),
          }),
        },
      })
      return NextResponse.json({ data: updated, error: null })
    }

    if (user.role === 'teacher' && review.product.creator_id === user.id) {
      // Преподаватель может только отвечать на отзывы своих продуктов
      if (body.reply_ru === undefined) {
        return NextResponse.json({ data: null, error: 'Только ответ доступен преподавателю' }, { status: 403 })
      }
      const updated = await db.review.update({
        where: { id: params.id },
        data: { reply_ru: body.reply_ru, replied_at: new Date() },
      })
      return NextResponse.json({ data: updated, error: null })
    }

    return NextResponse.json({ data: null, error: 'Доступ запрещён' }, { status: 403 })
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ data: null, error: 'Необходима авторизация' }, { status: 401 })
    }
    return NextResponse.json({ data: null, error: 'Ошибка сервера' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<string>>> {
  try {
    const user = await requireAuth()
    if (user.role !== 'admin') {
      return NextResponse.json({ data: null, error: 'Только администратор' }, { status: 403 })
    }
    await db.review.delete({ where: { id: params.id } })
    return NextResponse.json({ data: 'ok', error: null })
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ data: null, error: 'Необходима авторизация' }, { status: 401 })
    }
    return NextResponse.json({ data: null, error: 'Ошибка сервера' }, { status: 500 })
  }
}
