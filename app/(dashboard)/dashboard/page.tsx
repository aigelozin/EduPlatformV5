import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db/client'
import { BookOpen, ShoppingBag, CreditCard, ArrowRight } from 'lucide-react'
import { WaveCard } from '@/components/layout/WaveCard'

function WaveProgress({ value, accent }: { value: number; accent?: string }) {
  return (
    <div className="relative mt-2 h-3 overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: `${value}%`,
          background: accent
            ? `linear-gradient(90deg, ${accent}99, ${accent})`
            : 'linear-gradient(90deg, var(--wave-accent)99, var(--wave-accent))',
        }}
      />
      <svg
        viewBox="0 0 100 12"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full opacity-30"
        style={{ clipPath: `inset(0 ${100 - value}% 0 0)` }}
        aria-hidden="true"
      >
        <path
          d="M0,6 C10,2 20,10 30,6 C40,2 50,10 60,6 C70,2 80,10 90,6 C95,4 98,8 100,6"
          fill="none"
          stroke="white"
          strokeWidth="2"
        />
      </svg>
    </div>
  )
}

export default async function StudentDashboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  let activeSubscriptions = 0
  let purchasesCount = 0
  let ordersCount = 0
  let recentPurchases: {
    id: string
    product_id: string
    product: { id: string; title_ru: string; thumbnail_url: string | null }
  }[] = []

  try {
    ;[activeSubscriptions, purchasesCount, ordersCount, recentPurchases] = await Promise.all([
      db.userSubscription.count({
        where: { user_id: session.id, expires_at: { gt: now } },
      }),
      db.purchase.count({ where: { user_id: session.id } }),
      db.order.count({ where: { user_id: session.id } }),
      db.purchase.findMany({
        where: { user_id: session.id },
        take: 3,
        orderBy: { created_at: 'desc' },
        include: {
          product: {
            select: { id: true, title_ru: true, thumbnail_url: true },
          },
        },
      }),
    ])
  } catch {
    // DB unavailable — show empty state
  }

  // Fetch progress for recent purchases
  const progressMap = new Map<string, number>()
  try {
    if (recentPurchases.length > 0) {
      const progresses = await db.userProgress.findMany({
        where: {
          user_id: session.id,
          product_id: { in: recentPurchases.map((p) => p.product_id) },
        },
        select: { product_id: true, progress_pct: true },
      })
      progresses.forEach((p) => progressMap.set(p.product_id, p.progress_pct))
    }
  } catch {
    // DB unavailable
  }

  const stats = [
    { label: 'Активные подписки', value: activeSubscriptions, icon: CreditCard },
    { label: 'Купленные курсы', value: purchasesCount, icon: BookOpen },
    { label: 'Заказы', value: ordersCount, icon: ShoppingBag },
  ]

  return (
    <div className="space-y-8 relative z-10">
      <div className="mb-8 animate-fade-up relative z-10">
        <h1 className="text-2xl font-bold text-[var(--text-foam)]">
          Привет ∿
        </h1>
        <p className="text-sm text-[var(--text-muted-foam)]">Продолжай обучение</p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <WaveCard key={label} className="p-5 relative z-10">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{label}</p>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
          </WaveCard>
        ))}
      </div>

      {/* Continue learning */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Продолжить обучение</h2>

        {recentPurchases.length === 0 ? (
          <WaveCard className="p-8 text-center relative z-10 border-dashed">
            <BookOpen className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="mb-4 text-muted-foreground">У вас пока нет купленных курсов</p>
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Перейти в каталог
              <ArrowRight className="h-4 w-4" />
            </Link>
          </WaveCard>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentPurchases.map((purchase) => {
              const progress = progressMap.get(purchase.product_id) ?? 0
              return (
                <WaveCard key={purchase.id} className="overflow-hidden relative z-10">
                  {purchase.product.thumbnail_url ? (
                    <img
                      src={purchase.product.thumbnail_url}
                      alt={purchase.product.title_ru}
                      className="h-36 w-full object-cover"
                    />
                  ) : (
                    <div className="h-36 w-full bg-muted flex items-center justify-center">
                      <BookOpen className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="p-4">
                    <p className="font-medium text-foreground line-clamp-2">
                      {purchase.product.title_ru}
                    </p>
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Прогресс</span>
                        <span>{progress}%</span>
                      </div>
                      <WaveProgress value={progress} />
                    </div>
                    <Link
                      href={`/catalog/${purchase.product_id}`}
                      className="mt-3 inline-flex w-full items-center justify-center rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent"
                    >
                      Продолжить
                    </Link>
                  </div>
                </WaveCard>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
