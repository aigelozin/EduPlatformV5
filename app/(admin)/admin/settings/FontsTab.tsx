'use client'
import { useState } from 'react'
import type { SiteSettingsTypography, SiteSettings } from '@/lib/settings/site-settings'

const HEADING_FONTS = ['PT Serif', 'Playfair Display', 'Cormorant Garamond', 'Merriweather']
const BODY_FONTS = ['PT Sans', 'Inter', 'Lato', 'Nunito']
const SIZE_OPTIONS: { value: SiteSettingsTypography['baseFontSize']; label: string }[] = [
  { value: 'sm', label: 'S — 14px' },
  { value: 'md', label: 'M — 16px (по умолчанию)' },
  { value: 'lg', label: 'L — 18px' },
]

interface Props {
  settings: SiteSettings
  onSave: (typography: SiteSettingsTypography) => Promise<void>
  saving: boolean
}

export function FontsTab({ settings, onSave, saving }: Props) {
  const [form, setForm] = useState<SiteSettingsTypography>(settings.typography)

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
            Шрифт заголовков
          </label>
          <select
            className="w-full rounded-lg border px-3 py-2 text-sm bg-background"
            value={form.headingFont}
            onChange={(e) => setForm((f) => ({ ...f, headingFont: e.target.value }))}
          >
            {HEADING_FONTS.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
            Шрифт текста
          </label>
          <select
            className="w-full rounded-lg border px-3 py-2 text-sm bg-background"
            value={form.bodyFont}
            onChange={(e) => setForm((f) => ({ ...f, bodyFont: e.target.value }))}
          >
            {BODY_FONTS.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
          Базовый размер текста
        </label>
        <div className="flex gap-3">
          {SIZE_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="baseFontSize"
                value={opt.value}
                checked={form.baseFontSize === opt.value}
                onChange={() => setForm((f) => ({ ...f, baseFontSize: opt.value }))}
                className="accent-primary"
              />
              <span className="text-sm">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="rounded-lg border p-4 bg-muted/30">
        <p className="text-xs text-muted-foreground mb-2">Предпросмотр</p>
        <p
          className="text-xl font-bold mb-1"
          style={{ fontFamily: `'${form.headingFont}', Georgia, serif` }}
        >
          Заголовок курса
        </p>
        <p
          className="text-sm text-muted-foreground"
          style={{
            fontFamily: `'${form.bodyFont}', Arial, sans-serif`,
            fontSize: form.baseFontSize === 'sm' ? '14px' : form.baseFontSize === 'lg' ? '18px' : '16px',
          }}
        >
          Описание курса отображается здесь. Выберите шрифт и размер.
        </p>
      </div>

      <button
        onClick={() => onSave(form)}
        disabled={saving}
        className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold disabled:opacity-50 transition-opacity"
      >
        {saving ? 'Сохраняется...' : 'Сохранить шрифты'}
      </button>
    </div>
  )
}
