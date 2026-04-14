import type {
  Profile,
  Product,
  Category,
  Lesson,
  Order,
  Payment,
  Purchase,
  UserSubscription,
  Subscription,
  Review,
  Notification,
  Role,
  ProductType,
  VideoSource,
  ModerationStatus,
  OrderStatus,
  PaymentStatus,
  PaymentProvider,
  DeliveryProvider,
} from '@prisma/client'

// ─── Re-exports ───────────────────────────────────────────────────────────────

export type {
  Profile,
  Product,
  Category,
  Lesson,
  Order,
  Payment,
  Purchase,
  UserSubscription,
  Subscription,
  Review,
  Notification,
  Role,
  ProductType,
  VideoSource,
  ModerationStatus,
  OrderStatus,
  PaymentStatus,
  PaymentProvider,
  DeliveryProvider,
}

// ─── Session ──────────────────────────────────────────────────────────────────

export interface SessionUser {
  id: string
  email: string
  name: string
  role: Role
  avatar_url?: string | null
}

// ─── API Responses ────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T | null
  error: string | null
  meta?: Record<string, unknown>
}

export interface PaginatedResponse<T> {
  data: T[]
  error: string | null
  meta: {
    total: number
    page: number
    per_page: number
    total_pages: number
  }
}

// ─── Products ─────────────────────────────────────────────────────────────────

export type ProductWithCategory = Product & {
  category: Category | null
}

export type ProductWithLessons = Product & {
  lessons: Lesson[]
}

export type ProductCard = Pick<
  Product,
  'id' | 'slug' | 'type' | 'title_ru' | 'price' | 'sale_price' | 'thumbnail_url'
> & {
  category: Pick<Category, 'name_ru' | 'slug'> | null
  _count?: { reviews: number; purchases: number }
}

// ─── Access ───────────────────────────────────────────────────────────────────

export interface AccessCheckResult {
  hasAccess: boolean
  reason: 'purchase' | 'subscription' | 'free' | 'none'
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export interface CreatePaymentInput {
  order_id: string
  provider: PaymentProvider
  return_url: string
}

export interface PaymentResult {
  payment_url: string
  provider_payment_id: string
}

// ─── Delivery ─────────────────────────────────────────────────────────────────

export interface DeliveryCalculateInput {
  provider: DeliveryProvider
  from_city: string
  to_city: string
  weight_g: number
}

export interface DeliveryQuoteResult {
  amount: number  // копейки
  estimated_days: number
  expires_at: Date
}

// ─── AI ───────────────────────────────────────────────────────────────────────

export interface SeoGenerationResult {
  seo_title_ru: string
  seo_description_ru: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}
