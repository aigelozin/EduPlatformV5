import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { rateLimitAiChat } from '@/lib/rate-limit/redis'
import { streamChat } from '@/lib/ai/chat'
import type { ChatMessage } from '@/types'

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const user = await requireAuth()

    // Rate limit: 20 запросов/час на пользователя
    const allowed = await rateLimitAiChat(user.id)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Превышен лимит запросов. Попробуйте через час.' },
        { status: 429 }
      )
    }

    const body = await req.json() as { messages: ChatMessage[] }
    const { messages } = body

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Некорректный запрос' }, { status: 400 })
    }

    // Ограничение истории: последние 10 сообщений
    const recentMessages = messages.slice(-10)

    const stream = await streamChat(recentMessages)

    // Возвращаем Server-Sent Events
    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        const reader = stream.getReader()
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) {
              controller.enqueue(encoder.encode('data: [DONE]\n\n'))
              controller.close()
              break
            }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: value })}\n\n`))
          }
        } catch (err) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: 'Ошибка потока' })}\n\n`)
          )
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 })
    }
    console.error('[ai/chat]', err)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
