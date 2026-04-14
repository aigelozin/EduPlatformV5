import { vi } from 'vitest'

// Mock Prisma client for unit tests
vi.mock('@/lib/db/client', () => ({
  db: {
    purchase: { findUnique: vi.fn() },
    userSubscription: { findFirst: vi.fn() },
    product: { findUnique: vi.fn() },
    profile: { findUnique: vi.fn(), upsert: vi.fn() },
  },
}))
