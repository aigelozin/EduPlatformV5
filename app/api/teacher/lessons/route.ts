import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/session'
import { db } from '@/lib/db/client'
import type { ApiResponse, PaginatedResponse } from '@/types'
import { z } from 'zod'

const CreateLessonSchema = z.object({
  product_id: z.string().cuid('Некорректный ID продукта'),
  title_ru: z.string().min(2, 'Название должно быть не менее 2 символов').max(200),
  description_ru: z.string().max(2000).optional(),
  video_source: z.enum(['vk', 'rutube', 'kinescope', 'youtube', 'yos']).optional(),
  video_id: z.string().max(500).optional(),
  yos_key: z.string().max(500).optional(),
  duration_sec: z.number().int().min(0).optional(),
  sort_order: z.number().int().min(0).default(0),
  is_free: z.boolean().default(false),
})

async function getOwnedProduct(productId: string, userId: string, role: string) {
  const product = await db.product.findUnique({ where: { id: productId } })
  if (!product) return null
  if (role !== 'admin' && product.creator_id !== userId) return null
  return product
}

// GET /api/teacher/lessons?product_id=xxx
export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const user = await requireRole('teacher', 'admin')
    const productId = req.nextUrl.searchParams.get('product_id')

    if (!productId) {
      return NextResponse.json({ data: null, error: 'Необходим параметр product_id' }, { status: 400 })
    }

    const product = await getOwnedProduct(productId, user.id, user.role)
    if (!product) {
      return NextResponse.json({ data: null, error: 'Продукт не найден' }, { status: 404 })
    }

    const lessons = await db.lesson.findMany({
      where: { product_id: productId },
      orderBy: { sort_order: 'asc' },
    })

    return NextResponse.json({
      data: lessons,
      error: null,
      meta: { total: lessons.length },
    } satisfies PaginatedResponse<unknown>)
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'UNAUTHORIZED') return NextResponse.json({ data: null, error: 'Необходима авторизация' }, { status: 401 })
      if (err.message === 'FORBIDDEN') return NextResponse.json({ data: null, error: 'Доступ запрещён' }, { status: 403 })
    }
    return NextResponse.json({ data: null, error: 'Ошибка сервера' }, { status: 500 })
  }
}

// POST /api/teacher/lessons
export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const user = await requireRole('teacher', 'admin')
    const body = await req.json()
    const parsed = CreateLessonSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.errors[0]?.message ?? 'Некорректные данные' },
        { status: 400 }
      )
    }

    const product = await getOwnedProduct(parsed.data.product_id, user.id, user.role)
    if (!product) {
      return NextResponse.json({ data: null, error: 'Продукт не найден' }, { status: 404 })
    }

    const lesson = await db.lesson.create({
      data: parsed.data,
    })

    return NextResponse.json({ data: lesson, error: null }, { status: 201 })
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'UNAUTHORIZED') return NextResponse.json({ data: null, error: 'Необходима авторизация' }, { status: 401 })
      if (err.message === 'FORBIDDEN') return NextResponse.json({ data: null, error: 'Доступ запрещён' }, { status: 403 })
    }
    return NextResponse.json({ data: null, error: 'Ошибка сервера' }, { status: 500 })
  }
}
