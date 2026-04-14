import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import type { ApiResponse } from '@/types'

export async function GET(
  _req: NextRequest
): Promise<NextResponse<ApiResponse<unknown>>> {
  const subscriptions = await db.subscription.findMany({
    where: { is_active: true },
    include: {
      product: {
        select: {
          id: true,
          slug: true,
          title_ru: true,
          thumbnail_url: true,
          category: { select: { name_ru: true, slug: true } },
        },
      },
    },
    orderBy: { price: 'asc' },
  })

  return NextResponse.json({ data: subscriptions, error: null })
}
