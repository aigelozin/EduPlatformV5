import Link from 'next/link'
import { RevenueChart } from '@/components/admin/RevenueChart'

interface PageProps {
  searchParams: { period?: string }
}

const PERIODS = [
  { value: '7', label: '7 дней' },
  { value: '30', label: '30 дней' },
  { value: '90', label: '90 дней' },
  { value: 'all', label: 'Всё время' },
]

type KPIs = {
  revenue: number
  purchases: number
  newUsers: number
  activeSubscriptions: number
}

type TopProduct = {
  id: string
  title: string
  slug: string
  teacherName: string
  views: number
  enrollments: number
  reviewCount: number
  avgRating: number | null
}

type AnalyticsData = {
  kpis: KPIs
  topProducts: TopProduct[]
  revenueChart: { date: string; revenue: number }[]
}

async function getAnalytics(period: string): Promise<AnalyticsData | null> {
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const res = await fetch(`${base}/api/admin/analytics?period=${period}`, {
      cache: 'no-store',
    })
    if (!res.ok) return null
    const json = (await res.json()) as { data: AnalyticsData | null }
    return json.data
  } catch {
    return null
  }
}

export default async function AdminAnalyticsPage({ searchParams }: PageProps) {
  const period = searchParams.period ?? '30'
  const data = await getAnalytics(period)

  const kpis: KPIs = data?.kpis ?? {
    revenue: 0,
    purchases: 0,
    newUsers: 0,
    activeSubscriptions: 0,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Аналитика</h1>
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <Link
              key={p.value}
              href={`/admin/analytics?period=${p.value}`}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                period === p.value
                  ? 'bg-primary text-primary-foreground'
                  : 'border hover:bg-muted text-muted-foreground'
              }`}
            >
              {p.label}
            </Link>
          ))}
        </div>
      </div>

      {/* KPI карточки */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Выручка</p>
          <p className="text-2xl font-bold mt-1">
            {(kpis.revenue / 100).toLocaleString('ru-RU')} ₽
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Покупки</p>
          <p className="text-2xl font-bold mt-1">{kpis.purchases.toLocaleString('ru-RU')}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Новые пользователи</p>
          <p className="text-2xl font-bold mt-1">{kpis.newUsers.toLocaleString('ru-RU')}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Активные подписки</p>
          <p className="text-2xl font-bold mt-1">
            {kpis.activeSubscriptions.toLocaleString('ru-RU')}
          </p>
        </div>
      </div>

      {/* График выручки */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="text-base font-semibold mb-4">Выручка по дням</h2>
        <RevenueChart data={data?.revenueChart ?? []} />
      </div>

      {/* Топ продуктов */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">Топ продуктов</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Продукт</th>
                <th className="pb-2 pr-4 font-medium">Преподаватель</th>
                <th className="pb-2 pr-4 font-medium text-right">Просмотры</th>
                <th className="pb-2 pr-4 font-medium text-right">Записи</th>
                <th className="pb-2 font-medium text-right">Рейтинг</th>
              </tr>
            </thead>
            <tbody>
              {!data || data.topProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-muted-foreground">
                    Нет данных
                  </td>
                </tr>
              ) : (
                data.topProducts.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="py-2 pr-4">
                      <Link
                        href={`/catalog/${p.slug}`}
                        className="font-medium hover:underline truncate max-w-[200px] block"
                      >
                        {p.title}
                      </Link>
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">{p.teacherName}</td>
                    <td className="py-2 pr-4 text-right">{p.views}</td>
                    <td className="py-2 pr-4 text-right">{p.enrollments}</td>
                    <td className="py-2 text-right">
                      {p.avgRating !== null ? (
                        <span className="flex items-center justify-end gap-1">
                          <span className="text-yellow-500">★</span>
                          {p.avgRating.toFixed(1)}
                          <span className="text-xs text-muted-foreground">
                            ({p.reviewCount})
                          </span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
