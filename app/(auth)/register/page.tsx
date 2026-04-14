import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Регистрация' }

export default function RegisterPage() {
  return (
    <div className="container max-w-md py-16">
      <h1 className="text-2xl font-bold mb-8 text-center">Создать аккаунт</h1>
      <p className="text-center text-muted-foreground">Форма регистрации — в разработке</p>
    </div>
  )
}
