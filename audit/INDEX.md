# Аудит EduPlatformРФ — Pre-deploy отчёт

**Дата:** 2026-07-08  
**Метод:** 5 параллельных субагентов (Fable5)  
**Директория:** `/home/ai-openyoga/EduplatformРФ`

---

## Вывод

Код **не готов к деплою в текущем виде**: обнаружено 12 блокеров. Критичнее всего — `DEV_BYPASS_AUTH` без защиты `NODE_ENV !== 'production'` (при попадании в прод любой анонимный пользователь получает права admin), неверный заголовок подписи YooKassa (все вебхуки будут отклоняться с 401), три пропущенных `onDelete` в Prisma (удаление пользователя падает с FK-ошибкой — прямое нарушение ФЗ-152 ст.21), и незаполненный ИНН в пользовательском соглашении.

---

## Сводная таблица

| Критичность | Кол-во | Направления |
|-------------|--------|-------------|
| **БЛОКЕР**  | **12** | Auth×3, Платежи×2, Prisma/ФЗ-152×3, SEO/Контент×4 |
| **ВАЖНО**   | **30** | Auth×3, Платежи×4, Prisma/ФЗ-152×9, SEO/Контент×14 |
| **КОСМЕТИКА**| **24** | Build×3, Auth×2, Платежи×2, Prisma×4, SEO×13 |

---

## БЛОКЕРЫ — нельзя деплоить

### Авторизация и роли → [auth-roles.md](auth-roles.md)

**1. DEV_BYPASS_AUTH в middleware без защиты NODE_ENV**  
`middleware.ts:17` — При `DEV_BYPASS_AUTH=true` middleware возвращает `NextResponse.next()`, минуя все проверки. Нет guard `NODE_ENV !== 'production'`. Случайное попадание в прод → открытый `/admin`, `/teacher/`, `/dashboard`.

**2. DEV_BYPASS_AUTH в getSession() возвращает фиктивного admin**  
`lib/auth/session.ts:13` — Функция `getSession()` при флаге отдаёт хардкоженного пользователя `role: 'admin'`. Все API через `requireRole()` будут считать любой запрос административным.

**3. SSE-чат трансляций открыт анонимам**  
`app/api/livestreams/[id]/chat/stream/route.ts` — Нет `requireAuth()`. Любой может читать сообщения любой трансляции. Соседний POST-роут защищён.

---

### Платежи → [payments.md](payments.md)

**4. Тайминг-атака при сравнении HMAC-подписей**  
`lib/payments/yookassa.ts:82`, `cryptocloud.ts:71`, `mir.ts:77` — Используется `===` вместо `crypto.timingSafeEqual()`. Атакующий может побайтово восстановить секрет по времени ответа.

**5. Нет защиты от двойной обработки succeeded-вебхука**  
`app/api/webhooks/yookassa/route.ts:50` и аналогично в двух других — Нет проверки `payment.status !== 'succeeded'` перед транзакцией. При повторной доставке (штатное поведение провайдеров) транзакция выполнится дважды.

---

### ФЗ-152 и Prisma → [fdz152-secrets-prisma.md](fdz152-secrets-prisma.md)

**6. UserSubscription — нет onDelete на user_id и subscription_id**  
`schema.prisma:337-338` — По умолчанию Prisma ставит Restrict. Удаление пользователя падает с FK constraint error. Нарушение ФЗ-152 ст.21 (право на удаление ПД).

**7. ProductMessage — нет onDelete на user_id**  
`schema.prisma:213-214` — Удаление Profile даёт orphan-записи с именем/контентом удалённого пользователя или FK-ошибку.

**8. LivestreamMessage — нет onDelete на user_id**  
`schema.prisma:306` — Аналогичная проблема.

---

### SEO, контент, доступность → [seo-content-a11y.md](seo-content-a11y.md)

**9. Незаполненный ИНН в пользовательском соглашении**  
`app/(public)/terms/page.tsx:48` — В тексте буквально `ИНН: XXXXXXXXXX`. Публикация оферты с шаблонным ИНН нарушает требования ФЗ о защите прав потребителей.

**10. Конфликт бренда WisdomWave / EduPlatform**  
`app/layout.tsx` задаёт «WisdomWave», главная страница и 7+ страниц (terms, shop, live, auth-логотип) содержат «EduPlatform». В поисковой выдаче у разных страниц будут разные названия сайта.

**11. Нет og:image в глобальном layout**  
`app/layout.tsx:25-36` — Open Graph и Twitter-карточки без `images`. Превью при шаринге во ВКонтакте/Telegram будет пустым.

**12. Страница /checkout не закрыта от индексации**  
`app/(public)/checkout/page.tsx` — Нет `metadata` и нет `robots: { index: false }`. Страница оформления заказа может попасть в поисковый индекс.

---

## ВАЖНО — исправить до или сразу после деплоя

### Авторизация → [auth-roles.md](auth-roles.md)

| # | Файл:строка | Описание |
|---|-------------|----------|
| 13 | `app/api/webhooks/boxberry/route.ts:18` | Boxberry webhook принимает любой POST без верификации подписи — злоумышленник может пометить заказ как delivered |
| 14 | `app/api/webhooks/cdek/route.ts:17` | CDEK webhook проверяет только наличие `X-Request-Id` (не секрет), реальной HMAC-проверки нет |
| 15 | `app/api/admin/settings/route.ts:7` | `catch {}` не различает 401 и 403 — оба случая возвращают 500 |

### Платежи → [payments.md](payments.md)

| # | Файл:строка | Описание |
|---|-------------|----------|
| 16 | `webhooks/yookassa/route.ts:15` | Читается заголовок `X-Signature`, YooKassa передаёт `X-Request-Checksum` — в prod все вебхуки YooKassa отклоняются с 401 (де-факто блокер!) |
| 17 | `webhooks/*/route.ts:17-20` | Неверная подпись не логируется — атака или сбой конфигурации незаметны |
| 18 | `webhooks/*/route.ts:93` | `console.error` вместо GlitchTip — ошибки не попадают в мониторинг |
| 19 | Все webhook-роуты | Статус берётся из тела вебхука без перекрёстной проверки суммы через GET API провайдера |

### ФЗ-152 / Prisma → [fdz152-secrets-prisma.md](fdz152-secrets-prisma.md)

| # | Файл:строка | Описание |
|---|-------------|----------|
| 20 | `lib/cron/payouts.ts:41,71` | `console.log(${teacher.name})` — имя (ПД по ФЗ-152) пишется в PM2 logs |
| 21 | `.gitignore` | `.env.production` (без `.local`) не исключён — риск случайного коммита prod-секретов |
| 22 | `schema.prisma:362` | `Order.status` не индексирован — full scan при обработке заказов и очереди модерации |
| 23 | `schema.prisma:174` | `Product.moderation_status` не индексирован — full scan очереди модерации |
| 24 | `schema.prisma:419` | `TeacherPayout.status` — тип `String` вместо enum, не индексирован |
| 25 | `schema.prisma:344-346` | `Purchase.user_id/product_id` без явного `onDelete: Restrict` — намерение не задокументировано |
| 26 | `schema.prisma:483-485` | `Review.user_id` без `onDelete` — стратегия при удалении пользователя не определена |
| 27 | `schema.prisma:323` | `Subscription.product_id` без `onDelete` — удаление Product с активными подписками вызовет FK-ошибку |
| 28 | `privacy-policy/page.tsx` | Необходима проверка реквизитов Оператора (ФЗ-152 ст.18.1): полное наименование ООО, ИНН, адрес, DPO |

### SEO / Контент / A11y → [seo-content-a11y.md](seo-content-a11y.md)

| # | Файл:строка | Описание |
|---|-------------|----------|
| 29 | `app/(public)/page.tsx:295` | Видимый текст «появится в следующей фазе» в секции «Трансляции» |
| 30 | `app/(public)/page.tsx:380` | Видимый текст «в следующей фазе» в секции «Преподаватели» |
| 31 | `app/(public)/page.tsx:387` | Видимый текст «в следующей фазе» в секции «Отзывы» |
| 32 | `app/(public)/live/page.tsx:30` | Страница `/live` выводит «Трансляции скоро появятся» |
| 33 | `app/(public)/teachers/page.tsx:37` | Страница `/teachers` выводит «Преподаватели скоро появятся» |
| 34 | `app/sitemap.xml/route.ts:16` | Sitemap включает `/teachers/{uuid}` — если маршрута нет, в индексе будут 404 |
| 35-39 | Legal pages metadata | `terms`, `cookie-policy`, `privacy-policy`, `offer`, `teacher-agreement` — нет `description` в metadata |
| 40 | `admin/products/new/page.tsx:158` | `<label>` без `htmlFor`, `<input>` без `id` — скринридеры не связывают метки с полями |
| 41 | `admin/products/[id]/edit/page.tsx:184` | То же во всей форме редактирования продукта |
| 42 | `admin/categories/new/page.tsx:132` | То же во всей форме категорий |

---

## КОСМЕТИКА — желательно, не блокирует

### Сборка → [build-types.md](build-types.md)

3 предупреждения ESLint (`@next/next/no-img-element`): `admin/teachers/[id]/page.tsx:58`, `dashboard/page.tsx:174`, `dashboard/progress/page.tsx:77`. Заменить `<img>` на `<Image />` из `next/image`.

### Авторизация → [auth-roles.md](auth-roles.md)

- `admin/categories/route.ts:8` — устаревший паттерн `getSession()` + ручная проверка роли вместо `requireRole('admin')`
- `middleware.ts:3` — `/dashboard` без trailing slash в `protectedRoutes`, семантически совпадёт с `/dashboard-anything`

### Платежи → [payments.md](payments.md)

- `DIGITAL_PRODUCT_TYPES` дублируется в трёх webhook-роутах — вынести в `lib/payments/constants.ts`
- Rate limiting на webhook-роутах: нужно явно задокументировать исключение или настроить по IP провайдера

### Prisma → [fdz152-secrets-prisma.md](fdz152-secrets-prisma.md)

- `schema.prisma:375` — `Order` без составного `@@index([status, created_at])` 
- `schema.prisma:83` — `SiteSettings.id @default("main")` — singleton без защиты от дублей на уровне API
- `schema.prisma:425` — `TeacherPayout.teacher_id` без явного `onDelete: Restrict`
- `lib/cron/*.ts` — `console.log` в cron без ПД, но нарушает code style (нужен GlitchTip/logger)

---

## Что нельзя проверить без запущенного окружения

- Реальная верификация подписей YooKassa/CryptoCloud/МИР Pay (нужен тестовый webhook от провайдера)
- Redis rate limiting — работает ли при реальных запросах
- Email (SendPulse/SMTP) — доставка писем
- Yandex Object Storage — генерация signed URLs
- YandexGPT — ответы AI
- Полная проверка живых секретов на хардкод (grep был ограничен правами в сессии)
- Playwright E2E тесты (нужен запущенный dev-сервер с БД)

---

## Приоритетный план до деплоя

1. **Немедленно** — обернуть `DEV_BYPASS_AUTH` в `process.env.NODE_ENV !== 'production'` в `middleware.ts` и `lib/auth/session.ts`
2. **Немедленно** — исправить заголовок YooKassa: `X-Signature` → `X-Request-Checksum`
3. **Немедленно** — добавить `crypto.timingSafeEqual()` в `verifyYooKassaWebhook`, `verifyCryptocloudWebhook`, `verifyMirWebhook`
4. **Немедленно** — добавить `onDelete: Cascade` на `user_id` FK в `UserSubscription`, `ProductMessage`, `LivestreamMessage` + новая миграция
5. **Немедленно** — добавить `requireAuth()` в `app/api/livestreams/[id]/chat/stream/route.ts`
6. **До деплоя** — заполнить реквизиты ООО (ИНН, адрес) в `terms/page.tsx`
7. **До деплоя** — унифицировать бренд: заменить «EduPlatform» → «WisdomWave» во всех metadata и видимых текстах
8. **До деплоя** — добавить `og:image` в `app/layout.tsx`
9. **До деплоя** — добавить `robots: { index: false }` в `/checkout`
10. **До деплоя** — добавить `.env.production` в `.gitignore`
11. **До деплоя** — убрать `teacher.name` из `console.log` в `lib/cron/payouts.ts`
12. **После деплоя** — добавить индексы на `Order.status`, `Product.moderation_status`, `TeacherPayout.status`
