import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db/client'
import { Package, ShoppingBag, TrendingUp, DollarSign, Plus } from 'lucide-react'
import type { ModerationStatus } from '@/types'

function formatAmount(kopecks: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
  }).format(kopecks / 100)
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)
}

const moderationBadge: Record<ModerationStatus, { label: string; classes: string }> = {
  pending: { label: 'На модерации', classes: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  approved: { label: 'Одобрен', classes: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  rejected: { label: 'Отклонён', classes: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
}

export default async function TeacherOverviewPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'teacher' && session.role !== 'admin') redirect('/dashboard')

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [productsCount, salesData, monthRevenueData, recentProducts] = await Promise.all([
    db.product.count({ where: { creator_id: session.id } }),
    db.purchase.findMany({
      where: {
        product: { creator_id: session.id },
      },
      select: { amount: true },
    }),
    db.purchase.findMany({
      where: {
        product: { creator_id: session.id },
        created_at: { gte: startOfMonth },
      },
      select: { amount: true },
    }),
    db.product.findMany({
      where: { creator_id: session.id },
      take: 5,
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        title_ru: true,
        moderation_status: true,
        price: true,
        created_at: true,
      },
    }),
  ])

  const totalRevenue = salesData.reduce((sum, p) => sum + p.amount, 0)
  const monthRevenue = monthRevenueData.reduce((sum, p) => sum + p.amount, 0)

  const stats = [
    { label: 'Продукты', value: productsCount, icon: Package },
    { label: 'Продажи (всего)', value: salesData.length, icon: ShoppingBag },
    { label: 'Доход за месяц', value: formatAmount(monthRevenue), icon: TrendingUp },
    { label: 'Всего доход', value: formatAmount(totalRevenue), icon: DollarSign },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Обзор</h1>
          <p className="mt-1 text-muted-foreground">Добро пожаловать, {session.name}</p>
        </div>
        <Link
          href="/teacher/products/new"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Новый продукт
        </Link>
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

      {/* Recent products table */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Последние продукты</h2>
        {recentProducts.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center">
            <p className="text-muted-foreground">У вас пока нет продуктов</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Название</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Статус</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Цена</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Дата</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {recentProducts.map((product) => {
                  const badge = moderationBadge[product.moderation_status]
                  return (
                    <tr key={product.id}>
                      <td className="px-4 py-3 font-medium text-foreground">{product.title_ru}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${badge.classes}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-foreground">
                        {formatAmount(product.price)}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {formatDate(product.created_at)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-3 flex justify-end">
          <Link href="/teacher/products" className="text-sm text-primary hover:underline">
            Все продукты →
          </Link>
        </div>
      </div>
    </div>
  )
}
