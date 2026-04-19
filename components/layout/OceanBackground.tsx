'use client'

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

export function OceanBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {/* Wave layer 1 — closest */}
      <div className="absolute bottom-0 left-[-50%] h-[180px] w-[200%] opacity-25 animate-wave-1 will-change-transform">
        <svg viewBox="0 0 400 70" preserveAspectRatio="none" className="h-full w-full">
          <path d="M0,35 C80,15 160,55 240,30 C300,14 360,50 400,32 L400,70 L0,70 Z" className="wave-fill-1" />
        </svg>
      </div>

      {/* Wave layer 2 */}
      <div className="absolute bottom-[40px] left-[-50%] h-[180px] w-[200%] opacity-[0.14] animate-wave-2 will-change-transform">
        <svg viewBox="0 0 400 70" preserveAspectRatio="none" className="h-full w-full">
          <path d="M0,42 C70,22 150,60 230,36 C290,18 350,52 400,38 L400,70 L0,70 Z" className="wave-fill-2" />
        </svg>
      </div>

      {/* Wave layer 3 */}
      <div className="absolute bottom-[80px] left-[-50%] h-[180px] w-[200%] opacity-[0.08] animate-wave-3 will-change-transform">
        <svg viewBox="0 0 400 70" preserveAspectRatio="none" className="h-full w-full">
          <path d="M0,50 C90,28 180,65 270,42 C320,28 370,58 400,46 L400,70 L0,70 Z" className="wave-fill-1" />
        </svg>
      </div>

      {/* Wave layer 4 — far, desktop only */}
      <div className="hidden md:block absolute bottom-[200px] left-[-50%] h-[180px] w-[200%] opacity-[0.05] animate-wave-3r will-change-transform">
        <svg viewBox="0 0 400 70" preserveAspectRatio="none" className="h-full w-full">
          <path d="M0,55 C100,32 200,68 300,48 C350,35 380,60 400,52 L400,70 L0,70 Z" className="wave-fill-2" />
        </svg>
      </div>

      {/* Wave layer 5 — horizon, desktop only */}
      <div className="hidden md:block absolute bottom-[380px] left-[-50%] h-[180px] w-[200%] opacity-[0.04] animate-wave-slow will-change-transform">
        <svg viewBox="0 0 400 70" preserveAspectRatio="none" className="h-full w-full">
          <path d="M0,60 C120,38 240,70 360,52 C380,47 392,58 400,55 L400,70 L0,70 Z" className="wave-fill-1" />
        </svg>
      </div>

      {/* Wind streams */}
      {WIND_STREAMS.map((s, i) => (
        <div
          key={i}
          className="wind-stream absolute h-px rounded-sm animate-wind"
          style={{
            '--ws-top': s.top,
            '--ws-left': s.left,
            '--ws-width': s.width,
            '--ws-delay': s.delay,
            '--ws-dur': s.duration,
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}
