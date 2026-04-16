import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    await db.product.update({
      where: { id: params.id },
      data: { views_count: { increment: 1 } },
    })
  } catch {
    // fire-and-forget — ignore errors
  }
  return new NextResponse(null, { status: 204 })
}
