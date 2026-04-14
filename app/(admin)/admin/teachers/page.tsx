import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db/client'

export const metadata: Metadata = { title: 'Преподаватели | Администратор' }

export default async function AdminTeachersPage() {
  const session = await getSession()
  if (!session || session.role !== 'admin') redirect('/dashboard')

  const teachers = await db.profile.findMany({
    where: { role: 'teacher' },
    include: {
      _count: { select: { products: true } },
      products: {
        where: { moderation_status: 'pending' },
        select: { id: true },
      },
    },
    orderBy: { created_at: 'desc' },
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Преподаватели</h1>
      <p className="text-muted-foreground">Всего: {teachers.length}</p>

      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium">Преподаватель</th>
              <th className="text-left p-3 font-medium">Продуктов</th>
              <th className="text-left p-3 font-medium">Ожидают</th>
              <th className="text-left p-3 font-medium">Дата</th>
              <th className="text-left p-3 font-medium">Действия</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map((teacher) => (
              <tr key={teacher.id} className="border-t">
                <td className="p-3">
                  <p className="font-medium">{teacher.name}</p>
                  <p className="text-xs text-muted-foreground">{teacher.email}</p>
                </td>
                <td className="p-3">{teacher._count.products}</td>
                <td className="p-3">
                  {teacher.products.length > 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 font-medium">
                      {teacher.products.length}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="p-3 text-muted-foreground">
                  {teacher.created_at.toLocaleDateString('ru-RU')}
                </td>
                <td className="p-3">
                  <Link
                    href={`/admin/products?teacher_id=${teacher.id}`}
                    className="text-primary hover:underline text-xs"
                  >
                    Продукты →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
