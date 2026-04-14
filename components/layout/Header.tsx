'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useTheme } from 'next-themes'
import { Moon, Sun, Menu } from 'lucide-react'
import { useState } from 'react'

export function Header() {
  const t = useTranslations('nav')
  const { theme, setTheme } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="font-bold text-xl">
          EduPlatform
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/catalog" className="hover:text-primary transition-colors">
            {t('catalog')}
          </Link>
          <Link href="/shop" className="hover:text-primary transition-colors">
            {t('shop')}
          </Link>
          <Link href="/teachers" className="hover:text-primary transition-colors">
            {t('teachers')}
          </Link>
          <Link href="/live" className="hover:text-primary transition-colors">
            {t('live')}
          </Link>
          <Link href="/subscriptions" className="hover:text-primary transition-colors">
            {t('subscriptions')}
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-md hover:bg-accent transition-colors"
            aria-label="Переключить тему"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </button>

          <Link
            href="/login"
            className="hidden md:inline-flex px-4 py-2 text-sm rounded-md border hover:bg-accent transition-colors"
          >
            {t('login')}
          </Link>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-md hover:bg-accent"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Меню"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {menuOpen && (
        <div className="md:hidden border-t bg-background">
          <nav className="container py-4 flex flex-col gap-3 text-sm">
            <Link href="/catalog" onClick={() => setMenuOpen(false)}>{t('catalog')}</Link>
            <Link href="/shop" onClick={() => setMenuOpen(false)}>{t('shop')}</Link>
            <Link href="/teachers" onClick={() => setMenuOpen(false)}>{t('teachers')}</Link>
            <Link href="/live" onClick={() => setMenuOpen(false)}>{t('live')}</Link>
            <Link href="/subscriptions" onClick={() => setMenuOpen(false)}>{t('subscriptions')}</Link>
            <Link href="/login" onClick={() => setMenuOpen(false)}>{t('login')}</Link>
          </nav>
        </div>
      )}
    </header>
  )
}
