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

        {/* Mobile wave border — visible only on small screens */}
        <div className="relative h-5 overflow-hidden md:hidden" aria-hidden="true">
          <svg viewBox="0 0 400 18" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
            <path
              d="M0,9 C40,3 80,15 120,9 C160,3 200,15 240,9 C280,3 320,15 360,9 C380,6 392,13 400,9 L400,18 L0,18 Z"
              fill={dark ? 'rgba(8,18,40,0.85)' : 'rgba(200,230,248,0.85)'}
              className="animate-wave-1"
            />
            <path
              d="M0,7 C40,2 80,13 120,7 C160,2 200,13 240,7 C280,2 320,13 360,7 C380,5 392,11 400,7"
              fill="none"
              stroke="rgba(130,180,255,0.18)"
              strokeWidth="1"
            />
          </svg>
        </div>
      </header>
    </>
  )
}
