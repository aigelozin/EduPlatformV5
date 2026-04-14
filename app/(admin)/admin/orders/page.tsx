import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db/client'

export const metadata: Metadata = { title: 'Заказы | Администратор' }

const STATUS_LABELS: Record<string, string> = {
  pending: 'Ожидает',
  paid: 'Оплачен',
  shipped: 'Отправлен',
  delivered: 'Доставлен',
  cancelled: 'Отменён',
  refunded: 'Возврат',
}
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  paid: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  shipped: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  delivered: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  refunded: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
}

interface PageProps {
  searchParams: { status?: string }
}

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const session = await getSession()
  if (!session || session.role !== 'admin') redirect('/dashboard')

  const { status } = searchParams
  const validStatuses = ['pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded']

  const orders = await db.order.findMany({
    where: status && validStatuses.includes(status)
      ? { status: status as 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'refunded' }
      : {},
    include: {
      user: { select: { name: true, email: true } },
      _count: { select: { items: true } },
    },
    orderBy: { created_at: 'desc' },
    take: 50,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Заказы</h1>
        <select
          className="border rounded-lg px-3 py-2 text-sm bg-background"
          defaultValue={status ?? ''}
          onChange={undefined}
        >
          <option value="">Все статусы</option>
          {validStatuses.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium">Покупатель</th>
              <th className="text-left p-3 font-medium">Сумма</th>
              <th className="text-left p-3 font-medium">Товаров</th>
              <th className="text-left p-3 font-medium">Доставка</th>
              <th className="text-left p-3 font-medium">Статус</th>
              <th className="text-left p-3 font-medium">Дата</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted-foreground">Заказы не найдены</td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="border-t">
                  <td className="p-3">
                    <p className="font-medium">{order.user.name}</p>
                    <p className="text-xs text-muted-foreground">{order.user.email}</p>
                  </td>
                  <td className="p-3 font-semibold">{(order.total_amount / 100).toLocaleString('ru-RU')} ₽</td>
                  <td className="p-3">{order._count.items}</td>
                  <td className="p-3 text-muted-foreground">{order.delivery_provider ?? '—'}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                      {STATUS_LABELS[order.status]}
                    </span>
                  </td>
                  <td className="p-3 text-muted-foreground">{order.created_at.toLocaleDateString('ru-RU')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
