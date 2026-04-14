import { db } from '@/lib/db/client'

/**
 * Расчёт ежемесячных выплат преподавателям.
 * Запускается в конце каждого месяца (cron).
 */
export async function processMonthlyPayouts(): Promise<void> {
  const now = new Date()

  // Период: первый и последний день прошлого месяца
  const periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const periodEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)

  const feePercent = parseInt(process.env.PLATFORM_FEE_PERCENT ?? '20', 10)
  const teacherShare = 1 - feePercent / 100

  const monthLabel = periodStart.toLocaleString('ru-RU', { month: 'long', year: 'numeric' })

  console.log(`[payouts] Начало расчёта выплат за ${monthLabel}`)

  const teachers = await db.profile.findMany({
    where: { role: 'teacher', is_active: true },
    select: { id: true, name: true },
  })

  console.log(`[payouts] Найдено преподавателей: ${teachers.length}`)

  for (const teacher of teachers) {
    try {
      const revenueAgg = await db.purchase.aggregate({
        where: {
          product: { creator_id: teacher.id },
          created_at: { gte: periodStart, lte: periodEnd },
        },
        _sum: { amount: true },
      })

      const totalRevenue = revenueAgg._sum.amount ?? 0

      if (totalRevenue <= 0) {
        console.log(`[payouts] ${teacher.name}: выручки нет, пропускаем`)
        continue
      }

      const payoutAmount = Math.floor(totalRevenue * teacherShare)

      await db.teacherPayout.create({
        data: {
          teacher_id: teacher.id,
          amount: payoutAmount,
          period_start: periodStart,
          period_end: periodEnd,
          status: 'pending',
        },
      })

      const amountRub = (payoutAmount / 100).toLocaleString('ru-RU', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })

      await db.notification.create({
        data: {
          user_id: teacher.id,
          type: 'payout',
          title_ru: 'Выплата рассчитана',
          body_ru: `Выплата за ${monthLabel}: ${amountRub} ₽. Поступит в течение 3 рабочих дней.`,
        },
      })

      console.log(`[payouts] ${teacher.name}: выплата ${amountRub} ₽ создана`)
    } catch (err) {
      console.error(`[payouts] Ошибка при обработке преподавателя ${teacher.id}:`, err)
    }
  }

  console.log(`[payouts] Расчёт выплат завершён`)
}
