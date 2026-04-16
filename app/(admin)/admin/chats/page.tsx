import Link from 'next/link'
import { db } from '@/lib/db/client'

export default async function AdminChatsPage() {
  let products: Array<{
    id: string
    title_ru: string
    slug: string
    _count: { product_messages: number }
  }> = []

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let messagesToday = 0

  try {
    products = await db.product.findMany({
      where: { is_active: true },
      select: {
        id: true,
        title_ru: true,
        slug: true,
        _count: { select: { product_messages: true } },
      },
      orderBy: { product_messages: { _count: 'desc' } },
      take: 50,
    })

    messagesToday = await db.productMessage.count({
      where: { created_at: { gte: today }, is_deleted: false },
    })
  } catch {
    // DB unavailable
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Чаты продуктов</h1>
        <span className="text-sm text-muted-foreground">
          Сегодня: {messagesToday} сообщений
        </span>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30 text-left text-xs text-muted-foreground">
              <th className="px-4 py-2.5 font-medium">Продукт</th>
              <th className="px-4 py-2.5 font-medium text-right">Сообщений всего</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-4 py-8 text-center text-muted-foreground">
                  Нет данных
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/catalog/${p.slug}`}
                      className="font-medium hover:underline"
                    >
                      {p.title_ru}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-right font-medium">
                    {p._count.product_messages}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
