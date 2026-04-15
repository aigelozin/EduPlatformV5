import Redis from 'ioredis'

let redis: Redis | null = null

function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL!, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    })

    redis.on('error', (err) => {
      console.error('[Redis] Connection error:', err.message)
    })
  }
  return redis
}

/**
 * Sliding window rate limiter.
 * @returns { allowed: boolean, remaining: number, reset: number }
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; reset: number }> {
  const client = getRedis()
  const now = Date.now()
  const windowMs = windowSeconds * 1000
  const redisKey = `rate_limit:${key}`

  const pipeline = client.pipeline()
  pipeline.zremrangebyscore(redisKey, 0, now - windowMs)
  pipeline.zcard(redisKey)
  pipeline.zadd(redisKey, now, `${now}-${Math.random()}`)
  pipeline.expire(redisKey, windowSeconds)

  try {
    const results = await pipeline.exec()
    const count = (results?.[1]?.[1] as number) ?? 0
    const reset = Math.ceil((now + windowMs) / 1000)
    return {
      allowed: count < limit,
      remaining: Math.max(0, limit - count - 1),
      reset,
    }
  } catch {
    // Redis недоступен — пропускаем (graceful degradation для локальной разработки)
    return { allowed: true, remaining: limit, reset: Math.ceil((now + windowMs) / 1000) }
  }
}

/**
 * Rate limit для AI чата: 20 запросов / час на пользователя.
 */
export async function rateLimitAiChat(userId: string): Promise<boolean> {
  const limit = parseInt(process.env.AI_CHAT_RATE_LIMIT_PER_HOUR ?? '20', 10)
  const { allowed } = await rateLimit(`ai_chat:${userId}`, limit, 3600)
  return allowed
}

/**
 * Rate limit для API маршрутов: 100 запросов / минуту по IP.
 */
export async function rateLimitApi(ip: string, route: string): Promise<boolean> {
  const { allowed } = await rateLimit(`api:${route}:${ip}`, 100, 60)
  return allowed
}
