import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        'ocean-1': 'var(--ocean1)',
        'ocean-2': 'var(--ocean2)',
        'wave-accent': 'var(--wave-accent)',
        'card-body': 'var(--card-body)',
        'card-border': 'var(--card-border)',
        'text-foam': 'var(--text-foam)',
        'text-muted-foam': 'var(--text-muted-foam)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
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
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'wave-1': 'waveShift1 14s ease-in-out infinite',
        'wave-2': 'waveShift2 18s ease-in-out infinite',
        'wave-3': 'waveShift3 22s ease-in-out infinite',
        'wave-3r': 'waveShift1 28s ease-in-out infinite reverse',
        'wave-slow': 'waveShift2 35s ease-in-out infinite',
        'fade-up': 'fadeUp 0.5s cubic-bezier(0.25,0.46,0.45,0.94) both',
        wind: 'windFlow 8s ease-in-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
