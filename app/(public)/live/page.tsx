import type { Metadata } from 'next'
import { db } from '@/lib/db/client'

export const metadata: Metadata = {
  title: 'Прямые трансляции | EduPlatform',
  description: 'Расписание прямых трансляций — йога, фитнес, мастер-классы в прямом эфире.',
}

export default async function LivePage() {
  const now = new Date()
  const livestreams = await db.livestream.findMany({
    where: { scheduled_at: { gte: now } },
    orderBy: { scheduled_at: 'asc' },
    include: {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore — livestream связан с product через product_id
    },
    take: 20,
  })

  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold mb-2">Прямые трансляции</h1>
      <p className="text-muted-foreground mb-10">Занимайтесь в прямом эфире вместе с преподавателями</p>

      {livestreams.length === 0 ? (
        <div className="text-center py-20 space-y-4">
          <div className="text-6xl">📡</div>
          <p className="text-xl font-semibold">Трансляции скоро появятся</p>
          <p className="text-muted-foreground max-w-md mx-auto">
            Следите за анонсами в каталоге и на страницах преподавателей. Мы уведомим вас о новых трансляциях.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {livestreams.map((stream) => (
            <div key={stream.id} className="rounded-xl border p-5 bg-background hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs text-red-500 font-semibold uppercase">Скоро</span>
              </div>
              <p className="font-semibold mb-2">
                {stream.scheduled_at.toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              {stream.stream_url ? (
                <a
                  href={stream.stream_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-sm text-primary hover:underline"
                >
                  Смотреть трансляцию →
                </a>
              ) : (
                <p className="text-sm text-muted-foreground mt-3">Ссылка появится перед началом</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
