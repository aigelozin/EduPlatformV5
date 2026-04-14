import * as Sentry from '@sentry/nextjs'

// GlitchTip совместим с Sentry API — используем тот же SDK, другой DSN
// GLITCHTIP_DSN берётся из env и передаётся в Sentry.init() в sentry.client.config.ts / sentry.server.config.ts

export function captureException(err: unknown, context?: Record<string, unknown>): void {
  if (process.env.GLITCHTIP_DSN) {
    Sentry.captureException(err, { extra: context })
  } else {
    console.error('[Error]', err, context)
  }
}

export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info'
): void {
  if (process.env.GLITCHTIP_DSN) {
    Sentry.captureMessage(message, level)
  } else {
    console.log(`[${level.toUpperCase()}]`, message)
  }
}

export function setUser(user: { id: string; email?: string } | null): void {
  Sentry.setUser(user)
}
