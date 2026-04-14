import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Пользовательское соглашение | EduPlatform' }

export default function TermsPage() {
  return (
    <div className="container max-w-3xl py-12">
      <h1 className="text-3xl font-bold mb-2">Пользовательское соглашение</h1>
      <p className="text-muted-foreground text-sm mb-8">Редакция от января 2026 г.</p>

      <div className="space-y-8 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold mb-3">1. Предмет соглашения</h2>
          <p className="text-muted-foreground">
            Настоящее соглашение регулирует отношения между платформой EduPlatform и пользователями. Регистрируясь на платформе, вы принимаете условия данного соглашения в полном объёме.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">2. Права и обязанности пользователя</h2>
          <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
            <li>Использовать приобретённые материалы только в личных, некоммерческих целях</li>
            <li>Не распространять и не копировать платный контент</li>
            <li>Предоставлять достоверные данные при регистрации</li>
            <li>Соблюдать правила сообщества и уважительно относиться к преподавателям</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">3. Оплата и возврат</h2>
          <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
            <li>Оплата принимается через YooKassa, CryptoCloud и МИР Pay</li>
            <li>Возврат средств за цифровые товары — в течение 14 дней, если материал не был просмотрен более чем на 20%</li>
            <li>Возврат за физические товары — согласно закону о защите прав потребителей (14 дней, без следов использования)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">4. Ответственность</h2>
          <p className="text-muted-foreground">
            Платформа не несёт ответственности за прямые или косвенные убытки, связанные с использованием образовательных материалов. Все материалы предоставляются «как есть» и носят информационный характер.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">5. Реквизиты</h2>
          <p className="text-muted-foreground">
            ООО «ЭдуПлатформ», ИНН: XXXXXXXXXX, Россия<br />
            Адрес: г. Москва<br />
            Email: legal@eduplatform.ru
          </p>
        </section>
      </div>
    </div>
  )
}
