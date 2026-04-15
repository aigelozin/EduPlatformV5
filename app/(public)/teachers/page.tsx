import type { Metadata } from 'next'
import { db } from '@/lib/db/client'

export const metadata: Metadata = {
  title: 'Преподаватели | EduPlatform',
  description: 'Познакомьтесь с нашими преподавателями — экспертами по йоге, массажу, фитнесу, творчеству и бизнесу.',
}

export default async function TeachersPage() {
  type TeacherPublic = {
    id: string
    name: string
    email: string
    avatar_url: string | null
    bio_ru: string | null
    _count: { products: number }
  }

  let teachers: TeacherPublic[] = []
  try {
    teachers = await db.profile.findMany({
      where: { role: 'teacher', is_active: true },
      include: { _count: { select: { products: { where: { is_active: true, moderation_status: 'approved' } } } } },
      orderBy: { created_at: 'asc' },
    }) as unknown as TeacherPublic[]
  } catch {
    // DB unavailable — show empty state
  }

  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold mb-2">Наши преподаватели</h1>
      <p className="text-muted-foreground mb-10">Эксперты, которые помогут вам достичь ваших целей</p>

      {teachers.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-xl">Преподаватели скоро появятся</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {teachers.map((teacher) => (
            <div key={teacher.id} className="rounded-xl border p-6 bg-background hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                {teacher.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={teacher.avatar_url}
                    alt={teacher.name}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                    {teacher.name[0]}
                  </div>
                )}
                <div>
                  <h3 className="font-semibold">{teacher.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {teacher._count.products} {teacher._count.products === 1 ? 'курс' : teacher._count.products < 5 ? 'курса' : 'курсов'}
                  </p>
                </div>
              </div>
              {teacher.bio_ru && (
                <p className="text-sm text-muted-foreground line-clamp-3">{teacher.bio_ru}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
