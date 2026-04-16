'use client'
import { useState } from 'react'
import { BrandTab } from './BrandTab'
import { FontsTab } from './FontsTab'
import { ContentTab } from './ContentTab'
import { SeoTab } from './SeoTab'
import type { SiteSettings } from '@/lib/settings/site-settings'
import { DEFAULT_SETTINGS } from '@/lib/settings/site-settings'

const TABS = [
  { id: 'brand', label: 'Бренд' },
  { id: 'fonts', label: 'Шрифты' },
  { id: 'content', label: 'Контент' },
  { id: 'seo', label: 'GEO / SEO' },
] as const

type TabId = (typeof TABS)[number]['id']

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('brand')
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave(patch: Partial<SiteSettings>) {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (res.ok) {
        setSettings((s) => ({ ...s, ...patch }))
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Настройки сайта</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Дизайн, шрифты, контент главной, SEO и данные организации
          </p>
        </div>
        {saved && (
          <span className="text-sm text-green-600 font-medium bg-green-50 dark:bg-green-950 px-3 py-1 rounded-full">
            Сохранено ✓
          </span>
        )}
      </div>

      <div className="border-b flex gap-0 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div>
        {activeTab === 'brand' && (
          <BrandTab settings={settings} onSave={(b) => handleSave({ brand: b })} saving={saving} />
        )}
        {activeTab === 'fonts' && (
          <FontsTab
            settings={settings}
            onSave={(t) => handleSave({ typography: t })}
            saving={saving}
          />
        )}
        {activeTab === 'content' && (
          <ContentTab
            settings={settings}
            onSave={(h) => handleSave({ homepage: h })}
            saving={saving}
          />
        )}
        {activeTab === 'seo' && (
          <SeoTab settings={settings} onSave={(s) => handleSave({ seo: s })} saving={saving} />
        )}
      </div>
    </div>
  )
}
