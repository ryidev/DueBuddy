import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import webpush from 'web-push'

// Configure VAPID safely
const vapidEmail = process.env.VAPID_EMAIL || 'mailto:deadlinefocus@example.com'
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey)
} else {
  console.warn('VAPID keys missing. Push notifications will not be active.')
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()
  const { classroom_id, title, message } = body

  if (!classroom_id || !title || !message) {
    return NextResponse.json(
      { error: 'Missing required fields: classroom_id, title, message' },
      { status: 400 }
    )
  }

  // Get all subscriptions for classroom members
  const { data: members } = await supabase
    .from('classroom_members')
    .select('profile_id')
    .eq('classroom_id', classroom_id)

  if (!members) {
    return NextResponse.json({ error: 'No members found' }, { status: 404 })
  }

  const profileIds = members.map(m => m.profile_id)

  // Get push subscriptions
  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('*')
    .in('profile_id', profileIds)

  if (!subscriptions || subscriptions.length === 0) {
    return NextResponse.json({ success: true, message: 'No subscriptions' })
  }

  // Send push notifications
  const results = await Promise.allSettled(
    subscriptions.map(sub =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: sub.keys as { p256dh: string; auth: string },
        },
        JSON.stringify({ title, message })
      )
    )
  )

  // Remove failed subscriptions
  const failedSubscriptions = subscriptions.filter((_, i) =>
    results[i].status === 'rejected'
  )

  if (failedSubscriptions.length > 0) {
    await supabase
      .from('push_subscriptions')
      .delete()
      .in('endpoint', failedSubscriptions.map(s => s.endpoint))
  }

  return NextResponse.json({
    success: true,
    sent: results.filter(r => r.status === 'fulfilled').length,
    failed: failedSubscriptions.length,
  })
}
