# WisdomWave UI — Спецификация дизайна

**Дата:** 2026-04-20  
**Статус:** Утверждён  
**Ветка:** main (пофазово)

---

## Контекст

Проект — образовательный маркетплейс EduPlatformРФ (Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui + next-themes). Цель — внедрить дизайн-систему «Wisdom Wave» из HTML-прототипа (`Frontend EduPlatformWave/Educational Platform.html`) в продакшн-сайт. Прототип остаётся в репозитории как эталон.

---

## Решения

| Вопрос | Решение |
|--------|---------|
| Масштаб волн | Все страницы (публичные + дашборд + уроки) |
| Тема по умолчанию | По системе ОС (`prefers-color-scheme`) + переключатель ☀/☾ в хедере |
| Бренд | **WisdomWave** — обновить в `messages/ru.json` и метатегах |
| Подход к внедрению | Прямо в `main`, компонент за компонентом по фазам |

---

## Фаза 1 — Дизайн-система

### Шрифт
- Подключить `Outfit` (weights 200–700) через `next/font/google` в `app/layout.tsx`
- Применить как `font-sans` глобально через `className` на `<body>`

### CSS-переменные (`app/globals.css`)
Добавить в `:root` (dark) и `[data-theme="light"]` / `.light`:

```css
/* Dark — тёмный океан */
:root {
  --ocean1: #081228;
  --ocean2: #0c1a38;
  --foam: rgba(180,210,255,0.92);
  --foam-light: rgba(210,230,255,0.6);
  --card-body: rgba(10,22,52,0.82);
  --card-border: rgba(100,160,255,0.13);
  --wave-accent: oklch(0.63 0.26 272);
  --wave-accent-glow: oklch(0.63 0.26 272 / 0.18);
  --wave-gold: oklch(0.72 0.14 76);
  --text-foam: #d8e8ff;
  --text-muted-foam: rgba(180,210,255,0.5);
}

/* Light — дневная лазурь */
.light, [data-theme="light"] {
  --ocean1: #c2e0f7;
  --ocean2: #aed4f2;
  --foam: rgba(40,100,200,0.7);
  --foam-light: rgba(60,130,220,0.35);
  --card-body: rgba(255,255,255,0.88);
  --card-border: rgba(60,130,220,0.18);
  --wave-accent: oklch(0.52 0.24 272);
  --wave-gold: oklch(0.60 0.14 60);
  --text-foam: #0f2040;
  --text-muted-foam: rgba(20,60,130,0.55);
}
```

### Tailwind-токены (`tailwind.config.ts`)
```ts
colors: {
  ocean: { 1: 'var(--ocean1)', 2: 'var(--ocean2)' },
  foam: 'var(--foam)',
  'wave-accent': 'var(--wave-accent)',
  'card-body': 'var(--card-body)',
  'card-border': 'var(--card-border)',
}
```

### Анимации (`tailwind.config.ts`)
```ts
keyframes: {
  waveShift1: { '0%,100%': { transform: 'translateX(0)' }, '50%': { transform: 'translateX(-12%)' } },
  waveShift2: { '0%,100%': { transform: 'translateX(-6%)' }, '50%': { transform: 'translateX(6%)' } },
  waveShift3: { '0%,100%': { transform: 'translateX(0)' }, '50%': { transform: 'translateX(10%)' } },
  fadeUp: { from: { opacity: '0', transform: 'translateY(18px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
  windFlow: { '0%': { opacity: '0', transform: 'translateX(-80px)' }, '20%': { opacity: '1' }, '80%': { opacity: '0.5' }, '100%': { opacity: '0', transform: 'translateX(120px)' } },
},
animation: {
  wave1: 'waveShift1 14s ease-in-out infinite',
  wave2: 'waveShift2 18s ease-in-out infinite',
  wave3: 'waveShift3 22s ease-in-out infinite',
  'fade-up': 'fadeUp 0.5s cubic-bezier(0.25,0.46,0.45,0.94) both',
  wind: 'windFlow 8s ease-in-out infinite',
},
```

---

## Фаза 2 — Базовые компоненты

### `components/layout/OceanBackground.tsx`
- `'use client'` — читает тему через `useTheme`
- `position: fixed`, `inset: 0`, `z-index: 0`, `pointer-events: none`
- 5 SVG-волновых слоёв (`wl1`–`wl5`) с анимациями `wave1/2/3`
- 8–12 ветровых нитей: `<div>` с `background: linear-gradient`, анимация `wind` с разными `delay`
- Монтируется один раз в `app/layout.tsx` над `{children}`

### `components/layout/WaveCard.tsx`
Props: `children`, `className?`, `waveColor?`, `waveAccent?`, `onClick?`
- `background: var(--card-body)`, `border: 1px solid var(--card-border)`
- `backdrop-filter: blur(12px)`, `border-radius: 16px`
- Hover: `transform: translateY(-2px)`, `box-shadow` с `waveAccent` glow
- Если переданы `waveColor`/`waveAccent` — маленькая SVG-волна снизу карточки

---

## Фаза 3 — Header и навигация

### `components/layout/Header.tsx` (обновление)
- Логотип: SVG-волна (26×18, stroke `var(--wave-accent)`) + `Wisdom` (bold) + `Wave` (light, цвет `--wave-accent`)
- Кнопка гамбургер → открывает `WaveDrawer`
- Переключатель тем: кнопка ☀/☾, вызывает `setTheme` из `next-themes`
- Фон хедера: `var(--ocean1)` + нижняя тонкая SVG-волна

### `components/layout/WaveDrawer.tsx`
- `position: fixed`, `left: 0`, `top: 0`, `bottom: 0`, `width: 300px`, `z-index: 201`
- Backdrop: `rgba(0,0,20,0.55)` + `blur(2px)`, `opacity` toggle
- Анимация: `translateX(-100%) → translateX(0)`, `0.35s cubic-bezier(0.32,0,0.17,1)`
- Секции: **Мои курсы** (список с прогресс-барами) / **Сообщество** (форум, объявления, лидерборд) / **Наставник** (аватар, статус онлайн, кнопка чата)
- Данные курсов: `WaveDrawer` получает `courses` как prop из родительского layout (Server Component делает запрос, передаёт вниз)

---

## Фаза 4 — Публичные страницы

### `app/(public)/page.tsx` — Главная
- Hero: приветствие, статистика платформы (курсы, учеников, преподавателей) в `WaveCard`
- Каталог: сетка `WaveCard` с курсами, цвет карточки = категория
- CTA: кнопка «Начать обучение» с `wave-accent` gradient + glow

### `app/(public)/courses/page.tsx` — Каталог
- Фильтры категорий как `pill`-кнопки
- Сетка `WaveCard` — каждая карточка: обложка, название, прогресс (если куплен), цена

### `app/(public)/courses/[slug]/page.tsx` — Страница курса
- Hero с волновым градиентом в цвет курса
- Программа курса, блок преподавателя, кнопка покупки

---

## Фаза 5 — Дашборд ученика

### `app/(dashboard)/page.tsx`
- Персональный дашборд: приветствие, прогресс-кольца (SVG), карточки «продолжить курс»
- Волновой прогресс-бар: SVG-волна, заполнение = % прогресса

### `app/(dashboard)/lessons/[id]/page.tsx`
- Видеоплеер с волновым индикатором прогресса под плеером
- Список глав слева/снизу

---

## Фаза 6 — Мобайл

### `components/layout/MobileNav.tsx`
- `position: fixed`, `bottom: 0`, только `< md`
- 4 кнопки: Главная / Курсы / Прогресс / Профиль
- Активная кнопка: `wave-accent` цвет + тонкая линия сверху

### Адаптив
- `WaveCard` на мобиле: горизонтальный layout (обложка слева 80px, текст справа)
- `OceanBackground`: на мобиле `wl4` и `wl5` отключены (opacity: 0) для экономии GPU

---

## Бренд и i18n

- `messages/ru.json`: заменить все вхождения названия платформы на `WisdomWave`
- `app/layout.tsx` `<title>`: `WisdomWave — Образовательная платформа`
- `<meta name="description">`: обновить под новый бренд

---

## Ограничения и совместимость

- Только Tailwind — никаких inline styles в новых компонентах (кроме динамических CSS-переменных `waveColor`)
- `OceanBackground` — Server Component недопустим, только `'use client'`
- `WaveCard` может быть Server Component если нет `onClick`
- Dark mode: только через `next-themes` CSS-переменные, никаких `#hex` напрямую
- Все строки через `next-intl` ключи, никакого хардкода текста
