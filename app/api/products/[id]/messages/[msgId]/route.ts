import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db/client'
import type { ApiResponse } from '@/types'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; msgId: string } }
): Promise<NextResponse<ApiResponse<string>>> {
  try {
    const user = await requireAuth()
    const { is_pinned } = (await req.json()) as { is_pinned?: boolean }

    const msg = await db.productMessage.findUnique({ where: { id: params.msgId } })
    if (!msg || msg.product_id !== params.id) {
      return NextResponse.json({ data: null, error: 'Сообщение не найдено' }, { status: 404 })
    }

    // Только преподаватель продукта или admin может закреплять
    if (user.role === 'admin' || (user.role === 'teacher')) {
      const product = await db.product.findFirst({
        where: { id: params.id, creator_id: user.id },
      })
      if (!product && user.role !== 'admin') {
        return NextResponse.json({ data: null, error: 'Доступ запрещён' }, { status: 403 })
      }
      await db.productMessage.update({
        where: { id: params.msgId },
        data: { is_pinned: is_pinned ?? false },
      })
      return NextResponse.json({ data: 'ok', error: null })
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
  { params }: { params: { id: string; msgId: string } }
): Promise<NextResponse<ApiResponse<string>>> {
  try {
    const user = await requireAuth()

    const msg = await db.productMessage.findUnique({
      where: { id: params.msgId },
      include: { product: { select: { creator_id: true } } },
    })
    if (!msg || msg.product_id !== params.id) {
      return NextResponse.json({ data: null, error: 'Сообщение не найдено' }, { status: 404 })
    }

    const isOwner = msg.user_id === user.id
    const isTeacherOfProduct = user.role === 'teacher' && msg.product.creator_id === user.id
    const isAdmin = user.role === 'admin'

    if (!isOwner && !isTeacherOfProduct && !isAdmin) {
      return NextResponse.json({ data: null, error: 'Доступ запрещён' }, { status: 403 })
    }

    await db.productMessage.update({
      where: { id: params.msgId },
      data: { is_deleted: true, deleted_by: user.id },
    })

    return NextResponse.json({ data: 'ok', error: null })
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ data: null, error: 'Необходима авторизация' }, { status: 401 })
    }
    return NextResponse.json({ data: null, error: 'Ошибка сервера' }, { status: 500 })
  }
}
