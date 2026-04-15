'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  productId: string
  currentStatus: string
  productTitle: string
}

export function ProductModerationActions({ productId, currentStatus, productTitle }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)

  async function moderate(status: 'approved' | 'rejected', reason?: string) {
    setLoading(status === 'approved' ? 'approve' : 'reject')
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moderation_status: status,
          ...(reason && { rejection_reason: reason }),
        }),
      })
      if (res.ok) {
        router.refresh()
      } else {
        const json = await res.json() as { error?: string }
        alert(json.error ?? 'Ошибка')
      }
    } finally {
      setLoading(null)
      setShowRejectForm(false)
      setRejectReason('')
    }
  }

  if (currentStatus === 'pending') {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex gap-2">
          <button
            onClick={() => moderate('approved')}
            disabled={loading !== null}
            className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 disabled:opacity-50 transition-colors"
          >
            {loading === 'approve' ? '...' : 'Одобрить'}
          </button>
          <button
            onClick={() => setShowRejectForm(true)}
            disabled={loading !== null}
            className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 disabled:opacity-50 transition-colors"
          >
            Отклонить
          </button>
        </div>
        {showRejectForm && (
          <div className="mt-1 space-y-1">
            <input
              type="text"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Причина отклонения..."
              className="w-full text-xs px-2 py-1 rounded border bg-background"
              autoFocus
            />
            <div className="flex gap-1">
              <button
                onClick={() => rejectReason.trim() && moderate('rejected', rejectReason)}
                disabled={!rejectReason.trim() || loading !== null}
                className="text-xs px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {loading === 'reject' ? '...' : 'Отклонить'}
              </button>
              <button
                onClick={() => { setShowRejectForm(false); setRejectReason('') }}
                className="text-xs px-2 py-1 rounded border hover:bg-accent"
              >
                Отмена
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Для одобренных / отклонённых — только ссылка на редактирование
  return (
    <a
      href={`/admin/products/${productId}/edit`}
      className="text-xs text-primary hover:underline"
    >
      Редактировать
    </a>
  )
}
