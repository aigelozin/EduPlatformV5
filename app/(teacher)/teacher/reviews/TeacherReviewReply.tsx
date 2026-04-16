'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  reviewId: string
}

export function TeacherReviewReply({ reviewId }: Props) {
  const router = useRouter()
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  async function submit() {
    if (!text.trim()) return
    setLoading(true)
    try {
      await fetch(`/api/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply_ru: text }),
      })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-primary hover:underline"
      >
        Ответить на отзыв
      </button>
    )
  }

  return (
    <div className="space-y-2">
      <textarea
        className="w-full rounded-lg border px-3 py-2 text-sm bg-background resize-none"
        rows={2}
        placeholder="Ваш ответ..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        autoFocus
      />
      <div className="flex gap-2">
        <button
          onClick={submit}
          disabled={loading || !text.trim()}
          className="px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium disabled:opacity-50"
        >
          {loading ? 'Отправка...' : 'Отправить'}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="px-4 py-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          Отмена
        </button>
      </div>
    </div>
  )
}
