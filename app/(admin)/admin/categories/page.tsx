import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db/client'
import { CategoryDeleteButton } from '@/components/admin/CategoryDeleteButton'

export const metadata: Metadata = { title: 'Категории — Администратор' }

const SUB_TYPE_LABEL: Record<string, string> = {
  theme: 'По теме',
  teacher: 'По преподавателю',
}

export default async function AdminCategoriesPage() {
  const session = await getSession()
  if (!session || session.role !== 'admin') redirect('/dashboard')

  type CatRow = {
    id: string
    slug: string
    name_ru: string
    brief_ru: string | null
    wave_color: string | null
    wave_accent: string | null
    icon_emoji: string | null
    parent_id: string | null
    sub_type: string | null
    is_active: boolean
    sort_order: number
    teacher: { name: string } | null
    children: { id: string; name_ru: string; sub_type: string | null; teacher: { name: string } | null }[]
    _count: { products: number }
  }

  let categories: CatRow[] = []
  try {
    categories = (await db.category.findMany({
      include: {
        teacher: { select: { name: true } },
        children: {
          include: { teacher: { select: { name: true } } },
          orderBy: { sort_order: 'asc' },
        },
        _count: { select: { products: true } },
      },
      orderBy: [{ sort_order: 'asc' }, { name_ru: 'asc' }],
    })) as CatRow[]
  } catch {
    // DB unavailable
  }

  const topLevel = categories.filter((c) => !c.parent_id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Категории</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Управление категориями и подкатегориями курсов
          </p>
        </div>
        <Link
          href="/admin/categories/new"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          + Создать
        </Link>
      </div>

      {categories.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
          <p className="text-lg">Категорий ещё нет</p>
          <Link href="/admin/categories/new" className="mt-3 inline-block text-primary hover:underline">
            Создать первую категорию
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Название / slug</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Слоган</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Цвет</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Подкат.</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Продукты</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Статус</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {topLevel.map((cat) => (
                <>
                  {/* Top-level row */}
                  <tr key={cat.id} className="bg-card hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {cat.icon_emoji && <span className="text-lg">{cat.icon_emoji}</span>}
                        <div>
                          <p className="font-semibold text-foreground">{cat.name_ru}</p>
                          <p className="text-[11px] text-muted-foreground">{cat.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="max-w-[180px] px-4 py-3">
                      <p className="truncate text-xs text-muted-foreground">{cat.brief_ru ?? '—'}</p>
                    </td>
                    <td className="px-4 py-3">
                      {cat.wave_color ? (
                        <div className="flex items-center gap-1.5">
                          <div
                            className="h-4 w-4 rounded-full border"
                            style={{ background: cat.wave_color }}
                            title={cat.wave_color}
                          />
                          {cat.wave_accent && (
                            <div
                              className="h-4 w-4 rounded-full border"
                              style={{ background: cat.wave_accent }}
                              title={cat.wave_accent}
                            />
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-medium">{cat.children.length}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-medium">{cat._count.products}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          cat.is_active
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {cat.is_active ? 'Активна' : 'Скрыта'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/admin/categories/${cat.id}`}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          Изменить
                        </Link>
                        <CategoryDeleteButton
                          categoryId={cat.id}
                          categoryName={cat.name_ru}
                          hasChildren={cat.children.length > 0}
                          hasProducts={cat._count.products > 0}
                        />
                      </div>
                    </td>
                  </tr>

                  {/* Child rows */}
                  {cat.children.map((child) => (
                    <tr key={child.id} className="bg-muted/10 hover:bg-muted/20">
                      <td className="py-2 pl-10 pr-4">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <span className="text-[11px]">└</span>
                          <div>
                            <p className="text-sm font-medium text-foreground">{child.name_ru}</p>
                            {child.sub_type && (
                              <p className="text-[10px] text-muted-foreground">
                                {SUB_TYPE_LABEL[child.sub_type] ?? child.sub_type}
                                {child.teacher && ` · ${child.teacher.name}`}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-xs text-muted-foreground" colSpan={4}>
                        {child.teacher ? `Преподаватель: ${child.teacher.name}` : ''}
                      </td>
                      <td />
                      <td className="px-4 py-2 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            href={`/admin/categories/${child.id}`}
                            className="text-xs font-medium text-primary hover:underline"
                          >
                            Изменить
                          </Link>
                          <CategoryDeleteButton
                            categoryId={child.id}
                            categoryName={child.name_ru}
                            hasChildren={false}
                            hasProducts={false}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
