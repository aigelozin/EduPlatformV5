import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/session'
import { db } from '@/lib/db/client'
import { unstable_cache } from 'next/cache'
import type { ApiResponse } from '@/types'

type Period = '7' | '30' | '90' | 'all'

async function fetchAnalytics(period: Period) {
  const now = new Date()
  const days = period === 'all' ? null : parseInt(period, 10)
  const from = days ? new Date(now.getTime() - days * 24 * 60 * 60 * 1000) : null

  const dateFilter = from ? { gte: from } : undefined

  const [revenue, purchasesCount, newUsers, activeSubscriptions, topProducts, revenueByDay] =
    await Promise.all([
      // Суммарная выручка за период
      db.order.aggregate({
        where: { status: 'paid', ...(dateFilter && { created_at: dateFilter }) },
        _sum: { total_amount: true },
      }),
      // Новые покупки
      db.purchase.count({
        where: dateFilter ? { created_at: dateFilter } : {},
      }),
      // Новые пользователи
      db.profile.count({
        where: dateFilter ? { created_at: dateFilter } : {},
      }),
      // Активные подписки
      db.userSubscription.count({
        where: { expires_at: { gt: now }, is_active: true },
      }),
      // Топ продуктов
      db.product.findMany({
        where: { is_active: true, moderation_status: 'approved' },
        select: {
          id: true,
          title_ru: true,
          slug: true,
          views_count: true,
          creator: { select: { name: true } },
          _count: { select: { purchases: true, reviews: true } },
          reviews: {
            where: { is_visible: true },
            select: { rating: true },
          },
          user_progress: {
            where: { completed_at: { not: null } },
            select: { id: true },
          },
        },
        orderBy: { views_count: 'desc' },
        take: 20,
      }),
      // Выручка по дням
      db.order.findMany({
        where: {
          status: 'paid',
          ...(dateFilter && { created_at: dateFilter }),
        },
        select: { total_amount: true, created_at: true },
        orderBy: { created_at: 'asc' },
      }),
    ])

  // Группируем выручку по дням
  const revenueMap = new Map<string, number>()
  for (const order of revenueByDay) {
    const day = order.created_at.toISOString().split('T')[0]!
    revenueMap.set(day, (revenueMap.get(day) ?? 0) + order.total_amount)
  }
  const revenueChart = Array.from(revenueMap.entries()).map(([date, revenue]) => ({
    date,
    revenue,
  }))

  // Обогащаем топ продуктов
  const productsData = topProducts.map((p) => {
    const reviewCount = p._count.reviews
    const avgRating =
      reviewCount > 0
        ? p.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
        : null
    return {
      id: p.id,
      title: p.title_ru,
      slug: p.slug,
      teacherName: p.creator.name,
      views: p.views_count,
      enrollments: p._count.purchases,
      reviewCount,
      avgRating,
    }
  })

  return {
    kpis: {
      revenue: revenue._sum.total_amount ?? 0,
      purchases: purchasesCount,
      newUsers,
      activeSubscriptions,
    },
    topProducts: productsData,
    revenueChart,
  }
}

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    await requireRole('admin')
    const period = (req.nextUrl.searchParams.get('period') ?? '30') as Period

    const getData = unstable_cache(
      () => fetchAnalytics(period),
      [`admin-analytics-${period}`],
      { revalidate: 300, tags: ['admin-analytics'] }
    )

    const data = await getData()
    return NextResponse.json({ data, error: null })
  } catch (e: unknown) {
    const msg = (e as Error)?.message ?? ''
    if (msg === 'UNAUTHORIZED') return NextResponse.json({ data: null, error: 'Требуется авторизация' }, { status: 401 })
    if (msg === 'FORBIDDEN') return NextResponse.json({ data: null, error: 'Нет доступа' }, { status: 403 })
    return NextResponse.json({ data: null, error: 'Ошибка сервера' }, { status: 500 })
  }
}
