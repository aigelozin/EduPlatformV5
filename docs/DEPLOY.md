# WisdomWave — Инструкция по установке на сервер

**Версия:** 5.1 РФ | **Обновлено:** 2026-04-22  
**Стек:** Next.js 14 · MySQL 8 · Redis 7 · PM2 · Nginx · Let's Encrypt

---

## Содержание

1. [Требования к серверу](#1-требования-к-серверу)
2. [Подготовка сервера](#2-подготовка-сервера)
3. [Установка зависимостей](#3-установка-зависимостей)
4. [Развёртывание кода](#4-развёртывание-кода)
5. [Переменные окружения (.env)](#5-переменные-окружения-env)
6. [База данных (MySQL)](#6-база-данных-mysql)
7. [Сборка и запуск (PM2)](#7-сборка-и-запуск-pm2)
8. [Настройка Nginx](#8-настройка-nginx)
9. [SSL-сертификат (Let's Encrypt)](#9-ssl-сертификат-lets-encrypt)
10. [Автозапуск при перезагрузке](#10-автозапуск-при-перезагрузке)
11. [CI/CD через GitHub Actions](#11-cicd-через-github-actions)
12. [Проверка работоспособности](#12-проверка-работоспособности)
13. [Обновление сайта](#13-обновление-сайта)
14. [Мониторинг и логи](#14-мониторинг-и-логи)
15. [Локальная разработка](#15-локальная-разработка)
16. [Конфигурационные файлы](#16-конфигурационные-файлы)
17. [Часто задаваемые вопросы](#17-часто-задаваемые-вопросы)

---

## 1. Требования к серверу

### Минимальная конфигурация
| Параметр | Минимум | Рекомендуется |
|----------|---------|---------------|
| CPU | 1 vCPU | 2 vCPU |
| RAM | 1 GB | 2 GB |
| SSD | 20 GB | 40 GB |
| ОС | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |
| Доступ | SSH root или sudo | SSH sudo-пользователь |

### Открытые порты
| Порт | Назначение |
|------|-----------|
| 22 | SSH |
| 80 | HTTP (редирект на HTTPS) |
| 443 | HTTPS |

> Порт 3000 (Next.js) и 3306 (MySQL) **не должны** быть открыты наружу — только localhost.

### Внешние сервисы (нужны credentials)
- **MySQL** — на сервере или Beget MySQL
- **Яндекс Object Storage** — для файлов и видео
- **YooKassa** — платежи картой
- **CryptoCloud** — крипто-платежи
- **CDEK / Boxberry** — доставка
- **SendPulse** — email-рассылки
- **YandexGPT** — AI-ассистент
- **GlitchTip** (опционально) — мониторинг ошибок

---

## 2. Подготовка сервера

Подключитесь по SSH и создайте пользователя для приложения:

```bash
ssh root@ВАШ_IP

# Создать пользователя (если нет)
adduser deploy
usermod -aG sudo deploy

# Переключиться на пользователя
su - deploy
```

Обновите систему:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl wget unzip software-properties-common ufw
```

Настройте firewall:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## 3. Установка зависимостей

### Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version   # должно быть v20.x.x
npm --version
```

### PM2 (менеджер процессов)

```bash
sudo npm install -g pm2
pm2 --version
```

### MySQL 8

```bash
sudo apt install -y mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql

# Настройка безопасности (задайте пароль root)
sudo mysql_secure_installation
```

Создайте базу данных и пользователя:

```bash
sudo mysql -u root -p

# В консоли MySQL:
CREATE DATABASE wisdomwave CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'wisdomwave'@'localhost' IDENTIFIED BY 'СИЛЬНЫЙ_ПАРОЛЬ';
GRANT ALL PRIVILEGES ON wisdomwave.* TO 'wisdomwave'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Redis 7

```bash
sudo apt install -y redis-server

# Настроить пароль
sudo nano /etc/redis/redis.conf
# Найти строку # requirepass foobared
# Заменить на: requirepass ВАШ_REDIS_ПАРОЛЬ
# Найти: bind 127.0.0.1 ::1
# Убедиться что эта строка раскомментирована (только localhost)

sudo systemctl restart redis
sudo systemctl enable redis

# Проверить
redis-cli -a ВАШ_REDIS_ПАРОЛЬ ping  # должно ответить PONG
```

### Nginx

```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

## 4. Развёртывание кода

```bash
# Клонировать репозиторий
cd /var/www
sudo git clone https://github.com/aigelozin/EduPlatformV5.git wisdomwave
sudo chown -R deploy:deploy /var/www/wisdomwave
cd /var/www/wisdomwave

# Установить зависимости
npm ci

# Создать папку для логов PM2
mkdir -p logs
```

---

## 5. Переменные окружения (.env)

Создайте файл `.env` в папке проекта:

```bash
nano /var/www/wisdomwave/.env
```

Заполните все переменные (шаблон ниже):

```bash
# ─── Основные ───────────────────────────────────────────────────────────────
NEXTAUTH_URL=https://ВАШ_ДОМЕН.ru
NEXTAUTH_SECRET=СЛУЧАЙНАЯ_СТРОКА_МИНИМУМ_32_СИМВОЛА
AUTH_SECRET=ТА_ЖЕ_СТРОКА_ЧТО_И_NEXTAUTH_SECRET
AUTH_TRUST_HOST=true
NEXT_PUBLIC_APP_URL=https://ВАШ_ДОМЕН.ru

# ─── База данных (MySQL) ─────────────────────────────────────────────────────
DATABASE_PROVIDER=mysql
DATABASE_URL=mysql://wisdomwave:ПАРОЛЬ_БД@localhost:3306/wisdomwave
TEST_DATABASE_URL=mysql://wisdomwave:ПАРОЛЬ_БД@localhost:3306/wisdomwave_test

# ─── Redis ───────────────────────────────────────────────────────────────────
REDIS_URL=redis://:ВАШ_REDIS_ПАРОЛЬ@localhost:6379/0
REDIS_PASSWORD=ВАШ_REDIS_ПАРОЛЬ

# ─── Яндекс Object Storage (S3-совместимый) ──────────────────────────────────
YOS_ACCESS_KEY_ID=ваш_access_key
YOS_SECRET_ACCESS_KEY=ваш_secret_key
YOS_BUCKET_NAME=wisdomwave-private
YOS_PUBLIC_BUCKET_NAME=wisdomwave-public
YOS_ENDPOINT=https://storage.yandexcloud.net
YOS_REGION=ru-central1
NEXT_PUBLIC_YOS_PUBLIC_URL=https://storage.yandexcloud.net/wisdomwave-public

# ─── Платежи ────────────────────────────────────────────────────────────────
# YooKassa (https://yookassa.ru)
YOOKASSA_SHOP_ID=ваш_shop_id
YOOKASSA_SECRET_KEY=ваш_secret_key
YOOKASSA_WEBHOOK_SECRET=придумайте_секрет_для_webhook

# CryptoCloud (https://cryptocloud.plus)
CRYPTOCLOUD_API_KEY=ваш_api_key
CRYPTOCLOUD_SHOP_ID=ваш_shop_id
CRYPTOCLOUD_SECRET_KEY=ваш_secret_key
CRYPTOCLOUD_WEBHOOK_SECRET=придумайте_секрет_для_webhook

# МИР Pay
MIR_PAY_MERCHANT_ID=ваш_merchant_id
MIR_PAY_SECRET_KEY=ваш_secret_key
MIR_PAY_API_URL=https://mirpay.ru

# ─── Доставка ────────────────────────────────────────────────────────────────
# CDEK (https://www.cdek.ru/ru/integration/api)
CDEK_CLIENT_ID=ваш_client_id
CDEK_CLIENT_SECRET=ваш_client_secret
CDEK_API_URL=https://api.cdek.ru/v2

# Boxberry (https://boxberry.ru/business/it/openapi)
BOXBERRY_TOKEN=ваш_token
BOXBERRY_API_URL=https://api.boxberry.ru/json.php

# ─── Email ───────────────────────────────────────────────────────────────────
# SendPulse (https://sendpulse.com)
SENDPULSE_API_USER_ID=ваш_user_id
SENDPULSE_API_SECRET=ваш_secret

# Beget SMTP (резервный)
EMAIL_FROM=WisdomWave <noreply@ВАШ_ДОМЕН.ru>
EMAIL_SUPPORT=support@ВАШ_ДОМЕН.ru
SMTP_HOST=smtp.beget.com
SMTP_PORT=465
SMTP_USER=noreply@ВАШ_ДОМЕН.ru
SMTP_PASS=пароль_от_почты

# ─── AI ──────────────────────────────────────────────────────────────────────
# YandexGPT (https://cloud.yandex.ru/services/yandexgpt)
YANDEXGPT_API_KEY=ваш_api_key
YANDEXGPT_FOLDER_ID=ваш_folder_id
YANDEXGPT_MODEL=yandexgpt-lite
ANTHROPIC_API_KEY=ваш_api_key
AI_CHAT_RATE_LIMIT_PER_HOUR=100

# ─── Мониторинг (GlitchTip — опционально) ───────────────────────────────────
GLITCHTIP_DSN=https://ключ@app.glitchtip.com/номер
NEXT_PUBLIC_GLITCHTIP_DSN=https://ключ@app.glitchtip.com/номер
GLITCHTIP_ENVIRONMENT=production

# ─── Бизнес-логика ───────────────────────────────────────────────────────────
PLATFORM_FEE_PERCENT=20
SUBSCRIPTION_REMINDER_DAYS=3
CRON_SECRET=случайная_строка_для_защиты_cron
```

> **Безопасность:** файл `.env` никогда не должен попасть в git. Убедитесь что `.env` есть в `.gitignore`.

Сгенерировать случайные секреты:

```bash
# Для NEXTAUTH_SECRET / AUTH_SECRET
openssl rand -base64 32

# Для CRON_SECRET
openssl rand -hex 20
```

---

## 6. База данных (MySQL)

```bash
cd /var/www/wisdomwave

# Сгенерировать Prisma-клиент
npx prisma generate

# Применить миграции (создать таблицы)
npx prisma migrate deploy

# Заполнить начальными данными
npx prisma db seed
```

После seed будут созданы тестовые пользователи:

| Роль | Email | Пароль |
|------|-------|--------|
| admin | admin@eduplatform.ru | admin123 |
| teacher | teacher@eduplatform.ru | teacher123 |
| student | student@eduplatform.ru | student123 |

> **Важно:** смените пароли тестовых пользователей после первого входа через `/change-password`.

---

## 7. Сборка и запуск (PM2)

```bash
cd /var/www/wisdomwave

# Собрать production-версию
npm run build

# Создать папку для логов
mkdir -p logs

# Запустить через PM2
pm2 start ecosystem.config.js

# Проверить статус
pm2 status

# Сохранить список процессов для автозапуска
pm2 save
```

Проверить что приложение работает:

```bash
curl http://localhost:3000
# Должен вернуть HTML главной страницы
```

---

## 8. Настройка Nginx

Создайте конфиг для вашего домена:

```bash
sudo nano /etc/nginx/sites-available/wisdomwave
```

Содержимое файла (замените `ВАШ_ДОМЕН.ru` на реальный домен):

```nginx
server {
    listen 80;
    server_name ВАШ_ДОМЕН.ru www.ВАШ_ДОМЕН.ru;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ВАШ_ДОМЕН.ru www.ВАШ_ДОМЕН.ru;

    ssl_certificate     /etc/letsencrypt/live/ВАШ_ДОМЕН.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ВАШ_ДОМЕН.ru/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    # Заголовки безопасности
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;
    gzip_min_length 1000;

    # Статические файлы Next.js (кэш 1 год)
    location /_next/static/ {
        alias /var/www/wisdomwave/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /public/ {
        alias /var/www/wisdomwave/public/;
        expires 7d;
    }

    # Webhook-и — без буферизации
    location /api/webhooks/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_request_buffering off;
    }

    # Проксирование на Next.js
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
    }

    client_max_body_size 100m;
}
```

Активируйте конфиг:

```bash
sudo ln -s /etc/nginx/sites-available/wisdomwave /etc/nginx/sites-enabled/
sudo nginx -t          # Проверить синтаксис
sudo systemctl reload nginx
```

---

## 9. SSL-сертификат (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx

# Получить сертификат (домен должен уже указывать на сервер)
sudo certbot --nginx -d ВАШ_ДОМЕН.ru -d www.ВАШ_ДОМЕН.ru

# Автообновление (раз в 2 месяца через cron)
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Проверить
sudo certbot renew --dry-run
```

---

## 10. Автозапуск при перезагрузке

```bash
# Настроить автозапуск PM2 через systemd
pm2 startup

# Скопировать и выполнить команду которую выдаст PM2, например:
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u deploy --hp /home/deploy

# Сохранить текущий список процессов
pm2 save
```

После этого при каждой перезагрузке сервера автоматически запустятся:
- MySQL (systemd)
- Redis (systemd)
- Nginx (systemd)
- Next.js через PM2 (systemd `pm2-deploy.service`)

---

## 11. CI/CD через GitHub Actions

### Настройка Secrets в репозитории

Перейдите в GitHub → Settings → Secrets and variables → Actions → New repository secret:

| Secret | Значение |
|--------|----------|
| `BEGET_SSH_HOST` | IP или домен сервера |
| `BEGET_SSH_USER` | deploy |
| `BEGET_SSH_PRIVATE_KEY` | Приватный SSH-ключ |
| `BEGET_DEPLOY_PATH` | /var/www/wisdomwave |

### Генерация SSH-ключа для деплоя

```bash
# На локальной машине
ssh-keygen -t ed25519 -C "deploy@wisdomwave" -f ~/.ssh/wisdomwave_deploy

# Публичный ключ добавить на сервер
ssh-copy-id -i ~/.ssh/wisdomwave_deploy.pub deploy@ВАШ_IP

# Приватный ключ добавить в GitHub Secret BEGET_SSH_PRIVATE_KEY
cat ~/.ssh/wisdomwave_deploy
```

### Как работает автодеплой

При каждом `git push` в ветку `main`:
1. GitHub Actions подключается к серверу по SSH
2. Делает `git pull`
3. Устанавливает зависимости (`npm ci`)
4. Генерирует Prisma-клиент
5. Применяет новые миграции
6. Собирает проект (`npm run build`)
7. Перезапускает PM2 (`pm2 reload`)

Файл `.github/workflows/deploy.yml` уже есть в репозитории.

---

## 12. Проверка работоспособности

```bash
# Статус PM2
pm2 status
pm2 logs --lines 50

# Статус MySQL
sudo systemctl status mysql
mysql -u wisdomwave -p wisdomwave -e "SHOW TABLES;"

# Статус Redis
redis-cli -a ВАШ_REDIS_ПАРОЛЬ ping

# Статус Nginx
sudo systemctl status nginx
sudo nginx -t

# Проверка сайта
curl -I https://ВАШ_ДОМЕН.ru
curl https://ВАШ_ДОМЕН.ru/api/auth/csrf

# Проверка всех страниц (скрипт)
for url in "/" "/catalog" "/teachers" "/login" "/admin"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" -L "https://ВАШ_ДОМЕН.ru$url")
  echo "$code $url"
done
```

---

## 13. Обновление сайта

### Ручное обновление

```bash
cd /var/www/wisdomwave

git pull origin main
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 reload ecosystem.config.js --update-env
pm2 save
```

### Откат к предыдущей версии

```bash
git log --oneline -10      # Найти нужный коммит
git checkout ХЭШ_КОММИТА
npm ci && npm run build
pm2 reload ecosystem.config.js
```

---

## 14. Мониторинг и логи

```bash
# Логи приложения в реальном времени
pm2 logs

# Только ошибки
pm2 logs --err

# Логи за последние 100 строк
pm2 logs --lines 100

# Файлы логов
tail -f /var/www/wisdomwave/logs/pm2-error.log
tail -f /var/www/wisdomwave/logs/pm2-out.log

# Логи Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Мониторинг PM2 в реальном времени
pm2 monit

# Дисковое пространство
df -h

# Использование памяти
free -h
pm2 status   # Колонка mem — потребление каждого воркера
```

---

## 15. Локальная разработка

### Требования
- Docker + Docker Compose
- Node.js 20+
- 3 GB свободного места

### Запуск

```bash
# 1. Клонировать
git clone https://github.com/aigelozin/EduPlatformV5.git
cd EduPlatformV5

# 2. Установить зависимости
npm install

# 3. Запустить MySQL + Redis через Docker
docker compose up -d mysql redis

# 4. Создать .env.local (скопировать шаблон)
cp .env.example .env.local
# Отредактировать .env.local — заполнить DATABASE_URL, REDIS_URL и т.д.

# 5. Сгенерировать Prisma-клиент и применить миграции
npx prisma generate
DATABASE_URL="mysql://root:root_dev_password@localhost:3306/eduplatform" npx prisma migrate deploy
DATABASE_URL="mysql://root:root_dev_password@localhost:3306/eduplatform" npx prisma db seed

# 6. Запустить dev-сервер
npm run dev
```

Сайт доступен на http://localhost:3000

### Dev-режим без БД

Добавьте в `.env.local`:
```
DEV_BYPASS_AUTH=true
```
Это заменяет авторизацию на мок-admin сессию. Все публичные страницы работают без БД через fallback.

> **Убрать `DEV_BYPASS_AUTH` перед деплоем!**

---

## 16. Конфигурационные файлы

Ниже приведено полное содержание всех файлов конфигурации.

---

### `ecosystem.config.js` — PM2

```javascript
module.exports = {
  apps: [
    {
      name: 'eduplatform',
      script: 'node_modules/.bin/next',
      args: 'start',
      instances: 2,           // Количество воркеров (= числу CPU-ядер)
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
    },
  ],
}
```

---

### `nginx.conf` (шаблон) — Nginx

> Замените `ВАШ_ДОМЕН.ru` и `/path/to/app` на реальные значения.

```nginx
server {
    listen 80;
    server_name ВАШ_ДОМЕН.ru www.ВАШ_ДОМЕН.ru;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ВАШ_ДОМЕН.ru www.ВАШ_ДОМЕН.ru;

    ssl_certificate     /etc/letsencrypt/live/ВАШ_ДОМЕН.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ВАШ_ДОМЕН.ru/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;
    gzip_min_length 1000;

    location /_next/static/ {
        alias /var/www/wisdomwave/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /public/ {
        alias /var/www/wisdomwave/public/;
        expires 7d;
    }

    location /api/webhooks/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_request_buffering off;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
    }

    client_max_body_size 100m;
}
```

---

### `docker-compose.yml` — для локальной разработки

```yaml
version: '3.9'

services:
  mysql:
    image: mysql:8.0
    container_name: eduplatform_mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD:-root_dev_password}
      MYSQL_DATABASE: ${MYSQL_DATABASE:-eduplatform}
      MYSQL_USER: ${MYSQL_USER:-eduplatform}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD:-eduplatform_dev}
    ports:
      - '3306:3306'
    volumes:
      - mysql_data:/var/lib/mysql
    command: --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci
    healthcheck:
      test: ['CMD', 'mysqladmin', 'ping', '-h', 'localhost', '-u', 'root', '-p${MYSQL_ROOT_PASSWORD:-root_dev_password}']
      interval: 10s
      timeout: 5s
      retries: 10

  redis:
    image: redis:7-alpine
    container_name: eduplatform_redis
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD:-redis_dev_password}
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data
    healthcheck:
      test: ['CMD', 'redis-cli', '-a', '${REDIS_PASSWORD:-redis_dev_password}', 'ping']
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  mysql_data:
  redis_data:
```

---

### `.env.example` — шаблон переменных окружения

```bash
# Основные
NEXTAUTH_URL=https://ВАШ_ДОМЕН.ru
NEXTAUTH_SECRET=СЛУЧАЙНАЯ_СТРОКА_32_СИМВОЛА
AUTH_SECRET=СЛУЧАЙНАЯ_СТРОКА_32_СИМВОЛА
AUTH_TRUST_HOST=true
NEXT_PUBLIC_APP_URL=https://ВАШ_ДОМЕН.ru

# База данных
DATABASE_PROVIDER=mysql
DATABASE_URL=mysql://ПОЛЬЗОВАТЕЛЬ:ПАРОЛЬ@localhost:3306/wisdomwave
TEST_DATABASE_URL=mysql://ПОЛЬЗОВАТЕЛЬ:ПАРОЛЬ@localhost:3306/wisdomwave_test

# Redis
REDIS_URL=redis://:ПАРОЛЬ@localhost:6379/0
REDIS_PASSWORD=ПАРОЛЬ

# Яндекс Object Storage
YOS_ACCESS_KEY_ID=
YOS_SECRET_ACCESS_KEY=
YOS_BUCKET_NAME=wisdomwave-private
YOS_PUBLIC_BUCKET_NAME=wisdomwave-public
YOS_ENDPOINT=https://storage.yandexcloud.net
YOS_REGION=ru-central1
NEXT_PUBLIC_YOS_PUBLIC_URL=https://storage.yandexcloud.net/wisdomwave-public

# YooKassa
YOOKASSA_SHOP_ID=
YOOKASSA_SECRET_KEY=
YOOKASSA_WEBHOOK_SECRET=

# CryptoCloud
CRYPTOCLOUD_API_KEY=
CRYPTOCLOUD_SHOP_ID=
CRYPTOCLOUD_SECRET_KEY=
CRYPTOCLOUD_WEBHOOK_SECRET=

# МИР Pay
MIR_PAY_MERCHANT_ID=
MIR_PAY_SECRET_KEY=
MIR_PAY_API_URL=https://mirpay.ru

# CDEK
CDEK_CLIENT_ID=
CDEK_CLIENT_SECRET=
CDEK_API_URL=https://api.cdek.ru/v2

# Boxberry
BOXBERRY_TOKEN=
BOXBERRY_API_URL=https://api.boxberry.ru/json.php

# Email
SENDPULSE_API_USER_ID=
SENDPULSE_API_SECRET=
EMAIL_FROM=WisdomWave <noreply@ВАШ_ДОМЕН.ru>
EMAIL_SUPPORT=support@ВАШ_ДОМЕН.ru
SMTP_HOST=smtp.beget.com
SMTP_PORT=465
SMTP_USER=
SMTP_PASS=

# YandexGPT
YANDEXGPT_API_KEY=
YANDEXGPT_FOLDER_ID=
YANDEXGPT_MODEL=yandexgpt-lite
ANTHROPIC_API_KEY=
AI_CHAT_RATE_LIMIT_PER_HOUR=100

# GlitchTip (опционально)
GLITCHTIP_DSN=
NEXT_PUBLIC_GLITCHTIP_DSN=
GLITCHTIP_ENVIRONMENT=production

# Бизнес-логика
PLATFORM_FEE_PERCENT=20
SUBSCRIPTION_REMINDER_DAYS=3
CRON_SECRET=
```

---

### `.github/workflows/deploy.yml` — автодеплой

```yaml
name: Deploy to Server

on:
  push:
    branches: [main]

jobs:
  deploy:
    name: Deploy
    runs-on: ubuntu-latest

    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.BEGET_SSH_HOST }}
          username: ${{ secrets.BEGET_SSH_USER }}
          key: ${{ secrets.BEGET_SSH_PRIVATE_KEY }}
          script: |
            set -e
            cd ${{ secrets.BEGET_DEPLOY_PATH }}

            echo "=== Pulling latest code ==="
            git pull origin main

            echo "=== Installing dependencies ==="
            npm ci --production=false

            echo "=== Generating Prisma client ==="
            npx prisma generate

            echo "=== Running migrations ==="
            npx prisma migrate deploy

            echo "=== Building application ==="
            npm run build

            echo "=== Restarting PM2 ==="
            pm2 reload ecosystem.config.js --update-env

            echo "=== Deploy complete ==="
            pm2 status
```

---

## 17. Часто задаваемые вопросы

**Q: Сайт запустился, но при входе пишет ошибку конфигурации**  
A: Убедитесь что в `.env` установлены `AUTH_SECRET` и `AUTH_TRUST_HOST=true`. Это обязательно для NextAuth v5 в production.

**Q: Ошибка `Prisma: Environment variable not found: DATABASE_URL`**  
A: Команды `npx prisma ...` не читают `.env` автоматически вне Next.js. Передайте явно:  
`DATABASE_URL="mysql://..." npx prisma migrate deploy`

**Q: PM2 не запускается после перезагрузки**  
A: Выполните `pm2 save` после каждого изменения списка процессов, и убедитесь что выполнена команда `pm2 startup` + скопирована systemd-команда из её вывода.

**Q: Nginx возвращает 502 Bad Gateway**  
A: Проверьте что PM2 запущен (`pm2 status`) и Next.js слушает порт 3000 (`curl http://localhost:3000`).

**Q: Ошибка SSL при certbot**  
A: Домен должен уже указывать на IP сервера через DNS. Проверьте: `nslookup ВАШ_ДОМЕН.ru`.

**Q: Как поменять количество воркеров PM2?**  
A: В `ecosystem.config.js` измените `instances: 2` на нужное число (не больше числа CPU). После — `pm2 reload ecosystem.config.js`.

**Q: Как сбросить базу данных и начать заново**  
A: `npx prisma migrate reset` — удалит все данные и заново применит миграции + seed. **Только для dev-окружения!**
