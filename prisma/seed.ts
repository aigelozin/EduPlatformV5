import { PrismaClient, Role, ProductType, VideoSource, PaymentProvider } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // ─── Categories ─────────────────────────────────────────────────────────────
  const categories = await Promise.all([
    db.category.upsert({
      where: { slug: 'yoga' },
      update: {},
      create: { slug: 'yoga', name_ru: 'Йога', sort_order: 1 },
    }),
    db.category.upsert({
      where: { slug: 'massage' },
      update: {},
      create: { slug: 'massage', name_ru: 'Массаж', sort_order: 2 },
    }),
    db.category.upsert({
      where: { slug: 'fitness' },
      update: {},
      create: { slug: 'fitness', name_ru: 'Фитнес', sort_order: 3 },
    }),
    db.category.upsert({
      where: { slug: 'creativity' },
      update: {},
      create: { slug: 'creativity', name_ru: 'Творчество', sort_order: 4 },
    }),
    db.category.upsert({
      where: { slug: 'business' },
      update: {},
      create: { slug: 'business', name_ru: 'Бизнес', sort_order: 5 },
    }),
  ])

  console.log('✅ Categories created:', categories.length)

  // ─── Users ──────────────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('admin123', 12)
  const teacherPassword = await bcrypt.hash('teacher123', 12)
  const studentPassword = await bcrypt.hash('student123', 12)

  const admin = await db.profile.upsert({
    where: { email: 'admin@eduplatform.ru' },
    update: {},
    create: {
      email: 'admin@eduplatform.ru',
      password_hash: adminPassword,
      name: 'Администратор',
      role: Role.admin,
    },
  })

  const teacher = await db.profile.upsert({
    where: { email: 'teacher@eduplatform.ru' },
    update: {},
    create: {
      email: 'teacher@eduplatform.ru',
      password_hash: teacherPassword,
      name: 'Анна Иванова',
      role: Role.teacher,
      bio_ru: 'Сертифицированный преподаватель йоги с 10-летним опытом',
    },
  })

  const student = await db.profile.upsert({
    where: { email: 'student@eduplatform.ru' },
    update: {},
    create: {
      email: 'student@eduplatform.ru',
      password_hash: studentPassword,
      name: 'Иван Петров',
      role: Role.student,
    },
  })

  console.log('✅ Users created:', { admin: admin.email, teacher: teacher.email, student: student.email })

  // ─── Products ────────────────────────────────────────────────────────────────
  const lesson = await db.product.upsert({
    where: { slug: 'yoga-morning-practice' },
    update: {},
    create: {
      slug: 'yoga-morning-practice',
      type: ProductType.lesson,
      title_ru: 'Утренняя йога — пробуждение',
      description_ru: 'Мягкая практика для начала дня. 30 минут.',
      price: 49900, // 499 руб
      video_source: VideoSource.vk,
      video_id: 'example_vk_video_id',
      moderation_status: 'approved',
      is_active: true,
      creator_id: teacher.id,
      category_id: categories[0].id,
    },
  })

  const course = await db.product.upsert({
    where: { slug: 'yoga-beginner-course' },
    update: {},
    create: {
      slug: 'yoga-beginner-course',
      type: ProductType.course,
      title_ru: 'Йога для начинающих — 30 дней',
      description_ru: 'Полный курс для тех, кто только начинает практику.',
      price: 299900, // 2999 руб
      moderation_status: 'approved',
      is_active: true,
      creator_id: teacher.id,
      category_id: categories[0].id,
    },
  })

  const physicalBook = await db.product.upsert({
    where: { slug: 'yoga-book-asanas' },
    update: {},
    create: {
      slug: 'yoga-book-asanas',
      type: ProductType.physical_book,
      title_ru: 'Асаны йоги — иллюстрированное руководство',
      description_ru: 'Печатная книга с описанием 108 асан.',
      price: 89900, // 899 руб
      moderation_status: 'approved',
      is_active: true,
      creator_id: teacher.id,
      category_id: categories[0].id,
    },
  })

  const subscriptionPlan = await db.product.upsert({
    where: { slug: 'yoga-subscription-monthly' },
    update: {},
    create: {
      slug: 'yoga-subscription-monthly',
      type: ProductType.subscription_plan,
      title_ru: 'Подписка — Йога (месяц)',
      description_ru: 'Доступ ко всем урокам категории Йога на 30 дней.',
      price: 149900, // 1499 руб
      moderation_status: 'approved',
      is_active: true,
      creator_id: teacher.id,
      category_id: categories[0].id,
    },
  })

  console.log('✅ Products created')

  // ─── Lessons for course ──────────────────────────────────────────────────────
  await db.lesson.createMany({
    skipDuplicates: true,
    data: [
      {
        product_id: course.id,
        title_ru: 'Введение — что такое йога',
        video_source: VideoSource.rutube,
        video_id: 'example_rutube_id_1',
        duration_sec: 600,
        sort_order: 1,
        is_free: true,
      },
      {
        product_id: course.id,
        title_ru: 'Урок 1 — Дыхание пранаяма',
        video_source: VideoSource.vk,
        video_id: 'example_vk_id_2',
        duration_sec: 1800,
        sort_order: 2,
      },
      {
        product_id: course.id,
        title_ru: 'Урок 2 — Базовые асаны',
        video_source: VideoSource.vk,
        video_id: 'example_vk_id_3',
        duration_sec: 2400,
        sort_order: 3,
      },
    ],
  })

  console.log('✅ Lessons created')

  // ─── Payment methods config ──────────────────────────────────────────────────
  await db.paymentMethodsConfig.createMany({
    skipDuplicates: true,
    data: [
      {
        provider: PaymentProvider.yookassa,
        is_active: true,
        config: { name_ru: 'Банковская карта / СБП / ЮMoney' },
      },
      {
        provider: PaymentProvider.cryptocloud,
        is_active: true,
        config: { name_ru: 'Криптовалюта (USDT, BTC, ETH)' },
      },
      {
        provider: PaymentProvider.mir_pay,
        is_active: true,
        config: { name_ru: 'МИР Pay' },
      },
    ],
  })

  console.log('✅ Payment methods config created')
  console.log('🎉 Seed complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
