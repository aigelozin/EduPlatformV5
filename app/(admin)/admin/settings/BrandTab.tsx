'use client'
import { useState } from 'react'
import type { SiteSettingsBrand, SiteSettings } from '@/lib/settings/site-settings'

interface Props {
  settings: SiteSettings
  onSave: (brand: SiteSettingsBrand) => Promise<void>
  saving: boolean
}

export function BrandTab({ settings, onSave, saving }: Props) {
  const [form, setForm] = useState<SiteSettingsBrand>(settings.brand)

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
            Название сайта
          </label>
          <input
            className="w-full rounded-lg border px-3 py-2 text-sm bg-background"
            value={form.siteName}
            onChange={(e) => setForm((f) => ({ ...f, siteName: e.target.value }))}
          />
          <p className="text-xs text-muted-foreground">Отображается в хедере и &lt;title&gt;</p>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
            Слоган
          </label>
          <input
            className="w-full rounded-lg border px-3 py-2 text-sm bg-background"
            value={form.slogan}
            onChange={(e) => setForm((f) => ({ ...f, slogan: e.target.value }))}
          />
          <p className="text-xs text-muted-foreground">Рядом с логотипом в хедере</p>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
            Основной цвет
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              className="h-9 w-12 cursor-pointer rounded border"
              value={form.primaryColor}
              onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))}
            />
            <input
              className="flex-1 rounded-lg border px-3 py-2 text-sm bg-background font-mono"
              value={form.primaryColor}
              onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))}
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
            Цвет фона
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              className="h-9 w-12 cursor-pointer rounded border"
              value={form.backgroundColor}
              onChange={(e) => setForm((f) => ({ ...f, backgroundColor: e.target.value }))}
            />
            <input
              className="flex-1 rounded-lg border px-3 py-2 text-sm bg-background font-mono"
              value={form.backgroundColor}
              onChange={(e) => setForm((f) => ({ ...f, backgroundColor: e.target.value }))}
            />
          </div>
        </div>
      </div>
      <button
        onClick={() => onSave(form)}
        disabled={saving}
        className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold disabled:opacity-50 transition-opacity"
      >
        {saving ? 'Сохраняется...' : 'Сохранить бренд'}
      </button>
    </div>
  )
}
