import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'

interface CdekWebhookPayload {
  type: string
  attributes: {
    cdek_number?: string
    number?: string
    statuses?: Array<{
      code: string
      name: string
      city_name?: string
    }>
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const requestId = req.headers.get('X-Request-Id')
  if (!requestId) {
    return NextResponse.json({ error: 'Missing X-Request-Id header' }, { status: 400 })
  }

  try {
    const payload = (await req.json()) as CdekWebhookPayload
    const { type, attributes } = payload

    if (type !== 'ORDER_STATUS') {
      return NextResponse.json({ received: true }, { status: 200 })
    }

    const trackingNumber = attributes.cdek_number ?? attributes.number
    const latestStatus = attributes.statuses?.[0]

    if (!trackingNumber || !latestStatus) {
      return NextResponse.json({ received: true }, { status: 200 })
    }

    const statusCode = latestStatus.code
    const statusName = latestStatus.name
    const location = latestStatus.city_name ?? null

    const trackingInfo = JSON.stringify({ status: statusName, location, code: statusCode })

    const isDelivered = statusCode === 'DELIVERED'

    await db.order.updateMany({
      where: { delivery_tracking: trackingNumber },
      data: {
        delivery_tracking: trackingInfo,
        ...(isDelivered ? { status: 'delivered' } : {}),
      },
    })
  } catch (err) {
    console.error('[webhook/cdek] processing error:', err)
  }

  return NextResponse.json({ received: true }, { status: 200 })
}
