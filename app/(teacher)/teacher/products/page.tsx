import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db/client'
import { Plus } from 'lucide-react'
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

const productTypeLabels: Record<string, string> = {
  lesson: 'Урок',
  course: 'Курс',
  bundle: 'Набор',
  livestream: 'Трансляция',
  digital_book: 'Эл. книга',
  physical_book: 'Бумажная книга',
  souvenir: 'Сувенир',
  apparel: 'Одежда',
  subscription_plan: 'Подписка',
}

export default async function TeacherProductsPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'teacher' && session.role !== 'admin') redirect('/dashboard')

  const products = await db.product.findMany({
    where: { creator_id: session.id },
    orderBy: { created_at: 'desc' },
    select: {
      id: true,
      title_ru: true,
      type: true,
      moderation_status: true,
      price: true,
      created_at: true,
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Мои продукты</h1>
          <p className="mt-1 text-muted-foreground">Управление вашими курсами и материалами</p>
        </div>
        <Link
          href="/teacher/products/new"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Новый продукт
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center">
          <p className="mb-4 text-muted-foreground">У вас пока нет продуктов</p>
          <Link
            href="/teacher/products/new"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Создать первый продукт
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Название</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Тип</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Статус</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Цена</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Дата</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {products.map((product) => {
                const badge = moderationBadge[product.moderation_status]
                return (
                  <tr key={product.id}>
                    <td className="px-4 py-3 font-medium text-foreground max-w-xs">
                      <span className="line-clamp-1">{product.title_ru}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {productTypeLabels[product.type] ?? product.type}
                    </td>
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
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/teacher/products/${product.id}/edit`}
                          className="rounded px-2 py-1 text-xs text-primary hover:bg-accent"
                        >
                          Редактировать
                        </Link>
                        <Link
                          href={`/teacher/lessons?product_id=${product.id}`}
                          className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
                        >
                          Уроки
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
