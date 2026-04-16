'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Role } from '@prisma/client'

interface Props {
  userId: string
  isActive: boolean
  currentRole: Role
  forcePasswordChange: boolean
}

const ROLES: { value: Role; label: string }[] = [
  { value: 'student', label: 'Студент' },
  { value: 'subscriber', label: 'Подписчик' },
  { value: 'teacher', label: 'Преподаватель' },
  { value: 'admin', label: 'Администратор' },
]

export function UserActions({ userId, isActive, currentRole, forcePasswordChange }: Props) {
  const router = useRouter()
  const [role, setRole] = useState<Role>(currentRole)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  async function patch(data: Record<string, unknown>, message: string) {
    setLoading(true)
    try {
      await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      setSuccess(message)
      setTimeout(() => setSuccess(''), 2500)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border bg-card p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Действия</h2>
        {success && (
          <span className="text-sm text-green-600 font-medium">{success} ✓</span>
        )}
      </div>

      {/* Смена роли */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Изменить роль</label>
        <div className="flex gap-2">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="flex-1 rounded-lg border px-3 py-2 text-sm bg-background"
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <button
            onClick={() => patch({ role }, 'Роль обновлена')}
            disabled={loading || role === currentRole}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50"
          >
            Применить
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 pt-2 border-t">
        {/* Блокировка */}
        <button
          onClick={() => patch({ is_active: !isActive }, isActive ? 'Заблокирован' : 'Разблокирован')}
          disabled={loading}
          className={`px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 ${
            isActive
              ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {isActive ? 'Заблокировать' : 'Разблокировать'}
        </button>

        {/* Принудительная смена пароля */}
        <button
          onClick={() =>
            patch(
              { force_password_change: !forcePasswordChange },
              forcePasswordChange ? 'Флаг сброшен' : 'При следующем входе пользователь сменит пароль'
            )
          }
          disabled={loading}
          className={`px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 border ${
            forcePasswordChange
              ? 'border-orange-400 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950'
              : 'border-border text-foreground hover:bg-muted'
          }`}
        >
          {forcePasswordChange ? 'Сбросить флаг смены пароля' : 'Принудить сменить пароль'}
        </button>
      </div>
      {forcePasswordChange && (
        <p className="text-xs text-orange-600">
          Пользователь будет перенаправлен на смену пароля при следующем входе
        </p>
      )}
    </div>
  )
}
