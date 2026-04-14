# EduPlatform РФ — Руководство по настройке российских сервисов

Пошаговые инструкции по регистрации и настройке всех российских сервисов.

---

## 1. Яндекс Облако (Yandex Cloud)

Используется для: Object Storage, Managed Redis, YandexGPT API

### Регистрация

1. Перейти на cloud.yandex.ru
2. Зарегистрироваться через Яндекс аккаунт
3. Привязать банковскую карту (требуется для активации)
4. Создать платёжный аккаунт

### Создание сервисного аккаунта (для YOS)

```bash
# Через Yandex Cloud CLI (yc)
yc iam service-account create --name eduplatform-storage

# Назначить роль
yc resource-manager folder add-access-binding \
  --role storage.editor \
  --subject serviceAccount:<service-account-id>

# Создать HMAC-ключ
yc iam access-key create --service-account-name eduplatform-storage
# Сохранить key_id и secret — они показываются только один раз
```

### Создание бакетов Object Storage

1. Yandex Cloud Console → Object Storage → Создать бакет
2. Бакет 1: `eduplatform-private` (приватный, для видео и защищённых файлов)
3. Бакет 2: `eduplatform-public` (публичный, для аватаров и обложек)
4. Регион: `ru-central1` (Москва)

### Настройка CORS для публичного бакета

```xml
<CORSConfiguration>
  <CORSRule>
    <AllowedOrigin>https://yourdomain.ru</AllowedOrigin>
    <AllowedMethod>GET</AllowedMethod>
    <AllowedHeader>*</AllowedHeader>
  </CORSRule>
</CORSConfiguration>
```

### Создание Managed Redis

1. Yandex Cloud Console → Managed Databases → Redis → Создать кластер
2. Версия: Redis 7.x
3. Конфигурация хоста: минимальная (1 хост)
4. Пароль: задать надёжный пароль
5. Сохранить connection string: `redis://:password@host:6379/0`

### Получение YandexGPT API Key

1. Yandex Cloud Console → Каталог → IAM → Сервисные аккаунты
2. Создать сервисный аккаунт с ролью `ai.languageModels.user`
3. Создать API ключ: IAM → Сервисный аккаунт → Создать API ключ
4. Скопировать `folder_id` из Overview каталога

---

## 2. YooKassa

Используется для: приём платежей картами РФ, СБП, ЮMoney

### Регистрация

1. Перейти на yookassa.ru
2. Зарегистрироваться как ИП или ООО
3. Подписать договор (онлайн для ООО)
4. Дождаться верификации (~1–3 рабочих дня)

### Получение ключей

1. Личный кабинет YooKassa → Настройки → Ключи API
2. Скопировать `shopId` и `secretKey`
3. Webhook: Интеграция → HTTP-уведомления → Указать URL: `https://yourdomain.ru/api/webhooks/yookassa`
4. Скопировать `webhookSecret`

### Тестовые платежи

```bash
# Тестовые данные карты YooKassa:
# Номер: 5555 5555 5555 4444
# Срок: любой в будущем
# CVV: любые 3 цифры
# Для проверки 3DS: 1111 1111 1111 1026 (пароль: любые цифры)
```

---

## 3. МИР Pay / НСПК

Используется для: приём платежей картами МИР

### Регистрация

1. Перейти на mirpay.ru → Для бизнеса
2. Подать заявку как ООО/ИП
3. Заключить договор с НСПК
4. Получить `merchantId` и `secretKey`

### Альтернатива

YooKassa уже принимает МИР карты через свою систему.
Отдельная интеграция МИР Pay нужна только если требуется приём МИР Pay (бесконтактная оплата телефоном).

---

## 4. CryptoCloud

Используется для: приём крипто-платежей (USDT, BTC, ETH и др.)

### Регистрация

1. Перейти на cryptocloud.plus
2. Зарегистрироваться
3. Создать магазин
4. Скопировать `apiKey`, `shopId`, `secretKey`
5. Webhook URL: `https://yourdomain.ru/api/webhooks/cryptocloud`

---

## 5. CDEK API

Используется для: расчёт доставки и создание отправлений

### Регистрация

1. Перейти на cdek.ru → Для бизнеса → API
2. Зарегистрироваться как клиент CDEK
3. После одобрения получить OAuth2 credentials: `clientId` и `clientSecret`

### Тестовая среда

```bash
# Тестовый API: https://api.edu.cdek.ru/v2
# Тестовые credentials доступны в документации CDEK
CDEK_API_URL=https://api.edu.cdek.ru/v2
CDEK_CLIENT_ID=EMscd6r9JnFiQ3bLoyjJY6eM
CDEK_CLIENT_SECRET=PjLZkKBHEiLK3YsjtNrt3TGNG0ahs3kG
```

---

## 6. Boxberry

Используется для: доставка по РФ через пункты выдачи

### Регистрация

1. boxberry.ru → Партнёрам → Подключение
2. Заполнить анкету, дождаться одобрения
3. Получить API токен в личном кабинете

---

## 7. SendPulse

Используется для: транзакционные письма (подтверждение, заказы, подписки)

### Регистрация

1. sendpulse.com → Зарегистрироваться
2. Подтвердить email и домен
3. API: Настройки → API → Получить API ID и Secret Key
4. SPF/DKIM записи для вашего домена (обязательно для deliverability)

### SMTP настройка на Beget (backup)

```bash
# Создать почтовый ящик в панели Beget
# Настройки SMTP:
SMTP_HOST=mail.beget.com
SMTP_PORT=465
SMTP_USER=noreply@yourdomain.ru
SMTP_PASS=your-mailbox-password
```

---

## 8. Kinescope (опционально)

Используется для: профессиональный видеохостинг для образования

### Описание

Kinescope — российский видеохостинг специально для образовательных платформ.
Преимущества: защита от скачивания, аналитика просмотров, адаптивный bitrate, CDN в РФ.
Цена: от $30/мес.

### Регистрация

1. kinescope.io → Начать бесплатно
2. Создать проект
3. Получить API ключ: Settings → API Keys
4. Embed URL: `https://kinescope.io/embed/{videoId}`

---

## 9. GlitchTip (self-hosted)

Используется для: мониторинг ошибок (замена Sentry)

### Установка на VPS

```bash
# Требования: Docker, минимум 1GB RAM
# Beget VPS или RuVDS/Timeweb

git clone https://github.com/glitchtip/glitchtip-backend.git
cd glitchtip-backend
cp .env.example .env
# Заполнить SECRET_KEY, DATABASE_URL, REDIS_URL

docker-compose up -d
```

### Подключение к приложению

GlitchTip совместим с Sentry SDK:
```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs'
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_GLITCHTIP_DSN, // URL вашего GlitchTip
})
```

---

## 10. VK Video

Используется для: embed видео (основной источник)

### Загрузка видео

1. Зайти на vk.com
2. Видео → Добавить видео
3. Выбрать настройки приватности (для embed: "Доступно всем" или ограничено)
4. Скопировать embed код: `vk.com/video_ext.php?oid={oid}&id={id}&hash={hash}`

### API для управления

```bash
# VK API для управления видео через аккаунт преподавателя
# Документация: dev.vk.com/reference/video
# Нужен access_token с разрешением video
```

---

## 11. RuTube

Используется для: embed видео (основной источник)

### Загрузка видео

1. rutube.ru → Загрузить видео
2. Настроить доступ
3. Embed URL: `rutube.ru/play/embed/{videoId}`

### API

```bash
# RuTube API для загрузки видео программно
# Документация: rutube.ru/docs/api
```
