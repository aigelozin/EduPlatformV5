'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function BecomeTeacherPage() {
  const router = useRouter()
  const [bio, setBio] = useState('')
  const [consent, setConsent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!consent) {
      setError('Необходимо согласие с условиями для преподавателей')
      return
    }

    setLoading(true)

    const res = await fetch('/api/auth/become-teacher', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ consent: true, bio_ru: bio }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Ошибка при отправке заявки')
      return
    }

    router.push('/teacher')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 py-12">
      <div className="w-full max-w-lg bg-background rounded-2xl border shadow-sm p-8">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold">EduPlatform</Link>
          <p className="text-muted-foreground mt-2">Станьте преподавателем</p>
        </div>

        <div className="mb-6 rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-1">Как это работает:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Создаёте курсы, уроки или физические товары</li>
            <li>Ваши материалы проходят модерацию</li>
            <li>После одобрения становятся доступны покупателям</li>
            <li>Платформа берёт {process.env.NEXT_PUBLIC_PLATFORM_FEE ?? '20'}% комиссии</li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              О себе <span className="text-muted-foreground font-normal">(необязательно)</span>
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={1000}
              rows={4}
              placeholder="Расскажите о вашем опыте, специализации..."
              className="w-full px-3 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">{bio.length}/1000</p>
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border accent-primary"
            />
            <span className="text-xs text-muted-foreground leading-relaxed">
              Я согласен с{' '}
              <Link href="/teacher-agreement" className="text-primary hover:underline">
                условиями преподавателя
              </Link>
              {' '}и даю согласие на обработку персональных данных согласно{' '}
              <Link href="/privacy-policy" className="text-primary hover:underline">
                ФЗ-152
              </Link>
            </span>
          </label>

          {error && (
            <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2.5">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Отправляем заявку...' : 'Стать преподавателем'}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          <Link href="/dashboard" className="text-primary hover:underline">
            Вернуться в личный кабинет
          </Link>
        </p>
      </div>
    </div>
  )
}
