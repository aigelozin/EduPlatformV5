import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Контакты',
  description: 'Свяжитесь с нами — мы всегда готовы помочь',
}

export default function ContactsPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-16 space-y-10">
      <section className="space-y-4">
        <h1 className="text-3xl font-bold">Контакты</h1>
        <p className="text-muted-foreground leading-relaxed">
          Если у вас есть вопросы — напишите нам, и мы ответим в течение рабочего дня.
        </p>
      </section>

      <section className="space-y-6">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Email</p>
          <a
            href="mailto:support@eduplatform.ru"
            className="text-primary hover:underline font-medium"
          >
            support@eduplatform.ru
          </a>
        </div>

        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Для преподавателей
          </p>
          <a
            href="mailto:teachers@eduplatform.ru"
            className="text-primary hover:underline font-medium"
          >
            teachers@eduplatform.ru
          </a>
        </div>

        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Техническая поддержка
          </p>
          <a
            href="mailto:tech@eduplatform.ru"
            className="text-primary hover:underline font-medium"
          >
            tech@eduplatform.ru
          </a>
        </div>

        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Юридический адрес
          </p>
          <p className="text-foreground">Россия, обновить перед деплоем</p>
        </div>
      </section>

      <section className="rounded-xl border bg-muted/40 px-6 py-5 space-y-2">
        <h2 className="font-semibold">Время ответа</h2>
        <p className="text-sm text-muted-foreground">
          Пн–Пт: 9:00–18:00 МСК. Обычно отвечаем в течение нескольких часов.
        </p>
      </section>
    </main>
  )
}
