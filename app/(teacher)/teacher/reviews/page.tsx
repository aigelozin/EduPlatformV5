import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db/client'
import { TeacherReviewReply } from './TeacherReviewReply'

export default async function TeacherReviewsPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  let reviews: Array<{
    id: string
    rating: number
    text_ru: string | null
    reply_ru: string | null
    replied_at: Date | null
    created_at: Date
    user: { name: string }
    product: { title_ru: string; id: string }
  }> = []

  try {
    reviews = await db.review.findMany({
      where: {
        product: { creator_id: session.id },
        is_visible: true,
      },
      include: {
        user: { select: { name: true } },
        product: { select: { title_ru: true, id: true } },
      },
      orderBy: { created_at: 'desc' },
      take: 100,
    })
  } catch {
    // DB unavailable
  }

  // Группируем по продукту
  const byProduct = new Map<string, { title: string; reviews: typeof reviews }>()
  for (const r of reviews) {
    if (!byProduct.has(r.product.id)) {
      byProduct.set(r.product.id, { title: r.product.title_ru, reviews: [] })
    }
    byProduct.get(r.product.id)!.reviews.push(r)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Отзывы</h1>

      {reviews.length === 0 ? (
        <p className="text-muted-foreground">Отзывов пока нет</p>
      ) : (
        Array.from(byProduct.entries()).map(([productId, { title, reviews: productReviews }]) => (
          <div key={productId} className="space-y-3">
            <h2 className="text-base font-semibold">{title}</h2>
            {productReviews.map((review) => (
              <div key={review.id} className="rounded-xl border bg-card p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-yellow-500">
                    {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                  </span>
                  <span className="text-sm font-medium">{review.user.name}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {new Date(review.created_at).toLocaleDateString('ru-RU')}
                  </span>
                </div>
                {review.text_ru && (
                  <p className="text-sm text-muted-foreground">{review.text_ru}</p>
                )}
                {review.reply_ru ? (
                  <div className="text-sm bg-green-50 dark:bg-green-950 px-3 py-2 rounded-lg text-green-700 dark:text-green-300">
                    <span className="font-medium">Ваш ответ:</span> {review.reply_ru}
                  </div>
                ) : (
                  <TeacherReviewReply reviewId={review.id} />
                )}
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  )
}
