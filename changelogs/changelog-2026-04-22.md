# Changelog — сессия 2026-04-22

## Локальный деплой и тестирование

### Инфраструктура
- Docker-compose переведён с PostgreSQL на MySQL 8 (соответствует Beget Shared)
- Пользователь добавлен в группу `docker` (без повторного ввода sudo)
- MySQL + Redis подняты в Docker, применены миграции, выполнен seed
- Next.js переведён с dev-сервера на production PM2 (cluster, 2 воркера)
- PM2 зарегистрирован как systemd-сервис: автозапуск при перезагрузке

### Исправленные баги (найдены тестированием)
- `WAVE_PALETTE` вынесен из `'use client'` компонента в `lib/wave-palette.ts` — фикс 500 на `/catalog`
- `AUTH_SECRET` + `AUTH_TRUST_HOST=true` добавлены в `.env.local` — фикс NextAuth UntrustedHost в production
- `CRYPTOCLOUD_WEBHOOK_SECRET` добавлен в `.env.local` — фикс 500 на webhook
- Добавлен `GET /api/products/route.ts` — листинг каталога
- Добавлен `GET /api/products/[id]/route.ts` — карточка продукта
- Добавлен `GET /api/admin/products` — список для модерации (был только POST)
- Исправлен catch в `GET /api/admin/analytics` — возвращал 500 вместо 401
- OpenGraph мета-теги добавлены в `app/layout.tsx`

### Тестирование
- Прогон 44 проверок: 41 пройдена, 3 ложных срабатывания (cart=localStorage, /privacy→/privacy-policy, сессия через JWT без cookies)
- Все 26 страниц — 200 OK

### Документация и установщик
- `docs/DEPLOY.md` — полная инструкция установки на VPS (17 разделов)
- `.env.example` — обновлён шаблон со всеми 50+ переменными
- `install.sh` — автоматический установщик для Beget Shared с интерактивным wizard'ом:
  - спрашивает домен, MySQL, Redis, YOS, платежи, email, AI по очереди
  - секреты скрыты при вводе (`read -s`)
  - пропущенные сервисы получают заглушки (не вызывают 500)
  - `NEXTAUTH_SECRET`, webhook-секреты генерируются автоматически
  - поддерживает флаги `--update`, `--skip-seed`, `--no-wizard`
- `docs/BEGET_INSTALL.md` — пошаговая инструкция запуска installer'а на Beget

## Коммиты сессии
- `b04dfd0` — docs: deployment guide + production bug fixes
- `5ab848f` — feat: automated install script + Beget setup guide
- `59731b0` — feat: interactive setup wizard in install.sh
- `fec1a8f` — docs: update Beget install guide for wizard
