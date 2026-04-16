import { NextResponse } from 'next/server'
import { getSiteSettings } from '@/lib/settings/site-settings'

export async function GET() {
  const s = await getSiteSettings()
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://eduplatform.ru'

  const body = `# ${s.brand.siteName}
> ${s.seo.aiDescription || s.seo.defaultMetaDescription}

## Разделы
- Каталог курсов: ${base}/catalog
- Преподаватели: ${base}/teachers
- Подписки: ${base}/subscriptions
- Магазин: ${base}/shop
- Прямые трансляции: ${base}/live

## Услуги
${s.seo.keywords}

## Организация
${s.seo.orgName ? s.seo.orgName : s.brand.siteName}
Страна: ${s.seo.country}
${s.seo.phone ? `Телефон: ${s.seo.phone}` : ''}
${s.seo.email ? `Email: ${s.seo.email}` : ''}
`

  return new NextResponse(body.trim(), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
