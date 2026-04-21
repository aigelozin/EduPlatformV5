import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/session'
import { db } from '@/lib/db/client'
import type { ApiResponse } from '@/types'
import { z } from 'zod'

const CreateProductSchema = z.object({
  title_ru: z.string().min(2).max(200),
  type: z.enum(['lesson', 'course', 'bundle', 'livestream', 'digital_book', 'physical_book', 'souvenir', 'apparel', 'subscription_plan']),
  price: z.number().int().min(0),
  sale_price: z.number().int().min(0).optional().nullable(),
  description_ru: z.string().max(5000).optional().nullable(),
  seo_title_ru: z.string().max(200).optional().nullable(),
  seo_description_ru: z.string().max(500).optional().nullable(),
  thumbnail_url: z.string().url().optional().nullable(),
  preview_video_url: z.string().url().optional().nullable(),
  video_source: z.enum(['vk', 'rutube', 'kinescope', 'youtube', 'yos']).optional().nullable(),
  video_id: z.string().optional().nullable(),
  category_id: z.string().optional().nullable(),
  creator_id: z.string().optional().nullable(),
  moderation_status: z.enum(['pending', 'approved', 'rejected']).default('approved'),
  is_active: z.boolean().default(true),
  // Livestream fields (only when type === 'livestream')
  stream_url: z.string().url().optional().nullable(),
  scheduled_at: z.string().datetime().optional().nullable(),
  recording_url: z.string().url().optional().nullable(),
  recording_source: z.enum(['vk', 'rutube', 'kinescope', 'youtube', 'yos']).optional().nullable(),
})

// GET /api/admin/products — список всех продуктов для модерации
export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    await requireRole('admin')
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const perPage = 20
    const status = searchParams.get('status') // pending | approved | rejected | null=all

    const where = status ? { moderation_status: status as 'pending' | 'approved' | 'rejected' } : {}
    const [total, products] = await Promise.all([
      db.product.count({ where }),
      db.product.findMany({
        where,
        select: {
          id: true, slug: true, title_ru: true, type: true,
          moderation_status: true, is_active: true, price: true,
          created_at: true,
          creator: { select: { id: true, name: true, email: true } },
          category: { select: { id: true, name_ru: true } },
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
    ])
    return NextResponse.json({ data: { products, total, page, perPage }, error: null })
  } catch (e: unknown) {
    const msg = (e as Error)?.message ?? ''
    if (msg === 'UNAUTHORIZED') return NextResponse.json({ data: null, error: 'Требуется авторизация' }, { status: 401 })
    if (msg === 'FORBIDDEN') return NextResponse.json({ data: null, error: 'Нет доступа' }, { status: 403 })
    return NextResponse.json({ data: null, error: 'Ошибка сервера' }, { status: 500 })
  }
}

// POST /api/admin/products — создать продукт (от имени любого преподавателя или от admin)
export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const admin = await requireRole('admin')

    const body: unknown = await req.json()
    const parsed = CreateProductSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.errors[0]?.message ?? 'Некорректные данные' },
        { status: 400 }
      )
    }

    const { creator_id, stream_url, scheduled_at, recording_url, recording_source, ...rest } = parsed.data

    // Генерируем slug из названия
    const baseSlug = rest.title_ru
      .toLowerCase()
      .replace(/[^a-zа-яё0-9\s-]/gi, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 80)

    const uniqueSuffix = Date.now().toString(36)
    const slug = `${baseSlug}-${uniqueSuffix}`

    const product = await db.product.create({
      data: {
        ...rest,
        slug,
        creator_id: creator_id ?? admin.id,
      },
      select: { id: true, slug: true, title_ru: true, moderation_status: true },
    })

    // Если тип livestream — создаём запись в Livestream
    if (rest.type === 'livestream' && scheduled_at) {
      await db.livestream.create({
        data: {
          product_id: product.id,
          stream_url: stream_url ?? null,
          scheduled_at: new Date(scheduled_at),
          recording_url: recording_url ?? null,
          recording_source: recording_source ?? null,
        },
      })
    }

    return NextResponse.json({ data: product, error: null }, { status: 201 })
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'UNAUTHORIZED') return NextResponse.json({ data: null, error: 'Необходима авторизация' }, { status: 401 })
      if (err.message === 'FORBIDDEN') return NextResponse.json({ data: null, error: 'Доступ запрещён' }, { status: 403 })
    }
    return NextResponse.json({ data: null, error: 'Ошибка сервера' }, { status: 500 })
  }
}
