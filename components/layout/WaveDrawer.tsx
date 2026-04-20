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

          <div className="mx-5 my-2 h-px bg-[var(--card-border)]" />

          {/* Mentor */}
          <section className="px-5 pb-3">
            <p className="mb-2.5 text-[10px] font-bold uppercase tracking-widest text-[var(--wave-accent)]">
              ∿ Наставник
            </p>
            <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-body)] p-3">
              <div className="mb-3 flex items-center gap-2.5">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, var(--wave-accent), oklch(0.55 0.22 290))' }}
                >
                  НС
                </div>
                <div>
                  <p className="text-xs font-bold text-[var(--text-foam)]">Николай Степанов</p>
                  <p className="text-[9px] font-semibold text-emerald-400">● Онлайн</p>
                </div>
              </div>
              <Link
                href="/chat"
                onClick={onClose}
                className="flex w-full items-center justify-center rounded-lg py-2 text-xs font-bold text-white transition-opacity hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, var(--wave-accent), oklch(0.55 0.22 290))' }}
              >
                💬 Написать
              </Link>
            </div>
          </section>
        </div>

        {/* Footer — profile */}
        <div className="border-t border-[var(--card-border)] px-5 py-3.5">
          <Link
            href="/dashboard"
            onClick={onClose}
            className="flex items-center gap-2.5 rounded-xl px-2 py-2 transition-colors hover:bg-white/8"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full
              bg-[var(--wave-accent)] text-xs font-bold text-white">
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
