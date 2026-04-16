'use client'
import { useEffect, useRef, useState } from 'react'
import { Role } from '@prisma/client'

interface LiveMessage {
  id: string
  body_ru: string
  created_at: string
  user: { id: string; name: string; avatar_url: string | null; role: Role }
}

interface Props {
  livestreamId: string
  currentUserId: string
  currentUserRole: Role
}

const ROLE_LABELS: Partial<Record<Role, string>> = {
  teacher: 'Преподаватель',
  admin: 'Модератор',
}

export function LivestreamChat({ livestreamId, currentUserId, currentUserRole }: Props) {
  const [messages, setMessages] = useState<LiveMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [connected, setConnected] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const esRef = useRef<EventSource | null>(null)
  const isModeratorOrAdmin = currentUserRole === 'teacher' || currentUserRole === 'admin'

  useEffect(() => {
    function connect() {
      const es = new EventSource(`/api/livestreams/${livestreamId}/chat/stream`)
      esRef.current = es

      es.onopen = () => setConnected(true)

      es.onmessage = (event: MessageEvent<string>) => {
        try {
          const parsed = JSON.parse(event.data) as {
            type: string
            payload: LiveMessage | { id: string }
          }
          if (parsed.type === 'message') {
            const msg = parsed.payload as LiveMessage
            setMessages((prev) => [...prev.slice(-200), msg])
          } else if (parsed.type === 'message_deleted') {
            const { id } = parsed.payload as { id: string }
            setMessages((prev) => prev.filter((m) => m.id !== id))
          }
        } catch {
          // ignore parse errors
        }
      }

      es.onerror = () => {
        setConnected(false)
        es.close()
        setTimeout(connect, 3000)
      }
    }

    connect()
    return () => {
      esRef.current?.close()
    }
  }, [livestreamId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    if (!input.trim() || sending) return
    setSending(true)
    try {
      await fetch(`/api/livestreams/${livestreamId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body_ru: input }),
      })
      setInput('')
    } finally {
      setSending(false)
    }
  }

  async function deleteMessage(messageId: string) {
    await fetch(`/api/livestreams/${livestreamId}/chat`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId }),
    })
  }

  return (
    <div className="flex flex-col h-[400px] rounded-xl border bg-card">
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <h3 className="text-sm font-semibold">Чат трансляции</h3>
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${
            connected
              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          {connected ? '● В эфире' : '○ Подключение...'}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            Сообщений пока нет
          </p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className="flex items-start gap-2 group">
            <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
              {msg.user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-xs font-semibold">{msg.user.name}</span>
                {ROLE_LABELS[msg.user.role] && (
                  <span className="text-xs bg-primary/10 text-primary px-1.5 py-0 rounded-full">
                    {ROLE_LABELS[msg.user.role]}
                  </span>
                )}
              </div>
              <p className="text-sm break-words">{msg.body_ru}</p>
            </div>
            {isModeratorOrAdmin && (
              <button
                onClick={() => deleteMessage(msg.id)}
                className="text-xs text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                title="Удалить"
              >
                ✕
              </button>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 py-3 border-t flex gap-2">
        <input
          className="flex-1 rounded-lg border px-3 py-2 text-sm bg-background"
          placeholder="Написать в чат..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          disabled={!connected || sending}
        />
        <button
          onClick={sendMessage}
          disabled={!connected || sending || !input.trim()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {sending ? '...' : 'Отправить'}
        </button>
      </div>
    </div>
  )
}
