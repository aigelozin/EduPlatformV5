import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db/client'
import type { ApiResponse } from '@/types'
import { z } from 'zod'

const RegisterSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(8, 'Пароль должен быть не менее 8 символов'),
  name: z.string().min(2, 'Имя должно быть не менее 2 символов').max(100),
  consent: z.literal(true, { errorMap: () => ({ message: 'Необходимо согласие с политикой конфиденциальности' }) }),
})

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const body = await req.json()
    const parsed = RegisterSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.errors[0]?.message ?? 'Некорректные данные' },
        { status: 400 }
      )
    }

    const { email, password, name } = parsed.data

    const existing = await db.profile.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { data: null, error: 'Пользователь с таким email уже существует' },
        { status: 409 }
      )
    }

    const password_hash = await bcrypt.hash(password, 12)

    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      null
    const user_agent = req.headers.get('user-agent') ?? null

    const user = await db.profile.create({
      data: {
        email,
        password_hash,
        name,
        role: 'student',
        consent_logs: {
          create: {
            consent_type: 'registration',
            ip_address: ip,
            user_agent,
          },
        },
      },
      select: { id: true, email: true, name: true, role: true },
    })

    return NextResponse.json({ data: user, error: null }, { status: 201 })
  } catch {
    return NextResponse.json({ data: null, error: 'Ошибка сервера' }, { status: 500 })
  }
}
