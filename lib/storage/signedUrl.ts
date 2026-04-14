import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { yosClient, YOS_PRIVATE_BUCKET, YOS_PUBLIC_BUCKET } from './yos'

/**
 * Генерирует подписанный URL для приватного контента (видео, книги).
 * ВАЖНО: вызывать ТОЛЬКО после checkAccess() — TTL по умолчанию 1 час.
 */
export async function generateSignedYOSUrl(
  key: string,
  ttlSeconds: number = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: YOS_PRIVATE_BUCKET,
    Key: key,
  })

  return getSignedUrl(yosClient, command, { expiresIn: ttlSeconds })
}

/**
 * Генерирует presigned URL для загрузки файла (upload).
 * Используется в /api/upload/presigned — клиент грузит напрямую в YOS.
 */
export async function generateUploadPresignedUrl(
  key: string,
  contentType: string,
  bucket: 'private' | 'public' = 'private',
  ttlSeconds: number = 3600
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: bucket === 'private' ? YOS_PRIVATE_BUCKET : YOS_PUBLIC_BUCKET,
    Key: key,
    ContentType: contentType,
  })

  return getSignedUrl(yosClient, command, { expiresIn: ttlSeconds })
}

/**
 * Формирует публичный URL для объектов в публичном бакете.
 */
export function getPublicYOSUrl(key: string): string {
  const base = process.env.NEXT_PUBLIC_YOS_PUBLIC_URL ?? ''
  return `${base}/${key}`
}
