import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { verifyMirWebhook } from '@/lib/payments/mir'

const DIGITAL_PRODUCT_TYPES = [
  'lesson',
  'course',
  'bundle',
  'livestream',
  'digital_book',
] as const

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.text()
  const signature = req.headers.get('X-Signature') ?? ''

  const isValid = verifyMirWebhook(body, signature)
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  try {
    const payload = JSON.parse(body) as {
      status: string
      paymentId: string
      orderId?: string
    }

    const { status, paymentId } = payload

    if (status === 'CONFIRMED') {
      const payment = await db.payment.findFirst({
        where: { provider_payment_id: paymentId },
        include: {
          order: {
            include: {
              items: {
                include: {
                  product: true,
                },
              },
            },
          },
        },
      })

      if (payment) {
        await db.$transaction(async (tx) => {
          await tx.payment.update({
            where: { id: payment.id },
            data: { status: 'succeeded' },
          })

          await tx.order.update({
            where: { id: payment.order_id },
            data: { status: 'paid' },
          })

          const digitalItems = payment.order.items.filter((item) =>
            DIGITAL_PRODUCT_TYPES.includes(
              item.product.type as (typeof DIGITAL_PRODUCT_TYPES)[number]
            )
          )

          for (const item of digitalItems) {
            await tx.purchase.upsert({
              where: {
                user_id_product_id: {
                  user_id: payment.order.user_id,
                  product_id: item.product_id,
                },
              },
              create: {
                user_id: payment.order.user_id,
                product_id: item.product_id,
                amount: item.price,
              },
              update: {},
            })
          }
        })
      }
    } else if (status === 'DECLINED') {
      await db.payment.updateMany({
        where: { provider_payment_id: paymentId },
        data: { status: 'failed' },
      })
    } else if (status === 'CANCELLED') {
      await db.payment.updateMany({
        where: { provider_payment_id: paymentId },
        data: { status: 'cancelled' },
      })
    }
  } catch (err) {
    console.error('[webhook/mir] processing error:', err)
  }

  return NextResponse.json({ received: true }, { status: 200 })
}
