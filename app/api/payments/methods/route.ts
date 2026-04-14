import { NextResponse } from 'next/server'
import { db } from '@/lib/db/client'

export async function GET(): Promise<NextResponse> {
  try {
    const methods = await db.paymentMethodsConfig.findMany({
      select: {
        provider: true,
        is_active: true,
      },
      orderBy: { provider: 'asc' },
    })

    return NextResponse.json({ data: methods, error: null })
  } catch (err) {
    console.error('[payments/methods] error:', err)
    return NextResponse.json(
      { data: null, error: 'Failed to fetch payment methods' },
      { status: 500 }
    )
  }
}
