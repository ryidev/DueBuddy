import { NextResponse } from 'next/server'
import { triggerDeadlineNotifications } from '@/lib/notifications/trigger'

export async function GET(request: Request) {
  // Verify cron job secret (optional, for security)
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await triggerDeadlineNotifications()

  return NextResponse.json({ success: true })
}
