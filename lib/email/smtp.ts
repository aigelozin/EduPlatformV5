import nodemailer from 'nodemailer'

// ─── Singleton transporter ─────────────────────────────────────────────────────

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? 'smtp.beget.com',
  port: Number(process.env.SMTP_PORT ?? 465),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

// ─── HTML wrapper ──────────────────────────────────────────────────────────────

function wrapHtml(subject: string, body: string): string {
  return `<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #1a1a1a;">${subject}</h1>
  ${body}
  <p style="color: #666; font-size: 12px;">© 2026 EduPlatform. Все права защищены.</p>
</body>
</html>`
}

// ─── Core send ─────────────────────────────────────────────────────────────────

interface SendEmailParams {
  to: { name: string; email: string }
  subject: string
  html: string
}

async function sendEmail({ to, subject, html }: SendEmailParams): Promise<void> {
  await transporter.sendMail({
    from: `"${process.env.SMTP_FROM ?? 'EduPlatform'}" <${process.env.SMTP_USER}>`,
    to: `"${to.name}" <${to.email}>`,
    subject,
    html,
  })
}

// ─── Exported fallback functions ───────────────────────────────────────────────

export async function sendWelcomeEmailSmtp(to: { email: string; name: string }): Promise<void> {
  const subject = `Добро пожаловать, ${to.name}!`
  const html = wrapHtml(
    subject,
    `<p>Рады приветствовать вас на EduPlatform — платформе для обучения у лучших преподавателей России.</p>
     <p>Начните изучение прямо сейчас: перейдите в <a href="${process.env.NEXT_PUBLIC_APP_URL}/catalog">каталог курсов</a>.</p>`,
  )
  await sendEmail({ to, subject, html })
}

export async function sendOrderConfirmationEmailSmtp(
  to: { email: string; name: string },
  order: {
    id: string
    total_amount: number
    items: Array<{ title_ru: string; quantity: number; price: number }>
  },
): Promise<void> {
  const subject = `Заказ #${order.id} подтверждён`
  const itemRows = order.items
    .map(
      (item) =>
        `<tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.title_ru}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${(item.price / 100).toFixed(2)} ₽</td>
        </tr>`,
    )
    .join('')

  const html = wrapHtml(
    subject,
    `<p>Ваш заказ успешно оформлен. Спасибо, ${to.name}!</p>
     <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
       <thead>
         <tr style="background: #f5f5f5;">
           <th style="padding: 8px; text-align: left;">Товар</th>
           <th style="padding: 8px; text-align: center;">Кол-во</th>
           <th style="padding: 8px; text-align: right;">Цена</th>
         </tr>
       </thead>
       <tbody>${itemRows}</tbody>
       <tfoot>
         <tr>
           <td colspan="2" style="padding: 8px; font-weight: bold;">Итого</td>
           <td style="padding: 8px; text-align: right; font-weight: bold;">${(order.total_amount / 100).toFixed(2)} ₽</td>
         </tr>
       </tfoot>
     </table>
     <p>Следить за статусом заказа можно в <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/orders">личном кабинете</a>.</p>`,
  )
  await sendEmail({ to, subject, html })
}

export async function sendSubscriptionExpiryEmailSmtp(
  to: { email: string; name: string },
  subscriptionName: string,
  expiresAt: Date,
): Promise<void> {
  const subject = `Подписка «${subscriptionName}» скоро истекает`
  const dateStr = expiresAt.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const html = wrapHtml(
    subject,
    `<p>Уважаемый(ая) ${to.name},</p>
     <p>Ваша подписка «${subscriptionName}» истекает <strong>${dateStr}</strong>.</p>
     <p>Чтобы не потерять доступ к материалам, продлите подписку заранее:</p>
     <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/subscriptions" style="background: #4f46e5; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none;">Продлить подписку</a></p>`,
  )
  await sendEmail({ to, subject, html })
}

export async function sendPayoutNotificationEmailSmtp(
  to: { email: string; name: string },
  amount: number,
): Promise<void> {
  const subject = 'Выплата зачислена'
  const amountStr = (amount / 100).toFixed(2)
  const html = wrapHtml(
    subject,
    `<p>Здравствуйте, ${to.name}!</p>
     <p>На ваш счёт зачислена выплата на сумму <strong>${amountStr} ₽</strong>.</p>
     <p>Подробности — в разделе <a href="${process.env.NEXT_PUBLIC_APP_URL}/teacher/payouts">Выплаты</a> личного кабинета преподавателя.</p>`,
  )
  await sendEmail({ to, subject, html })
}
