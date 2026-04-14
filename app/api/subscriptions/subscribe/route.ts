import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db/client'
import type { ApiResponse } from '@/types'
import { z } from 'zod'

const SubscribeSchema = z.object({
  subscription_id: z.string().cuid('Некорректный ID подписки'),
  consent: z.literal(true, { errorMap: () => ({ message: 'Необходимо согласие с условиями' }) }),
})

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const user = await requireAuth()
    const body = await req.json()
    const parsed = SubscribeSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.errors[0]?.message ?? 'Некорректные данные' },
        { status: 400 }
      )
    }

    const { subscription_id } = parsed.data

    const plan = await db.subscription.findUnique({
      where: { id: subscription_id },
    })

    if (!plan || !plan.is_active) {
      return NextResponse.json({ data: null, error: 'План подписки не найден' }, { status: 404 })
    }

    // Проверяем нет ли уже активной подписки этого плана
    const existing = await db.userSubscription.findFirst({
      where: {
        user_id: user.id,
        subscription_id,
        is_active: true,
        expires_at: { gt: new Date() },
      },
    })

    if (existing) {
      return NextResponse.json(
        { data: null, error: 'У вас уже есть активная подписка этого типа' },
        { status: 409 }
      )
    }

    const expires_at = new Date()
    expires_at.setDate(expires_at.getDate() + plan.duration_days)

    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      null
    const user_agent = req.headers.get('user-agent') ?? null

    const [userSubscription] = await db.$transaction([
      db.userSubscription.create({
        data: {
          user_id: user.id,
          subscription_id,
          expires_at,
          is_active: true,
        },
        select: { id: true, subscription_id: true, expires_at: true },
      }),
      db.consentLog.create({
        data: {
          user_id: user.id,
          consent_type: 'checkout',
          ip_address: ip,
          user_agent,
        },
      }),
    ])

    return NextResponse.json(
      { data: { subscription_id: userSubscription.subscription_id, expires_at: userSubscription.expires_at }, error: null },
      { status: 201 }
    )
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ data: null, error: 'Необходима авторизация' }, { status: 401 })
    }
    return NextResponse.json({ data: null, error: 'Ошибка сервера' }, { status: 500 })
  }
}
