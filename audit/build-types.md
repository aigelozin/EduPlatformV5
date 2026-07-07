# Аудит: Сборка и типы

**Дата:** 2026-07-08
**Критичность:** НЕКРИТИЧНО — 0 ошибок TypeScript, 3 предупреждения ESLint (только warnings, не errors)

---

## Резюме

| Инструмент | Ошибки | Предупреждения |
|---|---|---|
| tsc --noEmit (type-check) | 0 | 0 |
| next lint (ESLint) | 0 | 3 |

Проект проходит сборку без ошибок. Предупреждения ESLint — использование `<img>` вместо `<Image />` из next/image (предупреждение `@next/next/no-img-element`). Не блокируют деплой.

---

## 1. npm run type-check

**Команда:** `tsc --noEmit`

```
> eduplatform-rf@1.0.0 type-check
> tsc --noEmit
```

**Результат:** 0 ошибок, 0 предупреждений. Чисто.

---

## 2. npm run lint

**Команда:** `next lint`

```
> eduplatform-rf@1.0.0 lint
> next lint


./app/(admin)/admin/teachers/[id]/page.tsx
58:13  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element

./app/(dashboard)/dashboard/page.tsx
174:23  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element

./app/(dashboard)/dashboard/progress/page.tsx
77:19  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element

info  - Need to disable some ESLint rules? Learn more here: https://nextjs.org/docs/basic-features/eslint#disabling-rules
```

**Результат:** 0 errors, 3 warnings.

### Детализация предупреждений

| Файл | Строка | Правило | Описание |
|---|---|---|---|
| `app/(admin)/admin/teachers/[id]/page.tsx` | 58:13 | `@next/next/no-img-element` | `<img>` вместо `<Image />` |
| `app/(dashboard)/dashboard/page.tsx` | 174:23 | `@next/next/no-img-element` | `<img>` вместо `<Image />` |
| `app/(dashboard)/dashboard/progress/page.tsx` | 77:19 | `@next/next/no-img-element` | `<img>` вместо `<Image />` |

---

## Вывод

**Деплой не заблокирован.** Все предупреждения ESLint касаются оптимизации изображений (LCP/bandwidth). Рекомендуется заменить `<img>` на `<Image />` из `next/image` после деплоя для улучшения производительности.
