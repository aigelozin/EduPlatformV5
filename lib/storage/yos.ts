import { S3Client } from '@aws-sdk/client-s3'

/**
 * Яндекс Object Storage клиент (S3-compatible).
 * Используется ТОЛЬКО на сервере — никогда не импортировать в Client Components.
 */
export const yosClient = new S3Client({
  region: process.env.YOS_REGION ?? 'ru-central1',
  endpoint: process.env.YOS_ENDPOINT ?? 'https://storage.yandexcloud.net',
  credentials: {
    accessKeyId: process.env.YOS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.YOS_SECRET_ACCESS_KEY!,
  },
})

/** Приватный бакет — для защищённого контента (видео, книги) */
export const YOS_PRIVATE_BUCKET = process.env.YOS_BUCKET_NAME!

/** Публичный бакет — аватары, обложки, галереи */
export const YOS_PUBLIC_BUCKET = process.env.YOS_PUBLIC_BUCKET_NAME!
