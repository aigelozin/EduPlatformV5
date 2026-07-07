import { createHmac, timingSafeEqual } from 'crypto'

export interface YooKassaPaymentResult {
  payment_id: string
  payment_url: string
  status: string
}

interface YooKassaApiResponse {
  id: string
  status: string
  confirmation: {
    type: string
    confirmation_url: string
  }
}

export async function createYooKassaPayment(params: {
  amount: number
  orderId: string
  returnUrl: string
  description: string
}): Promise<YooKassaPaymentResult> {
  const shopId = process.env.YOOKASSA_SHOP_ID
  const secretKey = process.env.YOOKASSA_SECRET_KEY

  if (!shopId || !secretKey) {
    throw new Error('YooKassa credentials are not configured')
  }

  const credentials = Buffer.from(`${shopId}:${secretKey}`).toString('base64')
  const amountInRubles = (params.amount / 100).toFixed(2)

  const body = {
    amount: {
      value: amountInRubles,
      currency: 'RUB',
    },
    confirmation: {
      type: 'redirect',
      return_url: params.returnUrl,
    },
    description: params.description,
    metadata: {
      order_id: params.orderId,
    },
    capture: true,
  }

  const response = await fetch('https://api.yookassa.ru/v3/payments', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/json',
      'Idempotence-Key': params.orderId,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`YooKassa API error: ${response.status} ${errorText}`)
  }

  const data = (await response.json()) as YooKassaApiResponse

  return {
    payment_id: data.id,
    payment_url: data.confirmation.confirmation_url,
    status: data.status,
  }
}

export function verifyYooKassaWebhook(body: string, signature: string): boolean {
  const webhookSecret = process.env.YOOKASSA_WEBHOOK_SECRET

  if (!webhookSecret) {
    throw new Error('YOOKASSA_WEBHOOK_SECRET is not configured')
  }

  const expected = createHmac('sha256', webhookSecret).update(body).digest('hex')
  const expectedBuf = Buffer.from(expected)
  const signatureBuf = Buffer.from(signature)

  return expectedBuf.length === signatureBuf.length && timingSafeEqual(expectedBuf, signatureBuf)
}
