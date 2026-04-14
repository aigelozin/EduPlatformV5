import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { calculateCdekDelivery } from '@/lib/delivery/cdek'
import { calculateBoxberryDelivery } from '@/lib/delivery/boxberry'

interface DeliveryResult {
  provider: 'cdek' | 'boxberry'
  amount: number
  estimated_days: number
  expires_at: Date
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as {
      to_city?: string
      to_zip?: string
      weight_g?: number
      order_id?: string
    }

    const { to_city, to_zip, weight_g, order_id } = body

    if (!weight_g || weight_g <= 0) {
      return NextResponse.json(
        { data: null, error: 'weight_g is required and must be positive' },
        { status: 400 }
      )
    }

    if (!to_city && !to_zip) {
      return NextResponse.json(
        { data: null, error: 'Either to_city or to_zip is required' },
        { status: 400 }
      )
    }

    const [cdekResult, boxberryResult] = await Promise.allSettled([
      to_city
        ? calculateCdekDelivery({ to_city, weight_g })
        : Promise.reject(new Error('to_city is required for CDEK')),
      to_zip
        ? calculateBoxberryDelivery({ to_zip, weight_g })
        : Promise.reject(new Error('to_zip is required for Boxberry')),
    ])

    const results: DeliveryResult[] = []

    if (cdekResult.status === 'fulfilled') {
      results.push({
        provider: 'cdek',
        ...cdekResult.value,
      })
    } else {
      console.error('[delivery/calculate] CDEK error:', cdekResult.reason)
    }

    if (boxberryResult.status === 'fulfilled') {
      results.push({
        provider: 'boxberry',
        ...boxberryResult.value,
      })
    } else {
      console.error('[delivery/calculate] Boxberry error:', boxberryResult.reason)
    }

    // Save successful quotes to DB
    const fromCity = process.env.BOXBERRY_FROM_CITY ?? 'Москва'

    await Promise.allSettled(
      results.map((quote) =>
        db.deliveryQuote.create({
          data: {
            order_id: order_id ?? null,
            provider: quote.provider,
            from_city: fromCity,
            to_city: to_city ?? to_zip ?? '',
            weight_g,
            amount: quote.amount,
            estimated_days: quote.estimated_days,
            expires_at: quote.expires_at,
          },
        })
      )
    )

    if (results.length === 0) {
      return NextResponse.json(
        { data: null, error: 'No delivery options available' },
        { status: 503 }
      )
    }

    return NextResponse.json({ data: results, error: null })
  } catch (err) {
    console.error('[delivery/calculate] error:', err)
    return NextResponse.json(
      { data: null, error: 'Failed to calculate delivery' },
      { status: 500 }
    )
  }
}
