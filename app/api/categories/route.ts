import { NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import type { ApiResponse } from '@/types'

// GET /api/categories — публичный список категорий верхнего уровня с подкатегориями
export async function GET(): Promise<NextResponse> {
  try {
    const categories = await db.category.findMany({
      where: { is_active: true, parent_id: null },
      select: {
        id: true,
        name_ru: true,
        slug: true,
        brief_ru: true,
        wave_color: true,
        wave_accent: true,
        icon_emoji: true,
        children: {
          where: { is_active: true },
          select: {
            id: true,
            name_ru: true,
            slug: true,
            sub_type: true,
            teacher: { select: { name: true, avatar_url: true } },
          },
          orderBy: { sort_order: 'asc' },
          take: 6,
        },
      },
      orderBy: { sort_order: 'asc' },
    })
    return NextResponse.json({ data: categories, error: null } satisfies ApiResponse<typeof categories>)
  } catch {
    return NextResponse.json(
      { data: null, error: 'Ошибка сервера' } satisfies ApiResponse<null>,
      { status: 500 },
    )
  }
}
