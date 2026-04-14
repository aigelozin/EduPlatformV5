import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Truck } from 'lucide-react'
import { db } from '@/lib/db/client'

interface PageProps {
  params: { slug: string }
}

const TYPE_LABELS: Record<string, string> = {
  physical_book: 'Книга',
  souvenir: 'Аксессуар',
  apparel: 'Одежда',
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const product = await db.product.findUnique({
    where: { slug: params.slug },
    select: { title_ru: true, seo_title_ru: true, seo_description_ru: true, thumbnail_url: true },
  })

  if (!product) return { title: 'Товар не найден' }

  return {
    title: product.seo_title_ru ?? product.title_ru,
    description: product.seo_description_ru ?? undefined,
    openGraph: {
      title: product.seo_title_ru ?? product.title_ru,
      description: product.seo_description_ru ?? undefined,
      ...(product.thumbnail_url && { images: [product.thumbnail_url] }),
    },
  }
}

export default async function ShopProductPage({ params }: PageProps) {
  const product = await db.product.findUnique({
    where: { slug: params.slug, is_active: true, moderation_status: 'approved' },
    include: {
      creator: { select: { name: true, avatar_url: true } },
      category: { select: { name_ru: true } },
      variants: { orderBy: { price: 'asc' } },
      _count: { select: { reviews: true } },
    },
  })

  if (!product) notFound()

  const displayPrice = product.sale_price ?? product.price

  return (
    <div className="container py-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Левая колонка: изображение */}
        <div className="space-y-3">
          <div className="aspect-square rounded-xl border overflow-hidden bg-muted">
            {product.thumbnail_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.thumbnail_url}
                alt={product.title_ru}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                Нет фото
              </div>
            )}
          </div>
        </div>

        {/* Правая колонка: информация */}
        <div className="space-y-5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {TYPE_LABELS[product.type] ?? product.type}
            </span>
            {product.category && (
              <span className="text-xs text-muted-foreground">{product.category.name_ru}</span>
            )}
          </div>

          <h1 className="text-3xl font-bold">{product.title_ru}</h1>

          {product.description_ru && (
            <p className="text-muted-foreground leading-relaxed">{product.description_ru}</p>
          )}

          {/* Цена */}
          <div>
            {product.sale_price ? (
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-primary">
                  {(product.sale_price / 100).toLocaleString('ru-RU')} ₽
                </span>
                <span className="text-lg text-muted-foreground line-through">
                  {(product.price / 100).toLocaleString('ru-RU')} ₽
                </span>
              </div>
            ) : (
              <span className="text-3xl font-bold">
                {(product.price / 100).toLocaleString('ru-RU')} ₽
              </span>
            )}
          </div>

          {/* Варианты */}
          {product.variants.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold">Варианты:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {product.variants.map((variant) => (
                  <div
                    key={variant.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                  >
                    <div>
                      <p className="text-sm font-medium">{variant.name_ru}</p>
                      {variant.stock !== null && (
                        <p className="text-xs text-muted-foreground">
                          {variant.stock > 0 ? `В наличии: ${variant.stock}` : 'Нет в наличии'}
                        </p>
                      )}
                    </div>
                    <span className="text-sm font-bold">
                      {(variant.price / 100).toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Кнопка В корзину */}
          <button
            className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            data-product-id={product.id}
            data-product-type={product.type}
            data-product-title={product.title_ru}
            data-product-price={displayPrice}
            data-product-thumbnail={product.thumbnail_url ?? ''}
          >
            В корзину
          </button>

          {/* Блок доставки */}
          <div className="flex items-start gap-3 p-4 rounded-xl border bg-muted/20">
            <Truck className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold">Доставка по РФ</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                CDEK и Boxberry — расчёт стоимости при оформлении заказа
              </p>
            </div>
          </div>

          {/* Автор и отзывы */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              {product.creator.avatar_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.creator.avatar_url}
                  alt={product.creator.name}
                  className="w-7 h-7 rounded-full object-cover"
                />
              )}
              <span>{product.creator.name}</span>
            </div>
            {product._count.reviews > 0 && (
              <span>★ {product._count.reviews} отзывов</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
