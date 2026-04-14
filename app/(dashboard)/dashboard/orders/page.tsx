import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db/client'
import type { OrderStatus } from '@/types'

function formatAmount(kopecks: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
  }).format(kopecks / 100)
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

const statusConfig: Record<OrderStatus, { label: string; classes: string }> = {
  pending: { label: 'Ожидает', classes: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  paid: { label: 'Оплачен', classes: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  shipped: { label: 'Отправлен', classes: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
  delivered: { label: 'Доставлен', classes: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  cancelled: { label: 'Отменён', classes: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  refunded: { label: 'Возврат', classes: 'bg-muted text-muted-foreground' },
}

export default async function StudentOrdersPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const orders = await db.order.findMany({
    where: { user_id: session.id },
    orderBy: { created_at: 'desc' },
    include: {
      items: {
        include: {
          product: { select: { title_ru: true } },
        },
      },
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Мои заказы</h1>
        <p className="mt-1 text-muted-foreground">История всех ваших заказов</p>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center">
          <p className="text-muted-foreground">У вас пока нет заказов</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const status = statusConfig[order.status]
            return (
              <div key={order.id} className="rounded-lg border border-border bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Заказ #{order.id.slice(0, 8).toUpperCase()} · {formatDate(order.created_at)}
                    </p>
                    <p className="mt-1 text-lg font-semibold text-foreground">
                      {formatAmount(order.total_amount)}
                    </p>
                  </div>
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${status.classes}`}>
                    {status.label}
                  </span>
                </div>

                {order.items.length > 0 && (
                  <ul className="mt-4 space-y-1 border-t border-border pt-4">
                    {order.items.map((item) => (
                      <li key={item.id} className="flex items-center justify-between text-sm">
                        <span className="text-foreground">{item.product.title_ru}</span>
                        <span className="text-muted-foreground">× {item.quantity}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
