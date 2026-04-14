# EduPlatform РФ — Скиллы и артефакты агентов

Адаптировано из V5.1. Изменения отмечены ⚡.

---

## Скилы проекта (`.claude/skills/`)

### 1. `db-migrate` — database-architect
```
Назначение: создать или обновить Prisma миграцию
Команда: /db-migrate
```
Действия: `npx prisma migrate dev --name {name}`, проверить types, запустить seed.

---

### 2. `check-access` — backend-engineer
```
Назначение: проверить логику checkAccess()
Команда: /check-access
```
Проверяет: purchases OR (user_subscriptions WHERE expires_at > now()).

---

### 3. `generate-seo` — ai-integration ⚡
```
Назначение: сгенерировать SEO-теги через YandexGPT (только RU)
Команда: /generate-seo [product_id]
```
Вызывает POST /api/teacher/products/[id]/generate-seo через YandexGPT API.
Fallback на Claude API если YandexGPT недоступен.

---

### 4. `deploy-beget` — devops-engineer
```
Назначение: задеплоить на Beget через SSH
Команда: /deploy-beget
```
Выполняет: git pull → prisma migrate deploy → npm run build → pm2 restart.

---

### 5. `test-payment` — payment-integrator ⚡
```
Назначение: тестовый платёж через выбранный провайдер
Команда: /test-payment [yookassa|cryptocloud|mir]
```
Тестирует webhook flow: create → success webhook → verify purchase created.
PayPal удалён из списка провайдеров.

---

### 6. `add-translation` — frontend-developer ⚡
```
Назначение: добавить ключ в messages/ru.json (только RU)
Команда: /add-translation [key] [ru_text]
```
Только RU, EN убран.

---

### 7. `setup-yos` — storage-engineer ⚡ (новый)
```
Назначение: проверить подключение к Яндекс Object Storage
Команда: /setup-yos
```
Проверяет credentials, создаёт тестовый объект в бакете, генерирует signed URL.

---

### 8. `check-rf-compliance` — devops-engineer ⚡ (новый)
```
Назначение: проверить что все сервисы используют российскую инфраструктуру
Команда: /check-rf-compliance
```
Проверяет env vars: нет Cloudflare/Upstash/Resend/Sentry keys, есть YOS/Redis/SendPulse/GlitchTip.

---

## Распределение артефактов по агентам

### database-architect
| Артефакт | Путь |
|---|---|
| Prisma schema | `prisma/schema.prisma` |
| Миграции | `prisma/migrations/` |
| Seed | `prisma/seed.ts` |
| DB client | `lib/db/client.ts` |
| TypeScript типы | `types/index.ts` |

### backend-engineer
| Артефакт | Путь |
|---|---|
| NextAuth config | `lib/auth/config.ts`, `lib/auth/session.ts` |
| Access control | `lib/access/checkAccess.ts` |
| Middleware | `middleware.ts` |
| Rate limiter ⚡ | `lib/rate-limit/redis.ts` (Яндекс Redis) |
| Auth API | `app/api/auth/**` |
| Catalog API | `app/api/catalog/**` |
| Teacher API | `app/api/teacher/**` |
| Admin API | `app/api/admin/**` |
| Orders API | `app/api/orders/**` |
| Subscriptions API | `app/api/subscriptions/**` |
| Cron jobs | `lib/cron/**` |

### frontend-developer
| Артефакт | Путь |
|---|---|
| Layout | `components/layout/**` |
| UI components | `components/ui/**` (shadcn) |
| Landing | `app/(public)/page.tsx` |
| Catalog pages | `app/(public)/catalog/**` |
| Shop pages | `app/(public)/shop/**` |
| Dashboards | `app/(dashboard)/**`, `app/(teacher)/**`, `app/(admin)/**` |
| Переводы ⚡ | `messages/ru.json` (только RU) |
| i18n config | `lib/i18n/**` |
| Checkout | `components/checkout/**` |

### payment-integrator ⚡
| Артефакт | Путь | Статус |
|---|---|---|
| YooKassa | `lib/payments/yookassa.ts` | Активен |
| CryptoCloud | `lib/payments/cryptocloud.ts` | Активен |
| МИР Pay | `lib/payments/mir.ts` | Активен |
| PayPal | — | **Удалён** ⚡ |
| Payments API | `app/api/payments/**` | Активен |
| Webhooks YooKassa | `app/api/webhooks/yookassa/route.ts` | Активен |
| Webhooks CryptoCloud | `app/api/webhooks/cryptocloud/route.ts` | Активен |
| Webhooks МИР Pay | `app/api/webhooks/mir/route.ts` | Активен |
| Webhooks PayPal | — | **Удалён** ⚡ |
| CDEK | `lib/delivery/cdek.ts` | Активен |
| Boxberry | `lib/delivery/boxberry.ts` | Активен |
| EasyPost | — | **Удалён** ⚡ |
| Delivery API | `app/api/delivery/**` | Активен |
| Delivery webhooks | `app/api/webhooks/cdek/route.ts`, `boxberry/route.ts` | Активен |

### storage-engineer ⚡
| Артефакт | Путь |
|---|---|
| YOS client ⚡ | `lib/storage/yos.ts` |
| Signed URLs ⚡ | `lib/storage/signedUrl.ts` (generateSignedYOSUrl) |
| Upload presigned | `app/api/upload/presigned/route.ts` |
| Video API | `app/api/lessons/[id]/video/route.ts` |
| Video player ⚡ | `components/player/VideoPlayer.tsx` (VK/RuTube/Kinescope/YouTube/YOS) |
| Upload progress | `components/player/UploadProgress.tsx` |

### ai-integration ⚡
| Артефакт | Путь |
|---|---|
| YandexGPT client ⚡ | `lib/ai/yandexgpt.ts` |
| Claude client (fallback) ⚡ | `lib/ai/claude.ts` |
| SEO generation ⚡ | `lib/ai/seo.ts` (YandexGPT primary) |
| Chat ⚡ | `lib/ai/chat.ts` (YandexGPT) |
| Rate limiter ⚡ | `lib/rate-limit/redis.ts` (Яндекс Redis) |
| Chat API | `app/api/ai/chat/route.ts` |
| Chat widget | `components/ai-chat/ChatWidget.tsx` |

### devops-engineer
| Артефакт | Путь |
|---|---|
| Docker Compose | `docker-compose.yml` |
| Nginx config | `nginx.conf` |
| PM2 config | `ecosystem.config.js` |
| CI workflow | `.github/workflows/ci.yml` |
| Deploy workflow | `.github/workflows/deploy.yml` |
| Env example ⚡ | `.env.example` (с YOS/Redis/SendPulse vars) |

### email-agent ⚡ (новый)
| Артефакт | Путь |
|---|---|
| SendPulse client ⚡ | `lib/email/sendpulse.ts` |
| Beget SMTP fallback ⚡ | `lib/email/smtp.ts` |
| Email templates | `lib/email/templates/**` |

### qa-reviewer
| Артефакт | Путь |
|---|---|
| Vitest config | `vitest.config.ts` |
| Playwright config | `playwright.config.ts` |
| Unit tests | `tests/unit/**` |
| Integration tests | `tests/integration/**` |
| E2E tests | `tests/e2e/**` |

---

## Порядок запуска агентов

```
1. devops-engineer    → docker-compose.yml, nginx.conf, CI/CD, .env.example (РФ vars)
2. database-architect → prisma/schema.prisma (YOS video_source, EN опционально), migrations, seed
3. backend-engineer   → NextAuth.js, middleware, checkAccess(), Яндекс Redis rate limiter
4. frontend-developer → layout, next-intl (только RU), Dark Mode, cookie-баннер
5. qa-reviewer        → vitest + playwright config
   --- Фаза 1 закончена ---

6. storage-engineer   → Яндекс YOS, VideoPlayer (VK/RuTube/Kinescope/YOS), signed URLs
7. backend-engineer   → Teacher API, Subscriptions API
8. ai-integration     → YandexGPT Chat, SEO, Redis rate limit
9. frontend-developer → Landing, Catalog
   --- Фаза 2: контент работает ---

10. payment-integrator → YooKassa + CryptoCloud + МИР Pay (без PayPal)
11. payment-integrator → CDEK + Boxberry (без EasyPost)
12. email-agent        → SendPulse + Beget SMTP
13. frontend-developer → Shop, Cart, Checkout (3 метода оплаты)
14. backend-engineer   → Orders API, post-payment logic
    --- Фаза 3: платежи работают ---

15. frontend-developer → все Dashboards + юридические страницы
16. backend-engineer   → Admin API, Cron jobs
17. devops-engineer    → Beget production deploy + GlitchTip настройка
18. qa-reviewer        → E2E тесты, финальная проверка
    --- MVP готов ---
```
