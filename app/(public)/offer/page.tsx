import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Публичная оферта | EduPlatform' }

export default function OfferPage() {
  return (
    <div className="container max-w-3xl py-12">
      <h1 className="text-3xl font-bold mb-2">Публичная оферта</h1>
      <p className="text-muted-foreground text-sm mb-8">на оказание образовательных и информационных услуг</p>

      <div className="space-y-8 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold mb-3">1. Общие положения</h2>
          <p className="text-muted-foreground">
            Настоящая публичная оферта является официальным предложением ООО «ЭдуПлатформ» (далее — «Исполнитель») любому физическому лицу (далее — «Заказчик») заключить договор на оказание образовательных и информационных услуг на условиях, изложенных в данном документе.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">2. Акцепт оферты</h2>
          <p className="text-muted-foreground">
            Акцептом оферты является оплата услуг через платёжные системы платформы. С момента оплаты договор считается заключённым на условиях данной оферты.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">3. Предмет договора</h2>
          <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
            <li>Предоставление доступа к видеоурокам, курсам и образовательным материалам</li>
            <li>Участие в прямых трансляциях</li>
            <li>Доступ к подписке на категории курсов</li>
            <li>Продажа физических товаров (книги, аксессуары, одежда)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">4. Стоимость и порядок оплаты</h2>
          <p className="text-muted-foreground">
            Стоимость услуг указана на странице каждого продукта. Оплата производится в рублях РФ через платёжные системы YooKassa, CryptoCloud или МИР Pay. Доступ к цифровым материалам предоставляется немедленно после подтверждения оплаты.
          </p>
        </section>
      </div>
    </div>
  )
}
