import { notFound } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db/client'
import { UserActions } from './UserActions'
import { Role } from '@prisma/client'

interface PageProps {
  params: { id: string }
}

const roleLabel: Record<Role, string> = {
  admin: 'Администратор',
  teacher: 'Преподаватель',
  subscriber: 'Подписчик',
  student: 'Студент',
}

export default async function UserDetailPage({ params }: PageProps) {
  let user = null
  let consentLog = null

  try {
    ;[user, consentLog] = await Promise.all([
      db.profile.findUnique({
        where: { id: params.id },
        include: {
          purchases: {
            include: { product: { select: { id: true, title_ru: true, slug: true } } },
            orderBy: { created_at: 'desc' },
            take: 10,
          },
          user_subscriptions: {
            where: { expires_at: { gt: new Date() } },
            include: { subscription: { select: { name_ru: true } } },
          },
        },
      }),
      db.consentLog.findFirst({
        where: { user_id: params.id, consent_type: 'registration' },
        orderBy: { created_at: 'asc' },
      }),
    ])
  } catch {
    // DB unavailable
  }

  if (!user) notFound()

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/users" className="text-sm text-muted-foreground hover:text-foreground">
          ← Пользователи
        </Link>
      </div>

      {/* Профиль */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Профиль</h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Имя</p>
            <p className="font-medium">{user.name}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="font-medium">{user.email}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Роль</p>
            <p className="font-medium">{roleLabel[user.role]}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Статус</p>
            <span
              className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                user.is_active
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}
            >
              {user.is_active ? 'Активен' : 'Заблокирован'}
            </span>
          </div>
          {user.city && (
            <div>
              <p className="text-xs text-muted-foreground">Город</p>
              <p className="font-medium">{user.city}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground">Дата регистрации</p>
            <p className="font-medium">{new Date(user.created_at).toLocaleDateString('ru-RU')}</p>
          </div>
        </div>
      </div>

      {/* Данные регистрации */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Данные при регистрации</h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">IP адрес</p>
            <p className="font-mono font-medium">{user.registration_ip ?? '—'}</p>
          </div>
          {consentLog?.user_agent && (
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground">User-Agent</p>
              <p className="font-medium text-xs break-all text-muted-foreground">{consentLog.user_agent}</p>
            </div>
          )}
          {consentLog?.created_at && (
            <div>
              <p className="text-xs text-muted-foreground">Дата/время регистрации</p>
              <p className="font-medium">
                {new Date(consentLog.created_at).toLocaleString('ru-RU')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Покупки */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Покупки</h2>
        {user.purchases.length === 0 ? (
          <p className="text-sm text-muted-foreground">Нет покупок</p>
        ) : (
          <ul className="space-y-1">
            {user.purchases.map((p) => (
              <li key={p.id} className="text-sm">
                <Link
                  href={`/catalog/${p.product.slug}`}
                  className="hover:underline text-primary"
                >
                  {p.product.title_ru}
                </Link>
                <span className="text-muted-foreground ml-2 text-xs">
                  {new Date(p.created_at).toLocaleDateString('ru-RU')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Подписки */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Активные подписки</h2>
        {user.user_subscriptions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Нет активных подписок</p>
        ) : (
          <ul className="space-y-1">
            {user.user_subscriptions.map((s) => (
              <li key={s.id} className="text-sm flex items-center gap-2">
                <span className="font-medium">{s.subscription.name_ru}</span>
                <span className="text-xs text-muted-foreground">
                  до {new Date(s.expires_at).toLocaleDateString('ru-RU')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Действия */}
      <UserActions
        userId={params.id}
        isActive={user.is_active}
        currentRole={user.role}
        forcePasswordChange={user.force_password_change}
      />
    </div>
  )
}
