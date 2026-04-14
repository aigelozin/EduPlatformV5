import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db/client'
import type { ApiResponse } from '@/types'
import { z } from 'zod'

const BecomeTeacherSchema = z.object({
  consent: z.literal(true, { errorMap: () => ({ message: 'Необходимо согласие с условиями для преподавателей' }) }),
  bio_ru: z.string().max(1000).optional(),
})

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const user = await requireAuth()

    if (user.role === 'teacher' || user.role === 'admin') {
      return NextResponse.json(
        { data: null, error: 'У вас уже есть роль преподавателя или администратора' },
        { status: 400 }
      )
    }

    const body = await req.json()
    const parsed = BecomeTeacherSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.errors[0]?.message ?? 'Некорректные данные' },
        { status: 400 }
      )
    }

    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      null
    const user_agent = req.headers.get('user-agent') ?? null

    await db.profile.update({
      where: { id: user.id },
      data: {
        role: 'teacher',
        ...(parsed.data.bio_ru ? { bio_ru: parsed.data.bio_ru } : {}),
        consent_logs: {
          create: {
            consent_type: 'teacher_signup',
            ip_address: ip,
            user_agent,
          },
        },
      },
    })

    return NextResponse.json({ data: { role: 'teacher' }, error: null })
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ data: null, error: 'Необходима авторизация' }, { status: 401 })
    }
    return NextResponse.json({ data: null, error: 'Ошибка сервера' }, { status: 500 })
  }
}
