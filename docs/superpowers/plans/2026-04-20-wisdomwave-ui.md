# WisdomWave UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Внедрить дизайн-систему WisdomWave (волновая стилистика, шрифт Outfit, тёмный/светлый океан) во все страницы продакшн-сайта на Next.js 14.

**Architecture:** Расширяем существующий Tailwind + shadcn/ui стек новыми CSS-переменными и токенами, добавляем четыре новых layout-компонента (OceanBackground, WaveCard, WaveDrawer, MobileNav), обновляем страницы поочерёдно. Всё в ветке `main` пофайлово — сайт работает на каждом этапе.

**Tech Stack:** Next.js 14 App Router, TypeScript strict, Tailwind CSS, shadcn/ui, next-themes, next-intl, next/font/google (Outfit), Vitest, Playwright

---

## Карта файлов

| Действие | Файл | Что меняется |
|----------|------|-------------|
| Modify | `app/layout.tsx` | Inter → Outfit, метатеги WisdomWave, `<OceanBackground />` |
| Modify | `app/globals.css` | Wave CSS-переменные |
| Modify | `tailwind.config.ts` | Wave токены + анимации |
| Create | `components/layout/OceanBackground.tsx` | 5 SVG-волн + ветровые нити |
| Create | `components/layout/WaveCard.tsx` | Стеклянная карточка |
| Create | `components/layout/WaveDrawer.tsx` | Слайд-панель навигации |
| Create | `components/layout/MobileNav.tsx` | Нижняя мобильная навигация |
| Modify | `components/layout/Header.tsx` | WisdomWave лого + интеграция WaveDrawer |
| Modify | `app/(public)/page.tsx` | Hero + статистика + каталог в WaveCard |
| Modify | `app/(public)/catalog/page.tsx` | Сетка WaveCard |
| Modify | `app/(public)/catalog/[slug]/page.tsx` | Hero курса + программа |
| Modify | `app/(dashboard)/dashboard/page.tsx` | Прогресс-дашборд |
| Modify | `messages/ru.json` | Название → WisdomWave |

---

## Task 1: CSS-переменные и Tailwind-токены

**Files:**
- Modify: `app/globals.css`
- Modify: `tailwind.config.ts`

- [ ] **Step 1.1: Добавить wave-переменные в `globals.css`**

Добавить в конец файла после существующих `@layer base` блоков:

```css
/* Wave design system */
@layer base {
  :root {
    --ocean1: #081228;
    --ocean2: #0c1a38;
    --foam: rgba(180,210,255,0.92);
    --foam-light: rgba(210,230,255,0.6);
    --card-body: rgba(10,22,52,0.82);
    --card-border: rgba(100,160,255,0.13);
    --wave-accent: oklch(0.63 0.26 272);
    --wave-accent-glow: oklch(0.63 0.26 272 / 0.18);
    --wave-gold: oklch(0.72 0.14 76);
    --text-foam: #d8e8ff;
    --text-muted-foam: rgba(180,210,255,0.5);
  }

  .light {
    --ocean1: #c2e0f7;
    --ocean2: #aed4f2;
    --foam: rgba(40,100,200,0.7);
    --foam-light: rgba(60,130,220,0.35);
    --card-body: rgba(255,255,255,0.88);
    --card-border: rgba(60,130,220,0.18);
    --wave-accent: oklch(0.52 0.24 272);
    --wave-gold: oklch(0.60 0.14 60);
    --text-foam: #0f2040;
    --text-muted-foam: rgba(20,60,130,0.55);
  }
}
```

- [ ] **Step 1.2: Добавить wave-токены и анимации в `tailwind.config.ts`**

В секцию `theme.extend.colors` добавить:

```ts
'ocean-1': 'var(--ocean1)',
'ocean-2': 'var(--ocean2)',
'wave-accent': 'var(--wave-accent)',
'card-body': 'var(--card-body)',
'card-border': 'var(--card-border)',
'text-foam': 'var(--text-foam)',
'text-muted-foam': 'var(--text-muted-foam)',
```

В секцию `theme.extend.keyframes` добавить:

```ts
waveShift1: {
  '0%,100%': { transform: 'translateX(0)' },
  '50%': { transform: 'translateX(-12%)' },
},
waveShift2: {
  '0%,100%': { transform: 'translateX(-6%)' },
  '50%': { transform: 'translateX(6%)' },
},
waveShift3: {
  '0%,100%': { transform: 'translateX(0)' },
  '50%': { transform: 'translateX(10%)' },
},
fadeUp: {
  from: { opacity: '0', transform: 'translateY(18px)' },
  to: { opacity: '1', transform: 'translateY(0)' },
},
windFlow: {
  '0%': { opacity: '0', transform: 'translateX(-80px)' },
  '20%': { opacity: '1' },
  '80%': { opacity: '0.5' },
  '100%': { opacity: '0', transform: 'translateX(120px)' },
},
```

В секцию `theme.extend.animation` добавить:

```ts
'wave-1': 'waveShift1 14s ease-in-out infinite',
'wave-2': 'waveShift2 18s ease-in-out infinite',
'wave-3': 'waveShift3 22s ease-in-out infinite',
'wave-3r': 'waveShift1 28s ease-in-out infinite reverse',
'wave-slow': 'waveShift2 35s ease-in-out infinite',
'fade-up': 'fadeUp 0.5s cubic-bezier(0.25,0.46,0.45,0.94) both',
wind: 'windFlow 8s ease-in-out infinite',
```

- [ ] **Step 1.3: Проверить type-check**

```bash
cd /home/ai-openyoga/EduplatformРФ && npm run type-check
```

Ожидается: 0 ошибок.

- [ ] **Step 1.4: Commit**

```bash
git add app/globals.css tailwind.config.ts
git commit -m "feat(design): add WisdomWave CSS variables and Tailwind tokens"
```

---

## Task 2: Шрифт Outfit + метатеги WisdomWave

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 2.1: Заменить Inter на Outfit**

Изменить строки 2 и 11 в `app/layout.tsx`:

Было:
```ts
import { Inter } from 'next/font/google'
// ...
const inter = Inter({ subsets: ['latin', 'cyrillic'] })
```

Стало:
```ts
import { Outfit } from 'next/font/google'
// ...
const outfit = Outfit({
  subsets: ['latin', 'cyrillic'],
  weight: ['200', '300', '400', '500', '600', '700'],
  variable: '--font-outfit',
})
```

- [ ] **Step 2.2: Обновить `<body>` className**

Было:
```tsx
<body className={inter.className}>
```

Стало:
```tsx
<body className={`${outfit.variable} font-sans`}>
```

- [ ] **Step 2.3: Добавить шрифт в tailwind.config.ts**

В `theme.extend` добавить:
```ts
fontFamily: {
  sans: ['var(--font-outfit)', 'system-ui', 'sans-serif'],
},
```

- [ ] **Step 2.4: Обновить метатеги**

В `app/layout.tsx` изменить `metadata`:

```ts
export const metadata: Metadata = {
  title: {
    default: 'WisdomWave — Образовательная платформа',
    template: '%s | WisdomWave',
  },
  description: 'WisdomWave — образовательная платформа: йога, массаж, фитнес, творчество онлайн',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
}
```

- [ ] **Step 2.5: Обновить название в `messages/ru.json`**

Найти в `messages/ru.json` все вхождения `EduPlatform` и заменить на `WisdomWave`:

```bash
grep -n "EduPlatform" /home/ai-openyoga/EduplatformРФ/messages/ru.json
```

Заменить найденные строки вручную (бренд в title, nav, footer).

- [ ] **Step 2.6: Type-check и commit**

```bash
npm run type-check
git add app/layout.tsx tailwind.config.ts messages/ru.json
git commit -m "feat(design): add Outfit font, update WisdomWave brand metadata"
```

---

## Task 3: OceanBackground компонент

**Files:**
- Create: `components/layout/OceanBackground.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 3.1: Создать `components/layout/OceanBackground.tsx`**

```tsx
'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

const WIND_STREAMS = [
  { top: '8%', width: '18%', left: '5%', delay: '0s', duration: '7s' },
  { top: '15%', width: '12%', left: '25%', delay: '2s', duration: '9s' },
  { top: '22%', width: '22%', left: '60%', delay: '1s', duration: '8s' },
  { top: '35%', width: '15%', left: '10%', delay: '3s', duration: '11s' },
  { top: '45%', width: '20%', left: '45%', delay: '0.5s', duration: '10s' },
  { top: '55%', width: '10%', left: '75%', delay: '4s', duration: '7s' },
  { top: '65%', width: '18%', left: '30%', delay: '1.5s', duration: '9s' },
  { top: '72%', width: '14%', left: '80%', delay: '2.5s', duration: '8s' },
]

const WAVE_SVG = (color: string) =>
  `M0,35 C80,15 160,55 240,30 C300,14 360,50 400,32 L400,70 L0,70 Z`

export function OceanBackground() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return null

  const dark = resolvedTheme !== 'light'
  const waveColor1 = dark ? '#0c1a38' : '#aed4f2'
  const waveColor2 = dark ? '#081228' : '#c2e0f7'

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {/* Wave layer 1 — closest */}
      <div className="wave-layer absolute bottom-0 left-[-50%] h-[180px] w-[200%] opacity-25 animate-wave-1">
        <svg viewBox="0 0 400 70" preserveAspectRatio="none" className="h-full w-full">
          <path d={WAVE_SVG(waveColor1)} fill={waveColor1} />
        </svg>
      </div>

      {/* Wave layer 2 */}
      <div className="absolute bottom-[40px] left-[-50%] h-[180px] w-[200%] opacity-[0.14] animate-wave-2">
        <svg viewBox="0 0 400 70" preserveAspectRatio="none" className="h-full w-full">
          <path d="M0,42 C70,22 150,60 230,36 C290,18 350,52 400,38 L400,70 L0,70 Z" fill={waveColor2} />
        </svg>
      </div>

      {/* Wave layer 3 */}
      <div className="absolute bottom-[80px] left-[-50%] h-[180px] w-[200%] opacity-[0.08] animate-wave-3">
        <svg viewBox="0 0 400 70" preserveAspectRatio="none" className="h-full w-full">
          <path d="M0,50 C90,28 180,65 270,42 C320,28 370,58 400,46 L400,70 L0,70 Z" fill={waveColor1} />
        </svg>
      </div>

      {/* Wave layer 4 — far */}
      <div className="hidden md:block absolute bottom-[200px] left-[-50%] h-[180px] w-[200%] opacity-[0.05] animate-wave-3r">
        <svg viewBox="0 0 400 70" preserveAspectRatio="none" className="h-full w-full">
          <path d="M0,55 C100,32 200,68 300,48 C350,35 380,60 400,52 L400,70 L0,70 Z" fill={waveColor2} />
        </svg>
      </div>

      {/* Wave layer 5 — horizon */}
      <div className="hidden md:block absolute bottom-[380px] left-[-50%] h-[180px] w-[200%] opacity-[0.04] animate-wave-slow">
        <svg viewBox="0 0 400 70" preserveAspectRatio="none" className="h-full w-full">
          <path d="M0,60 C120,38 240,70 360,52 C380,47 392,58 400,55 L400,70 L0,70 Z" fill={waveColor1} />
        </svg>
      </div>

      {/* Wind streams */}
      {WIND_STREAMS.map((s, i) => (
        <div
          key={i}
          className="absolute h-px rounded-sm animate-wind"
          style={{
            top: s.top,
            width: s.width,
            left: s.left,
            animationDelay: s.delay,
            animationDuration: s.duration,
            background: `linear-gradient(90deg, transparent, var(--foam-light), transparent)`,
          }}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 3.2: Добавить `OceanBackground` в `app/layout.tsx`**

Добавить импорт:
```ts
import { OceanBackground } from '@/components/layout/OceanBackground'
```

Добавить компонент первым дочерним элементом внутри `<ThemeProvider>`:
```tsx
<ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
  <OceanBackground />
  {children}
</ThemeProvider>
```

- [ ] **Step 3.3: Type-check и запустить dev-сервер для визуальной проверки**

```bash
npm run type-check
npm run dev
```

Открыть http://localhost:3000 — должны быть видны анимированные волны на фоне. Проверить смену тем.

- [ ] **Step 3.4: Commit**

```bash
git add components/layout/OceanBackground.tsx app/layout.tsx
git commit -m "feat(design): add OceanBackground with animated SVG waves"
```

---

## Task 4: WaveCard компонент

**Files:**
- Create: `components/layout/WaveCard.tsx`

- [ ] **Step 4.1: Создать `components/layout/WaveCard.tsx`**

```tsx
import { cn } from '@/lib/utils'

interface WaveCardProps {
  children: React.ReactNode
  className?: string
  waveColor?: string
  waveAccent?: string
  onClick?: () => void
  as?: 'div' | 'article' | 'section'
}

export function WaveCard({
  children,
  className,
  waveColor,
  waveAccent,
  onClick,
  as: Tag = 'div',
}: WaveCardProps) {
  return (
    <Tag
      onClick={onClick}
      className={cn(
        'relative overflow-hidden rounded-2xl border transition-all duration-200',
        'border-[var(--card-border)] bg-[var(--card-body)] backdrop-blur-md',
        onClick && 'cursor-pointer hover:-translate-y-0.5 hover:shadow-lg',
        className,
      )}
      style={
        waveAccent
          ? ({ '--hover-glow': `${waveAccent}33` } as React.CSSProperties)
          : undefined
      }
    >
      {children}

      {/* Bottom wave accent */}
      {waveColor && waveAccent && (
        <div aria-hidden="true" className="pointer-events-none absolute bottom-0 left-0 right-0 h-10 opacity-60">
          <svg viewBox="0 0 400 40" preserveAspectRatio="none" className="h-full w-full">
            <path
              d="M0,25 C80,10 160,38 240,20 C300,8 360,32 400,18 L400,40 L0,40 Z"
              fill={waveColor}
            />
          </svg>
        </div>
      )}
    </Tag>
  )
}
```

- [ ] **Step 4.2: Написать тест рендеринга**

Создать `tests/unit/components/wave-card.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { WaveCard } from '@/components/layout/WaveCard'

describe('WaveCard', () => {
  it('renders children', () => {
    render(<WaveCard>Test content</WaveCard>)
    expect(screen.getByText('Test content')).toBeDefined()
  })

  it('renders wave accent when waveColor and waveAccent provided', () => {
    const { container } = render(
      <WaveCard waveColor="#0c1a38" waveAccent="oklch(0.63 0.26 272)">
        content
      </WaveCard>,
    )
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('adds cursor-pointer when onClick provided', () => {
    const { container } = render(
      <WaveCard onClick={() => {}}>content</WaveCard>,
    )
    expect(container.firstChild).toHaveClass('cursor-pointer')
  })
})
```

- [ ] **Step 4.3: Запустить тест**

```bash
npm run test -- tests/unit/components/wave-card.test.tsx
```

Ожидается: 3 passed.

- [ ] **Step 4.4: Commit**

```bash
git add components/layout/WaveCard.tsx tests/unit/components/wave-card.test.tsx
git commit -m "feat(design): add WaveCard component with wave accent"
```

---

## Task 5: WaveDrawer компонент

**Files:**
- Create: `components/layout/WaveDrawer.tsx`

- [ ] **Step 5.1: Создать `components/layout/WaveDrawer.tsx`**

```tsx
'use client'

import Link from 'next/link'
import { useTheme } from 'next-themes'
import { X, MessageCircle, Megaphone, Trophy, BookOpen } from 'lucide-react'

interface CourseProgress {
  id: string
  title: string
  progress: number
  waveColor: string
  waveAccent: string
}

interface WaveDrawerProps {
  open: boolean
  onClose: () => void
  courses?: CourseProgress[]
}

const COMMUNITY_ITEMS = [
  { icon: MessageCircle, label: 'Форум курсов', href: '/forum' },
  { icon: Megaphone, label: 'Объявления', href: '/announcements' },
  { icon: Trophy, label: 'Таблица лидеров', href: '/leaderboard' },
]

export function WaveDrawer({ open, onClose, courses = [] }: WaveDrawerProps) {
  const { resolvedTheme } = useTheme()
  const dark = resolvedTheme !== 'light'

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 z-[200] bg-black/55 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Навигация"
        className={`fixed inset-y-0 left-0 z-[201] flex w-[300px] flex-col overflow-hidden
          border-r border-[var(--card-border)] backdrop-blur-2xl
          transition-transform duration-[350ms] [transition-timing-function:cubic-bezier(0.32,0,0.17,1)]
          ${open ? 'translate-x-0' : '-translate-x-full'}
          ${dark ? 'bg-[rgba(7,12,32,0.97)]' : 'bg-[rgba(235,245,255,0.97)]'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--card-border)] px-5 py-7">
          <Link href="/" onClick={onClose} className="flex items-center gap-2">
            <svg width="22" height="16" viewBox="0 0 32 22" aria-hidden="true">
              <path
                d="M2,11 C5,4 9,18 13,11 C17,4 21,18 25,11 C27,7 30,15 32,11"
                fill="none"
                stroke="var(--wave-accent)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
            <span className="text-base font-bold text-[var(--text-foam)]">
              Wisdom<span className="font-light text-[var(--wave-accent)]">Wave</span>
            </span>
          </Link>
          <button
            onClick={onClose}
            aria-label="Закрыть меню"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-sm
              text-[var(--text-muted-foam)] transition-colors hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto py-3">

          {/* My courses */}
          {courses.length > 0 && (
            <section className="px-5 pb-3">
              <p className="mb-2.5 text-[10px] font-bold uppercase tracking-widest text-[var(--wave-accent)]">
                ∿ Мои курсы
              </p>
              {courses.map((c) => (
                <Link
                  key={c.id}
                  href={`/catalog/${c.id}`}
                  onClick={onClose}
                  className="mb-1 flex items-center gap-2.5 rounded-xl px-2.5 py-2 transition-colors hover:bg-white/8"
                >
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs"
                    style={{ background: `linear-gradient(135deg, ${c.waveColor}, ${c.waveAccent}66)` }}
                  >
                    <BookOpen className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-[var(--text-foam)]">{c.title}</p>
                    {c.progress > 0 && (
                      <div className="mt-1 h-0.5 overflow-hidden rounded-sm bg-white/10">
                        <div
                          className="h-full rounded-sm transition-all"
                          style={{ width: `${c.progress}%`, background: c.waveAccent }}
                        />
                      </div>
                    )}
                  </div>
                  {c.progress > 0 && c.progress < 100 && (
                    <span className="text-[10px] font-bold" style={{ color: c.waveAccent }}>
                      {c.progress}%
                    </span>
                  )}
                </Link>
              ))}
            </section>
          )}

          <div className="mx-5 my-2 h-px bg-[var(--card-border)]" />

          {/* Community */}
          <section className="px-5 pb-3">
            <p className="mb-2.5 text-[10px] font-bold uppercase tracking-widest text-[var(--wave-accent)]">
              ∿ Сообщество
            </p>
            {COMMUNITY_ITEMS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={onClose}
                className="mb-1 flex items-center gap-2.5 rounded-xl px-2.5 py-2 transition-colors hover:bg-white/8"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <item.icon className="h-3.5 w-3.5 text-[var(--wave-accent)]" />
                </div>
                <span className="text-xs font-semibold text-[var(--text-foam)]">{item.label}</span>
              </Link>
            ))}
          </section>
        </div>

        {/* Footer — profile */}
        <div className="border-t border-[var(--card-border)] px-5 py-3.5">
          <Link
            href="/dashboard"
            onClick={onClose}
            className="flex items-center gap-2.5 rounded-xl px-2 py-2 transition-colors hover:bg-white/8"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-content rounded-full
              items-center justify-center bg-[var(--wave-accent)] text-xs font-bold text-white">
              WW
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--text-foam)]">Мой кабинет</p>
              <p className="text-[10px] text-[var(--text-muted-foam)]">Прогресс и настройки</p>
            </div>
          </Link>
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 5.2: Type-check**

```bash
npm run type-check
```

Ожидается: 0 ошибок.

- [ ] **Step 5.3: Commit**

```bash
git add components/layout/WaveDrawer.tsx
git commit -m "feat(design): add WaveDrawer slide panel component"
```

---

## Task 6: Обновить Header

**Files:**
- Modify: `components/layout/Header.tsx`

- [ ] **Step 6.1: Заменить содержимое `components/layout/Header.tsx`**

```tsx
'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useTheme } from 'next-themes'
import { Sun, Moon, Menu } from 'lucide-react'
import { useState } from 'react'
import { WaveDrawer } from '@/components/layout/WaveDrawer'

export function Header() {
  const t = useTranslations('nav')
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const dark = resolvedTheme !== 'light'

  return (
    <>
      <WaveDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <header
        className="sticky top-0 z-50 border-b border-[var(--card-border)] backdrop-blur-xl"
        style={{ background: dark ? 'rgba(8,18,40,0.85)' : 'rgba(200,230,248,0.85)' }}
      >
        <div className="container flex h-16 items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <svg width="22" height="16" viewBox="0 0 32 22" aria-hidden="true">
              <path
                d="M2,11 C5,4 9,18 13,11 C17,4 21,18 25,11 C27,7 30,15 32,11"
                fill="none"
                stroke="var(--wave-accent)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
            <span className="text-xl font-bold text-[var(--text-foam)]">
              Wisdom<span className="font-light text-[var(--wave-accent)]">Wave</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm">
            {[
              { href: '/catalog', key: 'catalog' },
              { href: '/shop', key: 'shop' },
              { href: '/teachers', key: 'teachers' },
              { href: '/live', key: 'live' },
              { href: '/subscriptions', key: 'subscriptions' },
            ].map(({ href, key }) => (
              <Link
                key={key}
                href={href}
                className="text-[var(--text-muted-foam)] transition-colors hover:text-[var(--wave-accent)]"
              >
                {t(key as Parameters<typeof t>[0])}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {/* Theme toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-muted-foam)]
                transition-colors hover:bg-white/10 hover:text-[var(--wave-accent)]"
              aria-label="Переключить тему"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </button>

            {/* Login */}
            <Link
              href="/login"
              className="hidden md:inline-flex items-center px-4 py-2 text-sm rounded-xl
                border border-[var(--card-border)] text-[var(--text-foam)]
                transition-colors hover:border-[var(--wave-accent)] hover:text-[var(--wave-accent)]"
            >
              {t('login')}
            </Link>

            {/* Hamburger */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-muted-foam)]
                transition-colors hover:bg-white/10 hover:text-[var(--wave-accent)]"
              aria-label="Открыть меню"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>
    </>
  )
}
```

- [ ] **Step 6.2: Type-check и визуальная проверка**

```bash
npm run type-check
npm run dev
```

Проверить: лого WisdomWave, SVG-волна, переключатель тем, открытие дравера по клику гамбургера.

- [ ] **Step 6.3: Commit**

```bash
git add components/layout/Header.tsx
git commit -m "feat(design): update Header with WisdomWave logo and WaveDrawer"
```

---

## Task 7: MobileNav компонент

**Files:**
- Create: `components/layout/MobileNav.tsx`
- Modify: `app/(public)/layout.tsx`

- [ ] **Step 7.1: Создать `components/layout/MobileNav.tsx`**

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BookOpen, BarChart2, User } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/', icon: Home, label: 'Главная' },
  { href: '/catalog', icon: BookOpen, label: 'Курсы' },
  { href: '/dashboard', icon: BarChart2, label: 'Прогресс' },
  { href: '/profile', icon: User, label: 'Профиль' },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden
        border-t border-[var(--card-border)] bg-[var(--card-body)] backdrop-blur-xl"
    >
      {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
        const active = pathname === href || (href !== '/' && pathname.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-medium
              transition-colors ${
                active
                  ? 'text-[var(--wave-accent)]'
                  : 'text-[var(--text-muted-foam)] hover:text-[var(--wave-accent)]'
              }`}
          >
            {active && (
              <div
                className="absolute top-0 h-0.5 w-10 rounded-b-sm bg-[var(--wave-accent)]"
                aria-hidden="true"
              />
            )}
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
```

- [ ] **Step 7.2: Добавить в `app/(public)/layout.tsx`**

```tsx
import { MobileNav } from '@/components/layout/MobileNav'

// В return добавить после {children}:
<MobileNav />
```

- [ ] **Step 7.3: Добавить `pb-16 md:pb-0` к main-контейнеру в `app/(public)/layout.tsx`**

Чтобы контент не перекрывался мобильной навигацией.

- [ ] **Step 7.4: Commit**

```bash
git add components/layout/MobileNav.tsx app/\(public\)/layout.tsx
git commit -m "feat(design): add MobileNav bottom navigation for mobile"
```

---

## Task 8: Главная страница

**Files:**
- Modify: `app/(public)/page.tsx`

- [ ] **Step 8.1: Прочитать текущий `app/(public)/page.tsx`**

```bash
cat /home/ai-openyoga/EduplatformРФ/app/\(public\)/page.tsx
```

- [ ] **Step 8.2: Обновить Hero-секцию**

Заменить текущий Hero на волновой вариант. Добавить в начало компонента:

```tsx
<section className="relative z-10 px-4 pt-20 pb-16 text-center animate-fade-up">
  <h1 className="mb-4 text-4xl font-bold tracking-tight text-[var(--text-foam)] md:text-6xl">
    Wisdom<span className="font-light text-[var(--wave-accent)]">Wave</span>
  </h1>
  <p className="mx-auto mb-8 max-w-xl text-lg text-[var(--text-muted-foam)]">
    Образовательная платформа — йога, массаж, фитнес и творчество онлайн
  </p>
  <div className="flex flex-wrap justify-center gap-3">
    <Link
      href="/catalog"
      className="rounded-xl px-8 py-3 text-sm font-semibold text-white transition-all
        hover:shadow-lg hover:-translate-y-0.5"
      style={{
        background: 'linear-gradient(135deg, var(--wave-accent), oklch(0.55 0.22 290))',
        boxShadow: '0 4px 20px var(--wave-accent-glow)',
      }}
    >
      Начать обучение
    </Link>
    <Link
      href="/subscriptions"
      className="rounded-xl border border-[var(--card-border)] px-8 py-3 text-sm font-semibold
        text-[var(--text-foam)] transition-colors hover:border-[var(--wave-accent)]"
    >
      Подписки
    </Link>
  </div>
</section>
```

- [ ] **Step 8.3: Обернуть карточки курсов в `WaveCard`**

Импортировать:
```tsx
import { WaveCard } from '@/components/layout/WaveCard'
```

Заменить существующие карточки на `<WaveCard>` с `waveColor` и `waveAccent` из данных курса.

- [ ] **Step 8.4: Визуальная проверка + commit**

```bash
npm run dev
# Проверить главную в dark и light теме
git add app/\(public\)/page.tsx
git commit -m "feat(design): update home page with WisdomWave hero and WaveCards"
```

---

## Task 9: Страница каталога

**Files:**
- Modify: `app/(public)/catalog/page.tsx`

- [ ] **Step 9.1: Прочитать текущий файл**

```bash
cat /home/ai-openyoga/EduplatformРФ/app/\(public\)/catalog/page.tsx
```

- [ ] **Step 9.2: Заменить карточки на WaveCard**

Импортировать `WaveCard`. Обернуть каждую карточку курса:

```tsx
<WaveCard
  key={course.id}
  waveColor={course.waveColor ?? '#0c1a38'}
  waveAccent={course.waveAccent ?? 'oklch(0.63 0.26 272)'}
  onClick={() => router.push(`/catalog/${course.slug}`)}
  className="p-0"
>
  {/* существующее содержимое карточки */}
</WaveCard>
```

Если в данных курса нет `waveColor`/`waveAccent` — использовать дефолты выше.

- [ ] **Step 9.3: Добавить заголовок с волновым стилем**

```tsx
<h1 className="mb-8 text-3xl font-bold text-[var(--text-foam)] animate-fade-up">
  ∿ Каталог курсов
</h1>
```

- [ ] **Step 9.4: Commit**

```bash
git add app/\(public\)/catalog/page.tsx
git commit -m "feat(design): update catalog page with WaveCard grid"
```

---

## Task 10: Страница курса

**Files:**
- Modify: `app/(public)/catalog/[slug]/page.tsx`

- [ ] **Step 10.1: Прочитать текущий файл**

```bash
cat /home/ai-openyoga/EduplatformРФ/app/\(public\)/catalog/\[slug\]/page.tsx
```

- [ ] **Step 10.2: Добавить Hero-секцию с волновым градиентом**

В начало страницы курса (после получения данных):

```tsx
<section
  className="relative z-10 overflow-hidden rounded-3xl mx-4 mt-4 p-8 md:p-12"
  style={{
    background: `linear-gradient(160deg, ${course.waveColor ?? '#081228'} 0%, ${course.waveAccent ?? 'oklch(0.63 0.26 272)'}33 100%)`,
    border: '1px solid var(--card-border)',
  }}
>
  <h1 className="mb-3 text-3xl font-bold text-[var(--text-foam)] md:text-4xl">
    {course.title}
  </h1>
  <p className="text-[var(--text-muted-foam)]">{course.description}</p>
</section>
```

- [ ] **Step 10.3: Обернуть блоки программы и преподавателя в WaveCard**

```tsx
<WaveCard className="p-6">
  {/* программа курса */}
</WaveCard>

<WaveCard className="p-6">
  {/* блок преподавателя */}
</WaveCard>
```

- [ ] **Step 10.4: Commit**

```bash
git add app/\(public\)/catalog/\[slug\]/page.tsx
git commit -m "feat(design): update course page with wave hero and WaveCards"
```

---

## Task 11: Дашборд ученика

**Files:**
- Modify: `app/(dashboard)/dashboard/page.tsx`

- [ ] **Step 11.1: Прочитать текущий файл**

```bash
cat /home/ai-openyoga/EduplatformРФ/app/\(dashboard\)/dashboard/page.tsx
```

- [ ] **Step 11.2: Добавить волновой прогресс-бар**

Создать inline-компонент для прогресса:

```tsx
function WaveProgress({ value, accent }: { value: number; accent?: string }) {
  return (
    <div className="relative h-3 overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: `${value}%`,
          background: accent
            ? `linear-gradient(90deg, ${accent}99, ${accent})`
            : 'linear-gradient(90deg, var(--wave-accent)99, var(--wave-accent))',
        }}
      />
      {/* wave on top */}
      <svg
        viewBox="0 0 100 12"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full opacity-30"
        style={{ clipPath: `inset(0 ${100 - value}% 0 0)` }}
      >
        <path d="M0,6 C10,2 20,10 30,6 C40,2 50,10 60,6 C70,2 80,10 90,6 C95,4 98,8 100,6" fill="none" stroke="white" strokeWidth="2"/>
      </svg>
    </div>
  )
}
```

- [ ] **Step 11.3: Обернуть виджеты в WaveCard**

Каждый виджет дашборда (прогресс курсов, статистика, рекомендации) обернуть в `<WaveCard className="p-5">`.

- [ ] **Step 11.4: Добавить приветственный заголовок**

```tsx
<div className="mb-8 animate-fade-up">
  <h1 className="text-2xl font-bold text-[var(--text-foam)]">
    Привет, {session.user.name?.split(' ')[0]} ∿
  </h1>
  <p className="text-sm text-[var(--text-muted-foam)]">Продолжай обучение</p>
</div>
```

- [ ] **Step 11.5: Commit**

```bash
git add app/\(dashboard\)/dashboard/page.tsx
git commit -m "feat(design): update student dashboard with wave progress and WaveCards"
```

---

## Task 12: Страница урока

**Files:**
- Modify: `app/(dashboard)/lessons/[id]/page.tsx` (или аналогичный путь)

- [ ] **Step 12.1: Найти файл страницы урока**

```bash
find /home/ai-openyoga/EduplatformРФ/app -name "page.tsx" | grep -i lesson
```

- [ ] **Step 12.2: Прочитать найденный файл**

```bash
cat <путь из предыдущего шага>
```

- [ ] **Step 12.3: Добавить волновой прогресс под видеоплеером**

После блока видеоплеера вставить:

```tsx
{/* Wave progress indicator */}
<div className="relative mt-2 h-2 overflow-hidden rounded-full bg-white/10">
  <div
    className="h-full rounded-full transition-all duration-500"
    style={{
      width: `${lessonProgress}%`,
      background: 'linear-gradient(90deg, var(--wave-accent)99, var(--wave-accent))',
    }}
  />
  <svg
    viewBox="0 0 100 8"
    preserveAspectRatio="none"
    className="absolute inset-0 h-full w-full opacity-40"
    style={{ clipPath: `inset(0 ${100 - lessonProgress}% 0 0)` }}
  >
    <path
      d="M0,4 C10,1 20,7 30,4 C40,1 50,7 60,4 C70,1 80,7 90,4 C95,2 98,6 100,4"
      fill="none"
      stroke="white"
      strokeWidth="1.5"
    />
  </svg>
</div>
<p className="mt-1 text-right text-[10px] text-[var(--text-muted-foam)]">
  {lessonProgress}% просмотрено
</p>
```

Где `lessonProgress` — существующая переменная прогресса урока (найти по коду).

- [ ] **Step 12.4: Обернуть список глав в WaveCard**

```tsx
<WaveCard className="p-5">
  <h3 className="mb-3 text-sm font-bold text-[var(--text-foam)]">Содержание урока</h3>
  {/* существующий список глав */}
</WaveCard>
```

- [ ] **Step 12.5: Commit**

```bash
git add <путь к файлу урока>
git commit -m "feat(design): update lesson page with wave progress indicator"
```

---

## Task 14: Push и финальная проверка

- [ ] **Step 12.1: Полная проверка**

```bash
npm run type-check && npm run lint && npm run test
```

Ожидается: 0 ошибок TypeScript, 0 lint-предупреждений на изменённых файлах, все тесты проходят.

- [ ] **Step 12.2: E2E smoke-тест главных страниц**

```bash
npm run test:e2e -- --grep "home|catalog"
```

- [ ] **Step 12.3: Push в GitHub**

```bash
git push origin main
```

- [ ] **Step 12.4: Проверить `.gitignore` — добавить `.superpowers/`**

```bash
grep -q ".superpowers" /home/ai-openyoga/EduplatformРФ/.gitignore || echo ".superpowers/" >> /home/ai-openyoga/EduplatformРФ/.gitignore
git add .gitignore
git commit -m "chore: add .superpowers to .gitignore"
git push origin main
```
