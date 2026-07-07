import { NextRequest, NextResponse } from 'next/server'
import { subscribe } from '@/lib/sse/livestream-broadcaster'
import { requireAuth } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    await requireAuth()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      // Начальное подтверждение подключения
      controller.enqueue(encoder.encode(': connected\n\n'))

      const unsub = subscribe(params.id, (data) => {
        try {
          controller.enqueue(encoder.encode(data))
        } catch {
          unsub()
        }
      })

      // Keep-alive ping каждые 25 секунд (предотвращает закрытие соединения прокси)
      const ping = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': ping\n\n'))
        } catch {
          clearInterval(ping)
          unsub()
        }
      }, 25_000)
    },
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // отключает буферизацию в Nginx
    },
  })
}
