'use client'

import { CreditCard, Wallet } from 'lucide-react'

type PaymentMethod = 'yookassa' | 'cryptocloud' | 'mir_pay'

interface PaymentMethodsProps {
  selected: PaymentMethod | null
  onSelect: (method: PaymentMethod) => void
  totalAmount: number // копейки
}

const METHODS: {
  id: PaymentMethod
  label: string
  description: string
  icon: React.ReactNode
}[] = [
  {
    id: 'yookassa',
    label: 'YooKassa',
    description: 'Банковская карта, СБП, ЮMoney',
    icon: <CreditCard className="w-5 h-5" />,
  },
  {
    id: 'cryptocloud',
    label: 'CryptoCloud',
    description: 'Криптовалюта (BTC, ETH, USDT)',
    icon: <Wallet className="w-5 h-5" />,
  },
  {
    id: 'mir_pay',
    label: 'МИР Pay',
    description: 'МИР Pay, карты МИР',
    icon: <CreditCard className="w-5 h-5" />,
  },
]

export function PaymentMethods({ selected, onSelect, totalAmount }: PaymentMethodsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Способ оплаты</p>
        <p className="text-base font-bold text-primary">
          {(totalAmount / 100).toLocaleString('ru-RU')} ₽
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {METHODS.map((method) => (
          <button
            key={method.id}
            type="button"
            onClick={() => onSelect(method.id)}
            className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
              selected === method.id
                ? 'ring-2 ring-primary bg-primary/5'
                : 'hover:bg-accent'
            }`}
          >
            <div className="shrink-0 text-muted-foreground">{method.icon}</div>
            <div className="flex-1">
              <p className="font-semibold text-sm">{method.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{method.description}</p>
            </div>
            {/* Radio indicator */}
            <div
              className={`w-4 h-4 rounded-full border-2 shrink-0 transition-colors ${
                selected === method.id
                  ? 'border-primary bg-primary'
                  : 'border-muted-foreground'
              }`}
            />
          </button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Безопасная обработка платежей на территории РФ
      </p>
    </div>
  )
}
