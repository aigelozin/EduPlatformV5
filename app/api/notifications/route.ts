import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db/client'
import type { ApiResponse } from '@/types'
import { z } from 'zod'

const MarkReadSchema = z.union([
  z.object({ ids: z.array(z.string().cuid()).min(1) }),
  z.object({ all: z.literal(true) }),
])

// GET /api/notifications — список уведомлений текущего пользователя
export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const user = await requireAuth()
    const { searchParams } = req.nextUrl
    const unreadOnly = searchParams.get('unread_only') === 'true'

    const notifications = await db.notification.findMany({
      where: {
        user_id: user.id,
        ...(unreadOnly ? { is_read: false } : {}),
      },
      orderBy: { created_at: 'desc' },
      take: 20,
      select: {
        id: true,
        type: true,
        title_ru: true,
        body_ru: true,
        is_read: true,
        data: true,
        created_at: true,
      },
    })

    const unreadCount = await db.notification.count({
      where: { user_id: user.id, is_read: false },
    })

    return NextResponse.json({
      data: notifications,
      error: null,
      meta: { unread_count: unreadCount },
    })
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'UNAUTHORIZED') return NextResponse.json({ data: null, error: 'Необходима авторизация' }, { status: 401 })
      if (err.message === 'FORBIDDEN') return NextResponse.json({ data: null, error: 'Доступ запрещён' }, { status: 403 })
    }
    return NextResponse.json({ data: null, error: 'Ошибка сервера' }, { status: 500 })
  }
}

// PATCH /api/notifications — пометить уведомления как прочитанные
export async function PATCH(req: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const user = await requireAuth()

    const body: unknown = await req.json()
    const parsed = MarkReadSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.errors[0]?.message ?? 'Некорректные данные' },
        { status: 400 }
      )
    }

    let updatedCount: number

    if ('all' in parsed.data) {
      const result = await db.notification.updateMany({
        where: { user_id: user.id, is_read: false },
        data: { is_read: true },
      })
      updatedCount = result.count
    } else {
      const result = await db.notification.updateMany({
        where: {
          user_id: user.id,
          id: { in: parsed.data.ids },
        },
        data: { is_read: true },
      })
      updatedCount = result.count
    }

    return NextResponse.json({ data: { updated: updatedCount }, error: null })
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'UNAUTHORIZED') return NextResponse.json({ data: null, error: 'Необходима авторизация' }, { status: 401 })
      if (err.message === 'FORBIDDEN') return NextResponse.json({ data: null, error: 'Доступ запрещён' }, { status: 403 })
    }
    return NextResponse.json({ data: null, error: 'Ошибка сервера' }, { status: 500 })
  }
}
