import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db/client'

function formatAmount(kopecks: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
  }).format(kopecks / 100)
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export default async function TeacherOrdersPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'teacher' && session.role !== 'admin') redirect('/dashboard')

  let purchases: {
    id: string
    amount: number
    created_at: Date
    product: { title_ru: string }
    user: { name: string; email: string }
  }[] = []

  try {
    purchases = await db.purchase.findMany({
      where: {
        product: { creator_id: session.role === 'admin' ? undefined : session.id },
      },
      orderBy: { created_at: 'desc' },
      take: 50,
      select: {
        id: true,
        amount: true,
        created_at: true,
        product: { select: { title_ru: true } },
        user: { select: { name: true, email: true } },
      },
    })
  } catch {
    // DB unavailable — show empty state
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Продажи</h1>
        <p className="mt-1 text-muted-foreground">История покупок ваших продуктов</p>
      </div>

      {purchases.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center">
          <p className="text-muted-foreground">Продаж пока нет</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Продукт</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Покупатель</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Сумма</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Дата</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {purchases.map((purchase) => (
                <tr key={purchase.id}>
                  <td className="px-4 py-3 font-medium text-foreground max-w-xs">
                    <span className="line-clamp-1">{purchase.product.title_ru}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <p className="text-foreground">{purchase.user.name}</p>
                    <p className="text-xs">{purchase.user.email}</p>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-foreground">
                    {formatAmount(purchase.amount)}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {formatDate(purchase.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
