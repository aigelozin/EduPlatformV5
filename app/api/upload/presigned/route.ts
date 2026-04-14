import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/session'
import { generateUploadPresignedUrl } from '@/lib/storage/signedUrl'
import { randomUUID } from 'crypto'
import type { ApiResponse } from '@/types'

const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/mov']
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ALLOWED_BOOK_TYPES = ['application/pdf']

interface PresignedResponse {
  upload_url: string
  key: string
  public_url?: string
}

export async function POST(
  req: NextRequest
): Promise<NextResponse<ApiResponse<PresignedResponse>>> {
  try {
    // Только teacher и admin могут загружать
    const user = await requireRole('teacher', 'admin')

    const body = await req.json() as {
      content_type: string
      file_type: 'video' | 'image' | 'book'
    }

    const { content_type, file_type } = body

    // Валидация типа файла
    const allowed =
      file_type === 'video'
        ? ALLOWED_VIDEO_TYPES
        : file_type === 'image'
        ? ALLOWED_IMAGE_TYPES
        : ALLOWED_BOOK_TYPES

    if (!allowed.includes(content_type)) {
      return NextResponse.json(
        { data: null, error: `Недопустимый тип файла: ${content_type}` },
        { status: 400 }
      )
    }

    const ext = content_type.split('/')[1] ?? 'bin'
    const bucket: 'private' | 'public' = file_type === 'image' ? 'public' : 'private'
    const key = `${file_type}s/${user.id}/${randomUUID()}.${ext}`

    const uploadUrl = await generateUploadPresignedUrl(key, content_type, bucket, 3600)

    return NextResponse.json({
      data: {
        upload_url: uploadUrl,
        key,
        ...(bucket === 'public' && {
          public_url: `${process.env.NEXT_PUBLIC_YOS_PUBLIC_URL}/${key}`,
        }),
      },
      error: null,
    })
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'UNAUTHORIZED') {
        return NextResponse.json({ data: null, error: 'Необходима авторизация' }, { status: 401 })
      }
      if (err.message === 'FORBIDDEN') {
        return NextResponse.json({ data: null, error: 'Доступ запрещён' }, { status: 403 })
      }
    }
    return NextResponse.json({ data: null, error: 'Ошибка сервера' }, { status: 500 })
  }
}
