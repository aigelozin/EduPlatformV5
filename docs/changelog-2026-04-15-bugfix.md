# Changelog 2026-04-15 — Bug Fixes & TypeScript

## Bug Fixes (local, no deploy needed)
- Fixed 500 errors on teacher/dashboard pages: added try/catch DB fallback pattern
- Created missing pages: /become-teacher, /checkout, /teacher/orders, /teacher/products/[id]/edit
- Created missing API routes: /api/categories, /api/teacher/products/[id]
- Fixed "В корзину" button: AddToCartButton client component + CartProvider in public layout
- Added Продажи link to teacher sidebar nav
- Removed dead "Забыли пароль?" link from login page

## TypeScript Fixes (0 errors remaining)
- Added explicit typed locals for all Prisma queries with includes (as unknown as T[] pattern)
- Created types/next-auth.d.ts to extend NextAuth User/Session/JWT with id and role fields
- Fixed PaginatedResponse meta: added page/per_page/total_pages fields in teacher lessons API
- Fixed subscriptions page: plan.product?.category (nullable optional chaining)
- Fixed orders API: Prisma.DbNull for nullable JSON delivery_address field; typed OrderCreated
- Fixed subscriptionReminder cron: moved link to data JSON field (not in Notification schema)
- Fixed test setup: explicit vitest imports for beforeAll/afterAll
- Fixed test mock: double cast (as unknown as) for Prisma mock type
- Excluded vitest configs from tsconfig (vite version mismatch with vite-tsconfig-paths)
