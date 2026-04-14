export interface CdekQuote {
  amount: number
  estimated_days: number
  expires_at: Date
}

interface CdekTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

interface CdekTariffResponse {
  delivery_sum: number
  period_min: number
  period_max: number
}

interface CdekOrdersResponse {
  entity?: {
    statuses?: Array<{
      name: string
      city?: string
    }>
  }
}

async function getCdekToken(): Promise<string> {
  const clientId = process.env.CDEK_CLIENT_ID
  const clientSecret = process.env.CDEK_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('CDEK credentials are not configured')
  }

  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  })

  const response = await fetch('https://api.cdek.ru/v2/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`CDEK OAuth error: ${response.status} ${errorText}`)
  }

  const data = (await response.json()) as CdekTokenResponse

  return data.access_token
}

export async function calculateCdekDelivery(params: {
  to_city: string
  weight_g: number
}): Promise<CdekQuote> {
  const token = await getCdekToken()

  const body = {
    tariff_code: 136,
    from_location: { city: 'Москва' },
    to_location: { city: params.to_city },
    packages: [{ weight: params.weight_g }],
  }

  const response = await fetch('https://api.cdek.ru/v2/calculator/tariff', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`CDEK tariff calculation error: ${response.status} ${errorText}`)
  }

  const data = (await response.json()) as CdekTariffResponse

  return {
    amount: Math.round(data.delivery_sum * 100),
    estimated_days: data.period_max,
    expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000),
  }
}

export async function trackCdekShipment(trackingNumber: string): Promise<{
  status: string
  location: string | null
}> {
  const token = await getCdekToken()

  const url = new URL('https://api.cdek.ru/v2/orders')
  url.searchParams.set('cdek_number', trackingNumber)

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`CDEK tracking error: ${response.status} ${errorText}`)
  }

  const data = (await response.json()) as CdekOrdersResponse
  const statuses = data.entity?.statuses ?? []
  const latest = statuses[0]

  return {
    status: latest?.name ?? 'unknown',
    location: latest?.city ?? null,
  }
}
