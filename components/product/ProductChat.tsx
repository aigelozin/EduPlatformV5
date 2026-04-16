'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { Role } from '@prisma/client'

interface Message {
  id: string
  body_ru: string
  is_pinned: boolean
  created_at: string
  user: { id: string; name: string; avatar_url: string | null; role: Role }
}

interface Props {
  productId: string
  currentUserId: string
  currentUserRole: Role
}

const ROLE_LABELS: Partial<Record<Role, string>> = {
  teacher: 'Преподаватель',
  admin: 'Администратор',
}

export function ProductChat({ productId, currentUserId, currentUserRole }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const lastTimestampRef = useRef<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const isTeacherOrAdmin = currentUserRole === 'teacher' || currentUserRole === 'admin'

  const fetchMessages = useCallback(async () => {
    try {
      const after = lastTimestampRef.current
      const url = `/api/products/${productId}/messages${after ? `?after=${encodeURIComponent(after)}` : ''}`
      const res = await fetch(url)
      if (!res.ok) return
      const data = (await res.json()) as { data: Message[] | null }
      if (!data.data?.length) return
      setMessages((prev) => {
        const ids = new Set(prev.map((m) => m.id))
        const newMsgs = data.data!.filter((m) => !ids.has(m.id))
        if (!newMsgs.length) return prev
        lastTimestampRef.current = newMsgs[newMsgs.length - 1]!.created_at
        return [...prev, ...newMsgs]
      })
    } catch {
      // ignore network errors
    }
  }, [productId])

  useEffect(() => {
    fetchMessages()
    const interval = setInterval(fetchMessages, 8000)
    return () => clearInterval(interval)
  }, [fetchMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    if (!input.trim() || sending) return
    setSending(true)
    try {
      const res = await fetch(`/api/products/${productId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body_ru: input }),
      })
      if (res.ok) {
        setInput('')
        await fetchMessages()
      }
    } finally {
      setSending(false)
    }
  }

  async function deleteMessage(msgId: string) {
    await fetch(`/api/products/${productId}/messages/${msgId}`, { method: 'DELETE' })
    setMessages((prev) => prev.filter((m) => m.id !== msgId))
  }

  async function pinMessage(msgId: string, pinned: boolean) {
    await fetch(`/api/products/${productId}/messages/${msgId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_pinned: !pinned }),
    })
    setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, is_pinned: !pinned } : m)))
  }

  const pinnedMessages = messages.filter((m) => m.is_pinned)
  const regularMessages = messages.filter((m) => !m.is_pinned)

  return (
    <div className="flex flex-col h-[500px] rounded-xl border bg-card">
      {/* Заголовок */}
      <div className="px-4 py-3 border-b">
        <h3 className="text-sm font-semibold">Обсуждение</h3>
      </div>

      {/* Закреплённые сообщения */}
      {pinnedMessages.length > 0 && (
        <div className="px-4 py-2 border-b bg-yellow-50 dark:bg-yellow-950 space-y-1">
          {pinnedMessages.map((msg) => (
            <div key={msg.id} className="flex items-start gap-2 text-sm">
              <span className="text-yellow-600">📌</span>
              <div>
                <span className="font-medium text-xs text-yellow-700 dark:text-yellow-300">
                  {msg.user.name}:
                </span>{' '}
                <span className="text-yellow-900 dark:text-yellow-100">{msg.body_ru}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Сообщения */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {regularMessages.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            Начните обсуждение...
          </p>
        )}
        {regularMessages.map((msg) => {
          const isOwn = msg.user.id === currentUserId
          const canDelete = isOwn || isTeacherOrAdmin
          const canPin = isTeacherOrAdmin

          return (
            <div key={msg.id} className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
              <div
                className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0"
              >
                {msg.user.name.charAt(0).toUpperCase()}
              </div>
              <div className={`max-w-[75%] space-y-0.5 ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium">{msg.user.name}</span>
                  {ROLE_LABELS[msg.user.role] && (
                    <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                      {ROLE_LABELS[msg.user.role]}
                    </span>
                  )}
                </div>
                <div
                  className={`rounded-xl px-3 py-2 text-sm ${
                    isOwn
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  {msg.body_ru}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {new Date(msg.created_at).toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {canPin && (
                    <button
                      onClick={() => pinMessage(msg.id, msg.is_pinned)}
                      className="text-xs text-muted-foreground hover:text-foreground"
                      title={msg.is_pinned ? 'Открепить' : 'Закрепить'}
                    >
                      📌
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => deleteMessage(msg.id)}
                      className="text-xs text-muted-foreground hover:text-destructive"
                      title="Удалить"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Ввод */}
      <div className="px-4 py-3 border-t flex gap-2">
        <input
          className="flex-1 rounded-lg border px-3 py-2 text-sm bg-background"
          placeholder="Написать сообщение..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          disabled={sending}
        />
        <button
          onClick={sendMessage}
          disabled={sending || !input.trim()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {sending ? '...' : 'Отправить'}
        </button>
      </div>
    </div>
  )
}
