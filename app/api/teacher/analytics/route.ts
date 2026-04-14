import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/session'
import { db } from '@/lib/db/client'
import type { ApiResponse } from '@/types'

export async function GET(): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const user = await requireRole('teacher', 'admin')

    const creatorFilter = user.role === 'admin' ? {} : { creator_id: user.id }

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [
      totalProducts,
      productsByStatus,
      totalPurchases,
      revenueResult,
      monthlyRevenueResult,
    ] = await Promise.all([
      db.product.count({ where: creatorFilter }),

      db.product.groupBy({
        by: ['moderation_status'],
        where: creatorFilter,
        _count: { _all: true },
      }),

      db.purchase.count({
        where: {
          product: creatorFilter,
        },
      }),

      db.payment.aggregate({
        where: {
          status: 'succeeded',
          order: {
            items: {
              some: {
                product: creatorFilter,
              },
            },
          },
        },
        _sum: { amount: true },
      }),

      db.payment.aggregate({
        where: {
          status: 'succeeded',
          created_at: { gte: startOfMonth },
          order: {
            items: {
              some: {
                product: creatorFilter,
              },
            },
          },
        },
        _sum: { amount: true },
      }),
    ])

    const statusCounts = { pending: 0, approved: 0, rejected: 0 }
    for (const row of productsByStatus) {
      statusCounts[row.moderation_status] = row._count._all
    }

    return NextResponse.json({
      data: {
        total_products: totalProducts,
        total_purchases: totalPurchases,
        total_revenue: revenueResult._sum.amount ?? 0,
        monthly_revenue: monthlyRevenueResult._sum.amount ?? 0,
        products_by_status: statusCounts,
      },
      error: null,
    })
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'UNAUTHORIZED') return NextResponse.json({ data: null, error: 'Необходима авторизация' }, { status: 401 })
      if (err.message === 'FORBIDDEN') return NextResponse.json({ data: null, error: 'Доступ запрещён' }, { status: 403 })
    }
    return NextResponse.json({ data: null, error: 'Ошибка сервера' }, { status: 500 })
  }
}
