import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db/client'

export const metadata: Metadata = { title: 'Панель администратора' }

export default async function AdminPage() {
  const session = await getSession()
  if (!session || session.role !== 'admin') redirect('/dashboard')

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  let usersCount = 0, teachersCount = 0, approvedProducts = 0, pendingProducts = 0
  let ordersTotal = 0, revenueResult: { _sum: { total_amount: number | null } } = { _sum: { total_amount: null } }
  let monthOrders = 0
  type RecentOrder = {
    id: string
    status: string
    total_amount: number
    created_at: Date
    user: { name: string; email: string }
  }

  let recentOrders: RecentOrder[] = []

  try {
    ;[usersCount, teachersCount, approvedProducts, pendingProducts, ordersTotal, revenueResult, monthOrders] =
      await Promise.all([
        db.profile.count(),
        db.profile.count({ where: { role: 'teacher' } }),
        db.product.count({ where: { moderation_status: 'approved', is_active: true } }),
        db.product.count({ where: { moderation_status: 'pending' } }),
        db.order.count(),
        db.order.aggregate({ _sum: { total_amount: true }, where: { status: 'paid' } }),
        db.order.count({ where: { created_at: { gte: startOfMonth } } }),
      ])
    recentOrders = await db.order.findMany({
      orderBy: { created_at: 'desc' },
      take: 5,
      include: { user: { select: { name: true, email: true } } },
    }) as RecentOrder[]
  } catch {
    // DB unavailable — show empty state
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    paid: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    shipped: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    delivered: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Обзор платформы</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Пользователей', value: usersCount },
          { label: 'Преподавателей', value: teachersCount },
          { label: 'Продуктов (одобрено)', value: approvedProducts },
          { label: 'Заказов за месяц', value: monthOrders },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border p-5 bg-background">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="text-3xl font-bold mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border p-5 bg-background">
          <p className="text-sm text-muted-foreground">Всего заказов</p>
          <p className="text-2xl font-bold mt-1">{ordersTotal}</p>
        </div>
        <div className="rounded-xl border p-5 bg-background">
          <p className="text-sm text-muted-foreground">Общий доход</p>
          <p className="text-2xl font-bold mt-1">
            {((revenueResult._sum.total_amount ?? 0) / 100).toLocaleString('ru-RU')} ₽
          </p>
        </div>
        <div className={`rounded-xl border p-5 ${pendingProducts > 0 ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' : 'bg-background'}`}>
          <p className="text-sm text-muted-foreground">Ожидают модерации</p>
          <p className="text-2xl font-bold mt-1">{pendingProducts}</p>
          {pendingProducts > 0 && (
            <Link href="/admin/products?status=pending" className="text-xs text-primary hover:underline mt-1 block">
              Проверить →
            </Link>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Последние заказы</h2>
          <Link href="/admin/orders" className="text-sm text-primary hover:underline">Все заказы →</Link>
        </div>
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium">Пользователь</th>
                <th className="text-left p-3 font-medium">Сумма</th>
                <th className="text-left p-3 font-medium">Статус</th>
                <th className="text-left p-3 font-medium">Дата</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-t">
                  <td className="p-3">
                    <p className="font-medium">{order.user.name}</p>
                    <p className="text-xs text-muted-foreground">{order.user.email}</p>
                  </td>
                  <td className="p-3">{(order.total_amount / 100).toLocaleString('ru-RU')} ₽</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status] ?? ''}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {order.created_at.toLocaleDateString('ru-RU')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Преподаватели', href: '/admin/teachers' },
          { label: 'Продукты', href: '/admin/products' },
          { label: 'Заказы', href: '/admin/orders' },
          { label: 'Статистика', href: '/admin/stats' },
        ].map((link) => (
          <Link key={link.href} href={link.href} className="rounded-lg border p-4 text-center hover:bg-accent transition-colors text-sm font-medium">
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
