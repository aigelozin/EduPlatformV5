import { createHmac } from 'crypto'

export interface MirPaymentResult {
  payment_id: string
  payment_url: string
}

interface MirPayApiResponse {
  paymentId: string
  paymentUrl: string
}

function buildMirSignature(body: string): string {
  const secretKey = process.env.MIR_PAY_SECRET_KEY

  if (!secretKey) {
    throw new Error('MIR_PAY_SECRET_KEY is not configured')
  }

  return createHmac('sha256', secretKey).update(body).digest('hex')
}

export async function createMirPayment(params: {
  amount: number
  orderId: string
  returnUrl: string
  description: string
}): Promise<MirPaymentResult> {
  const merchantId = process.env.MIR_PAY_MERCHANT_ID

  if (!merchantId) {
    throw new Error('MIR_PAY_MERCHANT_ID is not configured')
  }

  const bodyObj = {
    merchantId,
    amount: params.amount,
    currency: 'RUB',
    orderId: params.orderId,
    returnUrl: params.returnUrl,
    description: params.description,
  }

  const bodyStr = JSON.stringify(bodyObj)
  const hmac = buildMirSignature(bodyStr)

  const response = await fetch('https://pay.mironline.ru/v1/payment', {
    method: 'POST',
    headers: {
      'X-Merchant-ID': merchantId,
      'X-Signature': hmac,
      'Content-Type': 'application/json',
    },
    body: bodyStr,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`MIR Pay API error: ${response.status} ${errorText}`)
  }

  const data = (await response.json()) as MirPayApiResponse

  return {
    payment_id: data.paymentId,
    payment_url: data.paymentUrl,
  }
}

export function verifyMirWebhook(body: string, signature: string): boolean {
  const webhookSecret = process.env.MIR_PAY_WEBHOOK_SECRET

  if (!webhookSecret) {
    throw new Error('MIR_PAY_WEBHOOK_SECRET is not configured')
  }

  const expected = createHmac('sha256', webhookSecret).update(body).digest('hex')

  return expected === signature
}
