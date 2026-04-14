import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/session'
import { db } from '@/lib/db/client'
import type { ApiResponse } from '@/types'

// GET /api/admin/stats — dashboard статистика платформы
export async function GET(_req: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    await requireRole('admin')

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [
      totalUsers,
      totalTeachers,
      activeProducts,
      pendingProducts,
      totalOrders,
      revenueAgg,
      ordersThisMonth,
    ] = await Promise.all([
      db.profile.count(),
      db.profile.count({ where: { role: 'teacher' } }),
      db.product.count({ where: { moderation_status: 'approved', is_active: true } }),
      db.product.count({ where: { moderation_status: 'pending' } }),
      db.order.count(),
      db.order.aggregate({
        _sum: { total_amount: true },
        where: { status: 'paid' },
      }),
      db.order.count({ where: { created_at: { gte: startOfMonth } } }),
    ])

    return NextResponse.json({
      data: {
        total_users: totalUsers,
        total_teachers: totalTeachers,
        active_products: activeProducts,
        pending_moderation: pendingProducts,
        total_orders: totalOrders,
        total_revenue_kopecks: revenueAgg._sum.total_amount ?? 0,
        orders_this_month: ordersThisMonth,
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
