import Link from 'next/link'
import type { Metadata } from 'next'
import { CheckCircle } from 'lucide-react'
import { db } from '@/lib/db/client'

export const metadata: Metadata = {
  title: 'Подписки | EduPlatform',
  description: 'Получите неограниченный доступ ко всем курсам платформы. Йога, массаж, фитнес, творчество и бизнес.',
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
  return `${days} ${days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'}`
}

const BENEFITS = [
  'Неограниченный просмотр всех курсов категории',
  'Новые уроки каждую неделю без доплат',
  'Вопросы преподавателям в любое время',
  'Доступ к записям прошедших трансляций',
]

const FAQ = [
  {
    q: 'Как отменить подписку?',
    a: 'Вы можете отменить подписку в любой момент в личном кабинете. Доступ сохраняется до конца оплаченного периода.',
  },
  {
    q: 'Что если я уже купил курс?',
    a: 'Купленные курсы остаются у вас навсегда. Подписка даёт дополнительный доступ к остальным курсам категории.',
  },
  {
    q: 'Есть ли пробный период?',
    a: 'Многие уроки доступны бесплатно без подписки — вы можете оценить качество материалов перед покупкой.',
  },
]

export default async function SubscriptionsPage() {
  type SubscriptionPlan = {
    id: string
    name_ru: string
    price: number
    duration_days: number
    product: {
      id: string
      slug: string
      title_ru: string
      thumbnail_url: string | null
      category: { name_ru: string; slug: string } | null
    } | null
  }

  let plans: SubscriptionPlan[] = []
  try {
    plans = await db.subscription.findMany({
      where: { is_active: true },
      include: {
        product: {
          select: {
            id: true,
            slug: true,
            title_ru: true,
            thumbnail_url: true,
            category: { select: { name_ru: true, slug: true } },
          },
        },
      },
      orderBy: { price: 'asc' },
    }) as unknown as SubscriptionPlan[]
  } catch {
    // DB unavailable — show empty state
  }

  // Выделяем "популярный" план — средний по цене
  const featuredIndex = Math.floor(plans.length / 2)

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/10 to-background py-20 text-center">
        <div className="container space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Неограниченный доступ к курсам</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Оформите подписку и получите доступ ко всем урокам категории — без ограничений по количеству.
          </p>
        </div>
      </section>

      {/* Планы подписок */}
      <section className="container py-16">
        {plans.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-xl">Планы подписок скоро появятся</p>
            <Link href="/catalog" className="mt-4 inline-block text-primary hover:underline">
              Смотреть каталог курсов →
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-center mb-10">Выберите план</h2>
            <div className={`grid gap-6 ${plans.length === 1 ? 'max-w-sm mx-auto' : plans.length === 2 ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
              {plans.map((plan, idx) => {
                const isFeatured = idx === featuredIndex && plans.length > 1
                return (
                  <div
                    key={plan.id}
                    className={`rounded-2xl border p-6 flex flex-col gap-4 bg-background transition-shadow hover:shadow-md ${
                      isFeatured ? 'ring-2 ring-primary shadow-md' : ''
                    }`}
                  >
                    {isFeatured && (
                      <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                        Популярный выбор
                      </span>
                    )}

                    <div>
                      <h3 className="text-lg font-bold">{plan.name_ru}</h3>
                      {plan.product?.category && (
                        <p className="text-sm text-muted-foreground mt-1">{plan.product.category.name_ru}</p>
                      )}
                    </div>

                    <div>
                      <span className="text-3xl font-bold">
                        {(plan.price / 100).toLocaleString('ru-RU')} ₽
                      </span>
                      <span className="text-muted-foreground text-sm ml-1">
                        / {formatDuration(plan.duration_days)}
                      </span>
                    </div>

                    <ul className="space-y-2 flex-1">
                      {BENEFITS.map((benefit) => (
                        <li key={benefit} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          {benefit}
                        </li>
                      ))}
                    </ul>

                    <Link
                      href="/login"
                      className={`w-full py-3 rounded-lg text-center font-semibold transition-colors ${
                        isFeatured
                          ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                          : 'border hover:bg-accent'
                      }`}
                    >
                      Оформить подписку
                    </Link>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </section>

      {/* Что входит */}
      <section className="bg-muted/40 py-16">
        <div className="container">
          <h2 className="text-2xl font-bold text-center mb-10">Что входит в подписку</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {BENEFITS.map((benefit) => (
              <div key={benefit} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="container py-16 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8">Частые вопросы</h2>
        <div className="space-y-6">
          {FAQ.map((item) => (
            <div key={item.q} className="rounded-xl border p-5">
              <p className="font-semibold mb-2">{item.q}</p>
              <p className="text-sm text-muted-foreground">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary/5 py-16 text-center">
        <div className="container space-y-4">
          <h2 className="text-2xl font-bold">Готовы начать?</h2>
          <p className="text-muted-foreground">Зарегистрируйтесь и оформите подписку за пару минут</p>
          <Link
            href="/login"
            className="inline-block px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            Начать сейчас
          </Link>
        </div>
      </section>
    </div>
  )
}
