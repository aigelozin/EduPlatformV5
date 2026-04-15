import { NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import type { ApiResponse } from '@/types'

// GET /api/categories — публичный список категорий
export async function GET(): Promise<NextResponse> {
  try {
    const categories = await db.category.findMany({
      select: { id: true, name_ru: true, slug: true },
      orderBy: { name_ru: 'asc' },
    })
    return NextResponse.json({ data: categories, error: null } as ApiResponse<typeof categories>)
  } catch {
    return NextResponse.json(
      { data: null, error: 'Ошибка сервера' } satisfies ApiResponse<null>,
      { status: 500 }
    )
  }
}
