import Link from 'next/link'
import { db } from '@/lib/db/client'
import { Prisma, Role } from '@prisma/client'

interface PageProps {
  searchParams: { role?: string; status?: string; q?: string }
}

const ROLES: { value: string; label: string }[] = [
  { value: '', label: 'Все роли' },
  { value: 'student', label: 'Студент' },
  { value: 'teacher', label: 'Преподаватель' },
  { value: 'subscriber', label: 'Подписчик' },
  { value: 'admin', label: 'Администратор' },
]

const roleLabel: Record<Role, string> = {
  admin: 'Администратор',
  teacher: 'Преподаватель',
  subscriber: 'Подписчик',
  student: 'Студент',
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const roleParam = searchParams.role
  const statusParam = searchParams.status
  const q = searchParams.q?.trim()

  let users: Array<{
    id: string
    email: string
    name: string
    role: Role
    is_active: boolean
    city: string | null
    registration_ip: string | null
    created_at: Date
  }> = []

  try {
    const where: Prisma.ProfileWhereInput = {}

    if (roleParam && ['admin', 'teacher', 'subscriber', 'student'].includes(roleParam)) {
      where.role = roleParam as Role
    }
    if (statusParam === 'active') where.is_active = true
    if (statusParam === 'blocked') where.is_active = false
    if (q) {
      where.OR = [
        { email: { contains: q } },
        { name: { contains: q } },
      ]
    }

    users = await db.profile.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        is_active: true,
        city: true,
        registration_ip: true,
        created_at: true,
      },
      orderBy: { created_at: 'desc' },
      take: 100,
    })
  } catch {
    // DB unavailable
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Пользователи</h1>
        <span className="text-sm text-muted-foreground">{users.length} пользователей</span>
      </div>

      {/* Фильтры */}
      <form className="flex flex-wrap gap-2">
        <select
          name="role"
          defaultValue={roleParam ?? ''}
          className="rounded-lg border px-3 py-1.5 text-sm bg-background"
        >
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={statusParam ?? ''}
          className="rounded-lg border px-3 py-1.5 text-sm bg-background"
        >
          <option value="">Все статусы</option>
          <option value="active">Активные</option>
          <option value="blocked">Заблокированные</option>
        </select>
        <input
          name="q"
          defaultValue={q ?? ''}
          placeholder="Имя или email..."
          className="rounded-lg border px-3 py-1.5 text-sm bg-background min-w-[200px]"
        />
        <button
          type="submit"
          className="px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
        >
          Найти
        </button>
      </form>

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30 text-left text-xs text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Пользователь</th>
                <th className="px-4 py-2.5 font-medium">Роль</th>
                <th className="px-4 py-2.5 font-medium">Город</th>
                <th className="px-4 py-2.5 font-medium">IP регистрации</th>
                <th className="px-4 py-2.5 font-medium">Дата регистрации</th>
                <th className="px-4 py-2.5 font-medium">Статус</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Пользователи не найдены
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-2.5">
                      <Link href={`/admin/users/${user.id}`} className="hover:underline">
                        <p className="font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {roleLabel[user.role]}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {user.city ?? '—'}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground font-mono text-xs">
                      {user.registration_ip ?? '—'}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          user.is_active
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}
                      >
                        {user.is_active ? 'Активен' : 'Заблокирован'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
