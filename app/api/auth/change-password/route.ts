import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db/client'
import bcrypt from 'bcryptjs'
import type { ApiResponse } from '@/types'

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<string>>> {
  try {
    const user = await requireAuth()
    const body = (await req.json()) as { password?: string }

    if (!body.password || body.password.length < 8) {
      return NextResponse.json(
        { data: null, error: 'Пароль должен содержать минимум 8 символов' },
        { status: 400 }
      )
    }

    const hash = await bcrypt.hash(body.password, 12)
    await db.profile.update({
      where: { id: user.id },
      data: { password_hash: hash, force_password_change: false },
    })

    return NextResponse.json({ data: 'ok', error: null })
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ data: null, error: 'Необходима авторизация' }, { status: 401 })
    }
    return NextResponse.json({ data: null, error: 'Ошибка сервера' }, { status: 500 })
  }
}
