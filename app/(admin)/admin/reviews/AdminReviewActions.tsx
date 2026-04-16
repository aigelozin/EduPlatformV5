'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  reviewId: string
  isVisible: boolean
}

export function AdminReviewActions({ reviewId, isVisible }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function patch(data: Record<string, unknown>) {
    setLoading(true)
    try {
      await fetch(`/api/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function deleteReview() {
    if (!confirm('Удалить отзыв безвозвратно?')) return
    setLoading(true)
    try {
      await fetch(`/api/reviews/${reviewId}`, { method: 'DELETE' })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-1.5 shrink-0">
      <button
        onClick={() => patch({ is_visible: !isVisible })}
        disabled={loading}
        className="px-3 py-1 text-xs rounded-lg border hover:bg-muted disabled:opacity-50"
      >
        {isVisible ? 'Скрыть' : 'Показать'}
      </button>
      <button
        onClick={deleteReview}
        disabled={loading}
        className="px-3 py-1 text-xs rounded-lg text-destructive border border-destructive/30 hover:bg-destructive/10 disabled:opacity-50"
      >
        Удалить
      </button>
    </div>
  )
}
