import { createHmac, timingSafeEqual } from 'crypto'

export interface CryptoCloudInvoiceResult {
  invoice_id: string
  payment_url: string
}

interface CryptoCloudApiResponse {
  status: string
  result: {
    uuid: string
    link_page_url: string
  }
}

export async function createCryptoCloudInvoice(params: {
  amount: number
  orderId: string
  returnUrl: string
}): Promise<CryptoCloudInvoiceResult> {
  const apiKey = process.env.CRYPTOCLOUD_API_KEY
  const shopId = process.env.CRYPTOCLOUD_SHOP_ID

  if (!apiKey || !shopId) {
    throw new Error('CryptoCloud credentials are not configured')
  }

  const amountInRubles = (params.amount / 100).toFixed(2)

  const body = {
    shop_id: shopId,
    amount: amountInRubles,
    currency: 'RUB',
    order_id: params.orderId,
    url_return: params.returnUrl,
  }

  const response = await fetch('https://api.cryptocloud.plus/v2/invoice/create', {
    method: 'POST',
    headers: {
      Authorization: `Token ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`CryptoCloud API error: ${response.status} ${errorText}`)
  }

  const data = (await response.json()) as CryptoCloudApiResponse

  if (data.status !== 'success') {
    throw new Error(`CryptoCloud invoice creation failed: ${data.status}`)
  }

  return {
    invoice_id: data.result.uuid,
    payment_url: data.result.link_page_url,
  }
}

export function verifyCryptoCloudWebhook(body: string, signature: string): boolean {
  const webhookSecret = process.env.CRYPTOCLOUD_WEBHOOK_SECRET

  if (!webhookSecret) {
    throw new Error('CRYPTOCLOUD_WEBHOOK_SECRET is not configured')
  }

  const expected = createHmac('sha256', webhookSecret).update(body).digest('hex')
  const expectedBuf = Buffer.from(expected)
  const signatureBuf = Buffer.from(signature)

  return expectedBuf.length === signatureBuf.length && timingSafeEqual(expectedBuf, signatureBuf)
}
