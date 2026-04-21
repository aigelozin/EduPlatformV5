'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface TopCategory { id: string; name_ru: string; slug: string }
interface Teacher     { id: string; name: string; email: string }

function toSlug(s: string): string {
  const map: Record<string, string> = {
    а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'zh',з:'z',и:'i',й:'j',
    к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',
    х:'kh',ц:'ts',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya',
  }
  return s.toLowerCase()
    .split('').map(c => map[c] ?? c).join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export default function AdminNewCategoryPage() {
  const router = useRouter()
  const [topCategories, setTopCategories] = useState<TopCategory[]>([])
  const [teachers, setTeachers]           = useState<Teacher[]>([])
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState('')
  const slugTouched = useRef(false)

  const [form, setForm] = useState({
    name_ru: '',
    slug: '',
    brief_ru: '',
    description_ru: '',
    icon_emoji: '',
    wave_color: '',
    wave_accent: '',
    parent_id: '',
    sub_type: '',
    teacher_id: '',
    sort_order: 0,
    is_active: true,
  })

  useEffect(() => {
    fetch('/api/admin/categories')
      .then(r => r.json())
      .then((j: { data?: { id: string; name_ru: string; slug: string; parent_id: string | null }[] }) => {
        if (j.data) setTopCategories(j.data.filter(c => !c.parent_id))
      })
      .catch(() => {})
    fetch('/api/admin/users?role=teacher&limit=100')
      .then(r => r.json())
      .then((j: { data?: { users?: Teacher[] } }) => {
        if (j.data?.users) setTeachers(j.data.users)
      })
      .catch(() => {})
  }, [])

  function handle(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target
    const checked = (e.target as HTMLInputElement).checked
    const type = e.target.type

    if (name === 'name_ru') {
      setForm(prev => ({
        ...prev,
        name_ru: value,
        slug: slugTouched.current ? prev.slug : toSlug(value),
      }))
      return
    }
    if (name === 'slug') slugTouched.current = true
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.name_ru.trim() || !form.slug.trim()) {
      setError('Название и slug обязательны')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name_ru: form.name_ru.trim(),
          slug: form.slug.trim(),
          brief_ru: form.brief_ru || null,
          description_ru: form.description_ru || null,
          icon_emoji: form.icon_emoji || null,
          wave_color: form.wave_color || null,
          wave_accent: form.wave_accent || null,
          parent_id: form.parent_id || null,
          sub_type: form.parent_id && form.sub_type ? form.sub_type : null,
          teacher_id: form.sub_type === 'teacher' ? form.teacher_id || null : null,
          sort_order: Number(form.sort_order),
          is_active: form.is_active,
        }),
      })
      const json = (await res.json()) as { error?: string }
      if (!res.ok) { setError(json.error ?? 'Ошибка создания'); return }
      router.push('/admin/categories')
    } catch {
      setError('Сетевая ошибка')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/categories" className="text-sm text-muted-foreground hover:text-foreground">
          ← Категории
        </Link>
        <h1 className="text-2xl font-bold">Создать категорию</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Основное */}
        <fieldset className="rounded-xl border p-5 space-y-4">
          <legend className="px-1 text-sm font-semibold">Основное</legend>

          <div>
            <label className="mb-1 block text-sm font-medium">Название *</label>
            <input name="name_ru" required value={form.name_ru} onChange={handle}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Йога" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Slug *</label>
            <input name="slug" required value={form.slug} onChange={handle}
              pattern="[a-z0-9-]+" title="Только строчные латинские буквы, цифры и дефис"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="yoga" maxLength={80} />
            <p className="mt-1 text-[11px] text-muted-foreground">Авто-генерируется из названия. Используется в URL.</p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Краткий слоган <span className="text-muted-foreground">({form.brief_ru.length}/200)</span>
            </label>
            <input name="brief_ru" value={form.brief_ru} onChange={handle}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Гармония тела и духа через движение" maxLength={200} />
            <p className="mt-1 text-[11px] text-muted-foreground">Отображается на карточке категории на главной странице.</p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Описание</label>
            <textarea name="description_ru" rows={3} value={form.description_ru} onChange={handle}
              className="w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Подробное описание категории..." />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Иконка / эмодзи</label>
            <input name="icon_emoji" value={form.icon_emoji} onChange={handle}
              className="w-32 rounded-lg border bg-background px-3 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="🧘" maxLength={10} />
          </div>
        </fieldset>

        {/* Визуальный стиль */}
        <fieldset className="rounded-xl border p-5 space-y-4">
          <legend className="px-1 text-sm font-semibold">Волновой стиль</legend>
          <p className="text-xs text-muted-foreground">Цвета для волновой карточки на главной странице.</p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Цвет фона волны</label>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 flex-shrink-0 rounded-md border"
                  style={{ background: form.wave_color || 'transparent' }} />
                <input name="wave_color" value={form.wave_color} onChange={handle}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="#0a2a1a" maxLength={50} />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Цвет акцента</label>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 flex-shrink-0 rounded-md border"
                  style={{ background: form.wave_accent || 'transparent' }} />
                <input name="wave_accent" value={form.wave_accent} onChange={handle}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="oklch(0.65 0.20 160)" maxLength={100} />
              </div>
            </div>
          </div>

          {/* Live preview */}
          {(form.name_ru || form.wave_color) && (
            <div
              className="overflow-hidden rounded-xl border"
              style={{ border: '1px solid rgba(100,160,255,0.15)' }}
            >
              <div
                className="relative px-4 pb-0 pt-3"
                style={{ background: `linear-gradient(160deg, ${form.wave_color || '#1a1060'}, #080f28)` }}
              >
                {form.icon_emoji && (
                  <span className="absolute right-3 top-3 text-2xl opacity-60">{form.icon_emoji}</span>
                )}
                <p className="mb-3 text-sm font-bold text-[#e8f2ff]">
                  {form.name_ru || 'Название категории'}
                </p>
                <svg viewBox="0 0 200 16" preserveAspectRatio="none" className="block h-4 w-full">
                  <path d="M0,8 C20,3 40,13 60,8 C80,3 100,13 120,8 C140,3 160,13 180,8 C190,5 196,11 200,8 L200,16 L0,16 Z"
                    fill={form.wave_accent || 'rgba(100,150,255,0.3)'} />
                </svg>
              </div>
              <div className="bg-[var(--card-body)] px-4 py-2.5">
                <p className="text-xs text-[var(--text-muted-foam)]">
                  {form.brief_ru || 'Краткий слоган будет здесь'}
                </p>
              </div>
            </div>
          )}
        </fieldset>

        {/* Подкатегория */}
        <fieldset className="rounded-xl border p-5 space-y-4">
          <legend className="px-1 text-sm font-semibold">Иерархия</legend>

          <div>
            <label className="mb-1 block text-sm font-medium">Родительская категория</label>
            <select name="parent_id" value={form.parent_id} onChange={handle}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
              <option value="">— верхний уровень —</option>
              {topCategories.map(c => (
                <option key={c.id} value={c.id}>{c.name_ru} ({c.slug})</option>
              ))}
            </select>
          </div>

          {form.parent_id && (
            <div>
              <label className="mb-1 block text-sm font-medium">Тип подкатегории</label>
              <select name="sub_type" value={form.sub_type} onChange={handle}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                <option value="">— выбрать —</option>
                <option value="theme">По теме (напр. Хатха-йога)</option>
                <option value="teacher">По преподавателю</option>
              </select>
            </div>
          )}

          {form.parent_id && form.sub_type === 'teacher' && (
            <div>
              <label className="mb-1 block text-sm font-medium">Преподаватель</label>
              <select name="teacher_id" value={form.teacher_id} onChange={handle}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                <option value="">— выбрать преподавателя —</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.email})</option>
                ))}
              </select>
            </div>
          )}
        </fieldset>

        {/* Публикация */}
        <fieldset className="rounded-xl border p-5 space-y-4">
          <legend className="px-1 text-sm font-semibold">Публикация</legend>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Порядок сортировки</label>
              <input name="sort_order" type="number" value={form.sort_order} onChange={handle}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              <p className="mt-1 text-[11px] text-muted-foreground">Меньше = раньше</p>
            </div>
            <div className="flex items-center gap-3 pt-6">
              <input type="checkbox" id="is_active" name="is_active" checked={form.is_active}
                onChange={e => setForm(prev => ({ ...prev, is_active: e.target.checked }))}
                className="h-4 w-4 rounded border accent-primary" />
              <label htmlFor="is_active" className="text-sm font-medium">Активна (видна на сайте)</label>
            </div>
          </div>
        </fieldset>

        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/30">{error}</div>
        )}

        <div className="flex gap-3">
          <button type="submit" disabled={loading}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
            {loading ? 'Создание...' : 'Создать категорию'}
          </button>
          <Link href="/admin/categories"
            className="rounded-lg border px-6 py-2.5 text-sm font-medium hover:bg-accent">
            Отмена
          </Link>
        </div>
      </form>
    </div>
  )
}
