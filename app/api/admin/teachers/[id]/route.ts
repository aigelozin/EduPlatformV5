import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/session'
import { db } from '@/lib/db/client'
import type { ApiResponse } from '@/types'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<string>>> {
  try {
    await requireRole('admin')
    const body = (await req.json()) as {
      is_active?: boolean
      notification_text?: string
    }

    if (body.is_active !== undefined) {
      await db.profile.update({
        where: { id: params.id },
        data: { is_active: body.is_active },
      })
    }

    if (body.notification_text?.trim()) {
      await db.notification.create({
        data: {
          user_id: params.id,
          type: 'system',
          title_ru: 'Сообщение от администратора',
          body_ru: body.notification_text.trim(),
        },
      })
    }

    return NextResponse.json({ data: 'ok', error: null })
  } catch {
    return NextResponse.json({ data: null, error: 'Ошибка сервера' }, { status: 500 })
  }
}
