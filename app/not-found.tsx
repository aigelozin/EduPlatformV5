import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="container py-32 text-center">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <p className="text-xl text-muted-foreground mb-8">Страница не найдена</p>
      <Link
        href="/"
        className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
      >
        На главную
      </Link>
    </div>
  )
}
