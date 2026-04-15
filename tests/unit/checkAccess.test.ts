import { describe, it, expect, vi, beforeEach } from 'vitest'
import { checkAccess } from '@/lib/access/checkAccess'
import { db } from '@/lib/db/client'

const mockDb = db as unknown as {
  purchase: { findUnique: ReturnType<typeof vi.fn> }
  userSubscription: { findFirst: ReturnType<typeof vi.fn> }
  product: { findUnique: ReturnType<typeof vi.fn> }
}

describe('checkAccess()', () => {
  const userId = 'user_1'
  const productId = 'product_1'

  beforeEach(() => {
    vi.clearAllMocks()
    mockDb.product.findUnique.mockResolvedValue({
      id: productId,
      category_id: 'cat_1',
      type: 'lesson',
    })
  })

  it('returns hasAccess=true when user has a direct purchase', async () => {
    mockDb.purchase.findUnique.mockResolvedValue({ id: 'purchase_1' })
    mockDb.userSubscription.findFirst.mockResolvedValue(null)

    const result = await checkAccess(userId, productId)

    expect(result.hasAccess).toBe(true)
    expect(result.reason).toBe('purchase')
  })

  it('returns hasAccess=true when user has an active subscription', async () => {
    mockDb.purchase.findUnique.mockResolvedValue(null)
    mockDb.userSubscription.findFirst.mockResolvedValue({ id: 'sub_1' })

    const result = await checkAccess(userId, productId)

    expect(result.hasAccess).toBe(true)
    expect(result.reason).toBe('subscription')
  })

  it('returns hasAccess=false when user has no purchase or subscription', async () => {
    mockDb.purchase.findUnique.mockResolvedValue(null)
    mockDb.userSubscription.findFirst.mockResolvedValue(null)

    const result = await checkAccess(userId, productId)

    expect(result.hasAccess).toBe(false)
    expect(result.reason).toBe('none')
  })

  it('checks purchase before subscription (purchase takes priority)', async () => {
    mockDb.purchase.findUnique.mockResolvedValue({ id: 'purchase_1' })
    mockDb.userSubscription.findFirst.mockResolvedValue({ id: 'sub_1' })

    const result = await checkAccess(userId, productId)

    expect(result.reason).toBe('purchase')
    // Should not even check subscription when purchase exists
    expect(mockDb.userSubscription.findFirst).not.toHaveBeenCalled()
  })
})
