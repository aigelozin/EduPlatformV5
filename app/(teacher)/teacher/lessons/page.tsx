'use client'

import { useState, useEffect } from 'react'
import type { Metadata } from 'next'

interface Product {
  id: string
  title_ru: string
  type: string
}

interface Lesson {
  id: string
  title_ru: string
  video_source: string | null
  is_free: boolean
  duration_sec: number | null
  sort_order: number
}

export default function TeacherLessonsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProductId, setSelectedProductId] = useState<string>('')
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/teacher/products')
      .then((r) => r.json())
      .then((data) => setProducts(data.data ?? []))
      .catch(() => setError('Не удалось загрузить продукты'))
  }, [])

  useEffect(() => {
    if (!selectedProductId) { setLessons([]); return }
    setLoading(true)
    fetch(`/api/teacher/lessons?product_id=${selectedProductId}`)
      .then((r) => r.json())
      .then((data) => setLessons(data.data ?? []))
      .catch(() => setError('Не удалось загрузить уроки'))
      .finally(() => setLoading(false))
  }, [selectedProductId])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Уроки</h1>

      <div>
        <label className="block text-sm font-medium mb-2">Выберите продукт</label>
        <select
          className="border rounded-lg px-3 py-2 text-sm bg-background w-full max-w-sm"
          value={selectedProductId}
          onChange={(e) => setSelectedProductId(e.target.value)}
        >
          <option value="">— Выберите курс/продукт —</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>{p.title_ru}</option>
          ))}
        </select>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {selectedProductId && (
        <div>
          {loading ? (
            <p className="text-muted-foreground text-sm">Загрузка уроков...</p>
          ) : lessons.length === 0 ? (
            <p className="text-muted-foreground text-sm">Уроки не найдены. Добавьте первый урок.</p>
          ) : (
            <div className="rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">#</th>
                    <th className="text-left p-3 font-medium">Урок</th>
                    <th className="text-left p-3 font-medium">Источник</th>
                    <th className="text-left p-3 font-medium">Доступ</th>
                    <th className="text-left p-3 font-medium">Длительность</th>
                  </tr>
                </thead>
                <tbody>
                  {lessons.map((lesson) => (
                    <tr key={lesson.id} className="border-t">
                      <td className="p-3 text-muted-foreground">{lesson.sort_order + 1}</td>
                      <td className="p-3 font-medium">{lesson.title_ru}</td>
                      <td className="p-3 text-muted-foreground">{lesson.video_source ?? '—'}</td>
                      <td className="p-3">
                        {lesson.is_free ? (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Бесплатно
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
                            Платно
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {lesson.duration_sec ? `${Math.round(lesson.duration_sec / 60)} мин` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
