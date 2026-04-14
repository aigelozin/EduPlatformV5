import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db/client'
import type { ApiResponse } from '@/types'

// PATCH /api/notifications/[id] — пометить одно уведомление как прочитанное
export async function PATCH(
  _req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const user = await requireAuth()

    const notification = await db.notification.findUnique({
      where: { id: params.id },
      select: { id: true, user_id: true, is_read: true },
    })

    if (!notification) {
      return NextResponse.json({ data: null, error: 'Уведомление не найдено' }, { status: 404 })
    }

    if (notification.user_id !== user.id) {
      return NextResponse.json({ data: null, error: 'Доступ запрещён' }, { status: 403 })
    }

    const updated = await db.notification.update({
      where: { id: params.id },
      data: { is_read: true },
      select: {
        id: true,
        type: true,
        title_ru: true,
        body_ru: true,
        is_read: true,
        created_at: true,
      },
    })

    return NextResponse.json({ data: updated, error: null })
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'UNAUTHORIZED') return NextResponse.json({ data: null, error: 'Необходима авторизация' }, { status: 401 })
      if (err.message === 'FORBIDDEN') return NextResponse.json({ data: null, error: 'Доступ запрещён' }, { status: 403 })
    }
    return NextResponse.json({ data: null, error: 'Ошибка сервера' }, { status: 500 })
  }
}
