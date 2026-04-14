# EduPlatform РФ — AI Development Context

## Project

Multi-teacher educational marketplace (yoga, massage, fitness, creativity, business).
Physical goods + digital content + subscriptions + live streams.
Jurisdiction: ООО in Russia (ФЗ-152). Infrastructure: 100% Russia-based services.
Target: RU users (primary) + RU-speaking international.

---

## Stack

```
Next.js 14 App Router + TypeScript strict
PostgreSQL (Beget Shared) + Prisma ORM
NextAuth.js v5 — JWT sessions
Yandex Object Storage — file/video storage (S3-compatible, signed URLs TTL 1h)
Payments: YooKassa + CryptoCloud + МИР Pay  (NO Stripe, NO PayPal)
Delivery: CDEK API v2 + Boxberry API (NO EasyPost — RU-only delivery)
AI: YandexGPT API (primary) + Claude API fallback (chat + SEO)
Rate limiting: Яндекс Managed Redis (Yandex Cloud) | Errors: GlitchTip (self-hosted)
Email: SendPulse (RU) + Beget SMTP (backup)
Tests: Vitest + Playwright | CI/CD: GitHub Actions → SSH → Beget
i18n: next-intl (RU only — EN removed) | Styles: Tailwind CSS + shadcn/ui + next-themes
Deploy: PM2 + Nginx на Beget Shared (Node.js)
Local dev: Docker Compose (PostgreSQL 16 + Redis 7 + Next.js)
```

## Roles

`admin` | `teacher` | `subscriber` | `student`

- **teacher**: видит ТОЛЬКО свои продукты — `WHERE creator_id = session.user.id` в КАЖДОМ запросе
- **teacher content**: `moderation_status = 'approved'` для публичной видимости
- **subscriber**: активная `user_subscriptions` (`expires_at > now()`)

---

## Code Style

- TypeScript `strict: true` — без `any`, без необоснованных type assertions
- Server Components по умолчанию; `'use client'` только для browser API или React state
- Именование файлов: `kebab-case` для файлов/директорий, `PascalCase` для компонентов, `camelCase` для utils
- Named exports везде; default exports только для Next.js pages/layouts
- i18n: все строки через `next-intl` ключи (только RU) — никогда не хардкодить текст в компонентах
- Поля контента в БД: только `_ru` вариант (EN убран)
- Никаких `console.log` в продакшне — GlitchTip для трекинга ошибок
- Только Tailwind — никаких inline styles, никаких CSS modules (кроме `globals.css`)
- Dark mode: `next-themes` CSS-переменные — никогда `#hex` цвета или `bg-white/text-black`
- API responses: `{ data, error, meta }` — никогда raw Prisma объекты

## Architecture

```
app/(public)/        → публичные страницы (SSR, SEO)
app/(auth)/          → login, register, become-teacher
app/(dashboard)/     → личный кабинет ученика
app/(teacher)/       → дашборд преподавателя
app/(admin)/         → панель администратора
app/api/             → Route Handlers (server-only)

components/ui/       → shadcn/ui primitives (не изменять)
components/{domain}/ → компоненты по доменам
components/layout/   → Header, Footer, Sidebar

lib/db/              → Prisma singleton (server-only)
lib/auth/            → NextAuth.js config + session helpers
lib/access/          → checkAccess() — единственный источник правды для контроля доступа
lib/payments/        → yookassa.ts, cryptocloud.ts, mir.ts
lib/delivery/        → cdek.ts, boxberry.ts
lib/storage/         → Yandex Object Storage client + generateSignedYOSUrl()
lib/ai/              → YandexGPT client, SEO генерация, chat streaming
lib/rate-limit/      → Яндекс Redis middleware
lib/email/           → SendPulse + Beget SMTP транзакционные письма
lib/i18n/            → next-intl config (RU only)
lib/cron/            → cron задачи (выплаты, напоминания подписок)

prisma/schema.prisma → 23 таблицы (источник правды для БД)
prisma/seed.ts       → тестовые данные
messages/ru.json     → переводы (только RU)
tests/unit/          → Vitest unit-тесты
tests/integration/   → Vitest + тестовая БД
tests/e2e/           → Playwright E2E
```

Key dependency rules:
- `lib/db/` — server-only, никогда не импортировать Prisma в Client Components
- `DATABASE_URL` никогда не должен попадать в клиентские бандлы
- `lib/access/checkAccess.ts` — единственное место определения доступа к контенту
- Секреты платёжных систем только в ENV vars

---

## Critical Security Rules

- `checkAccess(userId, productId)` перед ЛЮБЫМ контентом урока/курса/видео — БЕЗ ИСКЛЮЧЕНИЙ
- `generateSignedYOSUrl()` ТОЛЬКО после `checkAccess()` — TTL 1 час
- Webhook handlers ДОЛЖНЫ проверять подпись провайдера до обработки любого события
- Секреты платёжных систем ТОЛЬКО в ENV vars
- Rate limit на ВСЕХ `/api/*` маршрутах через Redis middleware
- ФЗ-152: чекбокс согласия на регистрации + checkout + регистрации преподавателя → запись в `consent_log`
- Изоляция данных преподавателя: каждый запрос ДОЛЖЕН включать `WHERE creator_id = session.user.id`
- `PLATFORM_FEE_PERCENT` из ENV — никогда хардкодом

## Access Control Pattern

```typescript
// lib/access/checkAccess.ts
export async function checkAccess(userId: string, productId: string): Promise<boolean>
// Проверяет: purchases OR (user_subscriptions WHERE expires_at > now())
// Обязателен в /api/lessons/[id]/video — НИКОГДА не пропускать
```

## Video Sources (Russian-first)

```typescript
// VK Video (основной рекомендуемый)
`https://vk.com/video_ext.php?oid=${oid}&id=${id}&hash=${hash}`
// RuTube
`https://rutube.ru/play/embed/${id}`
// Kinescope (платный, лучший для образования)
`https://kinescope.io/embed/${id}`
// YouTube (как запасной)
`https://youtube.com/embed/${id}?rel=0&modestbranding=1`
// Yandex Object Storage (приватный) — ТОЛЬКО после checkAccess()
generateSignedYOSUrl(key, 3600)
```

## Payment Webhook Security

Каждый webhook handler ДОЛЖЕН проверить подпись:
- **YooKassa**: HMAC-SHA256 тела с секретным ключом
- **CryptoCloud**: HMAC-SHA256
- **МИР Pay**: специфичная проверка заголовка провайдера

## DB: 23 таблицы (Prisma)

`profiles`, `products`, `product_variants`, `lessons`, `courses`, `bundles`, `livestreams`,
`subscriptions`, `user_subscriptions`, `purchases`,
`orders`, `order_items`, `payments`, `teacher_payouts`,
`payment_methods_config`, `delivery_quotes`, `user_progress`,
`categories`, `reviews`, `consent_log`, `ai_chat_sessions`, `notifications`

---

## Workflow

### Plan Mode для сложных задач

Используй **Plan Mode** (`/plan`) для задач с 3+ шагами или затрагивающих несколько доменов (БД + API + UI).
НЕ пиши код до одобрения плана пользователем.

### Commit messages

Формат: `type(scope): description` (English, imperative mood, 72 символа макс)

```
feat(auth): add teacher registration with consent logging
fix(access): prevent signed URL generation without access check
refactor(payments): extract webhook signature verification helper
```

Types: `feat` | `fix` | `refactor` | `test` | `docs` | `chore` | `perf` | `security`

### Чеклист деплоя перед merge

1. `npm run type-check` — ноль ошибок
2. `npm run lint` — ноль предупреждений на изменённых файлах
3. `npm run test` — все unit/integration тесты проходят
4. Миграции: если `prisma/schema.prisma` изменён — включить migration файл
5. ENV: если добавлена новая переменная — обновить `.env.example`
6. i18n: если добавлен новый текст — обновить `messages/ru.json`

---

## Common Mistakes

- **Забытая изоляция преподавателя**: всегда `WHERE creator_id = session.user.id`
- **Пропущен checkAccess()**: никогда не возвращать signed YOS URL без checkAccess()
- **Импорт Prisma в клиенте**: `lib/db/client.ts` server-only — вызовет крэш при сборке
- **Хардкод цветов**: `bg-white` вместо семантических Tailwind dark mode переменных
- **Отсутствует запись consent_log**: регистрация, checkout, регистрация преподавателя — ФЗ-152
- **Непроверенные webhooks**: никогда не обрабатывать payload до верификации подписи
- **Хардкод комиссии**: литерал `0.2` вместо `process.env.PLATFORM_FEE_PERCENT`
- **Использование PayPal или EasyPost**: эти провайдеры удалены из РФ-версии
- **Использование Cloudflare R2**: заменён на Yandex Object Storage
- **Использование Resend или Upstash**: заменены на российские аналоги

---

## Testing

```bash
npm run test             # Vitest unit-тесты
npm run test:watch       # с watch mode
npm run test:integration # Vitest + тестовая БД (нужен TEST_DATABASE_URL)
npm run test:e2e         # Playwright (нужен запущенный dev сервер)
npm run type-check       # только проверка типов
npm run lint             # только линтер
```

Перед каждым коммитом:
```bash
npm run type-check && npm run lint && npm run test
```

---

## Deployment

```bash
# Локально (Docker Compose)
docker-compose up          # PostgreSQL + Redis + Next.js на :3000
npx prisma migrate dev
npx prisma db seed

# Продакшн (Beget — через CI/CD)
git push origin main       # → GitHub Actions → SSH → Beget

# Ручной деплой
ssh beget "cd /path/to/app && git pull && npx prisma migrate deploy && npm run build && pm2 restart ecosystem.config.js"
```
