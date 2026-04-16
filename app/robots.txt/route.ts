import { NextResponse } from 'next/server'

export function GET() {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://eduplatform.ru'
  const body = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api
Disallow: /dashboard

User-agent: GPTBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: YandexBot
Allow: /

Sitemap: ${base}/sitemap.xml`

  return new NextResponse(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
