import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/session'
import { db } from '@/lib/db/client'
import type { PaginatedResponse } from '@/types'
import type { Prisma } from '@prisma/client'

// GET /api/admin/users — список пользователей с фильтрацией
export async function GET(req: NextRequest): Promise<NextResponse<PaginatedResponse<unknown>>> {
  try {
    await requireRole('admin')

    const { searchParams } = req.nextUrl
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const perPage = 20
    const roleParam = searchParams.get('role')
    const q = searchParams.get('q')?.trim()

    const where: Prisma.ProfileWhereInput = {}

    if (roleParam && ['admin', 'teacher', 'subscriber', 'student'].includes(roleParam)) {
      where.role = roleParam as 'admin' | 'teacher' | 'subscriber' | 'student'
    }

    if (q) {
      where.OR = [
        { email: { contains: q, mode: 'insensitive' } },
        { name: { contains: q, mode: 'insensitive' } },
      ]
    }

    const [total, users] = await Promise.all([
      db.profile.count({ where }),
      db.profile.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          is_active: true,
          created_at: true,
          _count: {
            select: { products: true },
          },
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
    ])

    return NextResponse.json({
      data: users,
      error: null,
      meta: {
        total,
        page,
        per_page: perPage,
        total_pages: Math.ceil(total / perPage),
      },
    })
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'UNAUTHORIZED') return NextResponse.json({ data: [], error: 'Необходима авторизация', meta: { total: 0, page: 1, per_page: 20, total_pages: 0 } }, { status: 401 })
      if (err.message === 'FORBIDDEN') return NextResponse.json({ data: [], error: 'Доступ запрещён', meta: { total: 0, page: 1, per_page: 20, total_pages: 0 } }, { status: 403 })
    }
    return NextResponse.json({ data: [], error: 'Ошибка сервера', meta: { total: 0, page: 1, per_page: 20, total_pages: 0 } }, { status: 500 })
  }
}
