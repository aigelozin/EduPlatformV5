# Admin Panel — Дизайн и расширение функциональности

**Дата:** 2026-04-16  
**Статус:** Согласован  

---

## Контекст

Текущая админ-панель (`/admin`) содержит: обзор-дашборд, список преподавателей, список продуктов с модерацией, список заказов. Задача — добавить 7 взаимосвязанных подсистем.

---

## 1. Дизайн сайта

### Визуальное направление
- **Цвет:** тёплый беж `#f8f7f4` (фон) + глубокий зелёный `#4a7c59` (акцент)
- **Шрифты:** PT Serif (заголовки) + PT Sans (текст) — загрузка через Яндекс.Шрифты (`fonts.yandex.ru`)
- **Форма элементов:** сбалансированное скругление 8–12px

### Архитектура (Подход A — CSS-переменные из БД)

Новая таблица `site_settings` (одна строка):

```prisma
model SiteSettings {
  id         String   @id @default("main")
  brand      Json     // цвета, логотип, favicon, название, слоган
  typography Json     // шрифты, базовый размер
  homepage   Json     // hero-текст, nav-названия, секции, CTA
  seo        Json     // мета-теги, Schema.org, соцсети, llms-данные
  updated_at DateTime @updatedAt

  @@map("site_settings")
}
```

Root layout (`app/layout.tsx`) читает настройки через `unstable_cache` с TTL 60 сек и рендерит `<style>` тег с CSS-переменными (`--primary`, `--background`, `--font-heading`, `--font-body`, `--radius`). При сохранении из админки вызывается `revalidateTag('site-settings')`.

### Производительность (Core Web Vitals)
- `font-display: swap` + `preconnect` к `fonts.yandex.ru`
- Логотип и OG-изображение → Yandex Object Storage, формат WebP
- `next/image` с `priority` на hero-секции → LCP < 2.5s
- Настройки кешируются — нет overhead на каждый запрос

### Страница `/admin/settings` — 4 вкладки

**Вкладка «Бренд»:**
- Название сайта (хедер + `<title>`)
- Слоган (рядом с логотипом в хедере)
- Основной цвет (color picker → hex)
- Цвет фона (color picker → hex)
- Загрузка логотипа (PNG/SVG, до 200 КБ → YOS)
- Загрузка favicon (ICO/PNG, 32×32 или 64×64 → YOS)

**Вкладка «Шрифты»:**
- Выбор шрифта заголовков (dropdown: PT Serif, Playfair Display, Cormorant Garamond, Merriweather)
- Выбор шрифта текста (dropdown: PT Sans, Inter, Lato, Nunito)
- Базовый размер: S (14px) / M (16px, default) / L (18px)
- Живой превью при изменении

**Вкладка «Контент»:**
- Hero: главный заголовок, подзаголовок, текст основной CTA, текст второстепенной CTA
- Навигация: переименование пунктов меню (Каталог, Подписки, Преподаватели, Магазин) — только текст, не ссылки
- Секции главной страницы: переименование заголовков + toggle видимости (Популярные курсы, Трансляции, Блок отзывов и др.)

**Вкладка «GEO / SEO»:**
- Данные организации: название ООО, телефон, email, страна (для Schema.org + Яндекс.Справочник)
- Шаблон title: `{название страницы} | EduPlatform`
- Meta description по умолчанию
- OG-изображение по умолчанию (1200×630 → YOS)
- Описание для ИИ (160 символов, без маркетинговых клише)
- Ключевые услуги (через запятую → Schema.org `keywords` + `llms.txt`)
- Соцсети: VK, Telegram, YouTube, RuTube

---

## 2. SEO + ИИ-оптимизация

### Технический слой (автоматически, без участия админа)

**Schema.org JSON-LD** — генерируется сервером на каждой странице:
- Главная → `Organization`
- Страница курса → `Course` + `AggregateRating`
- Страница преподавателя → `Person`
- Каталог → `ItemList`

**`/llms.txt`** — новый стандарт для ИИ-агентов (ChatGPT, Perplexity, Яндекс ИИ):
```
# EduPlatform
> {описание для ИИ из site_settings}

## Разделы
- Каталог курсов: /catalog
- Преподаватели: /teachers
- Подписки: /subscriptions
- Магазин: /shop

## Услуги
{ключевые услуги из site_settings}
```

**`/robots.txt`** — разрешает GPTBot, PerplexityBot, YandexBot; запрещает `/admin`, `/api`, `/dashboard`.

**`/sitemap.xml`** — динамический, генерируется из БД: все продукты, преподаватели, категории. Инвалидируется при публикации нового продукта через `revalidatePath('/sitemap.xml')`.

**OpenGraph + Twitter Cards** — на всех публичных страницах. OG-изображение: `thumbnail_url` продукта или дефолтное из `site_settings`.

**Canonical URL** — на каждой странице.

### GEO-оптимизация на уровне преподавателя

Новое поле `city` в `profiles`. Используется:
- В JSON-LD `Person.address`
- В meta-title страницы преподавателя: `«Йога онлайн — Анна Соколова, Москва»`
- В JSON-LD `Course.location` если курс привязан к городу

### Поля на продуктах (редактируются из `/admin/products/[id]/edit`)
- `seo_title_ru` — уже есть в схеме
- `seo_description_ru` — уже есть в схеме
- `ai_description_ru` (новое, 160 симв.) — специально для ИИ-поисковиков

---

## 3. Управление контентом преподавателей

### Расширение `/admin/teachers`
- Фильтр: Все / Активные / Заблокированные / Ожидают одобрения
- Новые столбцы: Город, Доход платформы (сумма комиссий)
- Кнопка быстрого действия: Заблокировать / Разблокировать

### Новая страница `/admin/teachers/[id]`

**Блок «Профиль»:** просмотр и редактирование имени, email, аватара, города, bio, статуса.

**Блок «Продукты»:** таблица продуктов преподавателя с колонками:
- Название, статус модерации, просмотры, записи, продолжительность, дата последнего использования
- Фильтр по статусу модерации
- Кнопка «Отклонить всё» для массовой модерации

**Блок «Действия»:**
- Отправить уведомление (текст → запись в `notifications`)
- Заблокировать (`is_active = false`, все продукты скрываются публично)
- Разблокировать

### Расширение `/admin/products/[id]/edit`
- Поле «Город» (из профиля преподавателя, переопределяемое)
- Поля `seo_title_ru`, `seo_description_ru`, `ai_description_ru`
- Кнопка «Сгенерировать SEO» → вызывает `/api/teacher/products/[id]/generate-seo`

### Новые поля в схеме для продуктов
```prisma
// добавляется к model Product:
views_count      Int      @default(0)
duration_minutes Int?     // суммарная продолжительность уроков
ai_description_ru String? // описание для ИИ, 160 симв.
```

`views_count` инкрементируется через `db.product.update({ data: { views_count: { increment: 1 } } })` при загрузке публичной страницы продукта (не блокирует рендер, вызывается fire-and-forget через отдельный `POST /api/products/[id]/view` из клиентского компонента при монтировании).

**Записи** = `purchases.count` + `user_subscriptions.count` (считается запросом, не хранится).  
**Дата последнего использования** = `user_progress.updated_at` последней активной записи.

### Расширенная модерация продуктов
При отклонении (`rejected`) — обязательное поле с причиной → запись в `notifications` преподавателю.

---

## 4. Аналитика продуктов

### Новая страница `/admin/analytics`

**KPI-карточки** (фильтр: 7д / 30д / 90д / всё):
- Выручка за период (`orders.total_amount` где `status = paid`)
- Новые покупки (`purchases.created_at`)
- Новые пользователи (`profiles.created_at`)
- Активные подписки (`user_subscriptions` где `expires_at > now()`)

**Таблица «Топ продуктов»:** название, преподаватель, просмотры, записи, выручка, средняя оценка, % прохождения, продолжительность, дата последнего использования. Сортировка по любому столбцу. Экспорт CSV.

**График выручки:** линейный по дням/неделям через Recharts. Данные агрегируются на сервере.

**Блок «Активность студентов»:**
- Среднее % прохождения по всем курсам
- Топ-5 самых просматриваемых продуктов за период
- Топ-5 заброшенных (начали, не завершили > 30 дней)

**Кеширование:** все запросы `unstable_cache` TTL 5 минут.

### Расширение `/teacher/analytics`
Те же метрики, но `WHERE creator_id = session.id`. Добавляются: просмотры, записи, продолжительность, дата последнего использования по каждому продукту.

---

## 5. Отзывы и обратная связь

### Изменения в схеме
```prisma
// добавляется к model Review:
reply_ru   String?
replied_at DateTime?
is_visible Boolean  @default(true)
```

### По ролям

**Студент:** оставляет отзыв (оценка 1–5 + текст) после получения доступа к продукту; редактирует в течение 7 дней; видит ответ преподавателя.

**Преподаватель:** отвечает на отзывы своих продуктов (`reply_ru`); новая страница `/teacher/reviews` — все отзывы с фильтром по продукту/оценке; уведомление при новом отзыве.

**Администратор:** новая страница `/admin/reviews` — все отзывы платформы, фильтр по продукту/оценке/видимости; действия: удалить, скрыть (`is_visible = false`); уведомление при оценке 1–2.

**Публично:** список отзывов на странице продукта с ответом преподавателя; Schema.org `AggregateRating` → звёзды в Google/Яндексе.

---

## 6. Чат продуктов (гибридный)

### Новая таблица
```prisma
model ProductMessage {
  id         String   @id @default(cuid())
  product_id String
  user_id    String
  body_ru    String
  is_pinned  Boolean  @default(false)
  is_deleted Boolean  @default(false)
  deleted_by String?
  created_at DateTime @default(now())

  product    Product  @relation(...)
  user       Profile  @relation(...)

  @@index([product_id, created_at])
  @@map("product_messages")
}
```

### Доступ
Только пользователи с доступом через `checkAccess()` + преподаватель продукта + admin.

### Механика
- Вкладка «Обсуждение» на странице курса
- Polling: `GET /api/products/[id]/messages?after=[timestamp]` каждые 8 секунд
- При ответе преподавателя → уведомление участникам через `notifications`
- Подгрузка постранично: последние 50, кнопка «Загрузить ещё»

### По ролям
- **Студент:** пишет, читает
- **Преподаватель:** пишет, закрепляет (`is_pinned`), удаляет чужие сообщения в своих продуктах
- **Администратор:** удаляет любое сообщение; страница `/admin/chats` — список чатов с числом сообщений за день

---

## 7. Чат трансляций (real-time SSE)

### Новая таблица
```prisma
model LivestreamMessage {
  id           String    @id @default(cuid())
  livestream_id String
  user_id      String
  body_ru      String
  is_deleted   Boolean   @default(false)
  deleted_by   String?
  created_at   DateTime  @default(now())

  livestream   Livestream @relation(...)
  user         Profile    @relation(...)

  @@index([livestream_id, created_at])
  @@map("livestream_messages")
}
```

### Механика
- Клиент подписывается на `GET /api/livestreams/[id]/chat/stream` (SSE)
- Сообщения: `POST /api/livestreams/[id]/chat`
- Удаление рассылается через SSE-событие `message_deleted`
- После завершения трансляции: чат архивируется (чтение без записи)
- SSE-совместимо с Beget Shared + PM2 (нет persistent WebSocket)

---

## Навигация в сайдбаре `/admin`

Добавляются пункты:

```
Обзор
Преподаватели
Продукты
Заказы
─────────────
Аналитика      ← новый
Отзывы         ← новый
Чаты           ← новый
─────────────
Настройки      ← новый (→ /admin/settings)
```

---

## Новые страницы и API — итог

| Страница / Route | Что |
|---|---|
| `/admin/settings` | 4 вкладки: Бренд, Шрифты, Контент, GEO/SEO |
| `/admin/analytics` | Дашборд аналитики |
| `/admin/reviews` | Модерация отзывов |
| `/admin/chats` | Обзор чатов продуктов |
| `/admin/teachers/[id]` | Карточка преподавателя |
| `/teacher/reviews` | Отзывы преподавателя |
| `/api/admin/settings` | GET + PUT настроек сайта |
| `/api/products/[id]/messages` | GET (polling) + POST (чат продукта) |
| `/api/livestreams/[id]/chat` | POST сообщения |
| `/api/livestreams/[id]/chat/stream` | GET SSE-поток |
| `/llms.txt` | Статический route handler |
| `/sitemap.xml` | Динамический route handler |
| `/robots.txt` | Динамический route handler |

## Изменения в схеме — итог

| Модель | Изменение |
|---|---|
| `SiteSettings` | Новая таблица |
| `ProductMessage` | Новая таблица |
| `LivestreamMessage` | Новая таблица |
| `Product` | +`views_count`, +`duration_minutes`, +`ai_description_ru` |
| `Profile` | +`city` |
| `Review` | +`reply_ru`, +`replied_at`, +`is_visible` |
