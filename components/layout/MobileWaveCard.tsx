'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
export { WAVE_PALETTE } from '@/lib/wave-palette'

interface MobileWaveCardProps {
  href: string
  title: string
  category?: string
  duration?: string
  lessons?: number
  rating?: number
  progress?: number
  waveColor?: string
  waveAccent?: string
  className?: string
}

function safeGradientId(hex: string) {
  return 'mwc-' + hex.replace(/[^a-z0-9]/gi, '').slice(0, 8)
}


export function MobileWaveCard({
  href,
  title,
  category,
  duration,
  lessons,
  rating,
  progress = 0,
  waveColor = '#1a1060',
  waveAccent = 'oklch(0.63 0.26 272)',
  className,
}: MobileWaveCardProps) {
  const gid = safeGradientId(waveColor)

  return (
    <Link
      href={href}
      className={cn(
        'group block overflow-hidden rounded-2xl border transition-all duration-200',
        'border-[var(--card-border)]',
        'hover:border-white/20 hover:scale-[1.01] hover:shadow-xl hover:shadow-black/40',
        className,
      )}
    >
      {/* ── Crest ───────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden px-4 pb-0 pt-3"
        style={{ background: `linear-gradient(160deg, ${waveColor}, #080f28)` }}
      >
        {/* Radial glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 60% 80% at 20% 50%, ${waveAccent}20, transparent)`,
          }}
        />

        {/* Category badge */}
        {category && (
          <div className="relative mb-2">
            <span
              className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest"
              style={{
                color: waveAccent,
                background: `${waveAccent}18`,
                border: `1px solid ${waveAccent}35`,
              }}
            >
              {category}
            </span>
          </div>
        )}

        {/* Title rides the wave crest */}
        <p className="relative mb-3 text-sm font-bold leading-snug text-[#e8f2ff]">{title}</p>

        {/* Animated mini-wave SVG */}
        <svg
          viewBox="0 0 200 24"
          preserveAspectRatio="none"
          className="block h-6 w-full animate-wave-1"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={waveAccent} stopOpacity="0.3" />
              <stop offset="100%" stopColor={waveColor} stopOpacity="0.9" />
            </linearGradient>
          </defs>
          <path
            d="M0,12 C20,4 40,20 60,12 C80,4 100,20 120,12 C140,4 160,20 180,12 C190,8 196,16 200,12 L200,24 L0,24 Z"
            fill={`url(#${gid})`}
          />
          <path
            d="M0,10 C20,3 40,18 60,10 C80,3 100,18 120,10 C140,3 160,18 180,10 C190,6 196,14 200,10"
            fill="none"
            stroke="rgba(200,230,255,0.4)"
            strokeWidth="1"
          />
        </svg>
      </div>

      {/* ── Body ────────────────────────────────────────────── */}
      <div className="bg-[var(--card-body)] px-4 pb-3 pt-2.5">
        {/* Metadata row */}
        {(duration || lessons != null || rating != null) && (
          <div className="mb-2.5 flex gap-3 text-[10px] text-[var(--text-muted-foam)]">
            {duration && <span>⏱ {duration}</span>}
            {lessons != null && <span>📖 {lessons} ур.</span>}
            {rating != null && (
              <span className="text-[var(--wave-gold)]">★ {rating}</span>
            )}
          </div>
        )}

        {/* Progress bar or dive prompt */}
        {progress > 0 ? (
          <>
            <div className="mb-1 flex justify-between text-[9px]">
              <span className="text-[var(--text-muted-foam)]">Прогресс</span>
              <span className="font-bold" style={{ color: waveAccent }}>
                {progress}%
              </span>
            </div>
            <div className="h-0.5 overflow-hidden rounded-sm bg-white/10">
              <div
                className="h-full rounded-sm transition-all duration-500"
                style={{
                  width: `${progress}%`,
                  background: waveAccent,
                  boxShadow: `0 0 6px ${waveAccent}66`,
                }}
              />
            </div>
          </>
        ) : (
          <div
            className="rounded-md border py-1 text-center text-[10px]"
            style={{ borderColor: `${waveAccent}28`, color: `${waveAccent}99` }}
          >
            погрузиться ↓
          </div>
        )}
      </div>
    </Link>
  )
}
