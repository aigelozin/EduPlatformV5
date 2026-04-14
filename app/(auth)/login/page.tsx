import { useTranslations } from 'next-intl'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Вход' }

export default function LoginPage() {
  return (
    <div className="container max-w-md py-16">
      <h1 className="text-2xl font-bold mb-8 text-center">Вход в аккаунт</h1>
      <p className="text-center text-muted-foreground">Форма входа — в разработке</p>
    </div>
  )
}
