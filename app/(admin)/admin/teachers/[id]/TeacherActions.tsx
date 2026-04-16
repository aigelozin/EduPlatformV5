'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  teacherId: string
  isActive: boolean
}

export function TeacherActions({ teacherId, isActive }: Props) {
  const router = useRouter()
  const [notificationText, setNotificationText] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function toggleActive() {
    setLoading(true)
    try {
      await fetch(`/api/admin/teachers/${teacherId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !isActive }),
      })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function sendNotification() {
    if (!notificationText.trim()) return
    setLoading(true)
    try {
      await fetch(`/api/admin/teachers/${teacherId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_text: notificationText }),
      })
      setNotificationText('')
      setSent(true)
      setTimeout(() => setSent(false), 2500)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border bg-card p-6 space-y-4">
      <h2 className="text-lg font-semibold">Действия</h2>

      <div className="space-y-2">
        <label className="text-sm font-medium">Отправить уведомление</label>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-lg border px-3 py-2 text-sm bg-background"
            placeholder="Текст уведомления..."
            value={notificationText}
            onChange={(e) => setNotificationText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendNotification()}
          />
          <button
            onClick={sendNotification}
            disabled={loading || !notificationText.trim()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {sent ? 'Отправлено ✓' : 'Отправить'}
          </button>
        </div>
      </div>

      <div className="pt-2 border-t">
        <button
          onClick={toggleActive}
          disabled={loading}
          className={`px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 ${
            isActive
              ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {loading ? '...' : isActive ? 'Заблокировать преподавателя' : 'Разблокировать'}
        </button>
        {isActive && (
          <p className="text-xs text-muted-foreground mt-1">
            Блокировка скрывает все продукты преподавателя с публичных страниц
          </p>
        )}
      </div>
    </div>
  )
}
