import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Соглашение преподавателя | EduPlatform' }

export default function TeacherAgreementPage() {
  return (
    <div className="container max-w-3xl py-12">
      <h1 className="text-3xl font-bold mb-2">Соглашение преподавателя</h1>
      <p className="text-muted-foreground text-sm mb-8">Редакция от января 2026 г.</p>

      <div className="space-y-8 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold mb-3">1. Условия размещения контента</h2>
          <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
            <li>Вы гарантируете, что являетесь правообладателем всех размещаемых материалов</li>
            <li>Контент должен соответствовать тематике платформы и российскому законодательству</li>
            <li>Запрещены материалы, нарушающие авторские права третьих лиц</li>
            <li>Все новые продукты проходят модерацию перед публикацией (до 3 рабочих дней)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">2. Комиссия платформы</h2>
          <p className="text-muted-foreground">
            Платформа удерживает комиссию в размере, указанном в вашем личном кабинете, от каждой успешной продажи. Процент устанавливается платформой и может быть изменён с уведомлением за 30 дней.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">3. Требования к материалам</h2>
          <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
            <li>Видео: рекомендуемое разрешение 1080p, форматы MP4/MOV</li>
            <li>Длительность урока: от 5 до 120 минут</li>
            <li>Обложка курса: 16:9, минимум 1280×720 px</li>
            <li>Описание на русском языке (обязательно), на английском (опционально)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">4. Выплаты</h2>
          <p className="text-muted-foreground">
            Выплаты производятся ежемесячно, в первые 5 рабочих дней следующего месяца. Минимальная сумма выплаты — 1 000 ₽. Выплаты осуществляются через YooKassa на банковскую карту или счёт ИП/ООО, указанный в профиле преподавателя.
          </p>
        </section>
      </div>
    </div>
  )
}
