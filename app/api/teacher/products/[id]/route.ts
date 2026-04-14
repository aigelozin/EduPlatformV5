import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/session'
import { db } from '@/lib/db/client'
import type { ApiResponse } from '@/types'
import { z } from 'zod'

const UpdateProductSchema = z.object({
  title_ru: z.string().min(3).max(200).optional(),
  description_ru: z.string().max(5000).optional(),
  price: z.number().int().min(0).optional(),
  sale_price: z.number().int().min(0).nullable().optional(),
  thumbnail_url: z.string().url().optional(),
  video_source: z.enum(['vk', 'rutube', 'kinescope', 'youtube', 'yos']).optional(),
  video_id: z.string().optional(),
  is_active: z.boolean().optional(),
})

async function getOwnedProduct(productId: string, userId: string, role: string) {
  const product = await db.product.findUnique({ where: { id: productId } })
  if (!product) return null
  // Изоляция данных: teacher видит только свои продукты
  if (role !== 'admin' && product.creator_id !== userId) return null
  return product
}

// PATCH /api/teacher/products/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const user = await requireRole('teacher', 'admin')
    const product = await getOwnedProduct(params.id, user.id, user.role)

    if (!product) {
      return NextResponse.json({ data: null, error: 'Продукт не найден' }, { status: 404 })
    }

    const body = await req.json()
    const parsed = UpdateProductSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.errors[0]?.message ?? 'Некорректные данные' },
        { status: 400 }
      )
    }

    const updated = await db.product.update({
      where: { id: params.id },
      data: {
        ...parsed.data,
        // При изменении контента сбрасываем статус модерации
        ...(parsed.data.title_ru || parsed.data.description_ru
          ? { moderation_status: 'pending', is_active: false }
          : {}),
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

// DELETE /api/teacher/products/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const user = await requireRole('teacher', 'admin')
    const product = await getOwnedProduct(params.id, user.id, user.role)

    if (!product) {
      return NextResponse.json({ data: null, error: 'Продукт не найден' }, { status: 404 })
    }

    await db.product.delete({ where: { id: params.id } })
    return NextResponse.json({ data: null, error: null })
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'UNAUTHORIZED') return NextResponse.json({ data: null, error: 'Необходима авторизация' }, { status: 401 })
      if (err.message === 'FORBIDDEN') return NextResponse.json({ data: null, error: 'Доступ запрещён' }, { status: 403 })
    }
    return NextResponse.json({ data: null, error: 'Ошибка сервера' }, { status: 500 })
  }
}
