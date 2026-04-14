import { db } from '@/lib/db/client'

export async function sendSubscriptionReminders(): Promise<void> {
  const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
  const windowStart = new Date(threeDaysFromNow.getTime() - 60 * 60 * 1000)
  const windowEnd = new Date(threeDaysFromNow.getTime() + 60 * 60 * 1000)

  const expiring = await db.userSubscription.findMany({
    where: {
      is_active: true,
      expires_at: { gte: windowStart, lte: windowEnd },
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      subscription: { select: { name_ru: true } },
    },
  })

  console.log(`[SubscriptionReminder] Found ${expiring.length} expiring subscriptions`)

  for (const sub of expiring) {
    try {
      await db.notification.create({
        data: {
          user_id: sub.user_id,
          type: 'subscription_expiry',
          title_ru: 'Подписка истекает',
          body_ru: `Ваша подписка «${sub.subscription.name_ru}» истекает через 3 дня. Продлите, чтобы не потерять доступ.`,
          link: '/subscriptions',
        },
      })

      // Email через lib/email (lazy import во избежание циклических зависимостей)
      try {
        const { sendSubscriptionExpiryEmail } = await import('@/lib/email/index')
        await sendSubscriptionExpiryEmail(sub.user_id, sub.subscription.name_ru, sub.expires_at)
      } catch (emailErr) {
        console.error(`[SubscriptionReminder] Email failed for user ${sub.user_id}:`, emailErr)
      }
    } catch (err) {
      console.error(`[SubscriptionReminder] Failed for subscription ${sub.id}:`, err)
    }
  }

  console.log(`[SubscriptionReminder] Done`)
}
