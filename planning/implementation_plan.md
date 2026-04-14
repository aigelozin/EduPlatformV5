# EduPlatform РФ — Пошаговый план реализации

Адаптировано из V5.1. Изменения отмечены символом ⚡.

---

## Архитектурные изменения V5.1 → РФ

| Компонент | V5.1 | РФ-версия |
|---|---|---|
| Файловое хранилище | Cloudflare R2 | Яндекс Object Storage ⚡ |
| Rate Limiting | Upstash Redis (US) | Яндекс Managed Redis ⚡ |
| Email | Resend | SendPulse + Beget SMTP ⚡ |
| Мониторинг | Sentry (US) | GlitchTip (self-hosted) ⚡ |
| Платежи | YooKassa + PayPal + CryptoCloud + МИР | YooKassa + CryptoCloud + МИР Pay ⚡ |
| Доставка | CDEK + Boxberry + EasyPost | CDEK + Boxberry ⚡ |
| Видео | YouTube/VK/RuTube/Archive.org | VK/RuTube/Kinescope/YouTube ⚡ |
| AI | Claude API | YandexGPT + Claude fallback ⚡ |
| i18n | RU + EN | только RU ⚡ |

---

## Фаза 1: Фундамент (Неделя 1–2)

### Агент: devops-engineer
**Задачи:**
1. Создать `docker-compose.yml` (PostgreSQL 16 + Redis 7 + Next.js)
2. Создать `nginx.conf` для Beget
3. Создать `ecosystem.config.js` (PM2: cluster mode, 2 instances)
4. Создать `.github/workflows/ci.yml`
5. Создать `.github/workflows/deploy.yml`
6. Создать `.env.example` с российскими переменными ⚡

**Критерий:** `docker-compose up` поднимает PostgreSQL + Redis, Next.js на :3000

---

### Агент: database-architect
**Задачи:**
1. Создать `prisma/schema.prisma` (23 таблицы)
   - `video_source` enum: `vk | rutube | kinescope | youtube | yos` ⚡
   - Поля `*_en` — опциональные (nullable) ⚡
2. Создать начальную миграцию
3. Создать `prisma/seed.ts`:
   - 5 категорий
   - Тестовые продукты каждого типа
   - `payment_methods_config` (YooKassa, CryptoCloud, МИР Pay — без PayPal) ⚡
   - Тестовые пользователи
4. Создать `lib/db/client.ts`
5. Создать `types/index.ts`

**Критерий:** `npx prisma db seed` без ошибок, 23 таблицы созданы

---

### Агент: backend-engineer
**Задачи:**
1. Настроить NextAuth.js v5
2. Создать `middleware.ts`
3. Создать `lib/access/checkAccess.ts`
4. Создать `lib/rate-limit/redis.ts` с Яндекс Redis (ioredis) ⚡
5. Базовые CRUD API (auth, catalog)

**Критерий:** Регистрация, вход, checkAccess() работают

---

### Агент: frontend-developer
**Задачи:**
1. Инициализировать Next.js 14 + Tailwind + shadcn/ui + next-themes
2. Настроить `next-intl` (только RU, убрать EN) ⚡
3. Создать базовый layout (Header, Footer, Sidebar)
4. Создать cookie-баннер
5. Базовые страницы-заглушки

**Критерий:** Сайт открывается, Dark Mode работает, RU локаль работает

---

### Агент: qa-reviewer
**Задачи:**
1. Настроить `vitest.config.ts`
2. Настроить `playwright.config.ts`
3. Тест для `checkAccess()` (unit)
4. CI: lint + type-check + vitest

---

## Фаза 2: Контент и видео (Неделя 2–3)

### Агент: storage-engineer ⚡
**Задачи:**
1. Создать `lib/storage/yos.ts` (Яндекс Object Storage через @aws-sdk/client-s3) ⚡
2. Создать `lib/storage/signedUrl.ts` — `generateSignedYOSUrl(key, ttl=3600)` ⚡
3. Создать `app/api/lessons/[id]/video/route.ts` (checkAccess → return signed YOS URL или embed)
4. Создать `app/api/upload/presigned/route.ts`
5. Создать `components/player/VideoPlayer.tsx` — 4 источника: VK, RuTube, Kinescope, YouTube ⚡
6. Создать `components/player/UploadProgress.tsx`

**Критерий:** VideoPlayer работает для всех 4 источников, YOS signed URL выдаётся только после checkAccess()

---

### Агент: ai-integration ⚡
**Задачи:**
1. `lib/ai/yandexgpt.ts` — YandexGPT API клиент ⚡
2. `lib/ai/claude.ts` — Claude API клиент (fallback) ⚡
3. `lib/ai/seo.ts` — generateSEO(product) → {seo_title, seo_description} (использует YandexGPT) ⚡
4. `lib/ai/chat.ts` — streamChat через YandexGPT
5. `app/api/ai/chat/route.ts` (rate limit 20/час на пользователя через Яндекс Redis)
6. `components/ai-chat/ChatWidget.tsx`

**Критерий:** ChatWidget работает, SEO-генерация через YandexGPT работает

---

### Агент: backend-engineer
**Задачи:** (без изменений по сравнению с V5.1)
1. Teacher API
2. Subscriptions API
3. Purchase check middleware

---

### Агент: frontend-developer
**Задачи:**
1. Landing page — 12 секций
2. Catalog, Product page
3. Subscriptions page
4. SEO (только RU Schema.org) ⚡

---

## Фаза 3: Платежи и магазин (Неделя 3–4)

### Агент: payment-integrator ⚡
**Задачи:**

**Платежи (3 провайдера вместо 4):**
1. `lib/payments/yookassa.ts`
2. `lib/payments/cryptocloud.ts`
3. `lib/payments/mir.ts`
4. `app/api/payments/create/route.ts`
5. `app/api/payments/methods/route.ts`
6. Webhooks:
   - `app/api/webhooks/yookassa/route.ts`
   - `app/api/webhooks/cryptocloud/route.ts`
   - `app/api/webhooks/mir/route.ts`
   - (PayPal webhook удалён) ⚡

**Доставка (2 провайдера вместо 3):**
7. `lib/delivery/cdek.ts`
8. `lib/delivery/boxberry.ts`
9. `app/api/delivery/calculate/route.ts`
10. `app/api/webhooks/cdek/route.ts`
11. `app/api/webhooks/boxberry/route.ts`
- (EasyPost удалён) ⚡

**Критерий:** Тестовые платежи проходят, расчёт доставки работает

---

### Агент: frontend-developer
**Задачи:** (без изменений)
1. Shop + product cards
2. Cart, DeliveryCalculator
3. CheckoutForm с 3 провайдерами оплаты ⚡
4. PaymentMethods (YooKassa, CryptoCloud, МИР Pay)

---

## Фаза 4: Dashboards и финал (Неделя 4–6)

### Агент: frontend-developer
**Задачи:** (без изменений)
1. Student Dashboard
2. Teacher Dashboard
3. Admin Panel
4. Teachers list, Live stream schedule
5. Юридические страницы + `/delivery` + `/refund` ⚡

---

### Агент: backend-engineer
**Задачи:**
1. Admin API
2. Teacher payouts cron
3. Subscription reminder cron
4. Notifications API

---

### Агент: devops-engineer ⚡
**Задачи:**
1. Настройка deploy.yml для Beget
2. Документация по деплою
3. Настройка Nginx HTTPS
4. Настройка GlitchTip для мониторинга ⚡
5. Test-run деплоя на Beget

---

### Агент: email-setup ⚡ (новый мини-агент)
**Задачи:**
1. `lib/email/sendpulse.ts` — транзакционные письма через SendPulse API ⚡
2. `lib/email/smtp.ts` — Beget SMTP fallback через nodemailer ⚡
3. Адаптировать все email-шаблоны (приветствие, подтверждение заказа, уведомления)

---

### Агент: qa-reviewer
**Задачи:**
1. E2E тесты — ключевые флоу
2. Тест оплаты через YooKassa (без PayPal) ⚡
3. Тест доставки CDEK + Boxberry (без EasyPost) ⚡

**Критерий:** Все E2E тесты проходят, coverage > 80%

---

## Параллельные задачи

```
Фаза 1: devops + database ║ backend + frontend ║ qa
Фаза 2: storage + ai      ║ backend             ║ frontend
Фаза 3: payment           ║ frontend + backend
Фаза 4: frontend          ║ backend + devops + email ║ qa
```

---

## Зависимости между агентами

```
database-architect → backend-engineer (нужна схема)
backend-engineer → frontend-developer (нужны API)
storage-engineer → backend-engineer (нужны signed YOS URLs)
payment-integrator → backend-engineer (нужна логика после оплаты)
devops-engineer → (все агенты, нужна среда)
qa-reviewer → (все агенты, нужен готовый код)
email-setup → backend-engineer (нужны триггеры)
```

---

## Чеклист готовности РФ-версии

- [ ] Все данные пользователей хранятся на серверах в РФ (Beget + Яндекс Облако)
- [ ] Cloudflare R2 → Яндекс Object Storage
- [ ] Upstash Redis → Яндекс Managed Redis
- [ ] Resend → SendPulse + Beget SMTP
- [ ] Sentry → GlitchTip (self-hosted)
- [ ] PayPal удалён
- [ ] EasyPost удалён
- [ ] Archive.org embed удалён
- [ ] YandexGPT как primary AI
- [ ] Только RU локаль
- [ ] ФЗ-152 consent_log на всех обязательных шагах
