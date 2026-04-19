# Admin Panel Expansion — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the EduPlatform admin panel with 8 subsystems: site design settings, SEO+AI optimization, teacher content management, user management, product analytics, reviews moderation, product chat (hybrid polling), and livestream chat (SSE).

**Architecture:** CSS variables from a single `site_settings` DB row power the design system. All new admin pages follow the existing Server Component + try/catch pattern. Chats use polling (products) and SSE (livestreams). New Prisma models are added via migration before any feature work.

**Tech Stack:** Next.js 14 App Router, Prisma ORM, PostgreSQL, Tailwind CSS, shadcn/ui, Recharts (analytics charts), geoip-lite (IP geolocation), Server-Sent Events (livestream chat).

**Spec:** `docs/superpowers/specs/2026-04-16-admin-panel-design.md`

---

## Phase 0: Database Schema Migration

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/YYYYMMDD_admin_expansion/migration.sql` (auto-generated)

### Task 0.1: Add new fields and models to schema

- [ ] Open `prisma/schema.prisma` and add the following to `model Profile`:

```prisma
city                  String?
registration_ip       String?
force_password_change Boolean  @default(false)
```

- [ ] Add to `model Product`:

```prisma
views_count       Int     @default(0)
duration_minutes  Int?
ai_description_ru String?
```

- [ ] Add to `model Review`:

```prisma
reply_ru   String?
replied_at DateTime?
is_visible Boolean  @default(true)
```

- [ ] Add new model `SiteSettings` before `model Profile`:

```prisma
model SiteSettings {
  id         String   @id @default("main")
  brand      Json     @default("{}")
  typography Json     @default("{}")
  homepage   Json     @default("{}")
  seo        Json     @default("{}")
  updated_at DateTime @updatedAt

  @@map("site_settings")
}
```

- [ ] Add new model `ProductMessage` after `model Product`:

```prisma
model ProductMessage {
  id         String   @id @default(cuid())
  product_id String
  user_id    String
  body_ru    String
  is_pinned  Boolean  @default(false)
  is_deleted Boolean  @default(false)
  deleted_by String?
  created_at DateTime @default(now())

  product    Product  @relation(fields: [product_id], references: [id])
  user       Profile  @relation(fields: [user_id], references: [id])

  @@index([product_id, created_at])
  @@map("product_messages")
}
```

- [ ] Add `productMessages ProductMessage[]` to `model Product` and `model Profile` relations.

- [ ] Add new model `LivestreamMessage` after `model Livestream`:

```prisma
model LivestreamMessage {
  id            String     @id @default(cuid())
  livestream_id String
  user_id       String
  body_ru       String
  is_deleted    Boolean    @default(false)
  deleted_by    String?
  created_at    DateTime   @default(now())

  livestream    Livestream @relation(fields: [livestream_id], references: [id])
  user          Profile    @relation(fields: [user_id], references: [id])

  @@index([livestream_id, created_at])
  @@map("livestream_messages")
}
```

- [ ] Add `livestreamMessages LivestreamMessage[]` to `model Livestream` and `model Profile`.

- [ ] Run migration:

```bash
npx prisma migrate dev --name admin_expansion
```

Expected: migration file created, client regenerated, zero errors.

- [ ] Verify types are generated:

```bash
npm run type-check
```

Expected: zero errors.

- [ ] Commit:

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(db): add schema fields for admin expansion (Phase 0)"
```

---

## Phase 1: Site Design Settings

**Files:**
- Create: `lib/settings/site-settings.ts` — DB read + cache helper
- Create: `components/layout/SiteSettingsStyle.tsx` — renders CSS variables `<style>` tag
- Create: `app/(admin)/admin/settings/page.tsx` — 4-tab settings page
- Create: `app/(admin)/admin/settings/BrandTab.tsx`
- Create: `app/(admin)/admin/settings/FontsTab.tsx`
- Create: `app/(admin)/admin/settings/ContentTab.tsx`
- Create: `app/(admin)/admin/settings/SeoTab.tsx`
- Create: `app/api/admin/settings/route.ts` — GET + PUT
- Modify: `app/layout.tsx` — inject `<SiteSettingsStyle />`
- Modify: `app/(admin)/layout.tsx` — add «Настройки» to navLinks
- Modify: `app/globals.css` — add CSS variable definitions with defaults

### Task 1.1: Settings cache helper

- [ ] Create `lib/settings/site-settings.ts`:

```typescript
import { unstable_cache } from 'next/cache'
import { db } from '@/lib/db/client'

export type SiteSettingsBrand = {
  siteName: string
  slogan: string
  primaryColor: string
  backgroundColor: string
  logoUrl: string | null
  faviconUrl: string | null
}

export type SiteSettingsTypography = {
  headingFont: string
  bodyFont: string
  baseFontSize: 'sm' | 'md' | 'lg'
}

export type SiteSettingsHomepage = {
  heroTitle: string
  heroSubtitle: string
  heroPrimaryCtaText: string
  heroSecondaryCtaText: string
  navLabels: Record<string, string>
  sections: Record<string, { label: string; visible: boolean }>
}

export type SiteSettingsSeo = {
  orgName: string
  phone: string
  email: string
  country: string
  titleTemplate: string
  defaultMetaDescription: string
  ogImageUrl: string | null
  aiDescription: string
  keywords: string
  socials: Record<string, string>
}

export type SiteSettings = {
  brand: SiteSettingsBrand
  typography: SiteSettingsTypography
  homepage: SiteSettingsHomepage
  seo: SiteSettingsSeo
}

export const DEFAULT_SETTINGS: SiteSettings = {
  brand: {
    siteName: 'EduPlatform',
    slogan: 'Йога · Массаж · Фитнес',
    primaryColor: '#4a7c59',
    backgroundColor: '#f8f7f4',
    logoUrl: null,
    faviconUrl: null,
  },
  typography: {
    headingFont: 'PT Serif',
    bodyFont: 'PT Sans',
    baseFontSize: 'md',
  },
  homepage: {
    heroTitle: 'Учись у лучших преподавателей',
    heroSubtitle: 'Йога, массаж, фитнес, творчество и бизнес — онлайн-курсы, прямые трансляции и физические товары в одном месте.',
    heroPrimaryCtaText: 'Смотреть курсы',
    heroSecondaryCtaText: 'Подписки',
    navLabels: { catalog: 'Каталог', subscriptions: 'Подписки', teachers: 'Преподаватели', shop: 'Магазин' },
    sections: {
      popularProducts: { label: 'Популярные курсы', visible: true },
      livestreams: { label: 'Прямые трансляции', visible: true },
      reviews: { label: 'Отзывы студентов', visible: false },
    },
  },
  seo: {
    orgName: '',
    phone: '',
    email: '',
    country: 'Россия',
    titleTemplate: '{title} | EduPlatform',
    defaultMetaDescription: 'Онлайн-курсы йоги, массажа, фитнеса — от лучших преподавателей России.',
    ogImageUrl: null,
    aiDescription: '',
    keywords: 'йога, массаж, фитнес, творчество, бизнес',
    socials: {},
  },
}

export const getSiteSettings = unstable_cache(
  async (): Promise<SiteSettings> => {
    try {
      const row = await db.siteSettings.findUnique({ where: { id: 'main' } })
      if (!row) return DEFAULT_SETTINGS
      return {
        brand: { ...DEFAULT_SETTINGS.brand, ...(row.brand as object) } as SiteSettingsBrand,
        typography: { ...DEFAULT_SETTINGS.typography, ...(row.typography as object) } as SiteSettingsTypography,
        homepage: { ...DEFAULT_SETTINGS.homepage, ...(row.homepage as object) } as SiteSettingsHomepage,
        seo: { ...DEFAULT_SETTINGS.seo, ...(row.seo as object) } as SiteSettingsSeo,
      }
    } catch {
      return DEFAULT_SETTINGS
    }
  },
  ['site-settings'],
  { revalidate: 60, tags: ['site-settings'] }
)
```

- [ ] Run `npm run type-check` — expected: zero errors.

- [ ] Commit:

```bash
git add lib/settings/site-settings.ts
git commit -m "feat(settings): add site settings cache helper with defaults"
```

### Task 1.2: CSS variables style component

- [ ] Create `components/layout/SiteSettingsStyle.tsx`:

```typescript
import { getSiteSettings } from '@/lib/settings/site-settings'

const FONT_URLS: Record<string, string> = {
  'PT Serif': 'https://fonts.googleapis.com/css2?family=PT+Serif:ital,wght@0,400;0,700;1,400&display=swap',
  'PT Sans': 'https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap',
  'Playfair Display': 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap',
  'Inter': 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap',
  'Cormorant Garamond': 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600&display=swap',
  'Lato': 'https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&display=swap',
  'Merriweather': 'https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&display=swap',
  'Nunito': 'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap',
}

const BASE_SIZES: Record<string, string> = { sm: '14px', md: '16px', lg: '18px' }

export async function SiteSettingsStyle() {
  const s = await getSiteSettings()
  const headingUrl = FONT_URLS[s.typography.headingFont]
  const bodyUrl = FONT_URLS[s.typography.bodyFont]
  const css = `
    :root {
      --primary-color: ${s.brand.primaryColor};
      --bg-color: ${s.brand.backgroundColor};
      --font-heading: '${s.typography.headingFont}', Georgia, serif;
      --font-body: '${s.typography.bodyFont}', Arial, sans-serif;
      --base-font-size: ${BASE_SIZES[s.typography.baseFontSize] ?? '16px'};
    }
  `
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      {headingUrl && <link rel="stylesheet" href={headingUrl} />}
      {bodyUrl && s.typography.bodyFont !== s.typography.headingFont && (
        <link rel="stylesheet" href={bodyUrl} />
      )}
      <style dangerouslySetInnerHTML={{ __html: css }} />
    </>
  )
}
```

- [ ] Modify `app/layout.tsx` — import and add `<SiteSettingsStyle />` inside `<head>`:

```typescript
import { SiteSettingsStyle } from '@/components/layout/SiteSettingsStyle'
// inside <head>:
<SiteSettingsStyle />
```

- [ ] Run dev server: `npm run dev` — verify page loads, check `<style>` tag injected in HTML.

- [ ] Commit:

```bash
git add components/layout/SiteSettingsStyle.tsx app/layout.tsx
git commit -m "feat(settings): inject CSS variables from site_settings into root layout"
```

### Task 1.3: Settings API route

- [ ] Create `app/api/admin/settings/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { requireRole } from '@/lib/auth/session'
import { db } from '@/lib/db/client'
import type { ApiResponse } from '@/types'

export async function GET(): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    await requireRole('admin')
    const row = await db.siteSettings.findUnique({ where: { id: 'main' } })
    return NextResponse.json({ data: row, error: null })
  } catch {
    return NextResponse.json({ data: null, error: 'Ошибка сервера' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    await requireRole('admin')
    const body: unknown = await req.json()
    const { brand, typography, homepage, seo } = body as Record<string, unknown>
    const row = await db.siteSettings.upsert({
      where: { id: 'main' },
      create: { id: 'main', brand: brand ?? {}, typography: typography ?? {}, homepage: homepage ?? {}, seo: seo ?? {} },
      update: {
        ...(brand !== undefined && { brand }),
        ...(typography !== undefined && { typography }),
        ...(homepage !== undefined && { homepage }),
        ...(seo !== undefined && { seo }),
      },
    })
    revalidateTag('site-settings')
    return NextResponse.json({ data: row, error: null })
  } catch {
    return NextResponse.json({ data: null, error: 'Ошибка сервера' }, { status: 500 })
  }
}
```

- [ ] Test with curl (dev server running):

```bash
curl -s http://localhost:3000/api/admin/settings | jq .
```

Expected: `{ "data": null, "error": null }` (no row yet) or row data.

- [ ] Commit:

```bash
git add app/api/admin/settings/route.ts
git commit -m "feat(settings): add GET/PUT API for site settings"
```

### Task 1.4: Admin settings page with 4 tabs

- [ ] Create `app/(admin)/admin/settings/page.tsx`:

```typescript
'use client'
import { useState } from 'react'
import { BrandTab } from './BrandTab'
import { FontsTab } from './FontsTab'
import { ContentTab } from './ContentTab'
import { SeoTab } from './SeoTab'
import type { SiteSettings } from '@/lib/settings/site-settings'
import { DEFAULT_SETTINGS } from '@/lib/settings/site-settings'

const TABS = [
  { id: 'brand', label: '🎨 Бренд' },
  { id: 'fonts', label: '🔤 Шрифты' },
  { id: 'content', label: '📝 Контент' },
  { id: 'seo', label: '📍 GEO / SEO' },
] as const

type TabId = typeof TABS[number]['id']

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('brand')
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave(patch: Partial<SiteSettings>) {
    setSaving(true)
    try {
      await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      setSettings((s) => ({ ...s, ...patch }))
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Настройки сайта</h1>
        {saved && <span className="text-sm text-green-600 font-medium">Сохранено ✓</span>}
      </div>

      <div className="border-b flex gap-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div>
        {activeTab === 'brand' && <BrandTab settings={settings} onSave={(b) => handleSave({ brand: b })} saving={saving} />}
        {activeTab === 'fonts' && <FontsTab settings={settings} onSave={(t) => handleSave({ typography: t })} saving={saving} />}
        {activeTab === 'content' && <ContentTab settings={settings} onSave={(h) => handleSave({ homepage: h })} saving={saving} />}
        {activeTab === 'seo' && <SeoTab settings={settings} onSave={(s) => handleSave({ seo: s })} saving={saving} />}
      </div>
    </div>
  )
}
```

- [ ] Create `app/(admin)/admin/settings/BrandTab.tsx`:

```typescript
'use client'
import { useState } from 'react'
import type { SiteSettingsBrand, SiteSettings } from '@/lib/settings/site-settings'

interface Props {
  settings: SiteSettings
  onSave: (brand: SiteSettingsBrand) => Promise<void>
  saving: boolean
}

export function BrandTab({ settings, onSave, saving }: Props) {
  const [form, setForm] = useState<SiteSettingsBrand>(settings.brand)

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground uppercase tracking-wide">Название сайта</label>
          <input
            className="w-full rounded-lg border px-3 py-2 text-sm bg-background"
            value={form.siteName}
            onChange={(e) => setForm((f) => ({ ...f, siteName: e.target.value }))}
          />
          <p className="text-xs text-muted-foreground">Отображается в хедере и &lt;title&gt;</p>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground uppercase tracking-wide">Слоган</label>
          <input
            className="w-full rounded-lg border px-3 py-2 text-sm bg-background"
            value={form.slogan}
            onChange={(e) => setForm((f) => ({ ...f, slogan: e.target.value }))}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground uppercase tracking-wide">Основной цвет</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              className="h-9 w-12 cursor-pointer rounded border"
              value={form.primaryColor}
              onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))}
            />
            <input
              className="flex-1 rounded-lg border px-3 py-2 text-sm bg-background font-mono"
              value={form.primaryColor}
              onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))}
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground uppercase tracking-wide">Цвет фона</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              className="h-9 w-12 cursor-pointer rounded border"
              value={form.backgroundColor}
              onChange={(e) => setForm((f) => ({ ...f, backgroundColor: e.target.value }))}
            />
            <input
              className="flex-1 rounded-lg border px-3 py-2 text-sm bg-background font-mono"
              value={form.backgroundColor}
              onChange={(e) => setForm((f) => ({ ...f, backgroundColor: e.target.value }))}
            />
          </div>
        </div>
      </div>
      <button
        onClick={() => onSave(form)}
        disabled={saving}
        className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold disabled:opacity-50"
      >
        {saving ? 'Сохраняется...' : 'Сохранить'}
      </button>
    </div>
  )
}
```

- [ ] Create `app/(admin)/admin/settings/FontsTab.tsx` — similar pattern, dropdown selects for `headingFont`, `bodyFont`, radio for `baseFontSize` (sm/md/lg).

- [ ] Create `app/(admin)/admin/settings/ContentTab.tsx` — text inputs for hero fields, nav labels, and toggle switches for section visibility.

- [ ] Create `app/(admin)/admin/settings/SeoTab.tsx` — inputs for orgName, phone, email, titleTemplate, defaultMetaDescription, aiDescription, keywords, socials.

- [ ] Modify `app/(admin)/layout.tsx` — add Settings and Users to navLinks:

```typescript
import { LayoutDashboard, Users, Package, ShoppingBag, BarChart2, Star, MessageSquare, Settings, UserCog } from 'lucide-react'

const navLinks = [
  { href: '/admin', label: 'Обзор', icon: LayoutDashboard },
  { href: '/admin/teachers', label: 'Преподаватели', icon: Users },
  { href: '/admin/products', label: 'Продукты', icon: Package },
  { href: '/admin/orders', label: 'Заказы', icon: ShoppingBag },
  { href: '/admin/users', label: 'Пользователи', icon: UserCog },
  { href: '/admin/analytics', label: 'Аналитика', icon: BarChart2 },
  { href: '/admin/reviews', label: 'Отзывы', icon: Star },
  { href: '/admin/chats', label: 'Чаты', icon: MessageSquare },
  { href: '/admin/settings', label: 'Настройки', icon: Settings },
]
```

- [ ] Run `npm run type-check && npm run lint` — expected: zero errors.

- [ ] Open `http://localhost:3000/admin/settings` — verify 4 tabs render, save works, CSS variables update on page reload.

- [ ] Commit:

```bash
git add app/(admin)/admin/settings/ app/(admin)/layout.tsx
git commit -m "feat(admin): add /admin/settings page with 4 tabs (brand, fonts, content, seo)"
```

---

## Phase 2: SEO + AI Optimization

**Files:**
- Create: `app/robots.txt/route.ts`
- Create: `app/sitemap.xml/route.ts`
- Create: `app/llms.txt/route.ts`
- Create: `components/seo/SchemaOrg.tsx`
- Modify: `app/(public)/catalog/[slug]/page.tsx` — add Course schema + AggregateRating
- Modify: `app/(public)/teachers/page.tsx` — add Person schema + city
- Modify: `app/layout.tsx` — add Organization schema on root

### Task 2.1: robots.txt

- [ ] Create `app/robots.txt/route.ts`:

```typescript
import { NextResponse } from 'next/server'

export function GET() {
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

Sitemap: ${process.env.NEXT_PUBLIC_BASE_URL ?? 'https://eduplatform.ru'}/sitemap.xml`

  return new NextResponse(body, { headers: { 'Content-Type': 'text/plain' } })
}
```

- [ ] Verify: `curl http://localhost:3000/robots.txt`

### Task 2.2: sitemap.xml

- [ ] Create `app/sitemap.xml/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { db } from '@/lib/db/client'

export async function GET() {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://eduplatform.ru'
  const staticUrls = ['/', '/catalog', '/teachers', '/subscriptions', '/shop']

  let productSlugs: string[] = []
  let teacherIds: string[] = []
  try {
    const [products, teachers] = await Promise.all([
      db.product.findMany({ where: { is_active: true, moderation_status: 'approved' }, select: { slug: true } }),
      db.profile.findMany({ where: { role: 'teacher', is_active: true }, select: { id: true } }),
    ])
    productSlugs = products.map((p) => p.slug)
    teacherIds = teachers.map((t) => t.id)
  } catch { /* DB unavailable */ }

  const urls = [
    ...staticUrls.map((u) => `${base}${u}`),
    ...productSlugs.map((s) => `${base}/catalog/${s}`),
    ...teacherIds.map((id) => `${base}/teachers/${id}`),
  ]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}
</urlset>`

  return new NextResponse(xml, { headers: { 'Content-Type': 'application/xml' } })
}
```

### Task 2.3: llms.txt

- [ ] Create `app/llms.txt/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { getSiteSettings } from '@/lib/settings/site-settings'

export async function GET() {
  const s = await getSiteSettings()
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://eduplatform.ru'
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
${s.seo.orgName}
Страна: ${s.seo.country}
${s.seo.phone ? `Телефон: ${s.seo.phone}` : ''}
${s.seo.email ? `Email: ${s.seo.email}` : ''}
`
  return new NextResponse(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
```

### Task 2.4: Schema.org components

- [ ] Create `components/seo/SchemaOrg.tsx`:

```typescript
interface OrganizationSchemaProps {
  name: string; url: string; phone?: string; email?: string; socials?: string[]
}

export function OrganizationSchema({ name, url, phone, email, socials }: OrganizationSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name, url,
    ...(phone && { telephone: phone }),
    ...(email && { email }),
    ...(socials?.length && { sameAs: socials }),
  }
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
}

interface CourseSchemaProps {
  name: string; description: string; price: number; teacherName: string; teacherCity?: string | null
  reviewCount?: number; ratingValue?: number
}

export function CourseSchema({ name, description, price, teacherName, teacherCity, reviewCount, ratingValue }: CourseSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name, description,
    provider: { '@type': 'Person', name: teacherName, ...(teacherCity && { address: { '@type': 'PostalAddress', addressLocality: teacherCity, addressCountry: 'RU' } }) },
    offers: { '@type': 'Offer', price: (price / 100).toFixed(2), priceCurrency: 'RUB', availability: 'https://schema.org/InStock' },
    ...(reviewCount && ratingValue && {
      aggregateRating: { '@type': 'AggregateRating', ratingValue: ratingValue.toFixed(1), reviewCount }
    }),
  }
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
}
```

- [ ] Add `<OrganizationSchema />` to `app/layout.tsx` using settings from `getSiteSettings()`.

- [ ] Add `<CourseSchema />` to `app/(public)/catalog/[slug]/page.tsx`.

- [ ] Run `npm run type-check` — expected: zero errors.

- [ ] Commit:

```bash
git add app/robots.txt/ app/sitemap.xml/ app/llms.txt/ components/seo/
git commit -m "feat(seo): add robots.txt, sitemap.xml, llms.txt, Schema.org components"
```

---

## Phase 3: Teacher Content Management

**Files:**
- Create: `app/(admin)/admin/teachers/[id]/page.tsx`
- Create: `app/api/admin/teachers/[id]/route.ts`
- Modify: `app/(admin)/admin/teachers/page.tsx` — add filters, city, revenue columns
- Modify: `app/(admin)/admin/products/[id]/edit/page.tsx` — add SEO + AI fields
- Modify: `app/api/admin/products/[id]/route.ts`

### Task 3.1: Teacher detail page

- [ ] Create `app/(admin)/admin/teachers/[id]/page.tsx` — Server Component:
  - Loads teacher profile with `db.profile.findUnique({ where: { id }, include: { products: { include: { _count: { select: { purchases: true, reviews: true } } }, orderBy: { created_at: 'desc' } }, _count: { select: { products: true } } } })`
  - Shows Profile block (name, email, avatar, city, bio, status)
  - Shows Products table (title, moderation_status, views_count, purchases count, duration_minutes, last user_progress.updated_at)
  - Shows Actions: send notification form, block/unblock button

- [ ] Create `app/api/admin/teachers/[id]/route.ts`:

```typescript
// PATCH: block/unblock teacher
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  await requireRole('admin')
  const { is_active, notification_text } = await req.json() as { is_active?: boolean; notification_text?: string }
  if (is_active !== undefined) {
    await db.profile.update({ where: { id: params.id }, data: { is_active } })
  }
  if (notification_text) {
    await db.notification.create({
      data: { user_id: params.id, type: 'system', title_ru: 'Сообщение от администратора', body_ru: notification_text }
    })
  }
  return NextResponse.json({ data: 'ok', error: null })
}
```

- [ ] Modify `app/(admin)/admin/products/[id]/edit/page.tsx` — add fields: `seo_title_ru`, `seo_description_ru`, `ai_description_ru`, `duration_minutes`.

- [ ] Commit:

```bash
git add app/(admin)/admin/teachers/[id]/ app/api/admin/teachers/
git commit -m "feat(admin): add teacher detail page with products, actions, and SEO fields"
```

---

## Phase 4: User Management

**Files:**
- Create: `app/(admin)/admin/users/page.tsx`
- Create: `app/(admin)/admin/users/[id]/page.tsx`
- Create: `app/api/admin/users/[id]/route.ts` (already exists — extend)
- Create: `app/(auth)/change-password/page.tsx`
- Create: `app/api/auth/change-password/route.ts`
- Modify: `lib/auth/config.ts` — add `force_password_change` to JWT
- Modify: `middleware.ts` — redirect to `/change-password` if flag set
- Modify: `app/api/auth/register/route.ts` — save registration IP

### Task 4.1: Save registration IP

- [ ] Modify `app/api/auth/register/route.ts` — after creating profile, add:

```typescript
const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
await db.profile.update({ where: { id: newUser.id }, data: { registration_ip: ip } })
```

### Task 4.2: Users list page

- [ ] Create `app/(admin)/admin/users/page.tsx` — Server Component with filters (role, status, search). Table columns: имя, email, роль, статус, дата регистрации, IP регистрации, город. Load with `db.profile.findMany({ where: { ...filters }, orderBy: { created_at: 'desc' }, take: 50 })`.

### Task 4.3: User detail page

- [ ] Install geoip-lite:

```bash
npm install geoip-lite
npm install --save-dev @types/geoip-lite
```

- [ ] Create `app/(admin)/admin/users/[id]/page.tsx`:

```typescript
import geoip from 'geoip-lite'

// Inside the page component:
const geo = profile.registration_ip ? geoip.lookup(profile.registration_ip) : null
// geo.city, geo.country available
```

- Shows: Profile block, Registration block (IP + geo city/country + user-agent from consent_log), Access block (role select, purchases list, active subscriptions), Actions (block, force password change).

### Task 4.4: Force password change API

- [ ] Extend `app/api/admin/users/[id]/route.ts`:

```typescript
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  await requireRole('admin')
  const body = await req.json() as { role?: string; is_active?: boolean; force_password_change?: boolean }
  await db.profile.update({
    where: { id: params.id },
    data: {
      ...(body.role && { role: body.role as Role }),
      ...(body.is_active !== undefined && { is_active: body.is_active }),
      ...(body.force_password_change !== undefined && { force_password_change: body.force_password_change }),
    },
  })
  return NextResponse.json({ data: 'ok', error: null })
}
```

### Task 4.5: JWT + middleware for forced password change

- [ ] Modify `lib/auth/config.ts` JWT callback:

```typescript
async jwt({ token, user }) {
  if (user) {
    token.id = user.id
    token.role = (user as { role: Role }).role
    // Check force_password_change on sign-in
    const profile = await db.profile.findUnique({ where: { id: user.id as string }, select: { force_password_change: true } })
    token.force_password_change = profile?.force_password_change ?? false
  }
  return token
},
```

- [ ] Extend `types/next-auth.d.ts`:

```typescript
declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    role?: Role
    force_password_change?: boolean
  }
}
```

- [ ] Modify `middleware.ts` — add before other route checks:

```typescript
if (session?.user && (session as { user: { force_password_change?: boolean } }).user.force_password_change) {
  if (pathname !== '/change-password') {
    return NextResponse.redirect(new URL('/change-password', req.url))
  }
}
```

### Task 4.6: Change password page

- [ ] Create `app/(auth)/change-password/page.tsx` — client form with new password + confirm fields. On submit: `POST /api/auth/change-password`.

- [ ] Create `app/api/auth/change-password/route.ts`:

```typescript
export async function POST(req: NextRequest) {
  const user = await requireAuth()
  const { password } = await req.json() as { password: string }
  if (!password || password.length < 8) {
    return NextResponse.json({ data: null, error: 'Минимум 8 символов' }, { status: 400 })
  }
  const hash = await bcrypt.hash(password, 12)
  await db.profile.update({
    where: { id: user.id },
    data: { password_hash: hash, force_password_change: false },
  })
  return NextResponse.json({ data: 'ok', error: null })
}
```

- [ ] Run `npm run type-check` — zero errors.

- [ ] Commit:

```bash
git add app/(admin)/admin/users/ app/(auth)/change-password/ app/api/admin/users/ app/api/auth/change-password/
git commit -m "feat(admin): add user management, registration IP/geo, force password change"
```

---

## Phase 5: Product Analytics

**Files:**
- Create: `app/(admin)/admin/analytics/page.tsx`
- Create: `components/admin/RevenueChart.tsx` (client, Recharts)
- Create: `app/api/admin/analytics/route.ts`
- Create: `app/api/products/[id]/view/route.ts` — view counter
- Modify: `app/(public)/catalog/[slug]/page.tsx` — add view counter client component

### Task 5.1: Install Recharts

```bash
npm install recharts
```

### Task 5.2: Analytics API

- [ ] Create `app/api/admin/analytics/route.ts` — accepts `?period=7|30|90|all`, returns: KPIs (revenue, purchases, new users, active subscriptions), top products (title, views_count, purchases count, revenue, avg rating, completion %), revenue by day array.

### Task 5.3: Analytics page

- [ ] Create `app/(admin)/admin/analytics/page.tsx` — Server Component:
  - Fetches from `/api/admin/analytics`
  - 4 KPI cards
  - `<RevenueChart />` client component
  - Top products table with CSV export button

- [ ] Create `components/admin/RevenueChart.tsx`:

```typescript
'use client'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface Props { data: { date: string; revenue: number }[] }

export function RevenueChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis tickFormatter={(v: number) => `${(v / 100).toLocaleString('ru-RU')} ₽`} width={80} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v: number) => [`${(v / 100).toLocaleString('ru-RU')} ₽`, 'Выручка']} />
        <Line type="monotone" dataKey="revenue" stroke="#4a7c59" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
```

### Task 5.4: View counter

- [ ] Create `app/api/products/[id]/view/route.ts`:

```typescript
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await db.product.update({ where: { id: params.id }, data: { views_count: { increment: 1 } } })
  } catch { /* ignore */ }
  return new NextResponse(null, { status: 204 })
}
```

- [ ] Create `components/product/ViewTracker.tsx` — `'use client'` component that fires `POST /api/products/[id]/view` in `useEffect` on mount.

- [ ] Add `<ViewTracker productId={product.id} />` to `app/(public)/catalog/[slug]/page.tsx`.

- [ ] Commit:

```bash
git add app/(admin)/admin/analytics/ components/admin/ app/api/admin/analytics/ app/api/products/
git commit -m "feat(admin): add analytics dashboard with revenue chart and view counter"
```

---

## Phase 6: Reviews System

**Files:**
- Create: `app/(admin)/admin/reviews/page.tsx`
- Create: `app/(teacher)/teacher/reviews/page.tsx`
- Create: `app/api/products/[id]/reviews/route.ts` — POST (student creates review)
- Create: `app/api/reviews/[id]/route.ts` — PATCH (teacher reply, admin hide/delete)
- Modify: `app/(public)/catalog/[slug]/page.tsx` — show reviews with ratings
- Modify: `components/seo/SchemaOrg.tsx` — use AggregateRating

### Task 6.1: Review API

- [ ] Create `app/api/products/[id]/reviews/route.ts` — POST: validate user has access via `checkAccess()`, no existing review in last 7 days, create review with `rating` (1–5) and `text_ru`.

- [ ] Create `app/api/reviews/[id]/route.ts` — PATCH:
  - Teacher: can set `reply_ru` + `replied_at` for reviews on own products
  - Admin: can set `is_visible = false` or delete
  - Both: validated via `requireRole`

### Task 6.2: Admin reviews page

- [ ] Create `app/(admin)/admin/reviews/page.tsx` — table of all reviews, filter by rating (1–2 for alerts) and visibility. Each row: product name, student name, rating, text, visible toggle, delete button. Low-rating reviews highlighted in red.

### Task 6.3: Teacher reviews page

- [ ] Create `app/(teacher)/teacher/reviews/page.tsx` — reviews on teacher's own products, grouped by product. Each review shows reply form if no reply yet.

- [ ] Modify `app/(teacher)/layout.tsx` — add Reviews to navLinks.

- [ ] Add review display section to `app/(public)/catalog/[slug]/page.tsx` — stars, text, teacher reply, AggregateRating Schema.org.

- [ ] Commit:

```bash
git add app/(admin)/admin/reviews/ app/(teacher)/teacher/reviews/ app/api/products/ app/api/reviews/
git commit -m "feat(reviews): add reviews API, admin moderation, teacher replies, public display"
```

---

## Phase 7: Product Chat (Hybrid Polling)

**Files:**
- Create: `app/api/products/[id]/messages/route.ts` — GET (polling) + POST
- Create: `components/product/ProductChat.tsx` — client component
- Modify: `app/(public)/catalog/[slug]/page.tsx` — add chat tab
- Create: `app/(admin)/admin/chats/page.tsx`

### Task 7.1: Messages API

- [ ] Create `app/api/products/[id]/messages/route.ts`:

```typescript
// GET: ?after=ISO_TIMESTAMP — return messages after timestamp, max 50
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAuth()
  const hasAccess = await checkAccess(user.id, params.id)
  if (!hasAccess.hasAccess && !['teacher', 'admin'].includes(user.role)) {
    return NextResponse.json({ data: null, error: 'Нет доступа' }, { status: 403 })
  }
  const after = req.nextUrl.searchParams.get('after')
  const messages = await db.productMessage.findMany({
    where: {
      product_id: params.id,
      is_deleted: false,
      ...(after && { created_at: { gt: new Date(after) } }),
    },
    include: { user: { select: { id: true, name: true, avatar_url: true, role: true } } },
    orderBy: { created_at: 'asc' },
    take: 50,
  })
  return NextResponse.json({ data: messages, error: null })
}

// POST: send message
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAuth()
  const hasAccess = await checkAccess(user.id, params.id)
  if (!hasAccess.hasAccess && !['teacher', 'admin'].includes(user.role)) {
    return NextResponse.json({ data: null, error: 'Нет доступа' }, { status: 403 })
  }
  const { body_ru } = await req.json() as { body_ru: string }
  if (!body_ru?.trim()) return NextResponse.json({ data: null, error: 'Сообщение пустое' }, { status: 400 })
  const msg = await db.productMessage.create({
    data: { product_id: params.id, user_id: user.id, body_ru: body_ru.trim() },
    include: { user: { select: { id: true, name: true, avatar_url: true, role: true } } },
  })
  // Notify participants if teacher replied
  if (user.role === 'teacher') {
    const buyers = await db.purchase.findMany({ where: { product_id: params.id }, select: { user_id: true } })
    await db.notification.createMany({
      data: buyers.map((b) => ({ user_id: b.user_id, type: 'new_lesson' as const, title_ru: 'Новое сообщение от преподавателя', body_ru: body_ru.slice(0, 100) })),
      skipDuplicates: true,
    })
  }
  return NextResponse.json({ data: msg, error: null }, { status: 201 })
}
```

### Task 7.2: ProductChat client component

- [ ] Create `components/product/ProductChat.tsx` — `'use client'`:
  - State: `messages`, `lastTimestamp`, `inputText`
  - `useEffect` polls `GET /api/products/[id]/messages?after=...` every 8 seconds
  - Renders message list with avatar, name, role badge, text, time
  - Pinned messages at top (is_pinned)
  - Input + send button
  - Delete button for teacher/admin on each message (calls `DELETE /api/products/[id]/messages/[msgId]`)

- [ ] Add `<ProductChat productId={id} userRole={session.role} />` as a tab in `app/(public)/catalog/[slug]/page.tsx`.

### Task 7.3: Admin chats overview

- [ ] Create `app/(admin)/admin/chats/page.tsx` — table of all products with chat activity: product name, messages today, messages total, last message time. Link to product page.

- [ ] Commit:

```bash
git add app/api/products/[id]/messages/ components/product/ProductChat.tsx app/(admin)/admin/chats/
git commit -m "feat(chat): add product discussion chat with hybrid polling and moderation"
```

---

## Phase 8: Livestream Chat (SSE)

**Files:**
- Create: `app/api/livestreams/[id]/chat/route.ts` — POST message
- Create: `app/api/livestreams/[id]/chat/stream/route.ts` — GET SSE
- Create: `components/livestream/LivestreamChat.tsx` — client SSE consumer
- Modify: `app/(public)/live/page.tsx` — add chat alongside stream

### Task 8.1: In-memory SSE broadcaster

- [ ] Create `lib/sse/livestream-broadcaster.ts`:

```typescript
// Simple in-process SSE broadcaster per livestream ID
// Works with PM2 single-process mode on Beget

type Listener = (data: string) => void

const listeners = new Map<string, Set<Listener>>()

export function subscribe(livestreamId: string, listener: Listener): () => void {
  if (!listeners.has(livestreamId)) listeners.set(livestreamId, new Set())
  listeners.get(livestreamId)!.add(listener)
  return () => listeners.get(livestreamId)?.delete(listener)
}

export function broadcast(livestreamId: string, data: object) {
  const payload = `data: ${JSON.stringify(data)}\n\n`
  listeners.get(livestreamId)?.forEach((fn) => fn(payload))
}
```

### Task 8.2: SSE stream route

- [ ] Create `app/api/livestreams/[id]/chat/stream/route.ts`:

```typescript
import { subscribe } from '@/lib/sse/livestream-broadcaster'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(': connected\n\n'))
      const unsub = subscribe(params.id, (data) => {
        try { controller.enqueue(encoder.encode(data)) } catch { unsub() }
      })
      // Keep-alive ping every 25s
      const ping = setInterval(() => {
        try { controller.enqueue(encoder.encode(': ping\n\n')) } catch { clearInterval(ping) }
      }, 25_000)
    },
  })
  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
```

### Task 8.3: POST message + broadcast

- [ ] Create `app/api/livestreams/[id]/chat/route.ts`:

```typescript
import { broadcast } from '@/lib/sse/livestream-broadcaster'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAuth()
  const { body_ru } = await req.json() as { body_ru: string }
  if (!body_ru?.trim()) return NextResponse.json({ data: null, error: 'Пустое сообщение' }, { status: 400 })
  const msg = await db.livestreamMessage.create({
    data: { livestream_id: params.id, user_id: user.id, body_ru: body_ru.trim() },
    include: { user: { select: { id: true, name: true, avatar_url: true, role: true } } },
  })
  broadcast(params.id, { type: 'message', payload: msg })
  return NextResponse.json({ data: msg, error: null }, { status: 201 })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireRole('teacher', 'admin')
  const { messageId } = await req.json() as { messageId: string }
  await db.livestreamMessage.update({ where: { id: messageId }, data: { is_deleted: true, deleted_by: user.id } })
  broadcast(params.id, { type: 'message_deleted', payload: { id: messageId } })
  return NextResponse.json({ data: 'ok', error: null })
}
```

### Task 8.4: LivestreamChat client component

- [ ] Create `components/livestream/LivestreamChat.tsx` — `'use client'`:
  - Connects to `EventSource('/api/livestreams/[id]/chat/stream')`
  - On `message` event: parse JSON, append to messages
  - On `message_deleted` event: remove from messages by id
  - Reconnects on error after 3s
  - Input + send → `POST /api/livestreams/[id]/chat`

- [ ] Run `npm run type-check && npm run lint` — expected: zero errors.

- [ ] Commit:

```bash
git add lib/sse/ app/api/livestreams/ components/livestream/
git commit -m "feat(chat): add SSE real-time chat for livestreams with moderation"
```

---

## Final Steps

- [ ] Run full type check: `npm run type-check` — expected: zero errors
- [ ] Run linter: `npm run lint` — expected: zero warnings on changed files
- [ ] Run tests: `npm run test` — expected: all pass
- [ ] Push to GitHub: `git push origin main`
- [ ] Update `.gitignore` if `.superpowers/` not already excluded:

```bash
echo ".superpowers/" >> .gitignore
git add .gitignore && git commit -m "chore: ignore .superpowers brainstorm dir"
```

---

## Execution Order

Phases must be implemented in order: **0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8**. Phase 0 (schema) is a prerequisite for everything. Each subsequent phase is independent within its scope.
