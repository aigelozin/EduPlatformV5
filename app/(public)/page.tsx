import Link from 'next/link'
import type { Metadata } from 'next'
import { ChatWidget } from '@/components/ai-chat/ChatWidget'
import { db } from '@/lib/db/client'

export const metadata: Metadata = {
  title: 'EduPlatform — Йога, массаж, фитнес онлайн',
  description: 'Образовательная платформа: видеоуроки, курсы, прямые трансляции и физические товары. Йога, массаж, фитнес, творчество, бизнес.',
}

function formatDuration(days: number): string {
  if (days >= 365) {
    const years = Math.round(days / 365)
    return `${years} ${years === 1 ? 'год' : years < 5 ? 'года' : 'лет'}`
  }
  if (days >= 30) {
    const months = Math.round(days / 30)
    return `${months} ${months === 1 ? 'месяц' : months < 5 ? 'месяца' : 'месяцев'}`
  }
  return `${days} дней`
}

export default async function HomePage() {
  const [popularProducts, featuredPlans] = await Promise.all([
    db.product.findMany({
      where: { is_active: true, moderation_status: 'approved' },
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
      take: 4,
    }),
    db.subscription.findMany({
      where: { is_active: true },
      include: {
        product: {
          select: {
            title_ru: true,
            category: { select: { name_ru: true } },
          },
        },
      },
      orderBy: { price: 'asc' },
      take: 3,
    }),
  ])

  return (
    <>
      {/* 1. Hero */}
      <section className="relative bg-gradient-to-br from-primary/10 to-background py-24">
        <div className="container text-center space-y-6">
          <h1 className="text-5xl font-bold tracking-tight">
            Учись у лучших преподавателей
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Йога, массаж, фитнес, творчество и бизнес — онлайн-курсы, прямые трансляции и физические товары в одном месте.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/catalog"
              className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Смотреть курсы
            </Link>
            <Link
              href="/subscriptions"
              className="px-8 py-3 border rounded-lg font-semibold hover:bg-accent transition-colors"
            >
              Подписки
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Категории */}
      <section className="container py-16">
        <h2 className="text-3xl font-bold mb-8 text-center">Категории</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { slug: 'yoga', name: 'Йога', emoji: '🧘' },
            { slug: 'massage', name: 'Массаж', emoji: '💆' },
            { slug: 'fitness', name: 'Фитнес', emoji: '💪' },
            { slug: 'creativity', name: 'Творчество', emoji: '🎨' },
            { slug: 'business', name: 'Бизнес', emoji: '📈' },
          ].map((cat) => (
            <Link
              key={cat.slug}
              href={`/catalog?category=${cat.slug}`}
              className="flex flex-col items-center gap-2 p-6 rounded-xl border hover:bg-accent hover:border-primary transition-all group"
            >
              <span className="text-4xl">{cat.emoji}</span>
              <span className="font-medium text-sm">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Популярные курсы */}
      {popularProducts.length > 0 && (
        <section className="bg-muted/40 py-16">
          <div className="container">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold">Популярные курсы</h2>
              <Link href="/catalog" className="text-primary hover:underline text-sm">Все курсы →</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {popularProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/catalog/${product.slug}`}
                  className="group bg-background rounded-xl border overflow-hidden hover:shadow-md transition-shadow"
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
                  <div className="p-4 space-y-1">
                    {product.category && (
                      <span className="text-xs text-muted-foreground">{product.category.name_ru}</span>
                    )}
                    <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                      {product.title_ru}
                    </h3>
                    <div className="flex items-center justify-between pt-1">
                      {product.sale_price ? (
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-primary text-sm">
                            {(product.sale_price / 100).toLocaleString('ru-RU')} ₽
                          </span>
                          <span className="text-xs text-muted-foreground line-through">
                            {(product.price / 100).toLocaleString('ru-RU')} ₽
                          </span>
                        </div>
                      ) : (
                        <span className="font-bold text-sm">
                          {(product.price / 100).toLocaleString('ru-RU')} ₽
                        </span>
                      )}
                      {product._count.reviews > 0 && (
                        <span className="text-xs text-muted-foreground">★ {product._count.reviews}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. Преимущества */}
      <section className="container py-16">
        <h2 className="text-3xl font-bold mb-10 text-center">Почему EduPlatform</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: '🎥', title: 'Видео на российских платформах', desc: 'VK Video и RuTube — стабильная работа в России без VPN' },
            { icon: '💳', title: 'Удобная оплата', desc: 'Банковские карты, СБП, МИР Pay, криптовалюта' },
            { icon: '🔒', title: 'Защита данных', desc: 'Все данные хранятся на серверах в России согласно ФЗ-152' },
          ].map((item) => (
            <div key={item.title} className="text-center space-y-3">
              <div className="text-5xl">{item.icon}</div>
              <h3 className="font-semibold text-lg">{item.title}</h3>
              <p className="text-muted-foreground text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Трансляции */}
      <section className="bg-muted/40 py-16">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">Прямые трансляции</h2>
            <Link href="/live" className="text-primary hover:underline text-sm">Расписание →</Link>
          </div>
          <p className="text-muted-foreground">Расписание трансляций загружается — появится в следующей фазе</p>
        </div>
      </section>

      {/* 6. Подписки */}
      <section className="container py-16">
        <h2 className="text-3xl font-bold mb-4 text-center">Планы подписок</h2>
        <p className="text-muted-foreground text-center mb-8">Получите неограниченный доступ к курсам категории</p>
        {featuredPlans.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {featuredPlans.map((plan) => (
                <div key={plan.id} className="rounded-xl border p-5 bg-background hover:shadow-sm transition-shadow">
                  <p className="font-semibold">{plan.name_ru}</p>
                  {plan.product.category && (
                    <p className="text-xs text-muted-foreground mt-0.5">{plan.product.category.name_ru}</p>
                  )}
                  <p className="text-2xl font-bold mt-3">
                    {(plan.price / 100).toLocaleString('ru-RU')} ₽
                    <span className="text-sm font-normal text-muted-foreground ml-1">
                      / {formatDuration(plan.duration_days)}
                    </span>
                  </p>
                  <Link
                    href="/subscriptions"
                    className="mt-4 block text-center py-2 border rounded-lg text-sm hover:bg-accent transition-colors"
                  >
                    Подробнее
                  </Link>
                </div>
              ))}
            </div>
            <div className="text-center">
              <Link
                href="/subscriptions"
                className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                Все планы подписок
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center">
            <Link
              href="/subscriptions"
              className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Смотреть планы
            </Link>
          </div>
        )}
      </section>

      {/* 7. Магазин */}
      <section className="bg-muted/40 py-16">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">Магазин</h2>
            <Link href="/shop" className="text-primary hover:underline text-sm">Все товары →</Link>
          </div>
          <p className="text-muted-foreground">Книги, аксессуары, одежда — доставка по РФ через CDEK и Boxberry</p>
        </div>
      </section>

      {/* 8. Стать преподавателем */}
      <section className="container py-16 text-center">
        <h2 className="text-3xl font-bold mb-4">Вы преподаватель?</h2>
        <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
          Создавайте и продавайте свои курсы. Получайте выплаты через YooKassa.
        </p>
        <Link
          href="/become-teacher"
          className="px-8 py-3 border-2 border-primary text-primary rounded-lg font-semibold hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          Стать преподавателем
        </Link>
      </section>

      {/* 9. Преподаватели */}
      <section className="bg-muted/40 py-16">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">Наши преподаватели</h2>
            <Link href="/teachers" className="text-primary hover:underline text-sm">Все преподаватели →</Link>
          </div>
          <p className="text-muted-foreground">Список преподавателей — в следующей фазе</p>
        </div>
      </section>

      {/* 10. Отзывы */}
      <section className="container py-16">
        <h2 className="text-3xl font-bold mb-8 text-center">Отзывы студентов</h2>
        <p className="text-muted-foreground text-center">Отзывы загружаются динамически — в следующей фазе</p>
      </section>

      {/* 11. Доставка */}
      <section className="bg-muted/40 py-8">
        <div className="container flex flex-col sm:flex-row items-center justify-center gap-8 text-center">
          <div>
            <p className="font-semibold">📦 CDEK</p>
            <p className="text-sm text-muted-foreground">Доставка по всей России и СНГ</p>
          </div>
          <div>
            <p className="font-semibold">📦 Boxberry</p>
            <p className="text-sm text-muted-foreground">Пункты выдачи по России</p>
          </div>
          <div>
            <p className="font-semibold">💳 МИР Pay · СБП · Крипто</p>
            <p className="text-sm text-muted-foreground">Удобные методы оплаты</p>
          </div>
        </div>
      </section>

      {/* 12. CTA нижний */}
      <section className="container py-20 text-center">
        <h2 className="text-3xl font-bold mb-4">Начните обучение сегодня</h2>
        <p className="text-muted-foreground mb-8">Первый урок — бесплатно</p>
        <Link
          href="/register"
          className="px-10 py-4 bg-primary text-primary-foreground rounded-lg text-lg font-semibold hover:bg-primary/90 transition-colors"
        >
          Зарегистрироваться бесплатно
        </Link>
      </section>

      {/* AI Chat Widget */}
      <ChatWidget />
    </>
  )
}
