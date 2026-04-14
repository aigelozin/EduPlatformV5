# EduPlatform РФ — Environment Variables Reference

Все переменные нужны в `.env.local` (локально) и в панели Beget (продакшн).

---

## Application

| Переменная | Обязательна | Пример | Примечание |
|---|---|---|---|
| `NEXTAUTH_URL` | да | `https://yourdomain.ru` | Полный URL, без слеша в конце |
| `NEXTAUTH_SECRET` | да | `openssl rand -base64 32` | Мин. 32 символа |
| `NEXT_PUBLIC_APP_URL` | да | `https://yourdomain.ru` | Для клиентских ссылок |

---

## Database

| Переменная | Обязательна | Пример | Примечание |
|---|---|---|---|
| `DATABASE_URL` | да | `postgresql://user:pass@host:5432/db` | Beget PostgreSQL |
| `TEST_DATABASE_URL` | только dev | `postgresql://...test_db` | Отдельная БД для тестов |

---

## Яндекс Object Storage (YOS)

| Переменная | Обязательна | Примечание |
|---|---|---|
| `YOS_ACCESS_KEY_ID` | да | Из Yandex Cloud → IAM → Service Account Keys |
| `YOS_SECRET_ACCESS_KEY` | да | HMAC-ключ сервисного аккаунта |
| `YOS_BUCKET_NAME` | да | Приватный бакет для защищённого контента |
| `YOS_PUBLIC_BUCKET_NAME` | да | Публичный бакет для аватаров/галерей |
| `YOS_ENDPOINT` | да | `https://storage.yandexcloud.net` |
| `YOS_REGION` | да | `ru-central1` |
| `NEXT_PUBLIC_YOS_PUBLIC_URL` | да | `https://storage.yandexcloud.net/{bucket}` |

---

## Payment Providers

### YooKassa
| Переменная | Обязательна | Примечание |
|---|---|---|
| `YOOKASSA_SHOP_ID` | да | ID магазина из личного кабинета YooKassa |
| `YOOKASSA_SECRET_KEY` | да | Секретный ключ для API + webhook |
| `YOOKASSA_WEBHOOK_SECRET` | да | Секрет для подписи webhook |

### CryptoCloud
| Переменная | Обязательна | Примечание |
|---|---|---|
| `CRYPTOCLOUD_API_KEY` | да | API ключ из CryptoCloud |
| `CRYPTOCLOUD_SHOP_ID` | да | ID магазина |
| `CRYPTOCLOUD_SECRET_KEY` | да | Для HMAC-SHA256 верификации webhook |

### МИР Pay
| Переменная | Обязательна | Примечание |
|---|---|---|
| `MIR_PAY_MERCHANT_ID` | да | Merchant ID из НСПК |
| `MIR_PAY_SECRET_KEY` | да | Для верификации webhook |
| `MIR_PAY_API_URL` | да | Тест: `https://test.mirpay.ru` / Прод: `https://api.mirpay.ru` |

---

## Platform Business Logic

| Переменная | Обязательна | По умолчанию | Примечание |
|---|---|---|---|
| `PLATFORM_FEE_PERCENT` | да | `20` | % комиссии с каждой продажи |
| `SUBSCRIPTION_REMINDER_DAYS` | нет | `3` | За сколько дней до окончания отправлять напоминание |

---

## Delivery Providers

### CDEK
| Переменная | Обязательна | Примечание |
|---|---|---|
| `CDEK_CLIENT_ID` | да | OAuth2 client ID |
| `CDEK_CLIENT_SECRET` | да | OAuth2 client secret |
| `CDEK_API_URL` | да | `https://api.cdek.ru/v2` (прод) или `https://api.edu.cdek.ru/v2` (тест) |
| `CDEK_WEBHOOK_SECRET` | да | Для верификации webhook статуса доставки |

### Boxberry
| Переменная | Обязательна | Примечание |
|---|---|---|
| `BOXBERRY_TOKEN` | да | API токен из партнёрского кабинета Boxberry |
| `BOXBERRY_API_URL` | нет | По умолчанию продакшн URL |

---

## AI

### YandexGPT (primary)
| Переменная | Обязательна | Примечание |
|---|---|---|
| `YANDEXGPT_API_KEY` | да | Из Yandex Cloud → IAM → API Keys |
| `YANDEXGPT_FOLDER_ID` | да | ID каталога в Yandex Cloud |
| `YANDEXGPT_MODEL` | нет | `yandexgpt-lite` (быстрый) или `yandexgpt` (лучший) |

### Claude API (fallback)
| Переменная | Обязательна | Примечание |
|---|---|---|
| `ANTHROPIC_API_KEY` | нет | Fallback для SEO-генерации |
| `AI_CHAT_RATE_LIMIT_PER_HOUR` | нет | По умолчанию: `20` |

---

## Яндекс Managed Redis

| Переменная | Обязательна | Примечание |
|---|---|---|
| `REDIS_URL` | да | `redis://:password@host:6379/0` — из Yandex Cloud |
| `REDIS_PASSWORD` | да | Пароль из Yandex Cloud Managed Redis |

---

## Email

### SendPulse (primary)
| Переменная | Обязательна | Примечание |
|---|---|---|
| `SENDPULSE_API_USER_ID` | да | Из панели SendPulse |
| `SENDPULSE_API_SECRET` | да | Из панели SendPulse |
| `EMAIL_FROM` | да | `EduPlatform <noreply@yourdomain.ru>` |
| `EMAIL_SUPPORT` | да | `support@yourdomain.ru` |

### Beget SMTP (backup)
| Переменная | Обязательна | Примечание |
|---|---|---|
| `SMTP_HOST` | да | `mail.beget.com` |
| `SMTP_PORT` | да | `465` (SSL) или `587` (TLS) |
| `SMTP_USER` | да | Почтовый ящик на Beget |
| `SMTP_PASS` | да | Пароль почтового ящика |

---

## Monitoring (GlitchTip)

| Переменная | Обязательна | Примечание |
|---|---|---|
| `GLITCHTIP_DSN` | да | Из панели GlitchTip (`https://glitchtip.yourdomain.ru/...`) |
| `NEXT_PUBLIC_GLITCHTIP_DSN` | да | То же значение — для клиентской стороны |
| `GLITCHTIP_ENVIRONMENT` | нет | `production` или `development` |

Sentry SDK совместим с GlitchTip — в коде используется `@sentry/nextjs` с кастомным DSN.

---

## CI/CD (GitHub Actions Secrets)

| Секрет | Примечание |
|---|---|
| `BEGET_SSH_HOST` | Hostname сервера Beget |
| `BEGET_SSH_USER` | SSH имя пользователя |
| `BEGET_SSH_PRIVATE_KEY` | Приватный SSH ключ (RSA или Ed25519) |
| `BEGET_DEPLOY_PATH` | Абсолютный путь к приложению на сервере |
| Все `.env` переменные выше | Нужны для build-time env injection |

---

## Notes

- Никогда не коммитить `.env.local` или `.env` — оба в `.gitignore`
- `.env.example` ДОЛЖЕН обновляться при добавлении новой переменной
- Только переменные с префиксом `NEXT_PUBLIC_` безопасны для клиентского бандла
- Секреты платёжных систем НИКОГДА не должны попадать в клиент
- PayPal переменные убраны — не добавлять обратно
- EasyPost переменные убраны — не добавлять обратно
- R2 переменные убраны — используйте YOS аналоги
- Upstash переменные убраны — используйте REDIS_URL
