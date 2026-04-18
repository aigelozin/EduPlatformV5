# EduPlatformРФ

**Сайт:** [anandayoga.ru](https://anandayoga.ru)

**EduPlatformРФ** — российская образовательная платформа (EdTech) полного цикла: от базовых занятий до профессионального и бизнес-образования.

Платформа охватывает широкий спектр обучения:

- **Для детей и школьников** — репетиторы по школьным предметам, развивающие курсы, творческие занятия и спорт
- **Для студентов и молодых специалистов** — профессиональные навыки, подготовка к экзаменам, карьерный старт
- **Для взрослых** — йога, массаж, фитнес, психология, творчество, саморазвитие
- **Для профессионалов и предпринимателей** — курсы от практикующих экспертов, профессоров и успешных бизнесменов: управление, маркетинг, финансы, личная эффективность

Преподаватели любого уровня могут создавать и продавать онлайн-курсы, проводить прямые трансляции и вебинары, а также продавать сопутствующие физические товары. Студенты выбирают отдельные курсы или оформляют подписку на полный доступ к материалам платформы.

Все данные хранятся в России в соответствии с ФЗ-152.

## Возможности платформы

### Для студентов
- Покупка отдельных курсов или оформление подписки на все материалы
- Просмотр уроков с поддержкой VK Video, RuTube, Kinescope, YouTube
- Прохождение курсов с отслеживанием прогресса
- Участие в прямых трансляциях и вебинарах с чатом
- Покупка физических товаров с доставкой по России (CDEK, Boxberry)
- Личный кабинет: история заказов, прогресс, уведомления

### Для преподавателей
- Создание и продажа онлайн-курсов, уроков, подписок, физических товаров
- Проведение прямых трансляций
- Аналитика продаж и просмотров
- История заказов и выплат
- Модерация отзывов

### Для администраторов
- Модерация контента и пользователей
- Настройки платформы: бренд, шрифты, SEO, контент
- Аналитика доходов с графиками
- Управление отзывами и чатами
- Управление выплатами преподавателям
- AI-ассистент (YandexGPT + Claude)

## Стек

- **Frontend:** Next.js 14 App Router + TypeScript strict + Tailwind CSS
- **БД:** MySQL (Beget Shared) + Prisma ORM
- **Auth:** NextAuth.js v5 (JWT-сессии)
- **Хранилище:** Yandex Object Storage (ФЗ-152)
- **Платежи:** YooKassa + CryptoCloud + МИР Pay
- **Доставка:** CDEK + Boxberry
- **Email:** SendPulse + Beget SMTP (fallback)
- **AI:** YandexGPT (основной) + Claude API (fallback)
- **Rate limiting:** Яндекс Managed Redis
- **Мониторинг:** GlitchTip (self-hosted)
- **Deploy:** Beget Shared + PM2 + Nginx + GitHub Actions (CI/CD)

## Быстрый старт (локально)

### Требования

- Node.js 20+
- Docker & Docker Compose

### Установка

```bash
git clone https://github.com/aigelozin/EduPlatformV5.git
cd EduPlatformV5
cp .env.example .env.local
npm install
```

### Запуск без базы данных (DEV-режим)

Добавьте в `.env.local`:

```env
DEV_BYPASS_AUTH=true
```

Затем:

```bash
npm run dev
```

Сайт будет доступен на [http://localhost:3000](http://localhost:3000).  
Auth пропускается, используется мок-сессия администратора.

### Запуск с базой данных (Docker)

```bash
docker-compose up -d
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

## Переменные окружения

| Переменная | Описание |
|---|---|
| `DATABASE_URL` | MySQL connection string |
| `NEXTAUTH_SECRET` | Секрет для JWT |
| `NEXTAUTH_URL` | URL сайта |
| `YOS_BUCKET` | Yandex Object Storage bucket |
| `YOS_ACCESS_KEY` | YOS Access Key |
| `YOS_SECRET_KEY` | YOS Secret Key |
| `YOOKASSA_SHOP_ID` | YooKassa ID магазина |
| `YOOKASSA_SECRET_KEY` | YooKassa секрет |
| `CRYPTOCLOUD_API_KEY` | CryptoCloud API ключ |
| `SENDPULSE_ID` | SendPulse client ID |
| `SENDPULSE_SECRET` | SendPulse client secret |
| `YANDEX_GPT_API_KEY` | YandexGPT API ключ |
| `CLAUDE_API_KEY` | Claude API ключ (fallback) |
| `REDIS_URL` | Redis connection string |
| `DEV_BYPASS_AUTH` | `true` — пропустить auth (только для разработки) |

## Команды

```bash
npm run dev           # Dev-сервер
npm run build         # Production сборка
npm run start         # Production запуск
npm run type-check    # Проверка TypeScript
npm run lint          # ESLint
npm run test          # Unit-тесты (Vitest)
npm run test:e2e      # E2E тесты (Playwright)

npm run db:generate   # Prisma Client
npm run db:migrate    # Применить миграции (dev)
npm run db:deploy     # Применить миграции (prod)
npm run db:seed       # Заполнить тестовыми данными
npm run db:studio     # Prisma Studio GUI
```

## Структура проекта

```
app/
  (public)/         # Публичные страницы (лендинг, курсы, магазин)
  (auth)/           # Вход, регистрация, смена пароля
  (dashboard)/      # Личный кабинет студента
  (teacher)/        # Кабинет преподавателя
  (admin)/          # Панель администратора
  api/              # API routes
components/         # React компоненты
lib/                # Бизнес-логика, интеграции
prisma/             # Схема БД и миграции
specs/              # Спецификации проекта
planning/           # Планы и описание агентов
```

## Роли пользователей

| Роль | Возможности |
|---|---|
| `admin` | Полное управление платформой |
| `teacher` | Создание и продажа курсов/товаров |
| `subscriber` | Доступ по подписке |
| `student` | Покупка отдельных курсов |

## Деплой (Beget)

Сайт деплоится на Beget Shared через GitHub Actions по SSH.  
Домен: **anandayoga.ru**

```bash
# На сервере (после первого деплоя)
npm run db:deploy    # Применить миграции
npm run db:seed      # Начальные данные (опционально)
pm2 restart all
```

## Соответствие законодательству

- Все данные пользователей хранятся в России (ФЗ-152)
- Согласие на обработку персональных данных фиксируется при регистрации (таблица `consent_log`)
- Платёжные системы только российские (YooKassa, МИР)
- Доставка только по России (CDEK, Boxberry)

## История изменений

Подробный журнал изменений: [changes_v51_rf.md](./changes_v51_rf.md)

## Контакты

- Email: [aigelozin@gmail.com](mailto:aigelozin@gmail.com)
- Support: [support@itempuniversity.com](mailto:support@itempuniversity.com)
- GitHub Issues: [github.com/aigelozin/EduPlatformV5/issues](https://github.com/aigelozin/EduPlatformV5/issues)

## Лицензия

Proprietary — все права защищены.
