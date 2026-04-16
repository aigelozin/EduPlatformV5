import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { requireRole } from '@/lib/auth/session'
import { db } from '@/lib/db/client'
import type { ApiResponse } from '@/types'

export async function GET(): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    await requireRole('admin')
    const row = await db.siteSettings.findUnique({ where: { id: 'main' } })
    return NextResponse.json({ data: row, error: null })
  } catch {
    return NextResponse.json({ data: null, error: 'Ошибка сервера' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    await requireRole('admin')
    const body: unknown = await req.json()
    const { brand, typography, homepage, seo } = body as Record<string, unknown>
    const row = await db.siteSettings.upsert({
      where: { id: 'main' },
      create: {
        id: 'main',
        brand: brand ?? {},
        typography: typography ?? {},
        homepage: homepage ?? {},
        seo: seo ?? {},
      },
      update: {
        ...(brand !== undefined && { brand }),
        ...(typography !== undefined && { typography }),
        ...(homepage !== undefined && { homepage }),
        ...(seo !== undefined && { seo }),
      },
    })
    revalidateTag('site-settings')
    return NextResponse.json({ data: row, error: null })
  } catch {
    return NextResponse.json({ data: null, error: 'Ошибка сервера' }, { status: 500 })
  }
}
