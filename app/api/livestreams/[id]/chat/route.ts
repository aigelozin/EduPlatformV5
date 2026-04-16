import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db/client'
import { broadcast } from '@/lib/sse/livestream-broadcaster'
import type { ApiResponse } from '@/types'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const user = await requireAuth()
    const { body_ru } = (await req.json()) as { body_ru?: string }

    if (!body_ru?.trim()) {
      return NextResponse.json({ data: null, error: 'Пустое сообщение' }, { status: 400 })
    }

    const msg = await db.livestreamMessage.create({
      data: { livestream_id: params.id, user_id: user.id, body_ru: body_ru.trim() },
      include: {
        user: { select: { id: true, name: true, avatar_url: true, role: true } },
      },
    })

    broadcast(params.id, { type: 'message', payload: msg })

    return NextResponse.json({ data: msg, error: null }, { status: 201 })
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ data: null, error: 'Необходима авторизация' }, { status: 401 })
    }
    return NextResponse.json({ data: null, error: 'Ошибка сервера' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<string>>> {
  try {
    const user = await requireAuth()

    if (!['teacher', 'admin'].includes(user.role)) {
      return NextResponse.json({ data: null, error: 'Доступ запрещён' }, { status: 403 })
    }

    const { messageId } = (await req.json()) as { messageId?: string }
    if (!messageId) {
      return NextResponse.json({ data: null, error: 'messageId обязателен' }, { status: 400 })
    }

    await db.livestreamMessage.update({
      where: { id: messageId },
      data: { is_deleted: true, deleted_by: user.id },
    })

    broadcast(params.id, { type: 'message_deleted', payload: { id: messageId } })

    return NextResponse.json({ data: 'ok', error: null })
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ data: null, error: 'Необходима авторизация' }, { status: 401 })
    }
    return NextResponse.json({ data: null, error: 'Ошибка сервера' }, { status: 500 })
  }
}
