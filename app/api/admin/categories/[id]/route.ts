import { NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { getSession } from '@/lib/auth/session'
import type { ApiResponse } from '@/types'

type Params = { params: { id: string } }

// ── GET /api/admin/categories/[id] ───────────────────────
export async function GET(_req: Request, { params }: Params): Promise<NextResponse> {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ data: null, error: 'Forbidden' } satisfies ApiResponse<null>, { status: 403 })
  }

  try {
    const category = await db.category.findUnique({
      where: { id: params.id },
      include: {
        parent: { select: { id: true, name_ru: true, slug: true } },
        children: {
          include: { teacher: { select: { id: true, name: true, avatar_url: true } } },
          orderBy: { sort_order: 'asc' },
        },
        teacher: { select: { id: true, name: true, avatar_url: true } },
      },
    })
    if (!category) {
      return NextResponse.json({ data: null, error: 'Не найдено' } satisfies ApiResponse<null>, { status: 404 })
    }
    return NextResponse.json({ data: category, error: null } satisfies ApiResponse<typeof category>)
  } catch {
    return NextResponse.json({ data: null, error: 'Ошибка сервера' } satisfies ApiResponse<null>, { status: 500 })
  }
}

// ── PUT /api/admin/categories/[id] ───────────────────────
export async function PUT(req: Request, { params }: Params): Promise<NextResponse> {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ data: null, error: 'Forbidden' } satisfies ApiResponse<null>, { status: 403 })
  }

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ data: null, error: 'Invalid JSON' } satisfies ApiResponse<null>, { status: 400 })
  }

  // Slug uniqueness check if slug is being changed
  if (typeof body.slug === 'string') {
    const slug = body.slug.trim()
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { data: null, error: 'Slug: только строчные латинские буквы, цифры и дефис' } satisfies ApiResponse<null>,
        { status: 400 },
      )
    }
    const existing = await db.category.findUnique({ where: { slug } }).catch(() => null)
    if (existing && existing.id !== params.id) {
      return NextResponse.json(
        { data: null, error: 'Slug уже занят' } satisfies ApiResponse<null>,
        { status: 409 },
      )
    }
  }

  // Prevent self-parent
  if (body.parent_id === params.id) {
    return NextResponse.json(
      { data: null, error: 'Категория не может быть своим родителем' } satisfies ApiResponse<null>,
      { status: 400 },
    )
  }

  const sub_type = typeof body.sub_type === 'string' && body.sub_type ? body.sub_type : null
  const teacher_id = sub_type === 'teacher' && typeof body.teacher_id === 'string' ? body.teacher_id : null
  const parent_id =
    body.parent_id !== undefined
      ? typeof body.parent_id === 'string' && body.parent_id
        ? body.parent_id
        : null
      : undefined

  const updateData: Record<string, unknown> = {}
  if (typeof body.name_ru === 'string' && body.name_ru.trim()) updateData.name_ru = body.name_ru.trim()
  if (typeof body.slug === 'string') updateData.slug = body.slug.trim()
  if (body.description_ru !== undefined) updateData.description_ru = body.description_ru || null
  if (body.brief_ru !== undefined)
    updateData.brief_ru = typeof body.brief_ru === 'string' ? body.brief_ru.slice(0, 200) || null : null
  if (body.icon_emoji !== undefined)
    updateData.icon_emoji = typeof body.icon_emoji === 'string' ? body.icon_emoji.slice(0, 10) || null : null
  if (body.wave_color !== undefined)
    updateData.wave_color = typeof body.wave_color === 'string' ? body.wave_color.slice(0, 50) || null : null
  if (body.wave_accent !== undefined)
    updateData.wave_accent = typeof body.wave_accent === 'string' ? body.wave_accent.slice(0, 100) || null : null
  if (parent_id !== undefined) updateData.parent_id = parent_id
  if (body.sub_type !== undefined) updateData.sub_type = sub_type
  if (body.teacher_id !== undefined) updateData.teacher_id = teacher_id
  if (typeof body.sort_order === 'number') updateData.sort_order = body.sort_order
  if (typeof body.is_active === 'boolean') updateData.is_active = body.is_active

  try {
    const category = await db.category.update({
      where: { id: params.id },
      data: updateData,
      select: { id: true, slug: true, name_ru: true },
    })
    return NextResponse.json({ data: category, error: null } satisfies ApiResponse<typeof category>)
  } catch {
    return NextResponse.json({ data: null, error: 'Ошибка обновления' } satisfies ApiResponse<null>, { status: 500 })
  }
}

// ── DELETE /api/admin/categories/[id] ────────────────────
export async function DELETE(_req: Request, { params }: Params): Promise<NextResponse> {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ data: null, error: 'Forbidden' } satisfies ApiResponse<null>, { status: 403 })
  }

  try {
    const category = await db.category.findUnique({
      where: { id: params.id },
      include: {
        _count: { select: { children: true, products: true } },
      },
    })

    if (!category) {
      return NextResponse.json({ data: null, error: 'Не найдено' } satisfies ApiResponse<null>, { status: 404 })
    }
    if (category._count.children > 0) {
      return NextResponse.json(
        { data: null, error: 'Нельзя удалить: есть подкатегории' } satisfies ApiResponse<null>,
        { status: 400 },
      )
    }
    if (category._count.products > 0) {
      return NextResponse.json(
        { data: null, error: 'Нельзя удалить: есть продукты в категории' } satisfies ApiResponse<null>,
        { status: 400 },
      )
    }

    await db.category.delete({ where: { id: params.id } })
    return NextResponse.json({ data: 'deleted', error: null } satisfies ApiResponse<string>)
  } catch {
    return NextResponse.json({ data: null, error: 'Ошибка удаления' } satisfies ApiResponse<null>, { status: 500 })
  }
}
