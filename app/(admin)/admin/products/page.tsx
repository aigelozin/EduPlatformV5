import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db/client'
import { ProductModerationActions } from '@/components/admin/ProductModerationActions'

export const metadata: Metadata = { title: 'Продукты | Администратор' }

const STATUS_LABELS: Record<string, string> = {
  pending: 'Ожидает',
  approved: 'Одобрен',
  rejected: 'Отклонён',
}
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
}

interface PageProps {
  searchParams: { status?: string; teacher_id?: string }
}

export default async function AdminProductsPage({ searchParams }: PageProps) {
  const session = await getSession()
  if (!session || session.role !== 'admin') redirect('/dashboard')

  const { status, teacher_id } = searchParams

  const where = {
    ...(status && ['pending', 'approved', 'rejected'].includes(status)
      ? { moderation_status: status as 'pending' | 'approved' | 'rejected' }
      : {}),
    ...(teacher_id ? { creator_id: teacher_id } : {}),
  }

  let products: Awaited<ReturnType<typeof db.product.findMany>> = []
  try {
    products = await db.product.findMany({
      where,
      include: {
        creator: { select: { name: true, email: true } },
        category: { select: { name_ru: true } },
      },
      orderBy: { created_at: 'desc' },
      take: 50,
    })
  } catch {
    // DB unavailable
  }

  const tabs = [
    { label: 'Все', value: '' },
    { label: 'Ожидают', value: 'pending' },
    { label: 'Одобрены', value: 'approved' },
    { label: 'Отклонены', value: 'rejected' },
  ]

  function tabHref(value: string) {
    const params = new URLSearchParams()
    if (value) params.set('status', value)
    if (teacher_id) params.set('teacher_id', teacher_id)
    return `/admin/products${params.toString() ? '?' + params.toString() : ''}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Продукты</h1>
        <Link
          href="/admin/products/new"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          + Создать продукт
        </Link>
      </div>

      <div className="flex gap-2 flex-wrap">
        {tabs.map((tab) => (
          <a
            key={tab.value}
            href={tabHref(tab.value)}
            className={`px-4 py-2 rounded-full text-sm border transition-colors ${
              (status ?? '') === tab.value ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
            }`}
          >
            {tab.label}
          </a>
        ))}
      </div>

      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium">Продукт</th>
              <th className="text-left p-3 font-medium">Преподаватель</th>
              <th className="text-left p-3 font-medium">Тип</th>
              <th className="text-left p-3 font-medium">Цена</th>
              <th className="text-left p-3 font-medium">Статус</th>
              <th className="text-left p-3 font-medium">Действия</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted-foreground">
                  Продукты не найдены
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="border-t">
                  <td className="p-3">
                    <p className="font-medium line-clamp-1">{product.title_ru}</p>
                    {product.category && (
                      <p className="text-xs text-muted-foreground">{product.category.name_ru}</p>
                    )}
                  </td>
                  <td className="p-3">
                    <p className="text-sm">{product.creator.name}</p>
                    <p className="text-xs text-muted-foreground">{product.creator.email}</p>
                  </td>
                  <td className="p-3 text-muted-foreground">{product.type}</td>
                  <td className="p-3">{(product.price / 100).toLocaleString('ru-RU')} ₽</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[product.moderation_status]}`}>
                      {STATUS_LABELS[product.moderation_status]}
                    </span>
                  </td>
                  <td className="p-3">
                    <ProductModerationActions
                      productId={product.id}
                      currentStatus={product.moderation_status}
                      productTitle={product.title_ru}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
