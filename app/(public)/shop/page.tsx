import Link from 'next/link'
import type { Metadata } from 'next'
import { db } from '@/lib/db/client'

export const metadata: Metadata = {
  title: 'Магазин | EduPlatform',
  description: 'Книги, аксессуары, одежда — доставка по РФ.',
}

const TYPE_LABELS: Record<string, string> = {
  physical_book: 'Книга',
  souvenir: 'Аксессуар',
  apparel: 'Одежда',
}

const FILTERS = [
  { value: '', label: 'Все' },
  { value: 'physical_book', label: 'Книги' },
  { value: 'souvenir', label: 'Аксессуары' },
  { value: 'apparel', label: 'Одежда' },
] as const

type PhysicalType = 'physical_book' | 'souvenir' | 'apparel'

interface PageProps {
  searchParams: { type?: PhysicalType }
}

export default async function ShopPage({ searchParams }: PageProps) {
  const { type } = searchParams

  const where = {
    is_active: true,
    moderation_status: 'approved' as const,
    type: {
      in: (type ? [type] : ['physical_book', 'souvenir', 'apparel']) as PhysicalType[],
    },
  }

  const products = await db.product.findMany({
    where,
    select: {
      id: true,
      slug: true,
      type: true,
      title_ru: true,
      price: true,
      sale_price: true,
      thumbnail_url: true,
      category: { select: { name_ru: true } },
      _count: { select: { reviews: true } },
    },
    orderBy: { created_at: 'desc' },
  })

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-2">Магазин</h1>
      <p className="text-muted-foreground mb-8">
        Книги, аксессуары, одежда — доставка по РФ
      </p>

      {/* Фильтры по типу */}
      <div className="flex gap-2 flex-wrap mb-8">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={f.value ? `/shop?type=${f.value}` : '/shop'}
            className={`px-4 py-2 rounded-full text-sm border transition-colors ${
              (type ?? '') === f.value
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-accent'
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {/* Список товаров */}
      {products.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-xl">Товары не найдены</p>
          <Link href="/shop" className="mt-4 inline-block text-primary hover:underline">
            Сбросить фильтры
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="group rounded-xl border overflow-hidden hover:shadow-md transition-shadow bg-background flex flex-col"
            >
              <Link href={`/shop/${product.slug}`} className="flex-1">
                <div className="aspect-square bg-muted overflow-hidden">
                  {product.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.thumbnail_url}
                      alt={product.title_ru}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                      Нет фото
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {TYPE_LABELS[product.type] ?? product.type}
                    </span>
                    {product.category && (
                      <span className="text-xs text-muted-foreground">{product.category.name_ru}</span>
                    )}
                  </div>
                  <h3 className="font-semibold mt-1 line-clamp-2 group-hover:text-primary transition-colors">
                    {product.title_ru}
                  </h3>
                  <div className="flex items-center justify-between mt-3">
                    <div>
                      {product.sale_price ? (
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-primary">
                            {(product.sale_price / 100).toLocaleString('ru-RU')} ₽
                          </span>
                          <span className="text-xs text-muted-foreground line-through">
                            {(product.price / 100).toLocaleString('ru-RU')} ₽
                          </span>
                        </div>
                      ) : (
                        <span className="font-bold">
                          {(product.price / 100).toLocaleString('ru-RU')} ₽
                        </span>
                      )}
                    </div>
                    {product._count.reviews > 0 && (
                      <span className="text-xs text-muted-foreground">
                        ★ {product._count.reviews}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
              <div className="px-4 pb-4">
                <button
                  className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
                  data-product-id={product.id}
                  data-product-type={product.type}
                  data-product-title={product.title_ru}
                  data-product-price={product.sale_price ?? product.price}
                  data-product-thumbnail={product.thumbnail_url ?? ''}
                >
                  В корзину
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
