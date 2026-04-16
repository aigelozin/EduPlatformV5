import { notFound } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db/client'
import { TeacherActions } from './TeacherActions'
import { ModerationStatus } from '@prisma/client'

interface PageProps {
  params: { id: string }
}

export default async function TeacherDetailPage({ params }: PageProps) {
  let teacher = null

  try {
    teacher = await db.profile.findUnique({
      where: { id: params.id, role: 'teacher' },
      include: {
        products: {
          orderBy: { created_at: 'desc' },
          include: {
            _count: { select: { purchases: true, reviews: true } },
          },
        },
        _count: { select: { products: true } },
      },
    })
  } catch {
    // DB unavailable
  }

  if (!teacher) notFound()

  const moderationLabel: Record<ModerationStatus, string> = {
    pending: 'На проверке',
    approved: 'Одобрен',
    rejected: 'Отклонён',
  }

  const moderationColor: Record<ModerationStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/teachers" className="text-sm text-muted-foreground hover:text-foreground">
          ← Преподаватели
        </Link>
      </div>

      {/* Профиль */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Профиль</h2>
        <div className="flex items-start gap-4">
          {teacher.avatar_url ? (
            <img
              src={teacher.avatar_url}
              alt={teacher.name}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-xl font-bold text-muted-foreground">
              {teacher.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Имя</p>
              <p className="font-medium">{teacher.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="font-medium">{teacher.email}</p>
            </div>
            {teacher.city && (
              <div>
                <p className="text-xs text-muted-foreground">Город</p>
                <p className="font-medium">{teacher.city}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">Статус</p>
              <span
                className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                  teacher.is_active
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}
              >
                {teacher.is_active ? 'Активен' : 'Заблокирован'}
              </span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Продуктов</p>
              <p className="font-medium">{teacher._count.products}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Дата регистрации</p>
              <p className="font-medium">
                {new Date(teacher.created_at).toLocaleDateString('ru-RU')}
              </p>
            </div>
            {teacher.bio_ru && (
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">Bio</p>
                <p className="font-medium">{teacher.bio_ru}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Продукты */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Продукты</h2>
        {teacher.products.length === 0 ? (
          <p className="text-sm text-muted-foreground">Нет продуктов</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Название</th>
                  <th className="pb-2 pr-4 font-medium">Тип</th>
                  <th className="pb-2 pr-4 font-medium">Статус</th>
                  <th className="pb-2 pr-4 font-medium text-right">Просмотры</th>
                  <th className="pb-2 pr-4 font-medium text-right">Записи</th>
                  <th className="pb-2 font-medium text-right">Отзывы</th>
                </tr>
              </thead>
              <tbody>
                {teacher.products.map((product) => (
                  <tr key={product.id} className="border-b last:border-0">
                    <td className="py-2 pr-4">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="font-medium hover:underline truncate max-w-[200px] block"
                      >
                        {product.title_ru}
                      </Link>
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">{product.type}</td>
                    <td className="py-2 pr-4">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${moderationColor[product.moderation_status]}`}
                      >
                        {moderationLabel[product.moderation_status]}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-right">{product.views_count}</td>
                    <td className="py-2 pr-4 text-right">{product._count.purchases}</td>
                    <td className="py-2 text-right">{product._count.reviews}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Действия */}
      <TeacherActions teacherId={params.id} isActive={teacher.is_active} />
    </div>
  )
}
