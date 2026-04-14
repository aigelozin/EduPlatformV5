# EduPlatform V5.1 → РФ — Отчёт об изменениях

Дата: 2026-04-13

---

## Краткое резюме

Российская версия проекта — полная адаптация инфраструктуры под требования ФЗ-152 и реалии рынка РФ.
Все данные пользователей хранятся исключительно на серверах в России.

---

## Таблица изменений

| Компонент | V5.1 | РФ-версия | Тип изменения |
|---|---|---|---|
| Файловое хранилище | Cloudflare R2 (US) | Яндекс Object Storage (РФ) | Замена |
| Rate Limiting | Upstash Redis (US) | Яндекс Managed Redis (РФ) | Замена |
| Email | Resend (US) | SendPulse (RU) + Beget SMTP | Замена |
| Мониторинг ошибок | Sentry (US) | GlitchTip (self-hosted) | Замена |
| Платёжная система | PayPal | Удалён | Удаление |
| Доставка | EasyPost (international) | Удалён | Удаление |
| Видеоисточник | Archive.org | Удалён (заблокирован в РФ) | Удаление |
| Видеоисточник | — | Kinescope (RU) | Добавление |
| Трансляции | YouTube Live | VK Live + RuTube Live (primary) | Изменение |
| AI | Claude API (primary) | YandexGPT (primary) + Claude (fallback) | Изменение |
| i18n | RU + EN | Только RU | Упрощение |
| Доставка | CDEK + Boxberry | Без изменений | — |
| Платежи | YooKassa + CryptoCloud + МИР Pay | Без изменений | — |
| Хостинг | Beget Shared | Без изменений | — |
| БД | PostgreSQL на Beget | Без изменений | — |
| Auth | NextAuth.js v5 | Без изменений | — |
| Framework | Next.js 14 + TypeScript | Без изменений | — |

---

## Детальные изменения по файлам

### CLAUDE.md
- Обновлён Stack (YOS, Яндекс Redis, SendPulse, GlitchTip, YandexGPT)
- Убраны PayPal, EasyPost, Resend, Upstash, Cloudflare R2
- Video Sources: убран Archive.org, добавлен Kinescope
- Common Mistakes: добавлены правила не использовать PayPal/EasyPost/R2/Resend/Upstash
- i18n: только RU

### specs/eduplatform_spec_рф.md
- Полная новая спецификация с российским стеком
- Таблица сравнения V5.1 vs РФ
- Бюджет пересчитан в рублях (~₽1500–4000/мес вместо $25–45/мес)
- Раздел "07. ФЗ-152 COMPLIANCE" — расширен

### docs/architecture_decisions.md
- 9 новых ADR, специфичных для РФ (ADR-РФ-001 — ADR-РФ-009)
- Документируют причины каждой замены сервиса

### docs/env-vars.md
- Полностью переписан под российские сервисы
- Убраны: R2_, UPSTASH_, RESEND_, SENTRY_, PAYPAL_, EASYPOST_ переменные
- Добавлены: YOS_, YANDEXGPT_, REDIS_, SENDPULSE_, SMTP_, GLITCHTIP_ переменные

### docs/deployment.md
- Добавлены инструкции по настройке GlitchTip
- Добавлены инструкции по настройке Яндекс Managed Redis
- Добавлены инструкции по настройке Яндекс Object Storage

### docs/russian_services_setup.md (новый файл)
- Пошаговые инструкции по регистрации и настройке:
  Яндекс Облако, YooKassa, МИР Pay, CryptoCloud, CDEK, Boxberry, SendPulse, Kinescope, GlitchTip, VK Video, RuTube

### planning/implementation_plan.md
- Отмечены изменённые задачи агентов (⚡)
- storage-engineer: R2 → YOS
- ai-integration: Claude → YandexGPT + Claude fallback
- payment-integrator: убраны PayPal и EasyPost задачи
- Добавлен email-agent (SendPulse + Beget SMTP)
- Добавлен чеклист готовности РФ-версии

### planning/agents_skills.md
- Обновлены скиллы: `generate-seo` использует YandexGPT, `add-translation` только RU
- Добавлены скиллы: `setup-yos`, `check-rf-compliance`
- Обновлены таблицы артефактов (payment-integrator, storage-engineer, ai-integration)
- Добавлен email-agent с артефактами

---

## Что НЕ изменилось

- Структура 23 таблиц Prisma (только minor: video_source enum, EN поля optional)
- checkAccess() паттерн — без изменений
- NextAuth.js v5 — без изменений
- Beget Shared хостинг — без изменений
- PostgreSQL + Prisma — без изменений
- CDEK + Boxberry интеграции — без изменений
- YooKassa + CryptoCloud + МИР Pay — без изменений
- Роли: admin, teacher, subscriber, student — без изменений
- 9 типов продуктов — без изменений
- ФЗ-152 consent_log — сохранён и усилен
- CI/CD через GitHub Actions — без изменений

---

## Финансовое сравнение

| Категория | V5.1 (USD/мес) | РФ-версия (RUB/мес) |
|---|---|---|
| Хранилище | $0–5 (R2) | ~100–500 ₽ (YOS) |
| Redis | $0–10 (Upstash) | ~750 ₽ (Яндекс) |
| Email | $0–20 (Resend) | ~0–800 ₽ (SendPulse) |
| Мониторинг | $0 (Sentry free) | ~0 ₽ (GlitchTip self-hosted) |
| AI | $5–15 (Claude) | ~300–1500 ₽ (YandexGPT) |
| **Итого** | **$5–50/мес** | **~1150–3550 ₽/мес** |

При курсе ₽=~90/$: РФ-версия сопоставима или дешевле по цене.
