'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const PRODUCT_TYPES = [
  { value: 'lesson', label: 'Урок' },
  { value: 'course', label: 'Курс' },
  { value: 'bundle', label: 'Набор курсов' },
  { value: 'livestream', label: 'Трансляция' },
  { value: 'digital_book', label: 'Электронная книга' },
  { value: 'physical_book', label: 'Бумажная книга' },
  { value: 'souvenir', label: 'Сувенир' },
  { value: 'apparel', label: 'Одежда' },
  { value: 'subscription_plan', label: 'Подписка' },
]

const VIDEO_SOURCES = [
  { value: '', label: '— нет видео —' },
  { value: 'vk', label: 'VK Video' },
  { value: 'rutube', label: 'RuTube' },
  { value: 'kinescope', label: 'Kinescope' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'yos', label: 'Яндекс Object Storage' },
]

interface Teacher { id: string; name: string; email: string }
interface Category { id: string; name_ru: string }

export default function AdminNewProductPage() {
  const router = useRouter()
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState({
    title_ru: '',
    type: 'course',
    price: '',
    sale_price: '',
    description_ru: '',
    seo_title_ru: '',
    seo_description_ru: '',
    thumbnail_url: '',
    preview_video_url: '',
    video_source: '',
    video_id: '',
    category_id: '',
    creator_id: '',
    moderation_status: 'approved',
    is_active: true,
    // Livestream
    stream_url: '',
    scheduled_at: '',
    recording_url: '',
    recording_source: '',
  })

  useEffect(() => {
    // Загружаем преподавателей
    fetch('/api/admin/users?role=teacher&limit=100')
      .then(r => r.json())
      .then((json: { data?: { users?: Teacher[] } }) => {
        if (json.data?.users) setTeachers(json.data.users)
      })
      .catch(() => {})

    // Загружаем категории
    fetch('/api/categories')
      .then(r => r.json())
      .then((json: { data?: Category[] }) => {
        if (json.data) setCategories(json.data)
      })
      .catch(() => {})
  }, [])

  function handle(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value, type } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!form.price || isNaN(Number(form.price))) {
      setError('Укажите цену')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title_ru: form.title_ru,
          type: form.type,
          price: Math.round(parseFloat(form.price) * 100),
          sale_price: form.sale_price ? Math.round(parseFloat(form.sale_price) * 100) : null,
          description_ru: form.description_ru || null,
          seo_title_ru: form.seo_title_ru || null,
          seo_description_ru: form.seo_description_ru || null,
          thumbnail_url: form.thumbnail_url || null,
          preview_video_url: form.preview_video_url || null,
          video_source: form.video_source || null,
          video_id: form.video_id || null,
          category_id: form.category_id || null,
          creator_id: form.creator_id || null,
          moderation_status: form.moderation_status,
          is_active: form.is_active,
          // Livestream
          stream_url: form.stream_url || null,
          scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
          recording_url: form.recording_url || null,
          recording_source: form.recording_source || null,
        }),
      })

      const json = await res.json() as { error?: string; data?: { id: string } }

      if (!res.ok) {
        setError(json.error ?? 'Ошибка создания')
        return
      }

      setSuccess('Продукт создан!')
      setTimeout(() => router.push('/admin/products'), 1000)
    } catch {
      setError('Сетевая ошибка')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/products" className="text-muted-foreground hover:text-foreground text-sm">
          ← Продукты
        </Link>
        <h1 className="text-2xl font-bold">Создать продукт</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Основное */}
        <fieldset className="rounded-xl border p-5 space-y-4">
          <legend className="text-sm font-semibold px-1">Основное</legend>

          <div>
            <label className="block text-sm font-medium mb-1">Название *</label>
            <input name="title_ru" required value={form.title_ru} onChange={handle}
              className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Йога для начинающих" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Тип *</label>
              <select name="type" value={form.type} onChange={handle}
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                {PRODUCT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Категория</label>
              <select name="category_id" value={form.category_id} onChange={handle}
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                <option value="">— без категории —</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name_ru}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Преподаватель</label>
            <select name="creator_id" value={form.creator_id} onChange={handle}
              className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
              <option value="">— от имени admin —</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.email})</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Описание</label>
            <textarea name="description_ru" rows={4} value={form.description_ru} onChange={handle}
              className="w-full px-3 py-2 rounded-lg border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Описание курса..." />
          </div>
        </fieldset>

        {/* Цены */}
        <fieldset className="rounded-xl border p-5 space-y-4">
          <legend className="text-sm font-semibold px-1">Цены</legend>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Цена (₽) *</label>
              <input name="price" type="number" min="0" step="1" required value={form.price} onChange={handle}
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="1990" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Цена со скидкой (₽)</label>
              <input name="sale_price" type="number" min="0" step="1" value={form.sale_price} onChange={handle}
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="1490" />
            </div>
          </div>
        </fieldset>

        {/* Медиа */}
        <fieldset className="rounded-xl border p-5 space-y-4">
          <legend className="text-sm font-semibold px-1">Медиа</legend>

          <div>
            <label className="block text-sm font-medium mb-1">URL обложки</label>
            <input name="thumbnail_url" type="url" value={form.thumbnail_url} onChange={handle}
              className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="https://storage.yandexcloud.net/..." />
            {form.thumbnail_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.thumbnail_url} alt="preview" className="mt-2 h-24 rounded-lg object-cover" />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Прямая ссылка на видео
              <span className="ml-1 text-xs font-normal text-muted-foreground">(превью/тизер, доступен всем)</span>
            </label>
            <input name="preview_video_url" type="url" value={form.preview_video_url} onChange={handle}
              className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="https://vk.com/video_ext.php?... или https://rutube.ru/play/embed/..." />
            <p className="text-xs text-muted-foreground mt-1">
              VK: <code className="bg-muted px-1 rounded">https://vk.com/video_ext.php?oid=...&id=...&hash=...</code> ·
              RuTube: <code className="bg-muted px-1 rounded">https://rutube.ru/play/embed/ID</code> ·
              YouTube: <code className="bg-muted px-1 rounded">https://youtube.com/embed/ID</code>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Платный контент — источник
                <span className="ml-1 text-xs font-normal text-muted-foreground">(только после покупки)</span>
              </label>
              <select name="video_source" value={form.video_source} onChange={handle}
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                {VIDEO_SOURCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">ID / ключ видео</label>
              <input name="video_id" value={form.video_id} onChange={handle}
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="ID или путь в YOS" />
            </div>
          </div>
        </fieldset>

        {/* Трансляция — показываем только если тип livestream */}
        {form.type === 'livestream' && (
          <fieldset className="rounded-xl border-2 border-red-200 dark:border-red-800 p-5 space-y-4">
            <legend className="text-sm font-semibold px-1 text-red-600 dark:text-red-400">
              🔴 Прямая трансляция
            </legend>

            <div>
              <label className="block text-sm font-medium mb-1">Ссылка на трансляцию *</label>
              <input name="stream_url" type="url" value={form.stream_url} onChange={handle}
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="https://vk.com/video/lives/... или https://rutube.ru/live/..." />
              <p className="text-xs text-muted-foreground mt-1">
                VK Live, RuTube Live, YouTube Live — вставьте прямую ссылку на стрим
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Дата и время начала *</label>
                <input name="scheduled_at" type="datetime-local" value={form.scheduled_at} onChange={handle}
                  className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
            </div>

            <div className="border-t pt-4 space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">После трансляции — запись</p>
              <div>
                <label className="block text-sm font-medium mb-1">Ссылка на запись</label>
                <input name="recording_url" type="url" value={form.recording_url} onChange={handle}
                  className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="https://vk.com/video... или https://rutube.ru/video/..." />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Источник записи</label>
                <select name="recording_source" value={form.recording_source} onChange={handle}
                  className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                  {VIDEO_SOURCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>
          </fieldset>
        )}

        {/* SEO */}
        <fieldset className="rounded-xl border p-5 space-y-4">
          <legend className="text-sm font-semibold px-1">SEO</legend>
          <div>
            <label className="block text-sm font-medium mb-1">SEO заголовок</label>
            <input name="seo_title_ru" value={form.seo_title_ru} onChange={handle}
              className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Если пусто — используется название" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">SEO описание</label>
            <textarea name="seo_description_ru" rows={2} value={form.seo_description_ru} onChange={handle}
              className="w-full px-3 py-2 rounded-lg border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="До 160 символов" maxLength={160} />
          </div>
        </fieldset>

        {/* Публикация */}
        <fieldset className="rounded-xl border p-5 space-y-4">
          <legend className="text-sm font-semibold px-1">Публикация</legend>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Статус модерации</label>
              <select name="moderation_status" value={form.moderation_status} onChange={handle}
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                <option value="approved">Одобрен</option>
                <option value="pending">На модерации</option>
                <option value="rejected">Отклонён</option>
              </select>
            </div>
            <div className="flex items-center gap-3 pt-6">
              <input type="checkbox" id="is_active" name="is_active" checked={form.is_active}
                onChange={e => setForm(prev => ({ ...prev, is_active: e.target.checked }))}
                className="h-4 w-4 rounded border accent-primary" />
              <label htmlFor="is_active" className="text-sm font-medium">Активен (виден в каталоге)</label>
            </div>
          </div>
        </fieldset>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 rounded-lg px-4 py-3">{error}</div>
        )}
        {success && (
          <div className="text-sm text-green-600 bg-green-50 dark:bg-green-950/30 rounded-lg px-4 py-3">{success}</div>
        )}

        <div className="flex gap-3">
          <button type="submit" disabled={loading}
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors">
            {loading ? 'Создание...' : 'Создать продукт'}
          </button>
          <Link href="/admin/products"
            className="px-6 py-2.5 border rounded-lg font-medium hover:bg-accent transition-colors text-sm">
            Отмена
          </Link>
        </div>
      </form>
    </div>
  )
}
