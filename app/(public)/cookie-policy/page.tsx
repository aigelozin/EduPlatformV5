import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Политика Cookie | EduPlatform' }

export default function CookiePolicyPage() {
  return (
    <div className="container max-w-3xl py-12">
      <h1 className="text-3xl font-bold mb-2">Политика использования Cookie</h1>
      <p className="text-muted-foreground text-sm mb-8">Редакция от января 2026 г.</p>

      <div className="space-y-8 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold mb-3">Что такое cookie</h2>
          <p className="text-muted-foreground">
            Cookie — это небольшие текстовые файлы, которые сохраняются на вашем устройстве при посещении нашего сайта. Они помогают нам запоминать ваши предпочтения и улучшать работу платформы.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">Какие cookie мы используем</h2>
          <div className="space-y-4">
            {[
              { name: 'Сессионные', desc: 'Необходимы для работы авторизации и корзины. Удаляются при закрытии браузера.' },
              { name: 'Постоянные', desc: 'Сохраняют ваши настройки (тёмная тема, язык) на 30 дней.' },
              { name: 'Аналитические', desc: 'Помогают нам понять, как пользователи взаимодействуют с платформой. Данные анонимизированы.' },
            ].map((item) => (
              <div key={item.name} className="border rounded-lg p-4">
                <p className="font-medium mb-1">{item.name}</p>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">Как управлять cookie</h2>
          <p className="text-muted-foreground">
            Вы можете отключить cookie в настройках браузера. Обратите внимание: отключение необходимых cookie может привести к некорректной работе платформы (невозможность войти в аккаунт, потеря корзины).
          </p>
        </section>
      </div>
    </div>
  )
}
