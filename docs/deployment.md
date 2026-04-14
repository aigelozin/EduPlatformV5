# EduPlatform РФ — Deployment Guide

---

## Local Development

### Prerequisites

- Docker + Docker Compose
- Node.js 20+
- `.env.local` (скопировать из `.env.example` и заполнить)

### Запуск локального окружения

```bash
# Запустить PostgreSQL + Redis + Next.js
docker-compose up

# В отдельном терминале — применить миграции и seed
npx prisma migrate dev
npx prisma db seed

# Приложение доступно на http://localhost:3000
```

### Полезные команды

```bash
npm run dev              # Next.js dev server (hot reload)
npm run type-check       # TypeScript strict проверка
npm run lint             # ESLint
npm run test             # Vitest unit-тесты
npm run test:integration # Vitest integration тесты (нужен TEST_DATABASE_URL)
npm run test:e2e         # Playwright E2E (нужен запущенный dev сервер)
npx prisma studio        # DB браузер на http://localhost:5555
```

---

## Production: Beget Shared

### Первоначальная настройка (один раз)

```bash
# На Beget — через SSH или терминал панели управления
node -v           # должна быть 20+
npm install -g pm2

# Клонировать репозиторий
git clone https://github.com/aigelozin/EduPlatformV5.git /home/user/app
cd /home/user/app

# Установить зависимости
npm ci --production

# Скопировать и заполнить env vars
cp .env.example .env
nano .env

# Применить миграции
npx prisma migrate deploy

# Сборка
npm run build

# Запустить через PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup   # следовать инструкциям для автозапуска
```

### Nginx конфигурация

```nginx
server {
    listen 80;
    server_name yourdomain.ru www.yourdomain.ru;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.ru www.yourdomain.ru;

    ssl_certificate     /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;

    location /_next/static/ {
        alias /home/user/app/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /public/ {
        alias /home/user/app/public/;
        expires 7d;
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
    }
}
```

### HTTPS через Let's Encrypt

```bash
# Встроенная панель Beget SSL или certbot
certbot --nginx -d yourdomain.ru -d www.yourdomain.ru
```

---

## CI/CD через GitHub Actions

```
PR открыт/обновлён  → ci.yml  → lint + type-check + vitest
Push в main         → deploy.yml → SSH на Beget → git pull + migrate + build + pm2 restart
```

### Ключевые шаги deploy.yml

```yaml
- name: Deploy to Beget
  run: |
    ssh $BEGET_SSH_USER@$BEGET_SSH_HOST << 'EOF'
      cd $BEGET_DEPLOY_PATH
      git pull origin main
      npm ci --production
      npx prisma migrate deploy
      npm run build
      pm2 restart ecosystem.config.js --update-env
    EOF
```

---

## PM2 Configuration (`ecosystem.config.js`)

```javascript
module.exports = {
  apps: [{
    name: 'eduplatform-rf',
    script: 'node_modules/.bin/next',
    args: 'start',
    instances: 2,
    exec_mode: 'cluster',
    max_memory_restart: '512M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
  }],
}
```

---

## GlitchTip (мониторинг ошибок)

GlitchTip требует отдельного сервера с Docker. На Beget Shared Docker недоступен.

**Вариант 1: Beget VPS (~300 руб/мес)**
```bash
# На Beget VPS
docker run -d \
  --name glitchtip \
  -p 8000:8000 \
  -e SECRET_KEY=your-secret-key \
  -e DATABASE_URL=postgresql://... \
  glitchtip/glitchtip:latest
```

**Вариант 2: Яндекс Мониторинг**
Менее функциональный, но полностью в экосистеме Яндекс Облака.
Настраивается в Yandex Cloud Console.

**Вариант 3: Временно без мониторинга**
На этапе MVP можно использовать только PM2 логи + ручную проверку.

---

## Миграции в продакшне

```bash
# Безопасно — применяет только ожидающие миграции
npx prisma migrate deploy

# НИКОГДА в продакшне:
# npx prisma migrate dev     (дропает БД при конфликте)
# npx prisma migrate reset   (уничтожает все данные)
```

---

## Rollback

```bash
ssh user@beget-host
cd /path/to/app

# Откатиться к предыдущему коммиту
git log --oneline -5
git checkout <previous-sha>
npm run build
pm2 restart ecosystem.config.js
```

---

## Monitoring

- **GlitchTip**: ошибки продакшна на self-hosted сервере
- **PM2 логи**: `pm2 logs eduplatform-rf` на сервере
- **Яндекс Managed Redis**: мониторинг в консоли Yandex Cloud
- **Beget панель**: CPU/RAM/диск в панели хостинга

### Health check endpoint

```
GET /api/health
→ { status: 'ok', db: 'ok', timestamp: '...' }
```

---

## Настройка Яндекс Managed Redis

```bash
# В Yandex Cloud Console:
# 1. Создать кластер Managed Redis (минимальный тариф)
# 2. Скопировать connection string
# 3. Добавить в .env: REDIS_URL=redis://:password@host:6379/0

# Проверить подключение:
redis-cli -u $REDIS_URL ping
# → PONG
```

---

## Настройка Яндекс Object Storage

```bash
# В Yandex Cloud Console:
# 1. Создать 2 бакета: private (закрытый) и public (публичный)
# 2. Создать сервисный аккаунт с ролью storage.editor
# 3. Создать HMAC-ключ для сервисного аккаунта
# 4. Добавить в .env: YOS_ACCESS_KEY_ID, YOS_SECRET_ACCESS_KEY

# Публичный бакет — разрешить публичный доступ на чтение
# Приватный бакет — только signed URLs
```
