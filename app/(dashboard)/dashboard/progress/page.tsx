import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db/client'
import { BookOpen } from 'lucide-react'

export default async function StudentProgressPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const purchases = await db.purchase.findMany({
    where: { user_id: session.id },
    orderBy: { created_at: 'desc' },
    include: {
      product: {
        select: { id: true, title_ru: true, thumbnail_url: true, slug: true },
      },
    },
  })

  const progressList = purchases.length > 0
    ? await db.userProgress.findMany({
        where: {
          user_id: session.id,
          product_id: { in: purchases.map((p) => p.product_id) },
        },
        select: { product_id: true, progress_pct: true, completed_at: true },
      })
    : []

  const progressMap = new Map(progressList.map((p) => [p.product_id, p]))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Мои курсы</h1>
        <p className="mt-1 text-muted-foreground">Прогресс по купленным продуктам</p>
      </div>

      {purchases.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center">
          <BookOpen className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="mb-4 text-muted-foreground">У вас пока нет купленных курсов</p>
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Перейти в каталог
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {purchases.map((purchase) => {
            const progress = progressMap.get(purchase.product_id)
            const pct = progress?.progress_pct ?? 0
            const completed = !!progress?.completed_at

            return (
              <div
                key={purchase.id}
                className="rounded-lg border border-border bg-card overflow-hidden flex flex-col"
              >
                {purchase.product.thumbnail_url ? (
                  <img
                    src={purchase.product.thumbnail_url}
                    alt={purchase.product.title_ru}
                    className="h-40 w-full object-cover"
                  />
                ) : (
                  <div className="h-40 w-full bg-muted flex items-center justify-center">
                    <BookOpen className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}

                <div className="flex flex-1 flex-col p-4">
                  <p className="font-medium text-foreground line-clamp-2">
                    {purchase.product.title_ru}
                  </p>

                  {completed && (
                    <span className="mt-2 inline-flex w-fit rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      Завершён
                    </span>
                  )}

                  <div className="mt-auto pt-4">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Прогресс</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted">
                      <div
                        className="h-1.5 rounded-full bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <Link
                      href={`/catalog/${purchase.product.slug}`}
                      className="mt-3 inline-flex w-full items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      {pct > 0 ? 'Продолжить' : 'Начать'}
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
