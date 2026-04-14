'use client'

import { useState } from 'react'
import { Truck, CheckCircle } from 'lucide-react'

interface DeliveryQuote {
  provider: 'cdek' | 'boxberry'
  amount: number // копейки
  estimated_days: number
}

interface DeliveryCalculatorProps {
  weight_g: number
  onSelect: (quote: DeliveryQuote) => void
}

const PROVIDER_LABELS: Record<DeliveryQuote['provider'], string> = {
  cdek: 'CDEK',
  boxberry: 'Boxberry',
}

export function DeliveryCalculator({ weight_g, onSelect }: DeliveryCalculatorProps) {
  const [city, setCity] = useState('')
  const [zip, setZip] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [quotes, setQuotes] = useState<DeliveryQuote[]>([])
  const [selected, setSelected] = useState<DeliveryQuote['provider'] | null>(null)

  const isZipValid = /^\d{6}$/.test(zip)

  async function calculate() {
    if (!city.trim()) {
      setError('Введите город доставки')
      return
    }
    if (!isZipValid) {
      setError('Почтовый индекс должен содержать 6 цифр')
      return
    }

    setLoading(true)
    setError(null)
    setQuotes([])
    setSelected(null)

    try {
      const res = await fetch('/api/delivery/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to_city: city.trim(), to_zip: zip, weight_g }),
      })

      if (!res.ok) {
        const body = (await res.json()) as { error?: string }
        throw new Error(body.error ?? 'Ошибка расчёта доставки')
      }

      const data = (await res.json()) as { data: DeliveryQuote[] }
      setQuotes(data.data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось рассчитать доставку')
    } finally {
      setLoading(false)
    }
  }

  function handleSelect(quote: DeliveryQuote) {
    setSelected(quote.provider)
    onSelect(quote)
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold flex items-center gap-2">
        <Truck className="w-4 h-4" />
        Расчёт стоимости доставки
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-muted-foreground mb-1" htmlFor="delivery-city">
            Город
          </label>
          <input
            id="delivery-city"
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Например: Москва"
            className="w-full px-3 py-2 rounded-lg border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1" htmlFor="delivery-zip">
            Почтовый индекс
          </label>
          <input
            id="delivery-zip"
            type="text"
            inputMode="numeric"
            value={zip}
            onChange={(e) => setZip(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="123456"
            maxLength={6}
            className="w-full px-3 py-2 rounded-lg border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <button
        onClick={calculate}
        disabled={loading}
        className="px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
      >
        {loading ? 'Рассчитываем...' : 'Рассчитать'}
      </button>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {quotes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
          {quotes.map((quote) => (
            <button
              key={quote.provider}
              onClick={() => handleSelect(quote)}
              className={`text-left p-4 rounded-xl border transition-all ${
                selected === quote.provider
                  ? 'ring-2 ring-primary bg-primary/5'
                  : 'hover:bg-accent'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">{PROVIDER_LABELS[quote.provider]}</span>
                {selected === quote.provider && (
                  <CheckCircle className="w-4 h-4 text-primary" />
                )}
              </div>
              <p className="text-primary font-bold mt-1">
                {(quote.amount / 100).toLocaleString('ru-RU')} ₽
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {quote.estimated_days}{' '}
                {quote.estimated_days === 1
                  ? 'день'
                  : quote.estimated_days < 5
                  ? 'дня'
                  : 'дней'}
              </p>
            </button>
          ))}
        </div>
      )}

      {quotes.length === 0 && !loading && !error && (
        <p className="text-xs text-muted-foreground">
          Введите город и индекс, чтобы рассчитать стоимость доставки CDEK и Boxberry
        </p>
      )}
    </div>
  )
}
