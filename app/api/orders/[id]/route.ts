import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db/client'
import type { ApiResponse } from '@/types'

// ─── GET /api/orders/[id] — получить заказ по ID ─────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const user = await requireAuth()
    const { id } = params

    const order = await db.order.findUnique({
      where: { id },
      include: {
        items: {
          select: {
            id: true,
            quantity: true,
            price: true,
            variant_id: true,
            product: {
              select: {
                id: true,
                title_ru: true,
                type: true,
                thumbnail_url: true,
              },
            },
          },
        },
        payments: {
          select: {
            id: true,
            provider: true,
            status: true,
            amount: true,
            provider_payment_id: true,
            created_at: true,
            updated_at: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json(
        { data: null, error: 'Заказ не найден' },
        { status: 404 }
      )
    }

    // Проверяем доступ: владелец заказа или администратор
    if (order.user_id !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { data: null, error: 'Доступ запрещён' },
        { status: 403 }
      )
    }

    return NextResponse.json({ data: order, error: null })
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'UNAUTHORIZED') return NextResponse.json({ data: null, error: 'Необходима авторизация' }, { status: 401 })
      if (err.message === 'FORBIDDEN') return NextResponse.json({ data: null, error: 'Доступ запрещён' }, { status: 403 })
    }
    return NextResponse.json({ data: null, error: 'Ошибка сервера' }, { status: 500 })
  }
}
