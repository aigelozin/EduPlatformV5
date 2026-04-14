# EduPlatform РФ — Техническая спецификация
**Marketplace знаний и товаров — Российская инфраструктура**
Йога · Массаж · Фитнес · Творчество · Бизнес
Версия: РФ-1.0 | Адаптировано из V5.1 | Дата: 2026-04-13

---

## 00. КЛЮЧЕВЫЕ РЕШЕНИЯ

| Параметр | V5.1 | РФ-версия | Причина изменения |
|---|---|---|---|
| Хостинг | Beget.com Shared | Beget.com Shared | Без изменений |
| База данных | PostgreSQL (Beget) | PostgreSQL (Beget) | Без изменений |
| Аутентификация | NextAuth.js v5 | NextAuth.js v5 | Без изменений |
| Хранилище файлов | Cloudflare R2 (US) | Яндекс Объектное Хранилище (РФ) | Данные в РФ, ФЗ-152 |
| Rate Limiting | Upstash Redis (US) | Яндекс Managed Redis (РФ) | Данные в РФ |
| Email | Resend (US) | SendPulse (RU) + Beget SMTP | Данные в РФ, цена |
| Мониторинг ошибок | Sentry (US) | GlitchTip (self-hosted на Beget) | Данные в РФ |
| Платежи | YooKassa + PayPal + CryptoCloud + МИР | YooKassa + CryptoCloud + МИР Pay | PayPal удалён (нестабилен в РФ) |
| Доставка | CDEK + Boxberry + EasyPost | CDEK + Boxberry | EasyPost удалён (только РФ) |
| Видео | YouTube/VK/RuTube/Archive.org/R2 | VK/RuTube/Kinescope/YouTube*/YOS | Archive.org заблокирован, Kinescope добавлен |
| Трансляции | YouTube Live | VK Live + RuTube Live | YouTube нестабилен в РФ |
| AI | Claude API (US) | YandexGPT API (primary) + Claude API (fallback) | YandexGPT — данные в РФ |
| i18n | RU + EN | только RU | Аудитория — РФ |
| CI/CD | GitHub Actions | GitHub Actions / Gitflic | GitHub доступен в РФ |

*YouTube как запасной источник — может быть замедлен в РФ

---

## 01. ОБЗОР ПРОЕКТА

### 1.1 Решение
Мультипреподавательский marketplace: йога, массаж, фитнес, творчество, бизнес/саморазвитие.
- Видеоуроки и курсы (embed: VK/RuTube/Kinescope/YouTube + загрузка на YOS)
- Прямые трансляции (VK Live + RuTube Live + расписание)
- Физические товары (книги, мерч, одежда, аксессуары) с доставкой по РФ и СНГ
- Подписки с ограниченным доступом по времени
- 3 платёжных метода: YooKassa, CryptoCloud, МИР Pay
- AI-ассистент (YandexGPT) + AI SEO-генерация
- Dark Mode, ФЗ-152

### 1.2 Роли
| Роль | Возможности | Ограничения |
|---|---|---|
| admin | Полный доступ: все продукты, пользователи, платежи, аналитика, модерация, выплаты | — |
| teacher | СВОИ продукты, загрузка видео, аналитика своих продаж, выплаты | Только свои продукты (WHERE creator_id = user.id) |
| subscriber | Покупка контента/товаров, доступ по подписке, личный кабинет | Без создания контента |
| student | Регистрация, каталог, покупка отдельных продуктов | Без подписки без оплаты |

### 1.3 Типы продуктов
| Тип | Описание | Видео | Доставка | Подписка |
|---|---|---|---|---|
| lesson | Отдельный видеоурок | embed / YOS | — | Да |
| course | Набор уроков | embed / YOS | — | Да |
| bundle | Пакет (урок + трансляция + файлы) | embed / YOS | — | Да |
| livestream | Трансляция + запись | VK Live / RuTube Live | По расписанию | Да |
| digital_book | PDF-книга | — | — | Да |
| physical_book | Физическая книга | — | CDEK/Boxberry | Нет |
| souvenir | Сувениры, аксессуары | — | CDEK/Boxberry | Нет |
| apparel | Одежда (размер, цвет) | — | CDEK/Boxberry | Нет |
| subscription_plan | Подписка на курс/категорию | — | — | Основа |

---

## 02. СТЕК ТЕХНОЛОГИЙ

| Слой | Технология | Обоснование |
|---|---|---|
| Frontend/Backend | Next.js 14 App Router | SSR, SEO, RSC, единый стек |
| База данных | PostgreSQL (Beget) | На хостинге, без доп. расходов |
| ORM | Prisma | Типобезопасные запросы, миграции |
| Аутентификация | NextAuth.js v5 | Гибкость, JWT/sessions |
| Стили | Tailwind CSS + shadcn/ui + next-themes | Дизайн-система + Dark Mode |
| Хранилище | Яндекс Объектное Хранилище (YOS) | S3-совместимый, данные в РФ, ~2 руб/ГБ/мес |
| Платежи | YooKassa + CryptoCloud + МИР Pay | РФ + крипта |
| Доставка | CDEK API v2 + Boxberry API | РФ + СНГ |
| AI | YandexGPT API (primary) + Claude API (fallback) | Данные в РФ + качество |
| Rate Limiting | Яндекс Managed Redis | Данные в РФ, managed сервис |
| Email | SendPulse + Beget SMTP | RU-компания, данные в РФ |
| Мониторинг | GlitchTip (self-hosted) | Open source Sentry, данные на своём сервере |
| Тесты | Vitest + Playwright | Unit + E2E |
| CI/CD | GitHub Actions + SSH → Beget | Авто-деплой |
| i18n | next-intl (только RU) | Русскоязычная аудитория |
| Деплой локально | Docker Compose | PostgreSQL + Redis + Next.js |
| Деплой продакшн | PM2 + Nginx на Beget (Node.js) | Process manager |

### Бюджет сервисов (~₽1500–4000/мес)
| Сервис | Тариф | Цена |
|---|---|---|
| Яндекс Object Storage | 1 ГБ — ~2 руб/мес, исходящий трафик — ~1 руб/ГБ | ~100–500 руб |
| Яндекс Managed Redis | Минимальный тариф ~750 руб/мес | ~750 руб |
| SendPulse | Бесплатно до 15 000 писем/мес, потом ~800 руб | ~0–800 руб |
| GlitchTip | Self-hosted (бесплатно) | ~0 руб |
| YandexGPT API | Pay-per-use, ~0.06 руб/1000 токенов | ~300–1500 руб |
| Claude API (fallback) | Pay-per-use | ~0–500 руб |
| **Итого** | | **~1150–3300 руб/мес** |

---

## 03. АРХИТЕКТУРА И СТРУКТУРА ПРОЕКТА

```
EduplatformРФ/
├── app/
│   ├── (public)/           # Публичные страницы
│   │   ├── page.tsx        # Лендинг (12 секций)
│   │   ├── catalog/        # Каталог цифровых продуктов
│   │   ├── shop/           # Физические товары
│   │   ├── teachers/       # Список преподавателей
│   │   ├── live/           # Расписание трансляций
│   │   ├── subscriptions/  # Планы подписок
│   │   ├── checkout/       # Оформление заказа
│   │   └── [legal]/        # Юридические страницы
│   ├── (auth)/
│   │   ├── login/
│   │   ├── register/
│   │   └── become-teacher/
│   ├── (dashboard)/        # Личный кабинет ученика
│   ├── (teacher)/          # Дашборд преподавателя
│   ├── (admin)/            # Панель администратора
│   └── api/                # Route Handlers
│       ├── auth/
│       ├── catalog/
│       ├── lessons/
│       ├── subscriptions/
│       ├── teacher/
│       ├── admin/
│       ├── payments/
│       ├── delivery/
│       ├── webhooks/
│       ├── ai/
│       └── upload/
├── components/
│   ├── ui/                 # shadcn/ui базовые
│   ├── catalog/
│   ├── shop/
│   ├── player/             # Видеоплеер (4 источника: VK, RuTube, Kinescope, YOS)
│   ├── checkout/
│   ├── delivery/
│   ├── ai-chat/            # ChatWidget (YandexGPT)
│   ├── teacher/
│   ├── admin/
│   └── layout/
├── lib/
│   ├── db/                 # Prisma client + helpers
│   ├── auth/               # NextAuth.js config + middleware
│   ├── access/             # checkAccess()
│   ├── payments/           # yookassa.ts, cryptocloud.ts, mir.ts
│   ├── delivery/           # cdek.ts, boxberry.ts
│   ├── storage/            # YOS client + generateSignedYOSUrl()
│   ├── ai/                 # YandexGPT client (primary), Claude fallback
│   ├── rate-limit/         # Яндекс Redis middleware
│   ├── email/              # SendPulse + Beget SMTP
│   └── i18n/              # next-intl config (RU only)
├── prisma/
│   ├── schema.prisma       # 23 таблицы
│   ├── migrations/
│   └── seed.ts
├── messages/
│   └── ru.json             # Переводы (только RU)
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docker-compose.yml
├── nginx.conf
├── ecosystem.config.js
└── .env.example
```

---

## 04. БАЗА ДАННЫХ — 23 ТАБЛИЦЫ

Схема идентична V5.1 с одним изменением:
- Поле `video_source` в `products` и `lessons`: значения `vk | rutube | kinescope | youtube | yos` (вместо `youtube | vk | rutube | archive | r2`)
- Поле `preferred_lang` в `profiles`: убран EN, только `ru`
- Все поля `*_en` (title_en, description_en и т.д.) — опциональны, по умолчанию `null`

Остальные 23 таблицы без изменений:
`profiles`, `products`, `product_variants`, `lessons`, `courses`, `bundles`, `livestreams`,
`subscriptions`, `user_subscriptions`, `purchases`,
`orders`, `order_items`, `payments`, `teacher_payouts`,
`payment_methods_config`, `delivery_quotes`, `user_progress`,
`categories`, `reviews`, `consent_log`, `ai_chat_sessions`, `notifications`

---

## 05. ФУНКЦИОНАЛЬНОСТЬ

### 5.1 Аутентификация (NextAuth.js v5)
Без изменений по сравнению с V5.1.
- Email/Password (credentials provider)
- JWT sessions
- Middleware защита: /dashboard, /teacher, /admin

### 5.2 Видеоплеер (4 источника — Russian-first)

| Источник | URL | Статус |
|---|---|---|
| VK Video | `https://vk.com/video_ext.php?oid={}&id={}&hash={}` | Основной рекомендуемый |
| RuTube | `https://rutube.ru/play/embed/{id}` | Основной рекомендуемый |
| Kinescope | `https://kinescope.io/embed/{id}` | Платный, лучший для образования |
| YouTube | `https://youtube.com/embed/{id}` | Запасной (нестабилен в РФ) |
| YOS (приватный) | Signed URL, TTL 1ч | Загруженные видео, полная защита |

### 5.3 Хранилище — Яндекс Object Storage

```typescript
// lib/storage/yos.ts
import { S3Client } from '@aws-sdk/client-s3'

export const yosClient = new S3Client({
  region: 'ru-central1',
  endpoint: 'https://storage.yandexcloud.net',
  credentials: {
    accessKeyId: process.env.YOS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.YOS_SECRET_ACCESS_KEY!,
  },
})

// Приватный бакет — только для защищённого контента
// Публичный бакет — для аватаров, галерей, обложек
```

### 5.4 Платежи (3 провайдера)

**YooKassa** — карты РФ (Visa/MC/МИР через YooKassa), СБП, кошельки
**МИР Pay** — карты МИР напрямую через НСПК
**CryptoCloud** — криптовалюта (USDT, BTC и др.)

PayPal удалён. Обоснование: нестабильная работа с российскими аккаунтами, высокий риск блокировок.

### 5.5 Доставка (2 провайдера)

**CDEK API v2** — РФ и СНГ
**Boxberry** — РФ

EasyPost удалён. Обоснование: международная доставка для РФ-ориентированного проекта не нужна.

### 5.6 AI — YandexGPT (primary)

```typescript
// lib/ai/yandexgpt.ts
// Endpoint: https://llm.api.cloud.yandex.net/foundationModels/v1/completion
// Model: yandexgpt-lite (быстрый + дешёвый) или yandexgpt (лучший)
// Auth: IAM token или API key из Yandex Cloud
```

Claude API остаётся как fallback для SEO-генерации, если YandexGPT недоступен.

### 5.7 Email — SendPulse + Beget SMTP

```typescript
// lib/email/sendpulse.ts — транзакционные письма через SendPulse API
// lib/email/smtp.ts — Beget SMTP как fallback
// Бесплатно до 15 000 писем/мес на SendPulse
```

### 5.8 Мониторинг — GlitchTip

GlitchTip — open source альтернатива Sentry, устанавливается на собственный сервер.
Совместим с Sentry SDK — замена `SENTRY_DSN` на `GLITCHTIP_DSN`, остальной код без изменений.

```bash
# Деплой GlitchTip на Beget VPS или отдельный сервер:
docker run -d --name glitchtip -p 8000:8000 glitchtip/glitchtip
```

### 5.9 Трансляции

| Платформа | Embed | Статус |
|---|---|---|
| VK Live | `https://vk.com/video_ext.php?oid={}&id={}&hash={}` | Основной |
| RuTube Live | `https://rutube.ru/play/embed/{id}` | Основной |
| YouTube Live | `https://youtube.com/embed/{id}` | Запасной |

---

## 06. API ENDPOINTS

Полностью идентичны V5.1, с изменениями:

- `lib/payments/paypal.ts` → **удалён**
- `lib/delivery/easypost.ts` → **удалён**
- `lib/storage/r2.ts` → заменён на `lib/storage/yos.ts`
- `lib/ai/claude.ts` → `lib/ai/yandexgpt.ts` (primary) + `lib/ai/claude.ts` (fallback)
- `lib/rate-limit/redis.ts` → использует Яндекс Managed Redis вместо Upstash
- `lib/email/resend.ts` → `lib/email/sendpulse.ts` + `lib/email/smtp.ts`
- `app/api/webhooks/paypal/route.ts` → **удалён**
- `app/api/webhooks/easypost/` → **удалён**

---

## 07. ФЗ-152 COMPLIANCE

Обязательные требования:
- Все персональные данные хранятся исключительно на серверах в РФ
- Хостинг: Beget (Москва/Санкт-Петербург)
- БД: PostgreSQL на Beget (РФ)
- Файлы: Яндекс Object Storage (дата-центры в Москве)
- Сессии/кэш: Яндекс Managed Redis (РФ)
- Электронная почта: SendPulse (RU, данные в РФ)
- Мониторинг: GlitchTip self-hosted (на своём сервере в РФ)
- `consent_log` для регистрации, checkout, Teacher Agreement

---

## 08. SEO (только RU)

- Schema.org: Course, Organization, FAQPage — только на русском
- Open Graph — только RU локаль
- Sitemap генерируется для RU-страниц
- Без hreflang (EN убран)
- YandexGPT для AI SEO-генерации (title_ru, description_ru)

---

## 09. ЮРИДИЧЕСКИЕ СТРАНИЦЫ

- `/privacy-policy` — Политика конфиденциальности (ФЗ-152)
- `/terms` — Пользовательское соглашение
- `/offer` — Публичная оферта
- `/cookie-policy` — Cookie-политика
- `/teacher-agreement` — Договор с преподавателем
- `/delivery` — Условия доставки (CDEK + Boxberry)
- `/refund` — Условия возврата
