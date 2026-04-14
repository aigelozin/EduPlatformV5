import Link from 'next/link'
import { useTranslations } from 'next-intl'

export function Footer() {
  const t = useTranslations('footer')

  return (
    <footer className="border-t bg-background">
      <div className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-3">EduPlatform</h3>
            <p className="text-sm text-muted-foreground">
              Образовательная платформа для йоги, массажа, фитнеса и творчества
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Каталог</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/catalog" className="hover:text-foreground transition-colors">Все курсы</Link></li>
              <li><Link href="/shop" className="hover:text-foreground transition-colors">Магазин</Link></li>
              <li><Link href="/teachers" className="hover:text-foreground transition-colors">Преподаватели</Link></li>
              <li><Link href="/live" className="hover:text-foreground transition-colors">Трансляции</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Аккаунт</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/login" className="hover:text-foreground transition-colors">Войти</Link></li>
              <li><Link href="/register" className="hover:text-foreground transition-colors">Регистрация</Link></li>
              <li><Link href="/dashboard" className="hover:text-foreground transition-colors">Личный кабинет</Link></li>
              <li><Link href="/become-teacher" className="hover:text-foreground transition-colors">Стать преподавателем</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Информация</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/privacy" className="hover:text-foreground transition-colors">{t('privacy')}</Link></li>
              <li><Link href="/terms" className="hover:text-foreground transition-colors">{t('terms')}</Link></li>
              <li><Link href="/delivery" className="hover:text-foreground transition-colors">{t('delivery')}</Link></li>
              <li><Link href="/contacts" className="hover:text-foreground transition-colors">{t('contacts')}</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t text-sm text-muted-foreground text-center">
          © {new Date().getFullYear()} EduPlatform. {t('rights')}
        </div>
      </div>
    </footer>
  )
}
