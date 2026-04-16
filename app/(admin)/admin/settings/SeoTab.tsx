'use client'
import { useState } from 'react'
import type { SiteSettingsSeo, SiteSettings } from '@/lib/settings/site-settings'

interface Props {
  settings: SiteSettings
  onSave: (seo: SiteSettingsSeo) => Promise<void>
  saving: boolean
}

const SOCIAL_KEYS: { key: string; placeholder: string }[] = [
  { key: 'vk', placeholder: 'https://vk.com/...' },
  { key: 'telegram', placeholder: 'https://t.me/...' },
  { key: 'youtube', placeholder: 'https://youtube.com/...' },
  { key: 'rutube', placeholder: 'https://rutube.ru/...' },
]

export function SeoTab({ settings, onSave, saving }: Props) {
  const [form, setForm] = useState<SiteSettingsSeo>(settings.seo)

  function setField(field: keyof SiteSettingsSeo, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function setSocial(key: string, value: string) {
    setForm((f) => ({ ...f, socials: { ...f.socials, [key]: value } }))
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-sm font-semibold mb-3">Данные организации</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground uppercase tracking-wide">
              Название ООО
            </label>
            <input
              className="w-full rounded-lg border px-3 py-2 text-sm bg-background"
              value={form.orgName}
              onChange={(e) => setField('orgName', e.target.value)}
              placeholder="ООО «ЭдуПлатформ»"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground uppercase tracking-wide">
              Страна
            </label>
            <input
              className="w-full rounded-lg border px-3 py-2 text-sm bg-background"
              value={form.country}
              onChange={(e) => setField('country', e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground uppercase tracking-wide">
              Телефон
            </label>
            <input
              className="w-full rounded-lg border px-3 py-2 text-sm bg-background"
              value={form.phone}
              onChange={(e) => setField('phone', e.target.value)}
              placeholder="+7 (999) 000-00-00"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground uppercase tracking-wide">
              Email организации
            </label>
            <input
              className="w-full rounded-lg border px-3 py-2 text-sm bg-background"
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              placeholder="info@eduplatform.ru"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">SEO</h3>
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground uppercase tracking-wide">
              Шаблон title (используй {'{title}'})
            </label>
            <input
              className="w-full rounded-lg border px-3 py-2 text-sm bg-background font-mono"
              value={form.titleTemplate}
              onChange={(e) => setField('titleTemplate', e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground uppercase tracking-wide">
              Meta description по умолчанию
            </label>
            <textarea
              className="w-full rounded-lg border px-3 py-2 text-sm bg-background resize-none"
              rows={2}
              value={form.defaultMetaDescription}
              onChange={(e) => setField('defaultMetaDescription', e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground uppercase tracking-wide">
              Описание для ИИ-поисковиков (до 160 симв.)
            </label>
            <textarea
              className="w-full rounded-lg border px-3 py-2 text-sm bg-background resize-none"
              rows={2}
              maxLength={160}
              value={form.aiDescription}
              onChange={(e) => setField('aiDescription', e.target.value)}
              placeholder="Краткое описание платформы для GPT/Perplexity/Яндекс ИИ"
            />
            <p className="text-xs text-muted-foreground text-right">{form.aiDescription.length}/160</p>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground uppercase tracking-wide">
              Ключевые услуги (через запятую)
            </label>
            <input
              className="w-full rounded-lg border px-3 py-2 text-sm bg-background"
              value={form.keywords}
              onChange={(e) => setField('keywords', e.target.value)}
              placeholder="йога, массаж, фитнес"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Социальные сети</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SOCIAL_KEYS.map(({ key, placeholder }) => (
            <div key={key} className="space-y-1">
              <label className="text-xs text-muted-foreground uppercase tracking-wide">
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </label>
              <input
                className="w-full rounded-lg border px-3 py-2 text-sm bg-background"
                value={form.socials[key] ?? ''}
                onChange={(e) => setSocial(key, e.target.value)}
                placeholder={placeholder}
              />
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => onSave(form)}
        disabled={saving}
        className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold disabled:opacity-50 transition-opacity"
      >
        {saving ? 'Сохраняется...' : 'Сохранить SEO'}
      </button>
    </div>
  )
}
