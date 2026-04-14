import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { requireAuth } from '@/lib/auth/session'
import { createYooKassaPayment } from '@/lib/payments/yookassa'
import { createCryptoCloudInvoice } from '@/lib/payments/cryptocloud'
import { createMirPayment } from '@/lib/payments/mir'
import type { PaymentProvider } from '@prisma/client'

const VALID_PROVIDERS: PaymentProvider[] = ['yookassa', 'cryptocloud', 'mir_pay']

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const user = await requireAuth()

    const body = (await req.json()) as { order_id?: string; provider?: string }
    const { order_id, provider } = body

    if (!order_id || !provider) {
      return NextResponse.json(
        { data: null, error: 'order_id and provider are required' },
        { status: 400 }
      )
    }

    if (!VALID_PROVIDERS.includes(provider as PaymentProvider)) {
      return NextResponse.json(
        { data: null, error: `Invalid provider. Must be one of: ${VALID_PROVIDERS.join(', ')}` },
        { status: 400 }
      )
    }

    const typedProvider = provider as PaymentProvider

    // Verify order belongs to user and is in pending status
    const order = await db.order.findFirst({
      where: {
        id: order_id,
        user_id: user.id,
        status: 'pending',
      },
    })

    if (!order) {
      return NextResponse.json(
        { data: null, error: 'Order not found or not eligible for payment' },
        { status: 404 }
      )
    }

    // Verify provider is active
    const providerConfig = await db.paymentMethodsConfig.findFirst({
      where: {
        provider: typedProvider,
        is_active: true,
      },
    })

    if (!providerConfig) {
      return NextResponse.json(
        { data: null, error: `Payment provider '${provider}' is not active` },
        { status: 400 }
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const returnUrl = `${appUrl}/orders/${order_id}`
    const description = `Оплата заказа #${order_id}`

    let paymentUrl: string
    let providerPaymentId: string

    if (typedProvider === 'yookassa') {
      const result = await createYooKassaPayment({
        amount: order.total_amount,
        orderId: order_id,
        returnUrl,
        description,
      })
      paymentUrl = result.payment_url
      providerPaymentId = result.payment_id
    } else if (typedProvider === 'cryptocloud') {
      const result = await createCryptoCloudInvoice({
        amount: order.total_amount,
        orderId: order_id,
        returnUrl,
      })
      paymentUrl = result.payment_url
      providerPaymentId = result.invoice_id
    } else {
      const result = await createMirPayment({
        amount: order.total_amount,
        orderId: order_id,
        returnUrl,
        description,
      })
      paymentUrl = result.payment_url
      providerPaymentId = result.payment_id
    }

    // Create Payment record in DB
    await db.payment.create({
      data: {
        order_id,
        provider: typedProvider,
        provider_payment_id: providerPaymentId,
        status: 'pending',
        amount: order.total_amount,
        currency: 'RUB',
        metadata: { initiated_by: user.id },
      },
    })

    return NextResponse.json({ data: { payment_url: paymentUrl }, error: null })
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
    }

    console.error('[payments/create] error:', err)
    return NextResponse.json(
      { data: null, error: 'Failed to create payment' },
      { status: 500 }
    )
  }
}
