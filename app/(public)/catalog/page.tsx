import Link from 'next/link'
import type { Metadata } from 'next'
import { db } from '@/lib/db/client'
import { WaveCard } from '@/components/layout/WaveCard'
import { MobileWaveCard, WAVE_PALETTE } from '@/components/layout/MobileWaveCard'

export const metadata: Metadata = {
  title: 'Каталог курсов',
  description: 'Видеоуроки, курсы и вебинары по йоге, массажу, фитнесу, творчеству и бизнесу.',
}

const CATEGORIES = [
  { slug: 'yoga', name: 'Йога' },
  { slug: 'massage', name: 'Массаж' },
  { slug: 'fitness', name: 'Фитнес' },
  { slug: 'creativity', name: 'Творчество' },
  { slug: 'business', name: 'Бизнес' },
]

interface PageProps {
  searchParams: { category?: string; q?: string; page?: string }
}

export default async function CatalogPage({ searchParams }: PageProps) {
  const { category, q, page = '1' } = searchParams
  const pageNum = Math.max(1, parseInt(page, 10))
  const perPage = 12

  const where = {
    is_active: true,
    moderation_status: 'approved' as const,
    ...(category && { category: { slug: category } }),
    ...(q && {
      OR: [
        { title_ru: { contains: q, mode: 'insensitive' as const } },
        { description_ru: { contains: q, mode: 'insensitive' as const } },
      ],
    }),
  }

  type CatalogProduct = {
    id: string
    slug: string
    type: string
    title_ru: string
    price: number
    sale_price: number | null
    thumbnail_url: string | null
    category: { name_ru: string; slug: string } | null
    _count: { reviews: number; purchases: number }
  }

  let total = 0
  let products: CatalogProduct[] = []
  try {
    ;[total, products] = await Promise.all([
      db.product.count({ where }),
      db.product.findMany({
        where,
        select: {
          id: true,
          slug: true,
          type: true,
          title_ru: true,
          price: true,
          sale_price: true,
          thumbnail_url: true,
          category: { select: { name_ru: true, slug: true } },
          _count: { select: { reviews: true, purchases: true } },
        },
        orderBy: { created_at: 'desc' },
        skip: (pageNum - 1) * perPage,
        take: perPage,
      }) as unknown as CatalogProduct[],
    ])
  } catch {
    // DB unavailable — show empty state
  }

  const totalPages = Math.ceil(total / perPage)

  return (
    <div className="container py-10 relative z-10">
      <h1 className="mb-8 text-3xl font-bold text-[var(--text-foam)] animate-fade-up">
        ∿ Каталог курсов
      </h1>
      <p className="text-muted-foreground mb-8">Найдено: {total} курсов</p>

      {/* Фильтры по категориям */}
      <div className="flex gap-2 flex-wrap mb-8">
        <Link
          href="/catalog"
          className={`px-4 py-2 rounded-full text-sm border transition-colors ${
            !category ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
          }`}
        >
          Все
        </Link>
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.slug}
            href={`/catalog?category=${cat.slug}`}
            className={`px-4 py-2 rounded-full text-sm border transition-colors ${
              category === cat.slug ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
            }`}
          >
            {cat.name}
          </Link>
        ))}
      </div>

      {/* Список продуктов */}
      {products.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-xl">Курсы не найдены</p>
          <Link href="/catalog" className="mt-4 inline-block text-primary hover:underline">
            Сбросить фильтры
          </Link>
        </div>
      ) : (
        <>
          {/* Mobile: wave crest cards */}
          <div className="flex flex-col gap-4 sm:hidden">
            {products.map((product) => {
              const palette = WAVE_PALETTE[product.category?.slug ?? ''] ?? WAVE_PALETTE.massage
              return (
                <MobileWaveCard
                  key={product.id}
                  href={`/catalog/${product.slug}`}
                  title={product.title_ru}
                  category={product.category?.name_ru}
                  rating={product._count.reviews > 0 ? 4.8 : undefined}
                  waveColor={palette.color}
                  waveAccent={palette.accent}
                />
              )
            })}
          </div>

          {/* Desktop: standard grid */}
          <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <WaveCard
                key={product.id}
                waveColor="#0c1a38"
                waveAccent="oklch(0.63 0.26 272)"
                className="p-0 overflow-hidden"
                as="article"
              >
                <Link
                  href={`/catalog/${product.slug}`}
                  className="group flex flex-col h-full hover:no-underline"
                >
                  <div className="aspect-video bg-muted overflow-hidden">
                    {product.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.thumbnail_url}
                        alt={product.title_ru}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                        Нет обложки
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    {product.category && (
                      <span className="text-xs text-muted-foreground">{product.category.name_ru}</span>
                    )}
                    <h3 className="font-semibold mt-1 line-clamp-2 group-hover:text-primary transition-colors">
                      {product.title_ru}
                    </h3>
                    <div className="flex items-center justify-between mt-3 mt-auto">
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
              </WaveCard>
            ))}
          </div>
        </>
      )}

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-10">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/catalog?${new URLSearchParams({ ...(category ? { category } : {}), page: String(p) })}`}
              className={`w-10 h-10 flex items-center justify-center rounded-md border text-sm transition-colors ${
                p === pageNum ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
