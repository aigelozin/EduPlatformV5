import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db/client'
import { BookOpen, ShoppingBag, CreditCard, ArrowRight } from 'lucide-react'

export default async function StudentDashboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [activeSubscriptions, purchasesCount, ordersCount, recentPurchases] = await Promise.all([
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

  // Fetch progress for recent purchases
  const progressMap = new Map<string, number>()
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

  const stats = [
    { label: 'Активные подписки', value: activeSubscriptions, icon: CreditCard },
    { label: 'Купленные курсы', value: purchasesCount, icon: BookOpen },
    { label: 'Заказы', value: ordersCount, icon: ShoppingBag },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Добро пожаловать, {session.name}
        </h1>
        <p className="mt-1 text-muted-foreground">Ваш личный кабинет</p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-lg border border-border bg-card p-5"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{label}</p>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
          </div>
        ))}
      </div>

      {/* Continue learning */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Продолжить обучение</h2>

        {recentPurchases.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center">
            <BookOpen className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="mb-4 text-muted-foreground">У вас пока нет купленных курсов</p>
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Перейти в каталог
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentPurchases.map((purchase) => {
              const progress = progressMap.get(purchase.product_id) ?? 0
              return (
                <div
                  key={purchase.id}
                  className="rounded-lg border border-border bg-card overflow-hidden"
                >
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
                      <div className="h-1.5 w-full rounded-full bg-muted">
                        <div
                          className="h-1.5 rounded-full bg-primary transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                    <Link
                      href={`/catalog/${purchase.product_id}`}
                      className="mt-3 inline-flex w-full items-center justify-center rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent"
                    >
                      Продолжить
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
