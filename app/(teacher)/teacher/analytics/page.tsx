import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db/client'
import { BarChart3, DollarSign, Package, ShoppingBag } from 'lucide-react'

function formatAmount(kopecks: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
  }).format(kopecks / 100)
}

export default async function TeacherAnalyticsPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'teacher' && session.role !== 'admin') redirect('/dashboard')

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  let productsCount = 0
  let pendingCount = 0
  let approvedCount = 0
  let rejectedCount = 0
  let allPurchases: { amount: number }[] = []
  let monthPurchases: { amount: number }[] = []

  try {
    ;[productsCount, pendingCount, approvedCount, rejectedCount, allPurchases, monthPurchases] =
      await Promise.all([
        db.product.count({ where: { creator_id: session.id } }),
        db.product.count({ where: { creator_id: session.id, moderation_status: 'pending' } }),
        db.product.count({ where: { creator_id: session.id, moderation_status: 'approved' } }),
        db.product.count({ where: { creator_id: session.id, moderation_status: 'rejected' } }),
        db.purchase.findMany({
          where: { product: { creator_id: session.id } },
          select: { amount: true },
        }),
        db.purchase.findMany({
          where: {
            product: { creator_id: session.id },
            created_at: { gte: startOfMonth },
          },
          select: { amount: true },
        }),
      ])
  } catch {
    // DB unavailable — show empty state
  }

  const totalRevenue = allPurchases.reduce((sum, p) => sum + p.amount, 0)
  const monthRevenue = monthPurchases.reduce((sum, p) => sum + p.amount, 0)

  const stats = [
    { label: 'Всего продуктов', value: productsCount, icon: Package },
    { label: 'Всего продаж', value: allPurchases.length, icon: ShoppingBag },
    { label: 'Доход за месяц', value: formatAmount(monthRevenue), icon: BarChart3 },
    { label: 'Всего доход', value: formatAmount(totalRevenue), icon: DollarSign },
  ]

  const moderationRows = [
    { label: 'На модерации', count: pendingCount, classes: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
    { label: 'Одобрено', count: approvedCount, classes: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
    { label: 'Отклонено', count: rejectedCount, classes: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Аналитика</h1>
        <p className="mt-1 text-muted-foreground">Статистика по вашим продуктам и продажам</p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{label}</p>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
          </div>
        ))}
      </div>

      {/* Chart placeholder */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">График доходов</h2>
        <div className="flex h-48 items-center justify-center rounded-md border border-dashed border-border bg-muted/30">
          <p className="text-sm text-muted-foreground">
            График доходов — в следующей версии
          </p>
        </div>
      </div>

      {/* Moderation status table */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Статусы модерации</h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Статус</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Кол-во продуктов</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {moderationRows.map(({ label, count, classes }) => (
                <tr key={label}>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${classes}`}>
                      {label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-foreground">{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
