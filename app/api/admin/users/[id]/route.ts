import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/session'
import { db } from '@/lib/db/client'
import type { ApiResponse } from '@/types'
import { z } from 'zod'

const UpdateUserSchema = z.object({
  role: z.enum(['admin', 'teacher', 'subscriber', 'student']).optional(),
  is_active: z.boolean().optional(),
})

// PATCH /api/admin/users/[id] — изменить роль или заблокировать пользователя
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const admin = await requireRole('admin')

    if (admin.id === params.id) {
      return NextResponse.json(
        { data: null, error: 'Нельзя изменить собственный аккаунт' },
        { status: 400 }
      )
    }

    const body: unknown = await req.json()
    const parsed = UpdateUserSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.errors[0]?.message ?? 'Некорректные данные' },
        { status: 400 }
      )
    }

    const target = await db.profile.findUnique({
      where: { id: params.id },
      select: { id: true, role: true },
    })

    if (!target) {
      return NextResponse.json({ data: null, error: 'Пользователь не найден' }, { status: 404 })
    }

    if (target.role === 'admin') {
      return NextResponse.json(
        { data: null, error: 'Нельзя изменить другого администратора' },
        { status: 403 }
      )
    }

    const updated = await db.profile.update({
      where: { id: params.id },
      data: parsed.data,
      select: {
        id: true,
        email: true,
        role: true,
        is_active: true,
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
