import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/session'
import { db } from '@/lib/db/client'
import type { ApiResponse } from '@/types'
import { z } from 'zod'

const ModerationSchema = z.object({
  moderation_status: z.enum(['approved', 'rejected']),
  rejection_reason: z.string().min(1).max(500).optional(),
})

// PATCH /api/admin/products/[id] — обновить статус модерации
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    await requireRole('admin')

    const body: unknown = await req.json()
    const parsed = ModerationSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.errors[0]?.message ?? 'Некорректные данные' },
        { status: 400 }
      )
    }

    const { moderation_status, rejection_reason } = parsed.data

    if (moderation_status === 'rejected' && !rejection_reason) {
      return NextResponse.json(
        { data: null, error: 'Необходима причина отклонения' },
        { status: 400 }
      )
    }

    const product = await db.product.findUnique({
      where: { id: params.id },
      select: { id: true, title_ru: true, creator_id: true },
    })

    if (!product) {
      return NextResponse.json({ data: null, error: 'Продукт не найден' }, { status: 404 })
    }

    const isApproved = moderation_status === 'approved'

    const updated = await db.product.update({
      where: { id: params.id },
      data: {
        moderation_status,
        is_active: isApproved,
      },
      select: {
        id: true,
        slug: true,
        title_ru: true,
        moderation_status: true,
        is_active: true,
        creator_id: true,
        type: true,
        price: true,
        created_at: true,
        updated_at: true,
      },
    })

    const notificationBody = isApproved
      ? `Ваш продукт "${product.title_ru}" одобрен и теперь виден в каталоге.`
      : `Продукт "${product.title_ru}" отклонён. Причина: ${rejection_reason ?? ''}`

    await db.notification.create({
      data: {
        user_id: product.creator_id,
        type: 'system',
        title_ru: isApproved ? 'Продукт одобрен' : 'Продукт отклонён',
        body_ru: notificationBody,
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
