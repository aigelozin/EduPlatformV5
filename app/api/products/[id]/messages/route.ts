import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { checkAccess } from '@/lib/access/checkAccess'
import { db } from '@/lib/db/client'
import type { ApiResponse } from '@/types'

async function hasProductAccess(userId: string, productId: string, role: string) {
  if (role === 'admin') return true
  if (role === 'teacher') {
    const product = await db.product.findFirst({
      where: { id: productId, creator_id: userId },
      select: { id: true },
    })
    if (product) return true
  }
  const access = await checkAccess(userId, productId)
  return access.hasAccess
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const user = await requireAuth()

    const allowed = await hasProductAccess(user.id, params.id, user.role)
    if (!allowed) {
      return NextResponse.json({ data: null, error: 'Нет доступа' }, { status: 403 })
    }

    const after = req.nextUrl.searchParams.get('after')

    const messages = await db.productMessage.findMany({
      where: {
        product_id: params.id,
        is_deleted: false,
        ...(after && { created_at: { gt: new Date(after) } }),
      },
      include: {
        user: { select: { id: true, name: true, avatar_url: true, role: true } },
      },
      orderBy: { created_at: 'asc' },
      take: 50,
    })

    return NextResponse.json({ data: messages, error: null })
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ data: null, error: 'Необходима авторизация' }, { status: 401 })
    }
    return NextResponse.json({ data: null, error: 'Ошибка сервера' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const user = await requireAuth()

    const allowed = await hasProductAccess(user.id, params.id, user.role)
    if (!allowed) {
      return NextResponse.json({ data: null, error: 'Нет доступа' }, { status: 403 })
    }

    const { body_ru } = (await req.json()) as { body_ru?: string }
    if (!body_ru?.trim()) {
      return NextResponse.json({ data: null, error: 'Сообщение пустое' }, { status: 400 })
    }

    const msg = await db.productMessage.create({
      data: { product_id: params.id, user_id: user.id, body_ru: body_ru.trim() },
      include: {
        user: { select: { id: true, name: true, avatar_url: true, role: true } },
      },
    })

    // Уведомляем участников при ответе преподавателя
    if (user.role === 'teacher') {
      const buyers = await db.purchase.findMany({
        where: { product_id: params.id },
        select: { user_id: true },
        take: 100,
      })
      if (buyers.length > 0) {
        await db.notification.createMany({
          data: buyers.map((b) => ({
            user_id: b.user_id,
            type: 'new_lesson' as const,
            title_ru: 'Новое сообщение от преподавателя',
            body_ru: body_ru.slice(0, 100),
          })),
          skipDuplicates: true,
        })
      }
    }

    return NextResponse.json({ data: msg, error: null }, { status: 201 })
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ data: null, error: 'Необходима авторизация' }, { status: 401 })
    }
    return NextResponse.json({ data: null, error: 'Ошибка сервера' }, { status: 500 })
  }
}
