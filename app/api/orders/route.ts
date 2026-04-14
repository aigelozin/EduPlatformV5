import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db/client'
import type { ApiResponse } from '@/types'
import { z } from 'zod'

// ─── Типы физических товаров, требующих доставки ──────────────────────────────

const PHYSICAL_TYPES = new Set(['physical_book', 'souvenir', 'apparel'])

// ─── Схема валидации ──────────────────────────────────────────────────────────

const DeliveryAddressSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().min(10).max(20),
  city: z.string().min(2).max(100),
  zip: z.string().min(5).max(10),
  street: z.string().min(2).max(200),
  house: z.string().min(1).max(20),
})

const CreateOrderSchema = z.object({
  items: z
    .array(
      z.object({
        product_id: z.string().cuid(),
        variant_id: z.string().cuid().optional(),
        quantity: z.number().int().min(1).max(100),
      })
    )
    .min(1),
  delivery_provider: z.enum(['cdek', 'boxberry']).optional(),
  delivery_address: DeliveryAddressSchema.optional(),
  consent: z.literal(true),
})

// ─── POST /api/orders — создать заказ ────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const user = await requireAuth()

    const body: unknown = await req.json()
    const parsed = CreateOrderSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.errors[0]?.message ?? 'Некорректные данные' },
        { status: 400 }
      )
    }

    const { items, delivery_provider, delivery_address } = parsed.data

    // Загружаем все продукты одним запросом
    const productIds = items.map((i) => i.product_id)
    const products = await db.product.findMany({
      where: { id: { in: productIds }, is_active: true },
      select: {
        id: true,
        type: true,
        price: true,
        sale_price: true,
      },
    })

    // Проверяем, что все запрошенные продукты найдены и активны
    const productMap = new Map(products.map((p) => [p.id, p]))
    for (const item of items) {
      if (!productMap.has(item.product_id)) {
        return NextResponse.json(
          { data: null, error: `Продукт ${item.product_id} не найден или недоступен` },
          { status: 400 }
        )
      }
    }

    // Проверяем необходимость доставки
    const hasPhysical = items.some((item) => {
      const product = productMap.get(item.product_id)
      return product !== undefined && PHYSICAL_TYPES.has(product.type)
    })

    if (hasPhysical && !delivery_provider) {
      return NextResponse.json(
        { data: null, error: 'Для физических товаров необходимо указать службу доставки' },
        { status: 400 }
      )
    }

    // Считаем сумму заказа
    let total_amount = 0
    const orderItems = items.map((item) => {
      const product = productMap.get(item.product_id)!
      const unit_price = product.sale_price ?? product.price
      total_amount += unit_price * item.quantity
      return {
        product_id: item.product_id,
        variant_id: item.variant_id ?? null,
        quantity: item.quantity,
        price: unit_price,
      }
    })

    // IP и User-Agent для ConsentLog
    const ip_address =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
    const user_agent = req.headers.get('user-agent') ?? null

    // Транзакция: создаём Order + OrderItems + ConsentLog
    const order = await db.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          user_id: user.id,
          status: 'pending',
          total_amount,
          delivery_amount: 0,
          delivery_provider: delivery_provider ?? null,
          delivery_address: delivery_address ?? null,
          items: {
            create: orderItems,
          },
        },
        select: {
          id: true,
          total_amount: true,
          _count: { select: { items: true } },
        },
      })

      await tx.consentLog.create({
        data: {
          user_id: user.id,
          consent_type: 'checkout',
          ip_address,
          user_agent,
        },
      })

      return created
    })

    return NextResponse.json(
      {
        data: {
          order_id: order.id,
          total_amount: order.total_amount,
          items_count: order._count.items,
        },
        error: null,
      },
      { status: 201 }
    )
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'UNAUTHORIZED') return NextResponse.json({ data: null, error: 'Необходима авторизация' }, { status: 401 })
      if (err.message === 'FORBIDDEN') return NextResponse.json({ data: null, error: 'Доступ запрещён' }, { status: 403 })
    }
    return NextResponse.json({ data: null, error: 'Ошибка сервера' }, { status: 500 })
  }
}

// ─── GET /api/orders — список заказов пользователя ───────────────────────────

export async function GET(_req: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const user = await requireAuth()

    const orders = await db.order.findMany({
      where: { user_id: user.id },
      include: {
        items: {
          select: {
            id: true,
            product_id: true,
            variant_id: true,
            quantity: true,
            price: true,
          },
        },
        payments: {
          select: {
            id: true,
            provider: true,
            status: true,
            amount: true,
            created_at: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
      take: 20,
    })

    return NextResponse.json({ data: orders, error: null })
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'UNAUTHORIZED') return NextResponse.json({ data: null, error: 'Необходима авторизация' }, { status: 401 })
      if (err.message === 'FORBIDDEN') return NextResponse.json({ data: null, error: 'Доступ запрещён' }, { status: 403 })
    }
    return NextResponse.json({ data: null, error: 'Ошибка сервера' }, { status: 500 })
  }
}
