'use client'

import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import { useCart } from '@/components/shop/Cart'
import { CheckoutForm } from '@/components/checkout/CheckoutForm'

export default function CheckoutPage() {
  const { items, totalAmount } = useCart()

  if (items.length === 0) {
    return (
      <div className="container py-20 text-center space-y-4">
        <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground opacity-40" />
        <h1 className="text-2xl font-bold">Корзина пуста</h1>
        <p className="text-muted-foreground">Добавьте товары, чтобы оформить заказ</p>
        <div className="flex gap-3 justify-center pt-2">
          <Link
            href="/shop"
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            В магазин
          </Link>
          <Link
            href="/catalog"
            className="px-6 py-2.5 border rounded-lg font-medium hover:bg-accent transition-colors"
          >
            В каталог курсов
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-10 max-w-3xl">
      <h1 className="text-2xl font-bold mb-8">Оформление заказа</h1>
      <CheckoutForm items={items} totalAmount={totalAmount} />
    </div>
  )
}
