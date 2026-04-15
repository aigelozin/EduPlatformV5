import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/session'
import { db } from '@/lib/db/client'
import type { ApiResponse } from '@/types'
import { z } from 'zod'

const ModerationSchema = z.object({
  moderation_status: z.enum(['approved', 'rejected']),
  rejection_reason: z.string().min(1).max(500).optional(),
})

const EditProductSchema = z.object({
  title_ru: z.string().min(2).max(200).optional(),
  type: z.enum(['lesson', 'course', 'bundle', 'livestream', 'digital_book', 'physical_book', 'souvenir', 'apparel', 'subscription_plan']).optional(),
  price: z.number().int().min(0).optional(),
  sale_price: z.number().int().min(0).nullable().optional(),
  description_ru: z.string().max(5000).nullable().optional(),
  seo_title_ru: z.string().max(200).nullable().optional(),
  seo_description_ru: z.string().max(500).nullable().optional(),
  thumbnail_url: z.string().url().nullable().optional(),
  preview_video_url: z.string().url().nullable().optional(),
  video_source: z.enum(['vk', 'rutube', 'kinescope', 'youtube', 'yos']).nullable().optional(),
  video_id: z.string().nullable().optional(),
  category_id: z.string().nullable().optional(),
  moderation_status: z.enum(['pending', 'approved', 'rejected']).optional(),
  is_active: z.boolean().optional(),
  // Livestream fields
  stream_url: z.string().url().nullable().optional(),
  scheduled_at: z.string().datetime().nullable().optional(),
  ended_at: z.string().datetime().nullable().optional(),
  recording_url: z.string().url().nullable().optional(),
  recording_source: z.enum(['vk', 'rutube', 'kinescope', 'youtube', 'yos']).nullable().optional(),
})

// GET /api/admin/products/[id] — получить продукт для редактирования
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    await requireRole('admin')
    const product = await db.product.findUnique({
      where: { id: params.id },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        category: { select: { id: true, name_ru: true } },
      },
    })
    if (!product) return NextResponse.json({ data: null, error: 'Не найден' }, { status: 404 })

    // Если трансляция — добавляем livestream-данные
    let livestream = null
    if (product.type === 'livestream') {
      livestream = await db.livestream.findUnique({ where: { product_id: params.id } })
    }

    return NextResponse.json({ data: { ...product, livestream }, error: null })
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED')
      return NextResponse.json({ data: null, error: 'Необходима авторизация' }, { status: 401 })
    return NextResponse.json({ data: null, error: 'Ошибка сервера' }, { status: 500 })
  }
}

// PUT /api/admin/products/[id] — полное редактирование продукта
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    await requireRole('admin')

    const body: unknown = await req.json()
    const parsed = EditProductSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.errors[0]?.message ?? 'Некорректные данные' },
        { status: 400 }
      )
    }

    const product = await db.product.findUnique({ where: { id: params.id }, select: { id: true, type: true } })
    if (!product) return NextResponse.json({ data: null, error: 'Продукт не найден' }, { status: 404 })

    const { stream_url, scheduled_at, ended_at, recording_url, recording_source, ...productData } = parsed.data

    const updated = await db.product.update({
      where: { id: params.id },
      data: productData,
      select: { id: true, slug: true, title_ru: true, moderation_status: true, is_active: true, type: true, updated_at: true },
    })

    // Обновляем или создаём Livestream запись
    const isLivestream = (productData.type ?? product.type) === 'livestream'
    if (isLivestream) {
      const livestreamData = {
        stream_url: stream_url ?? null,
        scheduled_at: scheduled_at ? new Date(scheduled_at) : new Date(),
        ended_at: ended_at ? new Date(ended_at) : null,
        recording_url: recording_url ?? null,
        recording_source: recording_source ?? null,
      }
      await db.livestream.upsert({
        where: { product_id: params.id },
        update: livestreamData,
        create: { product_id: params.id, ...livestreamData },
      })
    }

    return NextResponse.json({ data: updated, error: null })
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'UNAUTHORIZED') return NextResponse.json({ data: null, error: 'Необходима авторизация' }, { status: 401 })
      if (err.message === 'FORBIDDEN') return NextResponse.json({ data: null, error: 'Доступ запрещён' }, { status: 403 })
    }
    return NextResponse.json({ data: null, error: 'Ошибка сервера' }, { status: 500 })
  }
}

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
