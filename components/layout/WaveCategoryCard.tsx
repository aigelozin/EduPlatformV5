'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { WAVE_PALETTE } from '@/lib/wave-palette'

interface Subcategory {
  id: string
  name_ru: string
  slug: string
  sub_type: string | null
  teacher?: { name: string; avatar_url: string | null } | null
}

interface WaveCategoryCardProps {
  href: string
  name: string
  brief?: string | null
  waveColor?: string | null
  waveAccent?: string | null
  iconEmoji?: string | null
  subcategories?: Subcategory[]
  className?: string
}

function safeGradientId(s: string) {
  return 'wcc-' + s.replace(/[^a-z0-9]/gi, '').slice(0, 8)
}

export function WaveCategoryCard({
  href,
  name,
  brief,
  waveColor,
  waveAccent,
  iconEmoji,
  subcategories = [],
  className,
}: WaveCategoryCardProps) {
  const slug = href.split('/').pop() ?? ''
  const palette = WAVE_PALETTE[slug] ?? WAVE_PALETTE['massage']
  const color  = waveColor  || palette.color
  const accent = waveAccent || palette.accent
  const gid = safeGradientId(color)

  const visibleSubs = subcategories.slice(0, 3)
  const extraCount  = subcategories.length - visibleSubs.length

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
      {/* ── Crest ───────────────────────────────── */}
      <div
        className="relative overflow-hidden px-4 pb-0 pt-3"
        style={{ background: `linear-gradient(160deg, ${color}, #080f28)` }}
      >
        {/* Radial glow */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
          <defs>
            <radialGradient id={gid} cx="30%" cy="40%" r="60%">
              <stop offset="0%" stopColor={accent} stopOpacity="0.18" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill={`url(#${gid})`} />
        </svg>

        {/* Emoji icon */}
        {iconEmoji && (
          <span className="absolute right-3 top-3 text-2xl opacity-60 select-none">
            {iconEmoji}
          </span>
        )}

        {/* Category name */}
        <p className="relative mb-3 text-sm font-bold text-[#e8f2ff] leading-snug pr-10">
          {name}
        </p>

        {/* Animated wave */}
        <svg
          viewBox="0 0 400 20"
          preserveAspectRatio="none"
          className="relative block h-5 w-full"
          aria-hidden
        >
          <path
            className="animate-wave-1"
            d="M0,10 C40,4 80,16 120,10 C160,4 200,16 240,10 C280,4 320,16 360,10 C380,7 392,13 400,10 L400,20 L0,20 Z"
            fill={accent}
            fillOpacity="0.55"
          />
        </svg>
      </div>

      {/* ── Body ────────────────────────────────── */}
      <div className="bg-[var(--card-body)] px-4 py-3 space-y-2.5">
        {brief && (
          <p className="text-xs text-[var(--text-muted-foam)] leading-snug line-clamp-2">
            {brief}
          </p>
        )}

        {visibleSubs.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {visibleSubs.map(sub => (
              <span
                key={sub.id}
                className="rounded-full border px-2 py-0.5 text-[10px] font-medium truncate max-w-[130px]"
                style={{ borderColor: accent, color: accent }}
              >
                {sub.sub_type === 'teacher' && sub.teacher
                  ? sub.teacher.name
                  : sub.name_ru}
              </span>
            ))}
            {extraCount > 0 && (
              <span
                className="rounded-full border px-2 py-0.5 text-[10px] font-medium"
                style={{ borderColor: accent, color: accent }}
              >
                +{extraCount}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}
