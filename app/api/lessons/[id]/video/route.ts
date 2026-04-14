import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { checkAccess } from '@/lib/access/checkAccess'
import { generateSignedYOSUrl } from '@/lib/storage/signedUrl'
import { db } from '@/lib/db/client'
import type { ApiResponse } from '@/types'

interface VideoResponse {
  type: 'embed' | 'signed_url'
  source: string
  url: string
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<VideoResponse>>> {
  try {
    const user = await requireAuth()

    const lesson = await db.lesson.findUnique({
      where: { id: params.id },
      include: { product: { select: { id: true } } },
    })

    if (!lesson) {
      return NextResponse.json({ data: null, error: 'Урок не найден' }, { status: 404 })
    }

    // Бесплатные уроки доступны без проверки доступа
    if (!lesson.is_free) {
      const access = await checkAccess(user.id, lesson.product.id)
      if (!access.hasAccess) {
        return NextResponse.json({ data: null, error: 'Нет доступа' }, { status: 403 })
      }
    }

    // YOS (приватное хранилище) — генерируем signed URL
    if (lesson.video_source === 'yos' && lesson.yos_key) {
      const signedUrl = await generateSignedYOSUrl(lesson.yos_key, 3600)
      return NextResponse.json({
        data: { type: 'signed_url', source: 'yos', url: signedUrl },
        error: null,
      })
    }

    // Embed источники (VK, RuTube, Kinescope, YouTube)
    if (lesson.video_source && lesson.video_id) {
      const embedUrl = buildEmbedUrl(lesson.video_source, lesson.video_id)
      return NextResponse.json({
        data: { type: 'embed', source: lesson.video_source, url: embedUrl },
        error: null,
      })
    }

    return NextResponse.json({ data: null, error: 'Видео не настроено' }, { status: 404 })
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ data: null, error: 'Необходима авторизация' }, { status: 401 })
    }
    console.error('[video/route]', err)
    return NextResponse.json({ data: null, error: 'Ошибка сервера' }, { status: 500 })
  }
}

function buildEmbedUrl(source: string, videoId: string): string {
  switch (source) {
    case 'vk': {
      // videoId format: "oid_id_hash" e.g. "-12345_67890_abcdef"
      const [oid, id, hash] = videoId.split('_')
      return `https://vk.com/video_ext.php?oid=${oid}&id=${id}&hash=${hash}`
    }
    case 'rutube':
      return `https://rutube.ru/play/embed/${videoId}`
    case 'kinescope':
      return `https://kinescope.io/embed/${videoId}`
    case 'youtube':
      return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`
    default:
      return ''
  }
}
