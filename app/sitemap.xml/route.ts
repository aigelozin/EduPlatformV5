import { NextResponse } from 'next/server'
import { db } from '@/lib/db/client'

export async function GET() {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://eduplatform.ru'
  const staticUrls = ['/', '/catalog', '/teachers', '/subscriptions', '/shop', '/live']

  let productSlugs: string[] = []
  let teacherIds: string[] = []

  try {
    const [products, teachers] = await Promise.all([
      db.product.findMany({
        where: { is_active: true, moderation_status: 'approved' },
        select: { slug: true },
      }),
      db.profile.findMany({
        where: { role: 'teacher', is_active: true },
        select: { id: true },
      }),
    ])
    productSlugs = products.map((p) => p.slug)
    teacherIds = teachers.map((t) => t.id)
  } catch {
    // DB unavailable — serve static URLs only
  }

  const urls = [
    ...staticUrls.map((u) => `${base}${u}`),
    ...productSlugs.map((s) => `${base}/catalog/${s}`),
    ...teacherIds.map((id) => `${base}/teachers/${id}`),
  ]

  const now = new Date().toISOString().split('T')[0]
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
  </url>`
  )
  .join('\n')}
</urlset>`

  return new NextResponse(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  })
}
