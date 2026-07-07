# Аудит платёжных интеграций — Pre-deploy проверка

**Дата:** 2026-07-08  
**Аудитор:** Claude Sonnet 4.6 (AI Code Auditor)  
**Директория проверки:** `/home/ai-openyoga/EduplatformРФ/lib/payments/` и `/home/ai-openyoga/EduplatformРФ/app/api/webhooks/`

---

## Проверенные файлы

### Библиотеки платёжных провайдеров
- `lib/payments/yookassa.ts`
- `lib/payments/mir.ts`
- `lib/payments/cryptocloud.ts`

### Webhook-роуты
- `app/api/webhooks/yookassa/route.ts`
- `app/api/webhooks/cryptocloud/route.ts`
- `app/api/webhooks/mir/route.ts`

---

## Сводка по трём критериям безопасности

| Критерий | YooKassa | CryptoCloud | МИР Pay |
|---|---|---|---|
| Верификация подписи вебхука | ЕСТЬ | ЕСТЬ | ЕСТЬ |
| Идемпотентность (защита от повторов) | ЧАСТИЧНО | ЧАСТИЧНО | ЧАСТИЧНО |
| Сумма берётся от провайдера, а не от клиента | ЕСТЬ | ЕСТЬ | ЕСТЬ |

---

## Найденные проблемы

---

### [БЛОКЕР] Небезопасное сравнение строк в верификации подписи — тайминг-атака

**Файлы:**
- `lib/payments/yookassa.ts:82`
- `lib/payments/cryptocloud.ts:71`
- `lib/payments/mir.ts:77`

**Описание:**  
Все три `verify*Webhook()` функции сравнивают HMAC-подписи через оператор `===`. Это обычное строковое сравнение, уязвимое к тайминг-атакам (timing attack): атакующий может побайтово угадать секретный ключ, измеряя время ответа. Для безопасного сравнения криптографических значений необходимо использовать `crypto.timingSafeEqual()`.

**Доказательство (yookassa.ts:80-83):**
```typescript
const expected = createHmac('sha256', webhookSecret).update(body).digest('hex')
return expected === signature
```

**То же самое в cryptocloud.ts:70-72 и mir.ts:76-78.**

**Исправление:** Заменить `===` на `crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))`.

---

### [БЛОКЕР] Идемпотентность: двойное начисление при статусе `payment.succeeded` / `CONFIRMED`

**Файлы:**
- `app/api/webhooks/yookassa/route.ts:34-85`
- `app/api/webhooks/cryptocloud/route.ts:34-86`
- `app/api/webhooks/mir/route.ts:31-82`

**Описание:**  
Все три обработчика используют `purchase.upsert()` для записи покупок, что защищает от дублирования на уровне строки `purchase`. Однако `payment.update()` и `order.update()` не защищены: если `payment.status` уже `succeeded`, обработчик молча повторит `update` без проверки текущего состояния. Это само по себе не приводит к двойному доступу из-за `upsert`, но есть серьёзная проблема: **нет проверки, что `payment.status !== 'succeeded'` перед выполнением транзакции**.

Если платёжная система отправит вебхук дважды (что является нормальным поведением — YooKassa, CryptoCloud и МИР Pay могут повторять доставку), обе доставки пройдут через `if (payment)` (запись в БД найдена), войдут в транзакцию и выполнят `update`. Хотя `upsert` на `purchase` безопасен, **нет гарантии атомарной защиты `payment` от двойной обработки** — например, в будущем при добавлении логики начисления бонусов, выплат учителю или email-уведомлений дублирование может произойти снова.

**Доказательство (yookassa/route.ts:50-84):**
```typescript
if (payment) {
  await db.$transaction(async (tx) => {
    await tx.payment.update({          // нет проверки payment.status !== 'succeeded'
      where: { id: payment.id },
      data: { status: 'succeeded' },
    })
    // ... upsert покупок
  })
}
```

**Исправление:** Добавить `where: { id: payment.id, status: { not: 'succeeded' } }` в `payment.update()` или перед транзакцией проверить `if (payment.status === 'succeeded') return`.

---

### [ВАЖНО] Ошибка верификации подписи не логируется — «тихий» 401

**Файлы:**
- `app/api/webhooks/yookassa/route.ts:17-20`
- `app/api/webhooks/cryptocloud/route.ts:17-20`
- `app/api/webhooks/mir/route.ts:17-20`

**Описание:**  
При неверной подписи возвращается `401`, но событие никак не логируется (ни через GlitchTip, ни через `console.error`). Это означает, что атака перебором подписей или сбой конфигурации (неверный `WEBHOOK_SECRET` в ENV) будут незаметны в production до тех пор, пока не перестанут приходить оплаченные заказы.

**Доказательство (yookassa/route.ts:17-20):**
```typescript
const isValid = verifyYooKassaWebhook(body, signature)
if (!isValid) {
  return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  // нет console.error, нет GlitchTip capture
}
```

**Исправление:** Добавить `console.error('[webhook/yookassa] invalid signature, ip:', req.ip)` или отправить событие в GlitchTip перед возвратом 401.

---

### [ВАЖНО] Верификация YooKassa: неверный заголовок подписи

**Файл:** `app/api/webhooks/yookassa/route.ts:15`

**Описание:**  
Согласно официальной документации YooKassa, подпись вебхука передаётся в заголовке `X-Request-Checksum`, а не `X-Signature`. Использование неправильного заголовка означает, что `signature` всегда будет пустой строкой `''`, а HMAC над телом никогда не совпадёт с пустой строкой — вебхуки от YooKassa будут отклоняться с `401` в production.

**Доказательство (route.ts:15):**
```typescript
const signature = req.headers.get('X-Signature') ?? ''
```

**Ожидаемое (по документации YooKassa):**
```typescript
const signature = req.headers.get('X-Request-Checksum') ?? ''
```

**Примечание:** Необходимо сверить с актуальной документацией провайдера — название заголовка может отличаться в зависимости от версии API YooKassa.

---

### [ВАЖНО] `console.error` в production — нарушение code style

**Файлы:**
- `app/api/webhooks/yookassa/route.ts:93`
- `app/api/webhooks/cryptocloud/route.ts:93`
- `app/api/webhooks/mir/route.ts:96`

**Описание:**  
В CLAUDE.md явно указано: «Никаких `console.log` в продакшне — GlitchTip для трекинга ошибок». Все три обработчика используют `console.error` для логирования ошибок обработки вместо отправки в GlitchTip. Ошибки парсинга JSON, ошибки БД не попадут в систему мониторинга.

**Доказательство (yookassa/route.ts:92-94):**
```typescript
} catch (err) {
  console.error('[webhook/yookassa] processing error:', err)
}
```

**Исправление:** Заменить `console.error` на вызов GlitchTip (Sentry-compatible `captureException(err)`).

---

### [ВАЖНО] Сумма транзакции не верифицируется через API провайдера

**Файлы:**
- `app/api/webhooks/yookassa/route.ts` (весь файл)
- `app/api/webhooks/cryptocloud/route.ts` (весь файл)
- `app/api/webhooks/mir/route.ts` (весь файл)

**Описание:**  
Сумма не берётся напрямую из клиентского запроса (это плюс), но она также не верифицируется через API платёжной системы. Обработчики доверяют статусу из тела вебхука без перекрёстной проверки суммы через GET-запрос к API провайдера (`GET /v3/payments/{id}`). Если вебхук будет подделан (или при ошибке подписи — см. блокер выше), система зачтёт оплату без проверки реальной суммы.

**Доказательство — поля `amount` не присутствуют в обработанном payload (yookassa/route.ts:23-30):**
```typescript
const payload = JSON.parse(body) as {
  event: string
  object: {
    id: string
    status: string          // только статус и id
    metadata?: { order_id?: string }
  }
}
```

**Исправление:** После успешной верификации подписи выполнить `GET https://api.yookassa.ru/v3/payments/{id}` и сверить `payment.amount.value` с `order.total` из БД перед зачислением.

---

### [КОСМЕТИКА] Дублирование списка `DIGITAL_PRODUCT_TYPES` в каждом роуте

**Файлы:**
- `app/api/webhooks/yookassa/route.ts:5-11`
- `app/api/webhooks/cryptocloud/route.ts:5-11`
- `app/api/webhooks/mir/route.ts:5-11`

**Описание:**  
Массив `DIGITAL_PRODUCT_TYPES` определён трижды идентично. При добавлении нового типа продукта его нужно обновить в трёх местах, что создаёт риск рассинхронизации.

**Доказательство:**
```typescript
// Одинаково во всех трёх файлах:
const DIGITAL_PRODUCT_TYPES = [
  'lesson', 'course', 'bundle', 'livestream', 'digital_book',
] as const
```

**Исправление:** Вынести в `lib/payments/constants.ts` и импортировать.

---

### [КОСМЕТИКА] Отсутствует rate limiting на webhook-эндпоинтах

**Файлы:**
- `app/api/webhooks/yookassa/route.ts`
- `app/api/webhooks/cryptocloud/route.ts`
- `app/api/webhooks/mir/route.ts`

**Описание:**  
В CLAUDE.md указано «Rate limit на ВСЕХ `/api/*` маршрутах через Redis middleware». Webhook-роуты не являются исключением по архитектуре, однако rate limiting здесь должен быть настроен по IP платёжного провайдера, а не по пользователю. Необходимо убедиться, что Redis middleware применяется или явно задокументировано исключение.

---

## Итоговая таблица

| # | Критичность | Файл:строка | Краткое описание |
|---|---|---|---|
| 1 | БЛОКЕР | `lib/payments/yookassa.ts:82`, `cryptocloud.ts:71`, `mir.ts:77` | Тайминг-атака: `===` вместо `timingSafeEqual` |
| 2 | БЛОКЕР | `webhooks/yookassa/route.ts:50`, аналогично в двух других | Нет защиты от двойной обработки `succeeded`-вебхука |
| 3 | ВАЖНО | `webhooks/yookassa/route.ts:17-20`, аналогично в двух других | Неверная подпись не логируется — незаметный сбой |
| 4 | ВАЖНО | `webhooks/yookassa/route.ts:15` | Неверное имя заголовка (`X-Signature` вместо `X-Request-Checksum`) |
| 5 | ВАЖНО | `webhooks/*/route.ts:92-94` | `console.error` вместо GlitchTip |
| 6 | ВАЖНО | Все три webhook-роута | Сумма не верифицируется через API провайдера |
| 7 | КОСМЕТИКА | Все три webhook-роута:5-11 | `DIGITAL_PRODUCT_TYPES` дублируется трижды |
| 8 | КОСМЕТИКА | Все три webhook-роута | Неясно, применяется ли rate limiting к webhook-эндпоинтам |

---

## Что работает правильно

- Верификация подписи присутствует во всех трёх провайдерах — подпись проверяется **до** обработки payload.
- Секреты берутся из ENV-переменных (`process.env.*`), хардкода нет.
- Сумма платежа **не берётся из клиентского запроса** — используется `item.price` из БД, связанной с `payment`, который создан сервером.
- `purchase.upsert` обеспечивает базовую идемпотентность на уровне записи о покупке.
- Транзакции (`db.$transaction`) обеспечивают атомарность обновлений payment + order + purchases.
- Обработка cancellation/failure вынесена отдельно от success.
