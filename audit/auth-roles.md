# Аудит: Авторизация и роли

**Дата:** 2026-07-08  
**Аудитор:** Claude Sonnet 4.6 (automated pre-deploy audit)  
**Охват:** `middleware.ts`, `lib/auth/session.ts`, `app/api/**/*.ts`

---

## Итог по секции

| Критичность | Кол-во |
|-------------|--------|
| БЛОКЕР      | 3      |
| ВАЖНО       | 3      |
| КОСМЕТИКА   | 2      |

---

## БЛОКЕРЫ

### 1. БЛОКЕР — DEV_BYPASS_AUTH полностью отключает middleware

**Файл:** `middleware.ts:17-19`  
**Описание:** При `DEV_BYPASS_AUTH=true` middleware немедленно возвращает `NextResponse.next()`, пропуская все проверки аутентификации, ролей и `force_password_change`. Если переменная случайно окажется `true` в production — любой анонимный пользователь получает полный доступ к `/admin`, `/teacher/` и `/dashboard` без авторизации.

**Доказательство:**
```typescript
// middleware.ts:17-19
if (process.env.DEV_BYPASS_AUTH === 'true') {
  return NextResponse.next()
}
```

**Требуется:** Убедиться, что в `.env.production` и CI/CD-пайплайне переменная явно отсутствует или равна `false`. Добавить проверку `NODE_ENV !== 'production'` как дополнительный guard.

---

### 2. БЛОКЕР — DEV_BYPASS_AUTH возвращает фиктивного admin в API-слое

**Файл:** `lib/auth/session.ts:13`  
**Описание:** Функция `getSession()` при `DEV_BYPASS_AUTH=true` возвращает захардкоженного пользователя с ролью `admin` (`id: 'dev-admin'`). Все API-роуты, использующие `requireRole()` / `getSession()`, будут считать этого пользователя администратором. Опасность: если переменная активна в production, любой вызов любого API-эндпоинта пройдёт с правами admin без JWT-токена.

**Доказательство:**
```typescript
// lib/auth/session.ts:3-13
const DEV_ADMIN: SessionUser = {
  id: 'dev-admin',
  email: 'admin@localhost',
  name: 'Dev Admin',
  role: 'admin',
  avatar_url: null,
}

export async function getSession(): Promise<SessionUser | null> {
  if (process.env.DEV_BYPASS_AUTH === 'true') return DEV_ADMIN
  ...
}
```

**Требуется:** Обернуть в `if (process.env.NODE_ENV !== 'production')` — иметь ДВОЙНУЮ защиту от попадания в prod.

---

### 3. БЛОКЕР — `/api/livestreams/[id]/chat/stream` не требует авторизации

**Файл:** `app/api/livestreams/[id]/chat/stream/route.ts`  
**Описание:** SSE-эндпоинт стримингового чата трансляции не содержит никакой проверки аутентификации. Любой анонимный пользователь может подписаться на SSE-поток и получать все сообщения чата любой трансляции, включая потенциально приватные.

**Доказательство:**
```typescript
// app/api/livestreams/[id]/chat/stream/route.ts — нет requireAuth() / requireRole()
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  // Напрямую возвращает SSE-поток без проверки сессии
  const stream = new ReadableStream({ ... })
  return new NextResponse(stream, { ... })
}
```

**Сравнение:** `app/api/livestreams/[id]/chat/route.ts` (POST/GET сообщений) содержит `requireAuth()` на строках 12 и 42. Стриминговый роут — нет.

---

## ВАЖНО

### 4. ВАЖНО — `/api/webhooks/boxberry` не проверяет подпись

**Файл:** `app/api/webhooks/boxberry/route.ts:18-49`  
**Описание:** Webhook-обработчик Boxberry принимает любой POST-запрос без верификации подписи провайдера. Нет проверки секретного ключа или HMAC. Злоумышленник может отправить поддельный payload и изменить статус заказа на `delivered`.  
Для сравнения: YooKassa, CryptoCloud и МИР Pay — все проверяют подпись.

**Доказательство:**
```typescript
// app/api/webhooks/boxberry/route.ts — нет верификации
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const payload = (await req.json()) as BoxberryWebhookPayload
    // ... сразу обрабатывает payload без проверки подписи
    await db.order.updateMany({ ... data: { status: 'delivered' } })
  }
}
```

**Требуется:** Добавить верификацию секрета Boxberry (header `X-Boxberry-Signature` или Bearer-токен).

---

### 5. ВАЖНО — `/api/webhooks/cdek` не проверяет подпись

**Файл:** `app/api/webhooks/cdek/route.ts:17-58`  
**Описание:** Webhook-обработчик CDEK проверяет только наличие заголовка `X-Request-Id` (отсутствие которого вернёт 400), но не верифицирует подпись CDEK. Заголовок `X-Request-Id` не является секретным — это обычный идентификатор запроса. Злоумышленник может подделать его и изменить статус заказа на `delivered`.

**Доказательство:**
```typescript
// app/api/webhooks/cdek/route.ts:18-22
const requestId = req.headers.get('X-Request-Id')
if (!requestId) {
  return NextResponse.json({ error: 'Missing X-Request-Id header' }, { status: 400 })
}
// Дальше — сразу обработка payload без HMAC-проверки
```

**Требуется:** Реализовать верификацию по документации CDEK API v2 (Bearer-токен через OAuth или HMAC).

---

### 6. ВАЖНО — `admin/settings` не возвращает 403 при FORBIDDEN

**Файл:** `app/api/admin/settings/route.ts:7-43`  
**Описание:** Оба обработчика (`GET` и `PUT`) используют `requireRole('admin')`, но блок `catch` перехватывает все исключения одним широким `catch {}` без различения `UNAUTHORIZED` (401) и `FORBIDDEN` (403). Оба случая вернут `500 Ошибка сервера`. Это мешает клиенту корректно обработать ответ и скрывает реальный статус безопасности.

**Доказательство:**
```typescript
// app/api/admin/settings/route.ts:7-15 (GET)
export async function GET(): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    await requireRole('admin')
    ...
  } catch {
    // Перехватывает И 'UNAUTHORIZED' И 'FORBIDDEN' → всегда 500
    return NextResponse.json({ data: null, error: 'Ошибка сервера' }, { status: 500 })
  }
}
```

**Сравнение:** Все остальные admin-роуты (stats, users, products, analytics) корректно обрабатывают оба исключения с 401/403.

---

## КОСМЕТИКА

### 7. КОСМЕТИКА — Непоследовательный стиль проверки роли в `admin/categories`

**Файл:** `app/api/admin/categories/route.ts:8-11`, `app/api/admin/categories/[id]/route.ts:10-12`  
**Описание:** Роуты категорий используют `getSession()` + ручную проверку `session.role !== 'admin'` вместо единого паттерна `requireRole('admin')`, принятого во всех остальных admin-роутах. Функционально эквивалентно, но нарушает единообразие кодовой базы и усложняет аудит.

**Доказательство:**
```typescript
// app/api/admin/categories/route.ts:8-10 — устаревший паттерн
const session = await getSession()
if (!session || session.role !== 'admin') {
  return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 })
}

// Все остальные admin-роуты — актуальный паттерн
await requireRole('admin')
```

---

### 8. КОСМЕТИКА — Middleware не защищает `/dashboard` с trailing slash

**Файл:** `middleware.ts:3-10`  
**Описание:** В массиве `protectedRoutes` маршрут `/dashboard` задан без trailing slash, а `/teacher/` и `/admin` — с разным форматом. Функция `matchesRoute` корректно нормализует это через `pathname.startsWith(r)`, но `/dashboard` без завершающего слэша означает, что `/dashboard-backup` или `/dashboardX` теоретически тоже попадут под защиту. Это не критично, но семантика не идеальна.

**Доказательство:**
```typescript
// middleware.ts:3-9
const protectedRoutes = ['/dashboard', '/teacher/', '/admin']

function matchesRoute(pathname: string, routes: string[]): boolean {
  return routes.some((r) => pathname === r.replace(/\/$/, '') || pathname.startsWith(r))
}
// '/dashboard' без '/' → startsWith('/dashboard') совпадёт с '/dashboard-anything'
```

---

## Маршруты без авторизации (намеренно публичные — ОК)

Следующие маршруты не требуют авторизации — это корректно по архитектуре (публичный каталог):

| Файл | Метод | Обоснование |
|------|-------|-------------|
| `app/api/catalog/route.ts` | GET | Публичный каталог товаров |
| `app/api/categories/route.ts` | GET | Публичный список категорий |
| `app/api/products/route.ts` | GET | Публичный список продуктов |
| `app/api/products/[id]/route.ts` | GET | Публичная страница продукта |
| `app/api/products/[id]/view/route.ts` | POST | Счётчик просмотров (fire-and-forget) |
| `app/api/subscriptions/route.ts` | GET | Публичные тарифы подписок |
| `app/api/payments/methods/route.ts` | GET | Публичные методы оплаты |
| `app/api/delivery/calculate/route.ts` | POST | Расчёт доставки на checkout |
| `app/api/auth/register/route.ts` | POST | Регистрация нового пользователя |
| `app/api/auth/[...nextauth]/route.ts` | * | NextAuth.js обработчик |
| `app/api/webhooks/yookassa/route.ts` | POST | Проверяет HMAC-подпись |
| `app/api/webhooks/cryptocloud/route.ts` | POST | Проверяет HMAC-подпись |
| `app/api/webhooks/mir/route.ts` | POST | Проверяет подпись провайдера |
| `app/api/cron/run/route.ts` | POST | Проверяет `CRON_SECRET` Bearer-токен |

---

## Сводка по admin API-роутам

| Файл | Метод(ы) | Защита | Статус |
|------|----------|--------|--------|
| `admin/stats` | GET | `requireRole('admin')` | ОК |
| `admin/analytics` | GET | `requireRole('admin')` | ОК |
| `admin/users` | GET | `requireRole('admin')` | ОК |
| `admin/users/[id]` | PATCH | `requireRole('admin')` | ОК |
| `admin/teachers/[id]` | PATCH | `requireRole('admin')` | ОК |
| `admin/products` | GET, POST | `requireRole('admin')` | ОК |
| `admin/products/[id]` | GET, PUT, PATCH | `requireRole('admin')` | ОК |
| `admin/settings` | GET, PUT | `requireRole('admin')` | **ВАЖНО: catch не различает 401/403** |
| `admin/categories` | GET, POST | `getSession()` + ручная проверка | КОСМЕТИКА: устаревший паттерн |
| `admin/categories/[id]` | GET, PATCH, DELETE | `getSession()` + ручная проверка | КОСМЕТИКА: устаревший паттерн |

## Сводка по teacher API-роутам

| Файл | Метод(ы) | Защита | Изоляция данных | Статус |
|------|----------|--------|-----------------|--------|
| `teacher/products` | GET, POST | `requireRole('teacher','admin')` | `creator_id = user.id` (admin = all) | ОК |
| `teacher/products/[id]` | PATCH, DELETE | `requireRole('teacher','admin')` | `getOwnedProduct()` | ОК |
| `teacher/products/[id]/generate-seo` | POST | `requireRole('teacher','admin')` | `creator_id !== user.id` check | ОК |
| `teacher/lessons` | GET, POST | `requireRole('teacher','admin')` | `getOwnedProduct()` | ОК |
| `teacher/analytics` | GET | `requireRole('teacher','admin')` | `creator_id = user.id` (admin = all) | ОК |
