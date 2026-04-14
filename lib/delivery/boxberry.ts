export interface BoxberryQuote {
  amount: number
  estimated_days: number
  expires_at: Date
}

interface BoxberryDeliveryCostsResponse {
  price: string
  delivery_period: string
}

interface BoxberryStatusEntry {
  Name: string
  AddressReduce?: string
}

export async function calculateBoxberryDelivery(params: {
  to_zip: string
  weight_g: number
}): Promise<BoxberryQuote> {
  const apiKey = process.env.BOXBERRY_API_KEY
  const fromCity = process.env.BOXBERRY_FROM_CITY ?? '010'

  if (!apiKey) {
    throw new Error('BOXBERRY_API_KEY is not configured')
  }

  const weightKg = params.weight_g / 1000

  const url = new URL('https://api.boxberry.ru/json.php')
  url.searchParams.set('token', apiKey)
  url.searchParams.set('method', 'DeliveryCosts')
  url.searchParams.set('weight', weightKg.toString())
  url.searchParams.set('aim', 'D')
  url.searchParams.set('zip', params.to_zip)
  url.searchParams.set('from', fromCity)

  const response = await fetch(url.toString(), {
    method: 'GET',
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Boxberry API error: ${response.status} ${errorText}`)
  }

  const data = (await response.json()) as BoxberryDeliveryCostsResponse

  const amountRubles = parseFloat(data.price)
  const estimatedDays = parseInt(data.delivery_period, 10)

  return {
    amount: Math.round(amountRubles * 100),
    estimated_days: isNaN(estimatedDays) ? 0 : estimatedDays,
    expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000),
  }
}

export async function trackBoxberryShipment(trackingNumber: string): Promise<{
  status: string
  location: string | null
}> {
  const apiKey = process.env.BOXBERRY_API_KEY

  if (!apiKey) {
    throw new Error('BOXBERRY_API_KEY is not configured')
  }

  const url = new URL('https://api.boxberry.ru/json.php')
  url.searchParams.set('token', apiKey)
  url.searchParams.set('method', 'ListStatuses')
  url.searchParams.set('ImId', trackingNumber)

  const response = await fetch(url.toString(), {
    method: 'GET',
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Boxberry tracking error: ${response.status} ${errorText}`)
  }

  const data = (await response.json()) as BoxberryStatusEntry[]
  const latest = Array.isArray(data) ? data[data.length - 1] : null

  return {
    status: latest?.Name ?? 'unknown',
    location: latest?.AddressReduce ?? null,
  }
}
