'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface CategoryDeleteButtonProps {
  categoryId: string
  categoryName: string
  hasChildren: boolean
  hasProducts: boolean
}

export function CategoryDeleteButton({
  categoryId,
  categoryName,
  hasChildren,
  hasProducts,
}: CategoryDeleteButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const blocked = hasChildren || hasProducts
  const title = hasChildren
    ? 'Нельзя удалить: есть подкатегории'
    : hasProducts
      ? 'Нельзя удалить: есть продукты'
      : 'Удалить категорию'

  async function handleDelete() {
    if (!window.confirm(`Удалить категорию «${categoryName}»? Это действие необратимо.`)) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/categories/${categoryId}`, { method: 'DELETE' })
      const json = (await res.json()) as { error?: string }
      if (!res.ok) {
        alert(json.error ?? 'Ошибка удаления')
        return
      }
      router.refresh()
    } catch {
      alert('Сетевая ошибка')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={blocked ? undefined : handleDelete}
      disabled={blocked || loading}
      title={title}
      className={`text-xs font-medium transition-colors ${
        blocked
          ? 'cursor-not-allowed text-muted-foreground/40'
          : 'text-destructive hover:text-destructive/80'
      }`}
    >
      {loading ? '...' : 'Удалить'}
    </button>
  )
}
