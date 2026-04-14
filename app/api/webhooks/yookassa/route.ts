import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { verifyYooKassaWebhook } from '@/lib/payments/yookassa'

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

  const isValid = verifyYooKassaWebhook(body, signature)
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  try {
    const payload = JSON.parse(body) as {
      event: string
      object: {
        id: string
        status: string
        metadata?: { order_id?: string }
      }
    }

    const { event, object: paymentObj } = payload

    if (event === 'payment.succeeded') {
      const payment = await db.payment.findFirst({
        where: { provider_payment_id: paymentObj.id },
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
    } else if (event === 'payment.canceled') {
      await db.payment.updateMany({
        where: { provider_payment_id: paymentObj.id },
        data: { status: 'cancelled' },
      })
    }
  } catch (err) {
    console.error('[webhook/yookassa] processing error:', err)
  }

  return NextResponse.json({ received: true }, { status: 200 })
}
