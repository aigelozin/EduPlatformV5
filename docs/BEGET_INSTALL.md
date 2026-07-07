# WisdomWave — Установка на Beget

**Для:** Beget Shared Hosting (SSH-доступ)
**Домен:** anandayoga.ru
**Логин SSH:** zinder_anandayoga
**Время установки:** ~10–15 минут

---

## Одна команда — полная установка

После подключения по SSH выполните:

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/aigelozin/EduPlatformV5/main/bootstrap.sh)
```

Скрипт сам клонирует репозиторий, задаст вопросы (домен, БД, ключи) и установит сайт.

**Обновление** (при каждом `git push` — автоматически через GitHub Actions, или вручную):
```bash
cd ~/anandayoga.ru && bash install.sh --update
```

---

## Содержание

1. [Что делают скрипты](#1-что-делают-скрипты)
2. [Шаг 1 — Подготовка в панели Beget](#2-шаг-1--подготовка-в-панели-beget)
3. [Шаг 2 — Подготовьте API-ключи заранее](#3-шаг-2--подготовьте-api-ключи-заранее)
4. [Шаг 3 — Подключение по SSH](#4-шаг-3--подключение-по-ssh)
5. [Шаг 4 — Запуск bootstrap.sh](#5-шаг-4--запуск-bootstrapsh)
6. [Шаг 5 — Настройка Nginx в панели Beget](#6-шаг-5--настройка-nginx-в-панели-beget)
7. [Что делать при ошибках](#7-что-делать-при-ошибках)
8. [Обновление сайта](#8-обновление-сайта)
9. [Структура папок на сервере](#9-структура-папок-на-сервере)

---

## 1. Что делают скрипты

Два скрипта: `bootstrap.sh` запускается один раз при первичной установке, `install.sh` — при каждом обновлении.

### bootstrap.sh — первичная установка

| Этап | Действие |
|------|----------|
| 0 | Клонирует репозиторий с GitHub в указанную директорию |
| → | Передаёт управление в `install.sh` |

### install.sh — установка и обновление

| Этап | Действие |
|------|----------|
| **Wizard** | Спрашивает: домен, БД, Redis, платежи, email, AI — создаёт `.env` |
| 1 | Проверяет `.env` — все ли обязательные переменные заполнены |
| 2 | Устанавливает Node.js 20 через nvm (если нет или старая версия) |
| 3 | Устанавливает PM2 без sudo (в `~/.npm-global`) |
| 4 | `git fetch --all && git reset --hard origin/main` (при `--update`) |
| 5 | `npm ci` — устанавливает зависимости (лимит RAM 512MB для Beget) |
| 6 | `npx prisma generate` — генерирует Prisma-клиент для MySQL |
| 7 | `npx prisma migrate deploy` — применяет все миграции |
| 8 | `npx prisma db seed` — начальные данные (пропускается при `--skip-seed`) |
| 9 | `npm run build` — собирает production Next.js (1–3 минуты) |
| 10 | PM2 start/reload — запуск/горячая перезагрузка (2 воркера) |
| 11 | `crontab @reboot` — автозапуск после перезагрузки сервера |
| 12 | Проверяет что сайт отвечает на `localhost:3000` |

### Флаги install.sh

| Команда | Когда использовать |
|---------|-------------------|
| `bash install.sh` | Первая установка (запустит wizard) |
| `bash install.sh --update` | Обновление: git pull + build + reload (seed пропускается) |
| `bash install.sh --reset` | Полный сброс PM2 (если процесс завис) |
| `bash install.sh --skip-seed` | Пропустить seed (данные уже есть) |
| `bash install.sh --no-wizard` | Пропустить wizard (`.env` уже готов) |

---

## 2. Шаг 1 — Подготовка в панели Beget

### 2.1 Создать базу данных MySQL

1. Войти на **cp.beget.com**
2. Перейти: **Сайты → MySQL**
3. Нажать **Добавить базу данных**
4. Заполнить:
   - Имя БД: `wisdomwave` → Beget добавит префикс: `zinder_wisdomwave`
   - Имя пользователя: `wisdomwave` → получится `zinder_wisdomwave`
   - Пароль: придумайте надёжный пароль, **запишите его**
5. Нажать **Добавить**

> Полное имя БД и пользователя будет с префиксом логина, например: `zinder_wisdomwave`

### 2.2 Узнать хост MySQL

На Beget Shared хост MySQL — всегда `localhost`.

### 2.3 Включить SSH-доступ

1. Панель Beget → **SSH-доступ**
2. Включить SSH (если не включён)
3. Установить SSH-пароль или добавить SSH-ключ

### 2.4 Создать почтовый ящик для отправки писем

1. Панель Beget → **Почта → Добавить ящик**
2. Адрес: `noreply@anandayoga.ru`
3. Задать пароль — **запишите его** (понадобится в wizard)

---

## 3. Шаг 2 — Подготовьте API-ключи заранее

`.env` создаётся автоматически во время работы wizard'а.
**Вам нужно только иметь под рукой** следующие данные — wizard спросит их по очереди.

Откройте эту инструкцию рядом с терминалом и заполните таблицу заранее:

### Обязательные (без них сайт не запустится)

| Параметр | Где взять | Ваше значение |
|----------|-----------|---------------|
| Домен | `anandayoga.ru` | |
| MySQL: имя БД | Панель Beget → MySQL | `zinder_wisdomwave` |
| MySQL: пользователь | Панель Beget → MySQL | `zinder_wisdomwave` |
| MySQL: пароль | Задали при создании БД | |

### Рекомендуемые (для полной работы)

| Параметр | Где взять | Ваше значение |
|----------|-----------|---------------|
| Redis URL | Yandex Cloud → Managed Redis → Подключение | |
| Redis пароль | Yandex Cloud → Managed Redis | |
| YOS Access Key | Yandex Cloud → Object Storage → Сервисный аккаунт → HMAC | |
| YOS Secret Key | Yandex Cloud → Object Storage (показывается один раз!) | |
| YooKassa Shop ID | yookassa.ru → Настройки магазина | |
| YooKassa Secret Key | yookassa.ru → Настройки магазина | |
| SMTP пароль | Панель Beget → Почта → ящик noreply@ | |

### Опциональные (можно добавить позже)

| Параметр | Где взять |
|----------|-----------|
| CryptoCloud API Key | cryptocloud.plus → API |
| CDEK Client ID/Secret | cdek.ru → Интеграции → API |
| Boxberry Token | boxberry.ru → OpenAPI |
| YandexGPT API Key | cloud.yandex.ru → API-ключи |
| Claude API Key | console.anthropic.com → API Keys |
| SendPulse API | sendpulse.com → API |

> Пропущенные сервисы получают безопасные заглушки — сайт запустится, но соответствующий функционал будет недоступен.

---

## 4. Шаг 3 — Подключение по SSH

### С Linux / macOS:
```bash
ssh zinder_anandayoga@anandayoga.ru
# Ввести пароль SSH из панели Beget
```

### С Windows (PuTTY):
1. Скачать PuTTY: putty.org
2. Host: `anandayoga.ru`, Port: `22`
3. Open → ввести логин и пароль

### Через панель Beget (Web SSH):
1. cp.beget.com → Сайты → SSH-доступ → **Web SSH**

---

## 5. Шаг 4 — Запуск bootstrap.sh

После подключения по SSH выполните одну команду:

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/aigelozin/EduPlatformV5/main/bootstrap.sh)
```

Скрипт спросит директорию установки (по умолчанию `~/anandayoga.ru`), клонирует репозиторий и запустит wizard.

> **Если curl недоступен** — вручную:
> ```bash
> git clone https://github.com/aigelozin/EduPlatformV5.git ~/anandayoga.ru
> bash ~/anandayoga.ru/install.sh
> ```

### Как выглядит wizard (полный пример диалога)

```
╔═══════════════════════════════════════════╗
║     WisdomWave — Установка на сервер      ║
║     2026-04-22 15:30:00                   ║
╚═══════════════════════════════════════════╝

══ Настройка конфигурации (.env) ══════════════

  Сейчас я задам вопросы для настройки сайта.
  Значения в [скобках] — текущие или рекомендуемые.
  Нажмите Enter чтобы оставить текущее значение.
  Необязательные поля можно пропустить (Enter).

── Основные настройки ──────────────────────────
  Домен сайта (без https://) [anandayoga.ru]: █
                                                ↑ нажмите Enter или введите другой домен
  ✓ Секретный ключ сгенерирован автоматически

── База данных MySQL (Beget) ────────────────────
  ↳ Данные из панели Beget → MySQL
  Хост MySQL [localhost]: █
  Порт MySQL [3306]: █
  Имя базы данных [zinder_wisdomwave]: █
  Пользователь БД [zinder_wisdomwave]: █
  Пароль БД: ████████  ← скрыт при вводе, Enter ничего не покажет
  ✓ DATABASE_URL настроен

── Redis (Яндекс Managed Redis или другой) ──────
  ↳ Yandex Cloud → Managed Service for Redis → Подключение
  ↳ Формат: rediss://:ПАРОЛЬ@ХОСТ.mdb.yandexcloud.net:6380/0
  ↳ Для пропуска нажмите Enter (rate-limiting будет отключён)
  REDIS_URL: █
  Пароль Redis: ████████
  ✓ Redis настроен

── Яндекс Object Storage (файлы и видео) ────────
  ↳ Yandex Cloud → Object Storage → Сервисный аккаунт → HMAC-ключ
  YOS Access Key ID: █
  YOS Secret Key: ████████
  Приватный бакет (для видео) [wisdomwave-private]: █
  Публичный бакет (для обложек) [wisdomwave-public]: █
  ✓ Яндекс Object Storage настроен

── Платежи ──────────────────────────────────────
  YooKassa (yookassa.ru → Настройки магазина)
  Shop ID: █
  Secret Key: ████████
  Webhook Secret (придумайте) [a3f8c2...]: █
  ✓ YooKassa настроена

  CryptoCloud (cryptocloud.plus → API)
  API Key: █           ← Enter пропустит, поставит заглушку
  ⚠  CryptoCloud пропущен

── Доставка (можно пропустить) ──────────────────
  CDEK (cdek.ru → Интеграция → API)
  Client ID: █
  ⚠  CDEK пропущен

  Boxberry (boxberry.ru → OpenAPI → Токен)
  Токен: █
  ⚠  Boxberry пропущен

── Email ─────────────────────────────────────────
  SendPulse (sendpulse.com → API → Создать)
  API User ID: █
  ⚠  SendPulse пропущен — письма через SMTP

  SMTP (Панель Beget → Почта → Создать ящик)
  Email отправителя [noreply@anandayoga.ru]: █
  Email поддержки [support@anandayoga.ru]: █
  Логин SMTP [noreply@anandayoga.ru]: █
  Пароль SMTP: ████████
  ✓ SMTP настроен

── AI (можно пропустить) ────────────────────────
  YandexGPT (cloud.yandex.ru → API-ключи)
  API Key: █
  ⚠  YandexGPT пропущен

  Claude API (console.anthropic.com → API Keys)
  API Key: █
  ⚠  Claude API пропущен

── Бизнес-логика ────────────────────────────────
  Комиссия платформы (%) [20]: █
  Напоминание о подписке (дней до окончания) [3]: █
  ✓ Бизнес-параметры сохранены

╔════════════════════════════════════════════╗
║   Конфигурация сохранена в .env            ║
╚════════════════════════════════════════════╝

  Для просмотра/редактирования: nano /home/.../anandayoga.ru/.env

  Продолжить установку? [Y/n]: █
```

После подтверждения — установка запускается автоматически:

```
══ 1. Проверка .env ═══════════════════════════
✓ Файл .env найден
✓ Обязательные переменные .env заполнены

══ 2. Node.js ══════════════════════════════════
▸ Устанавливаю nvm...       ← только при первом запуске
✓ Node.js v20.x.x
✓ npm 10.x.x

══ 3. PM2 ══════════════════════════════════════
✓ PM2 5.x.x

══ 4. Зависимости проекта ══════════════════════
▸ npm ci...
✓ Зависимости установлены

══ 5. Prisma — генерация клиента ═══════════════
✓ Prisma client сгенерирован

══ 6. База данных — миграции ═══════════════════
▸ Применяю миграции...
✓ Миграции применены

══ 7. Начальные данные (seed) ══════════════════
✓ Seed выполнен

══ 8. Сборка Next.js ═══════════════════════════
▸ npm run build (1–3 минуты)...
✓ Сборка завершена

══ 9. Запуск через PM2 ═════════════════════════
✓ PM2 процесс запущен

══ 10. Автозапуск через cron ═══════════════════
✓ Автозапуск PM2 добавлен в crontab (@reboot)

══ 11. Проверка ════════════════════════════════
✓ Сайт отвечает на http://localhost:3000/

╔════════════════════════════════════════════╗
║          Установка завершена!              ║
╚════════════════════════════════════════════╝

  Сайт:     https://anandayoga.ru
  Локально: http://localhost:3000

  Тестовые аккаунты (если запускался seed):
  admin    admin@eduplatform.ru   / admin123
  teacher  teacher@eduplatform.ru / teacher123
  student  student@eduplatform.ru / student123
  → Смените пароли после первого входа!

  Лог установки: logs/install.log
```

### Повторный запуск (wizard пропускается автоматически)

При повторном запуске скрипт определяет что `.env` уже заполнен и сразу переходит к установке. Если нужно изменить настройки — отредактируйте `.env` вручную:

```bash
nano /home/zinder_anandayoga/anandayoga.ru/.env
```

Или запустите wizard принудительно — удалите `.env` и запустите скрипт заново.

---

## 6. Шаг 5 — Настройка Nginx в панели Beget

На Beget Shared Nginx управляется через панель. Настройка занимает 2 минуты.

### 7.1 Указать папку для Node.js приложения

1. cp.beget.com → **Сайты**
2. Нажать на домен `anandayoga.ru` → **Настройки**
3. В поле **Тип сайта** выбрать **Node.js**
4. Порт приложения: `3000`
5. Сохранить

### 7.2 Включить HTTPS

1. Панель Beget → **SSL-сертификаты**
2. Нажать **Выпустить бесплатный Let's Encrypt** для `anandayoga.ru`
3. Подождать 1–2 минуты
4. Проверить: открыть `https://anandayoga.ru` в браузере

### 7.3 Альтернатива — .htaccess (если Node.js недоступен в панели)

Создайте `/home/zinder_anandayoga/anandayoga.ru/public_html/.htaccess`:

```apache
RewriteEngine On
RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]
```

---

## 7. Что делать при ошибках

### ❌ Wizard зависает или введён неверный пароль БД

```bash
# Отредактировать .env вручную и исправить DATABASE_URL
nano .env
# Запустить повторно — wizard пропустится, установка продолжится
bash install.sh --skip-seed
```

### ❌ "Can't connect to MySQL"

```bash
# Проверить подключение напрямую
mysql -u zinder_wisdomwave -p zinder_wisdomwave -e "SELECT 1;"

# Убедиться что имя БД содержит префикс
# Правильно:   mysql://zinder_wisdomwave:PASS@localhost:3306/zinder_wisdomwave
# Неправильно: mysql://wisdomwave:PASS@localhost:3306/wisdomwave
```

### ❌ "Redis connection refused"

На Beget Shared нет встроенного Redis. Нужно:
- Создать Яндекс Managed Redis (Yandex Cloud → Managed Service for Redis)
- Или пропустить Redis в wizard (нажать Enter) — rate-limiting отключится

### ❌ PM2 не найден после установки

```bash
export PATH="$HOME/.npm-global/bin:$PATH"
pm2 status
# Сделать постоянным
echo 'export PATH="$HOME/.npm-global/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

### ❌ Сборка падает — не хватает памяти

```bash
# Добавить в .env
echo "NODE_OPTIONS=--max-old-space-size=512" >> .env
npm run build
```

### ❌ Сайт не открывается после установки

```bash
pm2 status          # проверить что процесс online
pm2 logs --lines 30 # посмотреть ошибки
curl http://localhost:3000  # проверить локально
pm2 restart all     # перезапустить
```

---

## 8. Обновление сайта

### Автоматически — GitHub Actions (рекомендуется)

При каждом `git push origin main` GitHub Actions автоматически запускает `install.sh --update` на сервере.

Добавьте Secrets в репозиторий (Settings → Secrets and variables → Actions):

| Secret | Значение |
|--------|----------|
| `BEGET_SSH_HOST` | `anandayoga.ru` |
| `BEGET_SSH_USER` | `zinder_anandayoga` |
| `BEGET_SSH_PRIVATE_KEY` | Содержимое `~/.ssh/id_rsa` (приватный ключ) |
| `BEGET_DEPLOY_PATH` | `/home/zinder_anandayoga/anandayoga.ru` |

### Вручную

```bash
cd ~/anandayoga.ru
bash install.sh --update
```

---

## 9. Структура папок на сервере

После успешной установки:

```
/home/zinder_anandayoga/
└── anandayoga.ru/
    ├── .env                    ← создаётся wizard'ом
    ├── .env.example            ← шаблон из репозитория
    ├── install.sh              ← скрипт установки
    ├── ecosystem.config.js     ← конфигурация PM2
    │
    ├── node_modules/           ← создаёт npm ci
    ├── .next/                  ← создаёт npm run build
    ├── logs/
    │   ├── install.log         ← лог установки
    │   ├── pm2-out.log         ← stdout приложения
    │   └── pm2-error.log       ← stderr / ошибки
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

**В панели Beget (до запуска скрипта):**
- [ ] Создана БД MySQL → имя с префиксом: `zinder_wisdomwave`
- [ ] SSH-доступ включён, пароль задан
- [ ] Создан почтовый ящик `noreply@anandayoga.ru`

**Подготовить данные (для wizard'а):**
- [ ] Пароль от MySQL-БД
- [ ] Redis URL + пароль (Яндекс Managed Redis)
- [ ] YOS Access Key + Secret (Яндекс Object Storage)
- [ ] YooKassa Shop ID + Secret Key
- [ ] Пароль от SMTP ящика

**На сервере:**
- [ ] Подключился по SSH
- [ ] Файлы проекта скопированы (`git clone` или `rsync`)
- [ ] `bash install.sh` выполнен, wizard пройден
- [ ] Установка завершилась без ошибок (`✓ Сайт отвечает`)

**В панели Beget (после установки):**
- [ ] Тип сайта → Node.js, порт 3000
- [ ] SSL-сертификат Let's Encrypt выпущен
- [ ] Сайт открывается по `https://anandayoga.ru`

**Финальные шаги:**
- [ ] Вход с аккаунтом admin@eduplatform.ru / admin123
- [ ] Пароли тестовых аккаунтов изменены через `/change-password`
