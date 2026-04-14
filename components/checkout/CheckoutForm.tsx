'use client'

import { useState } from 'react'
import { CheckCircle } from 'lucide-react'
import { DeliveryCalculator } from '@/components/delivery/DeliveryCalculator'
import { PaymentMethods } from '@/components/checkout/PaymentMethods'
import type { CartItem } from '@/components/shop/Cart'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CheckoutFormProps {
  items: CartItem[]
  totalAmount: number // копейки (без доставки)
}

interface ContactData {
  name: string
  phone: string
  email: string
  consent: boolean
}

interface DeliveryQuote {
  provider: 'cdek' | 'boxberry'
  amount: number
  estimated_days: number
}

type PaymentMethod = 'yookassa' | 'cryptocloud' | 'mir_pay'
type Step = 1 | 2 | 3

const PHYSICAL_TYPES = new Set(['physical_book', 'souvenir', 'apparel'])

const STEP_LABELS: Record<Step, string> = {
  1: 'Данные',
  2: 'Доставка',
  3: 'Оплата',
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CheckoutForm({ items, totalAmount }: CheckoutFormProps) {
  const hasPhysical = items.some((i) => PHYSICAL_TYPES.has(i.type))

  const [step, setStep] = useState<Step>(1)
  const [contact, setContact] = useState<ContactData>({
    name: '',
    phone: '',
    email: '',
    consent: false,
  })
  const [delivery, setDelivery] = useState<DeliveryQuote | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null)
  const [errors, setErrors] = useState<Partial<Record<keyof ContactData, string>>>({})

  const deliveryAmount = delivery?.amount ?? 0
  const grandTotal = totalAmount + deliveryAmount

  // ── Validation ──────────────────────────────────────────────────────────────

  function validateContact(): boolean {
    const errs: Partial<Record<keyof ContactData, string>> = {}
    if (!contact.name.trim()) errs.name = 'Укажите имя'
    if (!/^\+7\d{10}$/.test(contact.phone.replace(/\s/g, '')))
      errs.phone = 'Укажите телефон в формате +7XXXXXXXXXX'
    if (!contact.email.includes('@')) errs.email = 'Укажите корректный email'
    if (!contact.consent) errs.consent = 'Необходимо согласие на обработку данных (ФЗ-152)'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  // ── Navigation ──────────────────────────────────────────────────────────────

  function goNext() {
    if (step === 1) {
      if (!validateContact()) return
      // Если нет физических — пропускаем шаг доставки
      setStep(hasPhysical ? 2 : 3)
      return
    }
    if (step === 2) {
      setStep(3)
      return
    }
  }

  function goBack() {
    if (step === 3) {
      setStep(hasPhysical ? 2 : 1)
      return
    }
    if (step === 2) {
      setStep(1)
      return
    }
  }

  // ── Submit ───────────────────────────────────────────────────────────────────

  function handlePay() {
    if (!paymentMethod) return
    // eslint-disable-next-line no-console
    console.log('Оплата:', {
      contact,
      delivery,
      paymentMethod,
      items,
      grandTotal,
    })
    // TODO: интеграция с платёжными системами в следующем шаге
  }

  // ── Step indicator ───────────────────────────────────────────────────────────

  const visibleSteps: Step[] = hasPhysical ? [1, 2, 3] : [1, 3]

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Progress bar */}
      <div className="flex items-center gap-2">
        {visibleSteps.map((s, idx) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold shrink-0 transition-colors ${
                step === s
                  ? 'bg-primary text-primary-foreground'
                  : step > s
                  ? 'bg-primary/20 text-primary'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {step > s ? <CheckCircle className="w-4 h-4" /> : idx + 1}
            </div>
            <span
              className={`text-sm hidden sm:block ${
                step === s ? 'font-semibold' : 'text-muted-foreground'
              }`}
            >
              {STEP_LABELS[s]}
            </span>
            {idx < visibleSteps.length - 1 && (
              <div className="flex-1 h-0.5 bg-muted rounded" />
            )}
          </div>
        ))}
      </div>

      {/* ── Step 1: Контактные данные ─────────────────────────────────────── */}
      {step === 1 && (
        <div className="rounded-xl border p-6 space-y-4 bg-background">
          <h2 className="text-lg font-semibold">Контактные данные</h2>

          <div>
            <label className="block text-xs text-muted-foreground mb-1" htmlFor="checkout-name">
              Имя и фамилия *
            </label>
            <input
              id="checkout-name"
              type="text"
              value={contact.name}
              onChange={(e) => setContact((p) => ({ ...p, name: e.target.value }))}
              placeholder="Иван Иванов"
              className="w-full px-3 py-2 rounded-lg border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1" htmlFor="checkout-phone">
              Телефон *
            </label>
            <input
              id="checkout-phone"
              type="tel"
              value={contact.phone}
              onChange={(e) => setContact((p) => ({ ...p, phone: e.target.value }))}
              placeholder="+7 900 000 00 00"
              className="w-full px-3 py-2 rounded-lg border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1" htmlFor="checkout-email">
              Email *
            </label>
            <input
              id="checkout-email"
              type="email"
              value={contact.email}
              onChange={(e) => setContact((p) => ({ ...p, email: e.target.value }))}
              placeholder="ivan@example.ru"
              className="w-full px-3 py-2 rounded-lg border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={contact.consent}
              onChange={(e) => setContact((p) => ({ ...p, consent: e.target.checked }))}
              className="mt-0.5 shrink-0 accent-primary"
            />
            <span className="text-xs text-muted-foreground leading-relaxed">
              Я даю согласие на обработку персональных данных в соответствии с{' '}
              <a href="/privacy" className="text-primary hover:underline" target="_blank">
                Политикой конфиденциальности
              </a>{' '}
              (ФЗ-152)
            </span>
          </label>
          {errors.consent && (
            <p className="text-xs text-destructive">{errors.consent}</p>
          )}

          <div className="flex justify-end pt-2">
            <button
              onClick={goNext}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Далее →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Доставка ─────────────────────────────────────────────── */}
      {step === 2 && hasPhysical && (
        <div className="rounded-xl border p-6 space-y-4 bg-background">
          <h2 className="text-lg font-semibold">Доставка</h2>

          <DeliveryCalculator
            weight_g={items
              .filter((i) => PHYSICAL_TYPES.has(i.type))
              .reduce((sum) => sum + 500, 0)} // 500г по умолчанию на позицию
            onSelect={(quote) => setDelivery(quote)}
          />

          {delivery && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm">
              <p className="font-medium">
                Выбрана доставка: {delivery.provider === 'cdek' ? 'CDEK' : 'Boxberry'}
              </p>
              <p className="text-muted-foreground">
                {(delivery.amount / 100).toLocaleString('ru-RU')} ₽ ·{' '}
                {delivery.estimated_days}{' '}
                {delivery.estimated_days === 1
                  ? 'день'
                  : delivery.estimated_days < 5
                  ? 'дня'
                  : 'дней'}
              </p>
            </div>
          )}

          <div className="flex justify-between pt-2">
            <button
              onClick={goBack}
              className="px-5 py-2 border rounded-lg text-sm font-semibold hover:bg-accent transition-colors"
            >
              ← Назад
            </button>
            <button
              onClick={goNext}
              disabled={!delivery}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              Далее →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Оплата ───────────────────────────────────────────────── */}
      {step === 3 && (
        <div className="rounded-xl border p-6 space-y-5 bg-background">
          <h2 className="text-lg font-semibold">Оплата</h2>

          {/* Итог */}
          <div className="rounded-lg border bg-muted/20 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Товары:</span>
              <span>{(totalAmount / 100).toLocaleString('ru-RU')} ₽</span>
            </div>
            {delivery && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Доставка:</span>
                <span>{(delivery.amount / 100).toLocaleString('ru-RU')} ₽</span>
              </div>
            )}
            <div className="border-t pt-2 flex justify-between font-bold">
              <span>Итого:</span>
              <span className="text-primary">
                {(grandTotal / 100).toLocaleString('ru-RU')} ₽
              </span>
            </div>
          </div>

          <PaymentMethods
            selected={paymentMethod}
            onSelect={setPaymentMethod}
            totalAmount={grandTotal}
          />

          <div className="flex justify-between pt-2">
            <button
              onClick={goBack}
              className="px-5 py-2 border rounded-lg text-sm font-semibold hover:bg-accent transition-colors"
            >
              ← Назад
            </button>
            <button
              onClick={handlePay}
              disabled={!paymentMethod}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              Оплатить {(grandTotal / 100).toLocaleString('ru-RU')} ₽
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
