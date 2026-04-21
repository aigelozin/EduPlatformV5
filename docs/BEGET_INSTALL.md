# WisdomWave — Установка на Beget через install.sh

**Для:** Beget Shared Hosting (SSH-доступ)  
**Домен:** anandayoga.ru  
**Логин SSH:** zinder_anandayoga  
**Время установки:** ~10–15 минут

---

## Содержание

1. [Что делает скрипт](#1-что-делает-скрипт)
2. [Шаг 1 — Подготовка в панели Beget](#2-шаг-1--подготовка-в-панели-beget)
3. [Шаг 2 — Файлы для копирования на сервер](#3-шаг-2--файлы-для-копирования-на-сервер)
4. [Шаг 3 — Создание файла .env](#4-шаг-3--создание-файла-env)
5. [Шаг 4 — Подключение по SSH](#5-шаг-4--подключение-по-ssh)
6. [Шаг 5 — Запуск скрипта](#6-шаг-5--запуск-скрипта)
7. [Шаг 6 — Настройка Nginx в панели Beget](#7-шаг-6--настройка-nginx-в-панели-beget)
8. [Что делать при ошибках](#8-что-делать-при-ошибках)
9. [Обновление сайта](#9-обновление-сайта)
10. [Структура папок на сервере](#10-структура-папок-на-сервере)

---

## 1. Что делает скрипт

`install.sh` автоматически выполняет все шаги установки без ручного вмешательства:

| Шаг | Действие |
|-----|----------|
| 1 | Проверяет `.env` — все ли обязательные переменные заполнены |
| 2 | Устанавливает Node.js 20 через nvm (если нет или старая версия) |
| 3 | Устанавливает PM2 без sudo (в `~/.npm-global`) |
| 4 | Устанавливает npm-зависимости (`npm ci`) |
| 5 | Генерирует Prisma-клиент для MySQL |
| 6 | Применяет миграции БД (создаёт таблицы) |
| 7 | Запускает seed — начальные данные, тестовые аккаунты |
| 8 | Собирает production-версию Next.js |
| 9 | Запускает/перезапускает через PM2 (cluster, 2 воркера) |
| 10 | Настраивает автозапуск через `crontab @reboot` |
| 11 | Проверяет что сайт отвечает |

---

## 2. Шаг 1 — Подготовка в панели Beget

Перед запуском скрипта нужно настроить несколько вещей в панели Beget.

### 2.1 Создать базу данных MySQL

1. Войти на **cp.beget.com**
2. Перейти: **Сайты → MySQL**
3. Нажать **Добавить базу данных**
4. Заполнить:
   - Имя БД: `wisdomwave` (или любое, Beget добавит префикс: `zinder_wisdomwave`)
   - Имя пользователя: `wisdomwave` (получится `zinder_wisdomwave`)
   - Пароль: придумайте надёжный пароль, **запишите его**
5. Нажать **Добавить**

> Полное имя БД и пользователя будет с префиксом логина, например: `zinder_wisdomwave`

### 2.2 Узнать хост MySQL

На Beget Shared хост MySQL — всегда `localhost`. Если сайт на другом сервере, найдите хост в разделе **MySQL → Подключение**.

### 2.3 Включить SSH-доступ

1. Панель Beget → **SSH-доступ**
2. Включить SSH (если не включён)
3. Установить SSH-пароль или добавить SSH-ключ

### 2.4 Настроить Node.js (опционально)

На некоторых тарифах Beget Node.js уже доступен. Скрипт установит его через nvm автоматически, если нужно.

---

## 3. Шаг 2 — Файлы для копирования на сервер

### Откуда копировать

Файлы находятся в папке проекта на локальной машине:  
`/home/ai-openyoga/EduplatformРФ/`

Или скачать с GitHub:  
`https://github.com/aigelozin/EduPlatformV5`

### Что нужно скопировать

Скопируйте **весь проект** на сервер в папку `/home/zinder_anandayoga/anandayoga.ru/`.

**Метод 1 — через git (рекомендуется):**  
Выполнить уже на сервере после SSH-подключения:
```bash
git clone https://github.com/aigelozin/EduPlatformV5.git /home/zinder_anandayoga/anandayoga.ru
```

**Метод 2 — через SCP с локальной машины:**
```bash
# Скопировать проект целиком (без node_modules и .next)
rsync -avz --exclude='node_modules' --exclude='.next' --exclude='logs' \
  /home/ai-openyoga/EduplatformРФ/ \
  zinder_anandayoga@anandayoga.ru:/home/zinder_anandayoga/anandayoga.ru/
```

### Обязательные файлы и папки

После копирования на сервере должна быть следующая структура:

```
/home/zinder_anandayoga/anandayoga.ru/
│
├── install.sh                  ← главный скрипт установки
├── .env                        ← файл с переменными окружения (см. Шаг 3)
├── .env.example                ← шаблон (не содержит реальных данных)
│
├── package.json                ← список npm-зависимостей
├── package-lock.json           ← точные версии пакетов
├── ecosystem.config.js         ← настройки PM2
├── next.config.js              ← настройки Next.js
├── tsconfig.json               ← настройки TypeScript
├── tailwind.config.ts          ← настройки Tailwind CSS
├── middleware.ts               ← middleware авторизации
│
├── prisma/
│   ├── schema.prisma           ← схема базы данных (23 таблицы)
│   ├── seed.ts                 ← начальные данные
│   └── migrations/             ← файлы миграций БД
│       ├── 20260417000000_mysql_init/
│       │   └── migration.sql
│       └── 20260421000000_category_subcategories/
│           └── migration.sql
│
├── app/                        ← исходный код страниц (Next.js App Router)
├── components/                 ← React-компоненты
├── lib/                        ← библиотеки и утилиты
├── types/                      ← TypeScript типы
├── public/                     ← статические файлы (иконки, картинки)
├── messages/
│   └── ru.json                 ← переводы интерфейса
│
└── docs/                       ← документация
    ├── DEPLOY.md
    └── BEGET_INSTALL.md        ← этот файл
```

### Что НЕ нужно копировать

| Папка/файл | Причина |
|-----------|---------|
| `node_modules/` | Создаётся скриптом через `npm ci` |
| `.next/` | Создаётся скриптом через `npm run build` |
| `.env.local` | Это файл для локальной разработки |
| `logs/` | Создаётся скриптом автоматически |
| `docker-compose.yml` | Docker не используется на Beget Shared |

---

## 4. Шаг 3 — Создание файла .env

Файл `.env` **не копируется** с локальной машины (там заглушки для dev).  
Его нужно создать вручную на сервере с реальными данными.

### Шаблон .env для Beget

Создайте файл `/home/zinder_anandayoga/anandayoga.ru/.env` со следующим содержимым.  
Замените все значения в `< >` на реальные:

```bash
# ─── Основные ────────────────────────────────────────────────
NEXTAUTH_URL=https://anandayoga.ru
NEXTAUTH_SECRET=<вставьте результат: openssl rand -base64 32>
AUTH_SECRET=<та же строка что NEXTAUTH_SECRET>
AUTH_TRUST_HOST=true
NEXT_PUBLIC_APP_URL=https://anandayoga.ru

# ─── База данных MySQL (Beget) ────────────────────────────────
# Имя БД и пользователя имеют префикс вашего логина!
DATABASE_PROVIDER=mysql
DATABASE_URL=mysql://zinder_wisdomwave:<пароль_от_БД>@localhost:3306/zinder_wisdomwave
TEST_DATABASE_URL=mysql://zinder_wisdomwave:<пароль_от_БД>@localhost:3306/zinder_wisdomwave

# ─── Redis (Яндекс Managed Redis) ────────────────────────────
# Получить в Yandex Cloud → Managed Service for Redis
REDIS_URL=rediss://:ПАРОЛЬ@ХОСТ_REDIS.mdb.yandexcloud.net:6380/0
REDIS_PASSWORD=ПАРОЛЬ

# ─── Яндекс Object Storage ────────────────────────────────────
YOS_ACCESS_KEY_ID=<ваш key_id>
YOS_SECRET_ACCESS_KEY=<ваш secret>
YOS_BUCKET_NAME=wisdomwave-private
YOS_PUBLIC_BUCKET_NAME=wisdomwave-public
YOS_ENDPOINT=https://storage.yandexcloud.net
YOS_REGION=ru-central1
NEXT_PUBLIC_YOS_PUBLIC_URL=https://storage.yandexcloud.net/wisdomwave-public

# ─── YooKassa ─────────────────────────────────────────────────
YOOKASSA_SHOP_ID=<ваш shop_id>
YOOKASSA_SECRET_KEY=<ваш secret_key>
YOOKASSA_WEBHOOK_SECRET=<придумайте: openssl rand -hex 20>

# ─── CryptoCloud ──────────────────────────────────────────────
CRYPTOCLOUD_API_KEY=<ваш api_key>
CRYPTOCLOUD_SHOP_ID=<ваш shop_id>
CRYPTOCLOUD_SECRET_KEY=<ваш secret_key>
CRYPTOCLOUD_WEBHOOK_SECRET=<придумайте: openssl rand -hex 20>

# ─── МИР Pay ──────────────────────────────────────────────────
MIR_PAY_MERCHANT_ID=<ваш merchant_id>
MIR_PAY_SECRET_KEY=<ваш secret_key>
MIR_PAY_API_URL=https://mirpay.ru

# ─── CDEK ─────────────────────────────────────────────────────
CDEK_CLIENT_ID=<ваш client_id>
CDEK_CLIENT_SECRET=<ваш client_secret>
CDEK_API_URL=https://api.cdek.ru/v2

# ─── Boxberry ─────────────────────────────────────────────────
BOXBERRY_TOKEN=<ваш token>
BOXBERRY_API_URL=https://api.boxberry.ru/json.php

# ─── Email ────────────────────────────────────────────────────
SENDPULSE_API_USER_ID=<ваш user_id>
SENDPULSE_API_SECRET=<ваш secret>
EMAIL_FROM=WisdomWave <noreply@anandayoga.ru>
EMAIL_SUPPORT=support@anandayoga.ru
SMTP_HOST=smtp.beget.com
SMTP_PORT=465
SMTP_USER=noreply@anandayoga.ru
SMTP_PASS=<пароль от почтового ящика в Beget>

# ─── YandexGPT ────────────────────────────────────────────────
YANDEXGPT_API_KEY=<ваш api_key>
YANDEXGPT_FOLDER_ID=<ваш folder_id>
YANDEXGPT_MODEL=yandexgpt-lite
ANTHROPIC_API_KEY=<ваш api_key>
AI_CHAT_RATE_LIMIT_PER_HOUR=100

# ─── Мониторинг (опционально) ─────────────────────────────────
GLITCHTIP_DSN=
NEXT_PUBLIC_GLITCHTIP_DSN=
GLITCHTIP_ENVIRONMENT=production

# ─── Бизнес-логика ────────────────────────────────────────────
PLATFORM_FEE_PERCENT=20
SUBSCRIPTION_REMINDER_DAYS=3
CRON_SECRET=<придумайте: openssl rand -hex 20>
```

> **Важно:** убедитесь что в файле `.env` нет строки `DEV_BYPASS_AUTH=true` — она отключает авторизацию!

---

## 5. Шаг 4 — Подключение по SSH

### С Linux / macOS:
```bash
ssh zinder_anandayoga@anandayoga.ru
# Ввести пароль SSH из панели Beget
```

### С Windows (PuTTY):
1. Скачать PuTTY: putty.org
2. Host: `anandayoga.ru`
3. Port: `22`
4. Connection → SSH → Auth → добавить SSH-ключ (если настроен)
5. Нажать Open

### Через панель Beget (Web SSH):
1. cp.beget.com → Сайты → SSH-доступ
2. Нажать кнопку **Web SSH**

---

## 6. Шаг 5 — Запуск скрипта

После подключения по SSH:

```bash
# Перейти в папку сайта
cd /home/zinder_anandayoga/anandayoga.ru

# Если ещё не скопировали через git — клонировать
# git clone https://github.com/aigelozin/EduPlatformV5.git .

# Создать .env (скопировать шаблон из Шага 3 и заполнить)
# nano .env

# Сделать скрипт исполняемым
chmod +x install.sh

# Запустить установку
bash install.sh
```

### Варианты запуска

| Команда | Когда использовать |
|---------|-------------------|
| `bash install.sh` | Первая установка |
| `bash install.sh --skip-seed` | Если БД уже заполнена (повторная установка) |
| `bash install.sh --update` | Обновление — делает git pull перед установкой |
| `bash install.sh --update --skip-seed` | Плановое обновление без сброса данных |

### Что происходит во время установки

```
══════════════════════════════════════
  1. Проверка окружения
══════════════════════════════════════
✓ Файл .env найден
✓ Обязательные переменные .env заполнены

══════════════════════════════════════
  2. Node.js
══════════════════════════════════════
▸ Устанавливаю nvm...             ← только при первом запуске
✓ Node.js v20.x.x
✓ npm 10.x.x

══════════════════════════════════════
  3. PM2
══════════════════════════════════════
✓ PM2 5.x.x

══════════════════════════════════════
  4. Зависимости проекта
══════════════════════════════════════
▸ npm ci (установка пакетов)...
✓ Зависимости установлены

══════════════════════════════════════
  5. Prisma — генерация клиента
══════════════════════════════════════
✓ Prisma client сгенерирован

══════════════════════════════════════
  6. База данных — миграции
══════════════════════════════════════
▸ Применяю миграции...
✓ Миграции применены

══════════════════════════════════════
  7. Начальные данные (seed)
══════════════════════════════════════
✓ Seed выполнен

══════════════════════════════════════
  8. Сборка Next.js
══════════════════════════════════════
▸ npm run build (займёт 1–3 минуты)...
✓ Сборка завершена

══════════════════════════════════════
  9. Запуск через PM2
══════════════════════════════════════
✓ PM2 процесс запущен

══════════════════════════════════════
  10. Автозапуск через cron
══════════════════════════════════════
✓ Автозапуск PM2 добавлен в crontab (@reboot)

══════════════════════════════════════
  11. Проверка
══════════════════════════════════════
✓ Сайт отвечает на http://localhost:3000/

╔═══════════════════════════════════════════╗
║          Установка завершена!             ║
╚═══════════════════════════════════════════╝
```

Полный лог сохраняется в `logs/install.log`.

---

## 7. Шаг 6 — Настройка Nginx в панели Beget

На Beget Shared Nginx управляется через панель, а не через конфиг-файл. Настройка занимает 2 минуты.

### 7.1 Указать папку для Node.js приложения

1. cp.beget.com → **Сайты**
2. Нажать на домен `anandayoga.ru` → **Настройки**
3. В поле **Тип сайта** выбрать **Node.js**
4. Порт приложения: `3000`
5. Сохранить

### 7.2 Включить HTTPS

1. Панель Beget → **SSL-сертификаты**
2. Нажать **Выпустить бесплатный Let's Encrypt** для домена `anandayoga.ru`
3. Подождать 1–2 минуты
4. Проверить: открыть `https://anandayoga.ru` в браузере

### 7.3 Альтернатива — .htaccess для проксирования (если Node.js недоступен в панели)

Создайте файл `/home/zinder_anandayoga/anandayoga.ru/public_html/.htaccess`:

```apache
RewriteEngine On
RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]
```

---

## 8. Что делать при ошибках

### ❌ "Файл .env не найден"
```bash
# Создать .env из шаблона
cp .env.example .env
nano .env  # Заполнить все переменные
```

### ❌ "Не заполнены обязательные переменные"
```bash
# Открыть .env и заполнить указанные переменные
nano .env
```

### ❌ "Can't connect to MySQL"
Проверить:
1. Правильно ли написан DATABASE_URL в `.env`
2. Имя БД содержит префикс: `zinder_wisdomwave` (не просто `wisdomwave`)
3. Пароль не содержит спецсимволов без экранирования
```bash
# Тест подключения к MySQL
mysql -u zinder_wisdomwave -p zinder_wisdomwave -e "SELECT 1;"
```

### ❌ "Redis connection refused"
На Beget Shared нет встроенного Redis. Нужно:
- Создать Яндекс Managed Redis (Yandex Cloud → Managed Service for Redis)
- Или временно отключить rate-limiting, закомментировав Redis в `lib/rate-limit/`

### ❌ PM2 не найден после установки
```bash
export PATH="$HOME/.npm-global/bin:$PATH"
pm2 status
# Добавить в ~/.bashrc для постоянного эффекта
echo 'export PATH="$HOME/.npm-global/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

### ❌ Сборка падает с ошибкой памяти
На Beget Shared может не хватать RAM. Увеличить лимит Node.js:
```bash
# Добавить в .env
NODE_OPTIONS=--max-old-space-size=512
# Затем повторить сборку
npm run build
```

### ❌ Сайт не открывается после установки
```bash
# 1. Проверить статус PM2
pm2 status
pm2 logs --lines 30

# 2. Проверить что порт слушается
curl http://localhost:3000

# 3. Перезапустить
pm2 restart all
```

---

## 9. Обновление сайта

### Автоматически (через GitHub Actions при push в main)
GitHub Actions сам подключится по SSH и выполнит обновление.  
Нужно добавить Secrets в GitHub репозиторий (см. `docs/DEPLOY.md` раздел 11).

### Вручную
```bash
cd /home/zinder_anandayoga/anandayoga.ru

# Обновить код и перезапустить (БД не трогаем)
bash install.sh --update --skip-seed
```

---

## 10. Структура папок на сервере

После успешной установки:

```
/home/zinder_anandayoga/
└── anandayoga.ru/
    ├── .env                    ← переменные окружения (создаётся вручную)
    ├── .env.example            ← шаблон (из репозитория)
    ├── install.sh              ← скрипт установки
    ├── ecosystem.config.js     ← конфигурация PM2
    │
    ├── node_modules/           ← зависимости (создаёт npm ci)
    ├── .next/                  ← production сборка (создаёт npm run build)
    ├── logs/
    │   ├── install.log         ← лог последней установки
    │   ├── pm2-out.log         ← stdout приложения
    │   └── pm2-error.log       ← stderr приложения
    │
    ├── prisma/
    │   ├── schema.prisma
    │   └── migrations/
    │
    ├── app/
    ├── components/
    ├── lib/
    ├── public/
    └── ...

~/.nvm/                         ← Node.js (устанавливает скрипт)
~/.npm-global/bin/pm2           ← PM2 (устанавливает скрипт)
```

---

## Быстрый чеклист

- [ ] Создана БД MySQL в панели Beget (имя с префиксом: `zinder_wisdomwave`)
- [ ] Получены Redis credentials (Яндекс Managed Redis)
- [ ] Получены ключи YooKassa, YOS, CDEK (по необходимости)
- [ ] Файлы проекта скопированы на сервер в `/home/zinder_anandayoga/anandayoga.ru/`
- [ ] Создан файл `.env` с реальными данными
- [ ] Удалена строка `DEV_BYPASS_AUTH=true` из `.env` (если была)
- [ ] SSH-подключение работает
- [ ] `bash install.sh` выполнен без ошибок
- [ ] В панели Beget настроен Node.js на порт 3000
- [ ] Выпущен SSL-сертификат для домена
- [ ] Сайт открывается по `https://anandayoga.ru`
- [ ] Выполнен вход с тестовым аккаунтом admin@eduplatform.ru
- [ ] Пароли тестовых аккаунтов изменены!
