import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/session'
import { db } from '@/lib/db/client'
import { generateSEO } from '@/lib/ai/seo'
import type { ApiResponse, SeoGenerationResult } from '@/types'

// POST /api/teacher/products/[id]/generate-seo
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<SeoGenerationResult>>> {
  try {
    const user = await requireRole('teacher', 'admin')

    const product = await db.product.findUnique({
      where: { id: params.id },
      include: { category: { select: { name_ru: true } } },
    })

    if (!product) {
      return NextResponse.json({ data: null, error: 'Продукт не найден' }, { status: 404 })
    }

    if (user.role !== 'admin' && product.creator_id !== user.id) {
      return NextResponse.json({ data: null, error: 'Доступ запрещён' }, { status: 403 })
    }

    const seo = await generateSEO({
      title_ru: product.title_ru,
      description_ru: product.description_ru,
      type: product.type,
      category: product.category?.name_ru,
    })

    // Сохраняем в БД
    await db.product.update({
      where: { id: params.id },
      data: {
        seo_title_ru: seo.seo_title_ru,
        seo_description_ru: seo.seo_description_ru,
      },
    })

    return NextResponse.json({ data: seo, error: null })
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'UNAUTHORIZED') return NextResponse.json({ data: null, error: 'Необходима авторизация' }, { status: 401 })
      if (err.message === 'FORBIDDEN') return NextResponse.json({ data: null, error: 'Доступ запрещён' }, { status: 403 })
    }
    return NextResponse.json({ data: null, error: 'Ошибка генерации SEO' }, { status: 500 })
  }
}
