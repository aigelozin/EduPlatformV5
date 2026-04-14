import {
  sendWelcomeEmail as sendWelcomeEmailSendPulse,
  sendOrderConfirmationEmail as sendOrderConfirmationEmailSendPulse,
  sendSubscriptionExpiryEmail as sendSubscriptionExpiryEmailSendPulse,
  sendPayoutNotificationEmail as sendPayoutNotificationEmailSendPulse,
} from './sendpulse'
import {
  sendWelcomeEmailSmtp,
  sendOrderConfirmationEmailSmtp,
  sendSubscriptionExpiryEmailSmtp,
  sendPayoutNotificationEmailSmtp,
} from './smtp'

// ─── Public API with SendPulse → SMTP fallback ────────────────────────────────

export async function sendWelcomeEmail(to: { email: string; name: string }): Promise<void> {
  try {
    await sendWelcomeEmailSendPulse(to)
  } catch (err) {
    console.error('[Email] SendPulse failed, falling back to SMTP:', err)
    await sendWelcomeEmailSmtp(to)
  }
}

export async function sendOrderConfirmationEmail(
  to: { email: string; name: string },
  order: {
    id: string
    total_amount: number
    items: Array<{ title_ru: string; quantity: number; price: number }>
  },
): Promise<void> {
  try {
    await sendOrderConfirmationEmailSendPulse(to, order)
  } catch (err) {
    console.error('[Email] SendPulse failed, falling back to SMTP:', err)
    await sendOrderConfirmationEmailSmtp(to, order)
  }
}

export async function sendSubscriptionExpiryEmail(
  userId: string,
  subscriptionName: string,
  expiresAt: Date,
): Promise<void> {
  try {
    await sendSubscriptionExpiryEmailSendPulse(userId, subscriptionName, expiresAt)
  } catch (err) {
    console.error('[Email] SendPulse failed, falling back to SMTP:', err)
    // SMTP fallback требует email и name — получаем из SendPulse ошибки мы не знаем их,
    // поэтому повторяем lookup через db напрямую
    const { db } = await import('@/lib/db/client')
    const profile = await db.profile.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    })
    if (!profile) throw new Error(`sendSubscriptionExpiryEmail fallback: profile not found for userId=${userId}`)
    await sendSubscriptionExpiryEmailSmtp(
      { email: profile.email, name: profile.name },
      subscriptionName,
      expiresAt,
    )
  }
}

export async function sendPayoutNotificationEmail(
  to: { email: string; name: string },
  amount: number,
): Promise<void> {
  try {
    await sendPayoutNotificationEmailSendPulse(to, amount)
  } catch (err) {
    console.error('[Email] SendPulse failed, falling back to SMTP:', err)
    await sendPayoutNotificationEmailSmtp(to, amount)
  }
}
