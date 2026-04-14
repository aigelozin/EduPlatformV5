import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const RunCronSchema = z.object({
  job: z.enum(['payouts', 'subscription_reminders']),
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = RunCronSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ data: null, error: 'Invalid job name' }, { status: 400 })
  }

  const { job } = parsed.data

  try {
    if (job === 'payouts') {
      const { processMonthlyPayouts } = await import('@/lib/cron/payouts')
      await processMonthlyPayouts()
      return NextResponse.json({ data: { message: 'Выплаты рассчитаны' }, error: null })
    }

    if (job === 'subscription_reminders') {
      const { sendSubscriptionReminders } = await import('@/lib/cron/subscriptionReminder')
      await sendSubscriptionReminders()
      return NextResponse.json({ data: { message: 'Напоминания отправлены' }, error: null })
    }
  } catch (err) {
    console.error(`[Cron] Job ${job} failed:`, err)
    return NextResponse.json({ data: null, error: 'Job failed' }, { status: 500 })
  }

  return NextResponse.json({ data: null, error: 'Unknown job' }, { status: 400 })
}
