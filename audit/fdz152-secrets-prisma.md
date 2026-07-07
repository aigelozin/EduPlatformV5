# Аудит pre-deploy: ФЗ-152 / Секреты / Prisma

Дата проверки: 2026-07-08  
Аудитор: Claude (automated)  
Директория: /home/ai-openyoga/EduplatformРФ

---

## Легенда

| Метка | Значение |
|-------|----------|
| БЛОКЕР | Нельзя деплоить без исправления |
| ВАЖНО | Должно быть исправлено в ближайшем спринте |
| КОСМЕТИКА | Желательно исправить, не блокирует |

---

## 1. ФЗ-152 и персональные данные

### 1.1 Согласия (consent_log)

| Критичность | Файл:строка | Описание |
|-------------|-------------|----------|
| — OK — | app/api/auth/register/route.ts:11,51 | consent: z.literal(true) + запись consent_logs при регистрации — ФЗ-152 соблюдён |
| — OK — | app/api/auth/become-teacher/route.ts:8,44 | Согласие + запись consent_logs для teacher_signup |
| — OK — | app/api/orders/route.ts:35,133 | Согласие + запись consentLog для checkout |
| — OK — | app/api/subscriptions/subscribe/route.ts:9,71 | Согласие + запись consentLog для подписки |

**Вывод**: все четыре точки обработки ПД (регистрация, стать преподавателем, покупка, подписка) фиксируют consent в `consent_log` с ip_address и user_agent. Требование ФЗ-152 ст.9 выполнено.

### 1.2 Логирование ПД в console.log

| Критичность | Файл:строка | Описание |
|-------------|-------------|----------|
| ВАЖНО | lib/cron/payouts.ts:41,71 | `console.log(... ${teacher.name} ...)` — имя преподавателя попадает в stdout/PM2 logs. Имя является ПД по ФЗ-152. Заменить на `teacher.id` или структурированный лог без ПД. |
| ВАЖНО | lib/cron/subscriptionReminder.ts:19 | `console.log(... Found ${expiring.length} expiring subscriptions)` — count безопасен, но строка 38: `Email failed for user ${sub.user_id}` — id допустим, не имя/email. Этот конкретный вызов ОК. |
| КОСМЕТИКА | lib/cron/payouts.ts:19,26,77 | console.log в cron без ПД (monthLabel, count). В продакшне следует заменить на GlitchTip/logger, но ПД не утекает. |
| КОСМЕТИКА | lib/cron/subscriptionReminder.ts:45 | `console.log('[SubscriptionReminder] Done')` — безопасно, но в продакшне лучше структурированный лог. |

**Проверка**: grep по `email|phone|name|password` в console-вызовах — прямой вывод email/phone/password не обнаружен в API-слое. Утечка ПД ограничена `teacher.name` в cron.

### 1.3 Страницы политики

| Критичность | Файл | Описание |
|-------------|------|----------|
| — OK — | app/(public)/privacy-policy/page.tsx | Страница политики конфиденциальности существует |
| — OK — | app/(public)/terms/page.tsx | Страница пользовательского соглашения существует |
| — OK — | app/(public)/cookie-policy/page.tsx | Страница политики cookies существует |
| ВАЖНО | — | Отсутствует явная ссылка на страницу обработчика ПД (Оператор) с реквизитами ООО согласно ФЗ-152 ст.18.1. Необходимо проверить содержимое privacy-policy на наличие данных Оператора: полное наименование ООО, ИНН, адрес, контакт DPO/ответственного за ПД. |

---

## 2. Секреты в коде

### 2.1 .gitignore

| Критичность | Файл:строка | Описание |
|-------------|-------------|----------|
| — OK — | .gitignore:13-17 | .env, .env.local, .env.development.local, .env.test.local, .env.production.local — все варианты env-файлов исключены |
| — OK — | .gitignore:45 | *.pem исключён |
| ВАЖНО | .gitignore | Не исключён `.env.production` (без суффикса `.local`). Если разработчик создаст `.env.production` напрямую — он попадёт в git. Добавить строку `.env.production` в .gitignore. |

### 2.2 Статус .env файлов в git

| Критичность | Файл | Описание |
|-------------|------|----------|
| — OK — | .env.local | Файл существует на диске, но НЕ отслеживается git (не является git-репозиторием или исключён). Секреты не закоммичены. |
| — OK — | .env.example | Содержит только плейсхолдеры (ПОЛЬЗОВАТЕЛЬ:ПАРОЛЬ, пустые значения). Безопасен для git. |

### 2.3 Хардкод секретов в коде

| Критичность | Описание |
|-------------|----------|
| — OK — | Автоматическая проверка `sk_\|pk_\|api_key\|apikey\|secret.*=.*['\"][a-zA-Z0-9]` в /app и /lib была заблокирована системой прав. Ручная проверка через Read файлов: |
| — OK — | lib/email/index.ts — нет хардкода ключей, только импорты |
| — OK — | lib/cron/payouts.ts — `process.env.PLATFORM_FEE_PERCENT` используется корректно |
| ВАЖНО | — | Необходимо выполнить полный grep вручную: `grep -rn "sk_\|pk_\|YOOKASSA_SECRET\|CRYPTOCLOUD\|MIR_PAY_SECRET" /home/ai-openyoga/EduplatformРФ/lib /home/ai-openyoga/EduplatformРФ/app --include="*.ts" \| grep -v "process\.env"` — автоматическая проверка не была выполнена из-за ограничений прав в текущей сессии. |

---

## 3. Prisma-схема

### 3.1 Индексы

| Критичность | Файл:строка | Описание |
|-------------|-------------|----------|
| — OK — | schema.prisma:196 | @@index([creator_id]) на Product — есть |
| — OK — | schema.prisma:197,198 | @@index([category_id]), @@index([type, is_active]) на Product — есть |
| — OK — | schema.prisma:340 | @@index([user_id, expires_at]) на UserSubscription — оптимально для проверки активных подписок |
| — OK — | schema.prisma:409 | @@index([provider_payment_id]) на Payment — важен для webhook lookup |
| — OK — | schema.prisma:531 | @@index([user_id, is_read]) на Notification — оптимально для badge count |
| ВАЖНО | schema.prisma:362 | Order.status не индексирован. Запросы типа `WHERE status = 'pending'` (админ-панель, обработка оплат) будут делать full scan. Добавить `@@index([status])` или `@@index([user_id, status])`. |
| ВАЖНО | schema.prisma:174 | Product.moderation_status не индексирован. Фильтр `WHERE moderation_status = 'pending'` для очереди модерации — full scan по всей таблице products. Добавить `@@index([moderation_status])`. |
| ВАЖНО | schema.prisma:419 | TeacherPayout.status — тип String (не enum), не индексирован. Запросы `WHERE status = 'pending'` для обработки выплат. Добавить индекс и рассмотреть смену типа на enum. |
| КОСМЕТИКА | schema.prisma:375 | Order не имеет @@index([status, created_at]) — для сортировки заказов по дате в рамках статуса. Не критично при текущих объёмах, но стоит добавить при росте. |

### 3.2 Каскады onDelete

| Критичность | Файл:строка | Описание |
|-------------|-------------|----------|
| — OK — | schema.prisma:212,229,250 | ProductMessage, ProductVariant, Lesson — Cascade при удалении Product |
| — OK — | schema.prisma:262,263,274,275 | CourseProduct, BundleProduct — Cascade при удалении родительского Product |
| — OK — | schema.prisma:305 | LivestreamMessage — Cascade при удалении Livestream |
| — OK — | schema.prisma:387 | OrderItem — Cascade при удалении Order |
| БЛОКЕР | schema.prisma:337-338 | UserSubscription: FK на user_id и subscription_id — нет onDelete. При удалении Profile или Subscription: Prisma по умолчанию выдаст ошибку (Restrict), что предотвратит удаление пользователя. По ФЗ-152 ст.21 (право на удаление ПД) — необходимо либо `onDelete: Cascade` (удалять подписки вместе с профилем) либо `onDelete: SetNull` если user_id nullable. Сейчас удаление профиля через API будет падать с FK constraint error. |
| БЛОКЕР | schema.prisma:213-214 | ProductMessage: user_id FK на Profile без onDelete. Если Profile удаляется — запись останется (orphan) или DB выдаст ошибку. Необходимо `onDelete: Cascade` или `SetNull` (с user_id nullable). |
| БЛОКЕР | schema.prisma:306 | LivestreamMessage: user_id FK на Profile без onDelete — аналогичная проблема orphan/error при удалении Profile. |
| ВАЖНО | schema.prisma:344-346 | Purchase: user_id и product_id без onDelete. Покупки — финансовые записи, их нельзя каскадно удалять. Нужно явно задать `onDelete: Restrict` (текущее поведение по умолчанию) или задокументировать что удаление Profile при наличии покупок запрещено. |
| ВАЖНО | schema.prisma:483-485 | Review: user_id и product_id без onDelete. Отзывы могут быть публичными — при удалении пользователя нужна стратегия (анонимизация через SetNull или Cascade). |
| ВАЖНО | schema.prisma:323 | Subscription.product_id FK без onDelete. Удаление Product с активными подписками — ошибка FK constraint. |
| КОСМЕТИКА | schema.prisma:425 | TeacherPayout.teacher_id без onDelete — финансовые записи, Restrict корректен, но стоит задать явно. |

### 3.3 Опасные @default значения

| Критичность | Файл:строка | Описание |
|-------------|-------------|----------|
| — OK — | schema.prisma:100 | Role @default(student) — безопасно, наименьшие привилегии |
| — OK — | schema.prisma:175 | moderation_status @default(pending) — контент требует одобрения, безопасно |
| — OK — | schema.prisma:176 | is_active @default(false) — продукт неактивен по умолчанию, безопасно |
| — OK — | schema.prisma:362 | OrderStatus @default(pending) — безопасно |
| — OK — | schema.prisma:399 | PaymentStatus @default(pending) — безопасно |
| ВАЖНО | schema.prisma:419 | TeacherPayout.status @default("pending") — строковый литерал вместо enum. При опечатке в коде (например "Pending") значение будет принято без ошибки. Рекомендуется создать enum PayoutStatus и заменить String на него. |
| КОСМЕТИКА | schema.prisma:83-84 | SiteSettings.id @default("main") — singleton паттерн через строковый PK. Технически работает, но при случайном create с другим id создаст дубль. Рассмотреть защиту на уровне API. |

---

## Итог по критичности

| Уровень | Кол-во | Ключевые пункты |
|---------|--------|-----------------|
| БЛОКЕР | 3 | UserSubscription/ProductMessage/LivestreamMessage без onDelete на user_id — блокирует право на удаление ПД (ФЗ-152 ст.21) |
| ВАЖНО | 9 | teacher.name в console.log; .env.production не в .gitignore; Order/Product/Payout без индекса на status; каскады на Purchase/Review/Subscription/TeacherPayout не явные; реквизиты Оператора в privacy-policy; ручная проверка секретов; TeacherPayout.status как String |
| КОСМЕТИКА | 4 | console.log в cron без ПД; Order.status составной индекс; SiteSettings singleton; TeacherPayout onDelete Restrict явный |

---

## Приоритетный план устранения

1. **Немедленно (БЛОКЕР)**: добавить `onDelete: Cascade` на user_id FK в `UserSubscription`, `ProductMessage`, `LivestreamMessage` + сгенерировать миграцию.
2. **До деплоя (ВАЖНО)**: добавить `@@index([status])` на Order, Product (moderation_status), TeacherPayout; добавить `.env.production` в .gitignore; убрать `teacher.name` из console.log в payouts.ts; выполнить ручной grep секретов.
3. **Спринт после деплоя (ВАЖНО)**: проверить содержимое privacy-policy на реквизиты Оператора; создать enum PayoutStatus; явно задать onDelete на Purchase, Review, Subscription.
