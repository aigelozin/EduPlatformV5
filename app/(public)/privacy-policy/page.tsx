import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Политика конфиденциальности | EduPlatform' }

export default function PrivacyPolicyPage() {
  return (
    <div className="container max-w-3xl py-12">
      <h1 className="text-3xl font-bold mb-2">Политика конфиденциальности</h1>
      <p className="text-muted-foreground text-sm mb-8">Редакция от января 2026 г.</p>

      <div className="space-y-8 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold mb-3">1. Какие данные мы собираем</h2>
          <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
            <li>Имя, адрес электронной почты, номер телефона при регистрации</li>
            <li>Данные платёжных транзакций (без номеров карт — они обрабатываются платёжными системами)</li>
            <li>Адрес доставки при оформлении заказа на физические товары</li>
            <li>История просмотров курсов и прогресс обучения</li>
            <li>Технические данные: IP-адрес, браузер, cookie-файлы</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">2. Как мы используем данные</h2>
          <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
            <li>Обеспечение доступа к приобретённым курсам и материалам</li>
            <li>Обработка платежей и доставка физических товаров</li>
            <li>Отправка уведомлений об обновлениях курсов и трансляциях</li>
            <li>Улучшение качества платформы и пользовательского опыта</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">3. Хранение данных</h2>
          <p className="text-muted-foreground">
            Все персональные данные пользователей хранятся исключительно на серверах, расположенных на территории Российской Федерации, в соответствии с требованиями Федерального закона №152-ФЗ «О персональных данных». Мы не передаём данные третьим лицам, за исключением платёжных систем и служб доставки, необходимых для исполнения ваших заказов.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">4. Ваши права</h2>
          <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
            <li>Запрос копии своих персональных данных</li>
            <li>Исправление неточных данных</li>
            <li>Удаление аккаунта и всех связанных данных</li>
            <li>Отзыв согласия на обработку персональных данных</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">5. Контакты</h2>
          <p className="text-muted-foreground">
            По вопросам обработки персональных данных обращайтесь: <strong>privacy@eduplatform.ru</strong>
          </p>
        </section>
      </div>
    </div>
  )
}
