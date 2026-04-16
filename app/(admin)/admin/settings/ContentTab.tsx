'use client'
import { useState } from 'react'
import type { SiteSettingsHomepage, SiteSettings } from '@/lib/settings/site-settings'

interface Props {
  settings: SiteSettings
  onSave: (homepage: SiteSettingsHomepage) => Promise<void>
  saving: boolean
}

const NAV_KEYS: { key: string; label: string }[] = [
  { key: 'catalog', label: 'Каталог' },
  { key: 'subscriptions', label: 'Подписки' },
  { key: 'teachers', label: 'Преподаватели' },
  { key: 'shop', label: 'Магазин' },
]

const SECTION_KEYS: { key: string }[] = [
  { key: 'popularProducts' },
  { key: 'livestreams' },
  { key: 'reviews' },
]

export function ContentTab({ settings, onSave, saving }: Props) {
  const [form, setForm] = useState<SiteSettingsHomepage>(settings.homepage)

  function setHero(field: keyof SiteSettingsHomepage, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function setNavLabel(key: string, value: string) {
    setForm((f) => ({ ...f, navLabels: { ...f.navLabels, [key]: value } }))
  }

  function setSectionLabel(key: string, value: string) {
    setForm((f) => ({
      ...f,
      sections: {
        ...f.sections,
        [key]: { ...f.sections[key], label: value },
      },
    }))
  }

  function toggleSection(key: string) {
    setForm((f) => ({
      ...f,
      sections: {
        ...f.sections,
        [key]: { ...f.sections[key], visible: !f.sections[key]?.visible },
      },
    }))
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-sm font-semibold mb-3">Главный экран (Hero)</h3>
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground uppercase tracking-wide">
              Заголовок
            </label>
            <input
              className="w-full rounded-lg border px-3 py-2 text-sm bg-background"
              value={form.heroTitle}
              onChange={(e) => setHero('heroTitle', e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground uppercase tracking-wide">
              Подзаголовок
            </label>
            <textarea
              className="w-full rounded-lg border px-3 py-2 text-sm bg-background resize-none"
              rows={2}
              value={form.heroSubtitle}
              onChange={(e) => setHero('heroSubtitle', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground uppercase tracking-wide">
                Кнопка 1 (основная)
              </label>
              <input
                className="w-full rounded-lg border px-3 py-2 text-sm bg-background"
                value={form.heroPrimaryCtaText}
                onChange={(e) => setHero('heroPrimaryCtaText', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground uppercase tracking-wide">
                Кнопка 2
              </label>
              <input
                className="w-full rounded-lg border px-3 py-2 text-sm bg-background"
                value={form.heroSecondaryCtaText}
                onChange={(e) => setHero('heroSecondaryCtaText', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Названия в навигации</h3>
        <div className="grid grid-cols-2 gap-3">
          {NAV_KEYS.map(({ key, label }) => (
            <div key={key} className="space-y-1">
              <label className="text-xs text-muted-foreground uppercase tracking-wide">
                {label}
              </label>
              <input
                className="w-full rounded-lg border px-3 py-2 text-sm bg-background"
                value={form.navLabels[key] ?? label}
                onChange={(e) => setNavLabel(key, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Секции главной страницы</h3>
        <div className="space-y-2">
          {SECTION_KEYS.map(({ key }) => {
            const section = form.sections[key]
            if (!section) return null
            return (
              <div key={key} className="flex items-center gap-3 rounded-lg border px-4 py-2.5">
                <input
                  type="checkbox"
                  id={`section-${key}`}
                  checked={section.visible}
                  onChange={() => toggleSection(key)}
                  className="accent-primary h-4 w-4"
                />
                <label htmlFor={`section-${key}`} className="flex-1 text-sm cursor-pointer">
                  {section.label}
                </label>
                <input
                  className="w-48 rounded border px-2 py-1 text-xs bg-background"
                  value={section.label}
                  onChange={(e) => setSectionLabel(key, e.target.value)}
                  placeholder="Заголовок секции"
                />
              </div>
            )
          })}
        </div>
      </div>

      <button
        onClick={() => onSave(form)}
        disabled={saving}
        className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold disabled:opacity-50 transition-opacity"
      >
        {saving ? 'Сохраняется...' : 'Сохранить контент'}
      </button>
    </div>
  )
}
