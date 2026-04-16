import { db } from '@/lib/db/client'
import { AdminReviewActions } from './AdminReviewActions'

interface PageProps {
  searchParams: { rating?: string; visible?: string }
}

export default async function AdminReviewsPage({ searchParams }: PageProps) {
  const ratingFilter = searchParams.rating ? parseInt(searchParams.rating, 10) : undefined
  const visibleFilter =
    searchParams.visible === 'false' ? false : searchParams.visible === 'true' ? true : undefined

  let reviews: Array<{
    id: string
    rating: number
    text_ru: string | null
    reply_ru: string | null
    is_visible: boolean
    created_at: Date
    user: { name: string; email: string }
    product: { title_ru: string; slug: string }
  }> = []

  try {
    reviews = await db.review.findMany({
      where: {
        ...(ratingFilter && { rating: ratingFilter }),
        ...(visibleFilter !== undefined && { is_visible: visibleFilter }),
      },
      include: {
        user: { select: { name: true, email: true } },
        product: { select: { title_ru: true, slug: true } },
      },
      orderBy: { created_at: 'desc' },
      take: 100,
    })
  } catch {
    // DB unavailable
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Отзывы</h1>

      {/* Фильтры */}
      <form className="flex flex-wrap gap-2">
        <select
          name="rating"
          defaultValue={ratingFilter?.toString() ?? ''}
          className="rounded-lg border px-3 py-1.5 text-sm bg-background"
        >
          <option value="">Все оценки</option>
          {[1, 2, 3, 4, 5].map((r) => (
            <option key={r} value={r}>
              {'★'.repeat(r)} ({r})
            </option>
          ))}
        </select>
        <select
          name="visible"
          defaultValue={visibleFilter?.toString() ?? ''}
          className="rounded-lg border px-3 py-1.5 text-sm bg-background"
        >
          <option value="">Все</option>
          <option value="true">Видимые</option>
          <option value="false">Скрытые</option>
        </select>
        <button
          type="submit"
          className="px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
        >
          Фильтровать
        </button>
      </form>

      <div className="space-y-3">
        {reviews.length === 0 ? (
          <p className="text-muted-foreground text-sm py-8 text-center">Отзывы не найдены</p>
        ) : (
          reviews.map((review) => (
            <div
              key={review.id}
              className={`rounded-xl border bg-card p-4 ${
                review.rating <= 2 ? 'border-red-200 dark:border-red-800' : ''
              } ${!review.is_visible ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-yellow-500 text-sm">
                      {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                    </span>
                    <span className="font-medium text-sm">{review.user.name}</span>
                    <span className="text-xs text-muted-foreground">→</span>
                    <span className="text-sm text-primary">{review.product.title_ru}</span>
                    {!review.is_visible && (
                      <span className="text-xs bg-muted px-2 py-0.5 rounded-full">Скрыт</span>
                    )}
                    {review.rating <= 2 && (
                      <span className="text-xs bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 px-2 py-0.5 rounded-full">
                        Низкая оценка
                      </span>
                    )}
                  </div>
                  {review.text_ru && (
                    <p className="text-sm text-muted-foreground">{review.text_ru}</p>
                  )}
                  {review.reply_ru && (
                    <p className="text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950 px-3 py-2 rounded-lg">
                      <span className="font-medium">Ответ преподавателя:</span> {review.reply_ru}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {new Date(review.created_at).toLocaleDateString('ru-RU')}
                  </p>
                </div>
                <AdminReviewActions reviewId={review.id} isVisible={review.is_visible} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
