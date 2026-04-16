import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'О нас',
  description: 'Образовательная платформа для преподавателей йоги, массажа, фитнеса и творчества',
}

export default function AboutPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-16 space-y-10">
      <section className="space-y-4">
        <h1 className="text-3xl font-bold">О платформе</h1>
        <p className="text-muted-foreground leading-relaxed">
          Мы создаём пространство, где преподаватели йоги, массажа, фитнеса, творчества и бизнеса
          делятся знаниями, а ученики находят курсы и наставников в одном месте.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Для преподавателей</h2>
        <ul className="space-y-2 text-muted-foreground leading-relaxed list-disc list-inside">
          <li>Публикуйте курсы, уроки и физические товары</li>
          <li>Проводите прямые трансляции с интерактивным чатом</li>
          <li>Получайте выплаты через ЮKassa, CryptoCloud и МИР Pay</li>
          <li>Отслеживайте аналитику продаж в личном кабинете</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Для учеников</h2>
        <ul className="space-y-2 text-muted-foreground leading-relaxed list-disc list-inside">
          <li>Покупайте отдельные курсы или оформляйте подписку</li>
          <li>Учитесь в удобном темпе — материалы всегда доступны</li>
          <li>Участвуйте в живых трансляциях и задавайте вопросы</li>
          <li>Заказывайте физические товары с доставкой СДЭК и Boxberry</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Юрисдикция и безопасность</h2>
        <p className="text-muted-foreground leading-relaxed">
          Платформа зарегистрирована в России, соответствует ФЗ-152 «О персональных данных».
          Все данные хранятся на российских серверах. Платежи обрабатываются через лицензированных
          российских провайдеров.
        </p>
      </section>
    </main>
  )
}
