'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import type { Category } from '@/types'

const productTypes = [
  { value: 'lesson', label: 'Урок' },
  { value: 'course', label: 'Курс' },
  { value: 'bundle', label: 'Набор' },
  { value: 'livestream', label: 'Трансляция' },
  { value: 'digital_book', label: 'Электронная книга' },
  { value: 'physical_book', label: 'Бумажная книга' },
  { value: 'souvenir', label: 'Сувенир' },
  { value: 'apparel', label: 'Одежда' },
]

interface ProductData {
  title_ru: string
  type: string
  price: number
  description_ru: string | null
  category_id: string | null
  thumbnail_url: string | null
  preview_video_url: string | null
}

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const productId = params.id

  const [categories, setCategories] = useState<Pick<Category, 'id' | 'name_ru'>[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)

  const [form, setForm] = useState({
    title_ru: '',
    type: 'course',
    price: '',
    description_ru: '',
    category_id: '',
    thumbnail_url: '',
    preview_video_url: '',
  })

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((json: { data: Pick<Category, 'id' | 'name_ru'>[] }) => {
        if (json.data) setCategories(json.data)
      })
      .catch(() => {/* silent */})
  }, [])

  useEffect(() => {
    fetch(`/api/teacher/products/${productId}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null }
        return r.json()
      })
      .then((json: { data: ProductData } | null) => {
        if (!json?.data) return
        const p = json.data
        setForm({
          title_ru: p.title_ru,
          type: p.type,
          price: String(p.price / 100),
          description_ru: p.description_ru ?? '',
          category_id: p.category_id ?? '',
          thumbnail_url: p.thumbnail_url ?? '',
          preview_video_url: p.preview_video_url ?? '',
        })
      })
      .catch(() => setError('Не удалось загрузить продукт'))
      .finally(() => setIsLoading(false))
  }, [productId])

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const priceRub = parseFloat(form.price)
    if (isNaN(priceRub) || priceRub < 0) {
      setError('Введите корректную цену')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/teacher/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title_ru: form.title_ru,
          price: Math.round(priceRub * 100),
          description_ru: form.description_ru || undefined,
          category_id: form.category_id || undefined,
          thumbnail_url: form.thumbnail_url || undefined,
          preview_video_url: form.preview_video_url || undefined,
        }),
      })

      const json = (await res.json()) as { error?: string }
      if (!res.ok) {
        setError(json.error ?? 'Ошибка сохранения')
        return
      }

      router.push('/teacher/products')
    } catch {
      setError('Сетевая ошибка. Попробуйте ещё раз.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl py-10 text-center text-muted-foreground">
        Загрузка...
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="mx-auto max-w-2xl py-10 text-center space-y-4">
        <p className="text-xl font-semibold">Продукт не найден</p>
        <button
          onClick={() => router.push('/teacher/products')}
          className="text-primary hover:underline text-sm"
        >
          ← Вернуться к продуктам
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Редактировать продукт</h1>
        <p className="mt-1 text-muted-foreground">
          После сохранения продукт снова отправится на модерацию.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground" htmlFor="title_ru">
            Название <span className="text-destructive">*</span>
          </label>
          <input
            id="title_ru"
            name="title_ru"
            type="text"
            required
            value={form.title_ru}
            onChange={handleChange}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Type — readonly (нельзя менять после создания) */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Тип продукта
          </label>
          <input
            type="text"
            readOnly
            value={productTypes.find((t) => t.value === form.type)?.label ?? form.type}
            className="w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground cursor-not-allowed"
          />
          <p className="text-xs text-muted-foreground mt-1">Тип нельзя изменить после создания</p>
        </div>

        {/* Price */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground" htmlFor="price">
            Цена (в рублях) <span className="text-destructive">*</span>
          </label>
          <input
            id="price"
            name="price"
            type="number"
            required
            min="0"
            step="0.01"
            value={form.price}
            onChange={handleChange}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Category */}
        {categories.length > 0 && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground" htmlFor="category_id">
              Категория
            </label>
            <select
              id="category_id"
              name="category_id"
              value={form.category_id}
              onChange={handleChange}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">— Выберите категорию —</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name_ru}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Description */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground" htmlFor="description_ru">
            Описание
          </label>
          <textarea
            id="description_ru"
            name="description_ru"
            rows={4}
            value={form.description_ru}
            onChange={handleChange}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>

        {/* Thumbnail URL */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground" htmlFor="thumbnail_url">
            URL обложки
          </label>
          <input
            id="thumbnail_url"
            name="thumbnail_url"
            type="url"
            value={form.thumbnail_url}
            onChange={handleChange}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="https://..."
          />
        </div>

        {/* Preview video URL */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground" htmlFor="preview_video_url">
            URL превью-видео <span className="text-muted-foreground font-normal">(тизер)</span>
          </label>
          <input
            id="preview_video_url"
            name="preview_video_url"
            type="url"
            value={form.preview_video_url}
            onChange={handleChange}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="https://vk.com/video_ext.php?..."
          />
        </div>

        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {isSubmitting ? 'Сохранение...' : 'Сохранить изменения'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-md border border-border px-5 py-2 text-sm font-medium text-foreground hover:bg-accent"
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  )
}
