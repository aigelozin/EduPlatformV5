import { db } from '@/lib/db/client'
import type { AccessCheckResult } from '@/types'

/**
 * Единственный источник правды для проверки доступа к контенту.
 * Обязателен перед любой выдачей signed YOS URL или защищённого контента.
 *
 * Логика: purchase OR (active subscription → product category OR product)
 */
export async function checkAccess(
  userId: string,
  productId: string
): Promise<AccessCheckResult> {
  // 1. Прямая покупка
  const purchase = await db.purchase.findUnique({
    where: { user_id_product_id: { user_id: userId, product_id: productId } },
  })

  if (purchase) {
    return { hasAccess: true, reason: 'purchase' }
  }

  // 2. Активная подписка на продукт
  const product = await db.product.findUnique({
    where: { id: productId },
    select: { category_id: true, type: true },
  })

  if (product) {
    const now = new Date()

    const subscription = await db.userSubscription.findFirst({
      where: {
        user_id: userId,
        expires_at: { gt: now },
        is_active: true,
        subscription: {
          product: {
            OR: [
              { id: productId },
              ...(product.category_id
                ? [{ category_id: product.category_id }]
                : []),
            ],
          },
        },
      },
    })

    if (subscription) {
      return { hasAccess: true, reason: 'subscription' }
    }
  }

  return { hasAccess: false, reason: 'none' }
}

/**
 * Бросает ошибку если доступа нет. Удобно в API route handlers.
 */
export async function requireAccess(
  userId: string,
  productId: string
): Promise<AccessCheckResult> {
  const result = await checkAccess(userId, productId)
  if (!result.hasAccess) throw new Error('ACCESS_DENIED')
  return result
}
