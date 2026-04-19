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
