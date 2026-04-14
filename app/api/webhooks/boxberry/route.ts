import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'

interface BoxberryWebhookPayload {
  ImId: string
  Status?: string
  StatusDate?: string
  Address?: string
}

const DELIVERED_STATUSES = [
  'Вручено',
  'Получено адресатом',
  'Вручено получателю',
  'Выдано',
]

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const payload = (await req.json()) as BoxberryWebhookPayload

    const { ImId, Status, Address } = payload

    if (!ImId) {
      return NextResponse.json({ received: true }, { status: 200 })
    }

    const statusName = Status ?? 'unknown'
    const location = Address ?? null

    const trackingInfo = JSON.stringify({ status: statusName, location })

    const isDelivered = DELIVERED_STATUSES.some((s) =>
      statusName.toLowerCase().includes(s.toLowerCase())
    )

    await db.order.updateMany({
      where: { delivery_tracking: ImId },
      data: {
        delivery_tracking: trackingInfo,
        ...(isDelivered ? { status: 'delivered' } : {}),
      },
    })
  } catch (err) {
    console.error('[webhook/boxberry] processing error:', err)
  }

  return NextResponse.json({ received: true }, { status: 200 })
}
