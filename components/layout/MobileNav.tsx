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
            className={`relative flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-medium
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
