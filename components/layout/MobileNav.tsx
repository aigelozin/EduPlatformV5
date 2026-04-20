'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/',          symbol: '∿', label: 'Главная'  },
  { href: '/catalog',   symbol: '◎', label: 'Каталог'  },
  { href: '/dashboard', symbol: '◈', label: 'Прогресс' },
  { href: '/login',     symbol: '◉', label: 'Профиль'  },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden
        border-t border-[var(--card-border)] bg-[var(--card-body)] backdrop-blur-xl"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}
    >
      {NAV_ITEMS.map(({ href, symbol, label }) => {
        const active = pathname === href || (href !== '/' && pathname.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            className={`relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[9px] font-semibold
              transition-all duration-200 ${
                active
                  ? 'text-[var(--wave-accent)]'
                  : 'text-[var(--text-muted-foam)] hover:text-[var(--wave-accent)]'
              }`}
          >
            {active && (
              <div
                className="absolute top-0 h-0.5 w-8 rounded-b-sm bg-[var(--wave-accent)]"
                aria-hidden="true"
              />
            )}
            <span
              className="text-xl leading-none"
              style={active ? { filter: 'drop-shadow(0 0 6px var(--wave-accent))' } : undefined}
            >
              {symbol}
            </span>
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
