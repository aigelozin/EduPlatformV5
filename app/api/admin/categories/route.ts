import { NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { getSession } from '@/lib/auth/session'
import type { ApiResponse } from '@/types'

// ── GET /api/admin/categories ─────────────────────────────
export async function GET(): Promise<NextResponse> {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ data: null, error: 'Forbidden' } satisfies ApiResponse<null>, { status: 403 })
  }

  try {
    const categories = await db.category.findMany({
      include: {
        children: {
          include: { teacher: { select: { id: true, name: true, avatar_url: true } } },
          orderBy: { sort_order: 'asc' },
        },
        teacher: { select: { id: true, name: true, avatar_url: true } },
        _count: { select: { products: true } },
      },
      orderBy: [{ sort_order: 'asc' }, { name_ru: 'asc' }],
    })
    return NextResponse.json({ data: categories, error: null } satisfies ApiResponse<typeof categories>)
  } catch {
    return NextResponse.json({ data: null, error: 'Ошибка сервера' } satisfies ApiResponse<null>, { status: 500 })
  }
}

// ── POST /api/admin/categories ────────────────────────────
export async function POST(req: Request): Promise<NextResponse> {
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

  const name_ru = typeof body.name_ru === 'string' ? body.name_ru.trim() : ''
  const slug = typeof body.slug === 'string' ? body.slug.trim() : ''

  if (!name_ru || !slug) {
    return NextResponse.json(
      { data: null, error: 'Название и slug обязательны' } satisfies ApiResponse<null>,
      { status: 400 },
    )
  }
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json(
      { data: null, error: 'Slug: только строчные латинские буквы, цифры и дефис' } satisfies ApiResponse<null>,
      { status: 400 },
    )
  }

  const existing = await db.category.findUnique({ where: { slug } }).catch(() => null)
  if (existing) {
    return NextResponse.json(
      { data: null, error: 'Slug уже занят' } satisfies ApiResponse<null>,
      { status: 409 },
    )
  }

  const sub_type = typeof body.sub_type === 'string' && body.sub_type ? body.sub_type : null
  const teacher_id = sub_type === 'teacher' && typeof body.teacher_id === 'string' ? body.teacher_id : null
  const parent_id = typeof body.parent_id === 'string' && body.parent_id ? body.parent_id : null

  try {
    const category = await db.category.create({
      data: {
        slug,
        name_ru,
        name_en: typeof body.name_en === 'string' ? body.name_en || null : null,
        description_ru: typeof body.description_ru === 'string' ? body.description_ru || null : null,
        brief_ru: typeof body.brief_ru === 'string' ? body.brief_ru.slice(0, 200) || null : null,
        icon_emoji: typeof body.icon_emoji === 'string' ? body.icon_emoji.slice(0, 10) || null : null,
        wave_color: typeof body.wave_color === 'string' ? body.wave_color.slice(0, 50) || null : null,
        wave_accent: typeof body.wave_accent === 'string' ? body.wave_accent.slice(0, 100) || null : null,
        parent_id,
        sub_type,
        teacher_id,
        sort_order: typeof body.sort_order === 'number' ? body.sort_order : 0,
        is_active: body.is_active !== false,
      },
      select: { id: true, slug: true, name_ru: true },
    })
    return NextResponse.json({ data: category, error: null } satisfies ApiResponse<typeof category>, { status: 201 })
  } catch {
    return NextResponse.json({ data: null, error: 'Ошибка создания' } satisfies ApiResponse<null>, { status: 500 })
  }
}
