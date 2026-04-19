import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { db } from '@/lib/db/client'
import { WaveCard } from '@/components/layout/WaveCard'

interface PageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const product = await db.product.findUnique({
      where: { slug: params.slug },
      select: { title_ru: true, seo_title_ru: true, seo_description_ru: true, thumbnail_url: true },
    })
    if (!product) return { title: 'Курс не найден' }
    return {
      title: product.seo_title_ru ?? product.title_ru,
      description: product.seo_description_ru ?? undefined,
      openGraph: {
        title: product.seo_title_ru ?? product.title_ru,
        description: product.seo_description_ru ?? undefined,
        ...(product.thumbnail_url && { images: [product.thumbnail_url] }),
      },
    }
  } catch {
    return { title: 'Курс не найден' }
  }
}

export default async function ProductPage({ params }: PageProps) {
  type ProductFull = {
    id: string
    title_ru: string
    description_ru: string | null
    price: number
    sale_price: number | null
    thumbnail_url: string | null
    creator: { name: string; avatar_url: string | null; bio_ru: string | null }
    category: { name_ru: string; slug: string } | null
    lessons: {
      id: string
      title_ru: string
      is_free: boolean
      duration_sec: number | null
      sort_order: number
    }[]
    _count: { purchases: number; reviews: number }
  }

  let product: ProductFull | null = null
  try {
    product = await db.product.findUnique({
      where: { slug: params.slug, is_active: true, moderation_status: 'approved' },
      include: {
        creator: { select: { name: true, avatar_url: true, bio_ru: true } },
        category: { select: { name_ru: true, slug: true } },
        lessons: { orderBy: { sort_order: 'asc' } },
        _count: { select: { purchases: true, reviews: true } },
      },
    }) as ProductFull | null
  } catch {
    // DB unavailable
  }

  if (!product) notFound()

  const priceDisplay = product.sale_price
    ? `${(product.sale_price / 100).toLocaleString('ru-RU')} ₽`
    : `${(product.price / 100).toLocaleString('ru-RU')} ₽`

  return (
    <div className="container py-10 relative z-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Основная информация */}
        <div className="lg:col-span-2 space-y-6">
          {/* Wave Hero Section */}
          <section
            className="relative z-10 overflow-hidden rounded-3xl mx-4 mt-4 p-8 md:p-12 mb-8"
            style={{
              background: `linear-gradient(160deg, #081228 0%, oklch(0.63 0.26 272 / 0.2) 100%)`,
              border: '1px solid var(--card-border)',
            }}
          >
            <h1 className="mb-3 text-3xl font-bold text-[var(--text-foam)] md:text-4xl">
              {product.title_ru}
            </h1>
            {product.description_ru && (
              <p className="text-[var(--text-muted-foam)]">{product.description_ru}</p>
            )}
          </section>

          {product.thumbnail_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.thumbnail_url}
              alt={product.title_ru}
              className="w-full rounded-xl aspect-video object-cover"
            />
          )}

          {product.category && (
            <span className="text-sm text-muted-foreground">{product.category.name_ru}</span>
          )}

          {/* Программа курса */}
          {product.lessons.length > 0 && (
            <WaveCard className="p-6 relative z-10">
              <h2 className="text-xl font-semibold mb-4">
                Программа ({product.lessons.length} уроков)
              </h2>
              <div className="space-y-2">
                {product.lessons.map((lesson, idx) => (
                  <div
                    key={lesson.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30"
                  >
                    <span className="text-sm text-muted-foreground w-6 shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-sm flex-1">{lesson.title_ru}</span>
                    {lesson.is_free && (
                      <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-2 py-0.5 rounded-full">
                        Бесплатно
                      </span>
                    )}
                    {lesson.duration_sec && (
                      <span className="text-xs text-muted-foreground shrink-0">
                        {Math.round(lesson.duration_sec / 60)} мин
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </WaveCard>
          )}

          {/* Преподаватель */}
          <WaveCard className="p-6 relative z-10">
            <div className="flex items-center gap-4">
              {product.creator.avatar_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.creator.avatar_url}
                  alt={product.creator.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              )}
              <div>
                <p className="font-semibold">{product.creator.name}</p>
                {product.creator.bio_ru && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {product.creator.bio_ru}
                  </p>
                )}
              </div>
            </div>
          </WaveCard>
        </div>

        {/* Карточка покупки */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 rounded-xl border p-6 space-y-4 bg-background">
            <div>
              {product.sale_price ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-primary">
                    {(product.sale_price / 100).toLocaleString('ru-RU')} ₽
                  </span>
                  <span className="text-lg text-muted-foreground line-through">
                    {(product.price / 100).toLocaleString('ru-RU')} ₽
                  </span>
                </div>
              ) : (
                <span className="text-3xl font-bold">{priceDisplay}</span>
              )}
            </div>

            <button className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors">
              Купить
            </button>

            <div className="text-xs text-muted-foreground space-y-1 text-center">
              <p>Оплата: YooKassa · МИР Pay · Крипто</p>
              <p>{product._count.purchases} покупок · {product._count.reviews} отзывов</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
