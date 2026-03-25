import { createClient } from '@/lib/supabase/server'
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

export async function triggerDeadlineNotifications() {
  const supabase = await createClient()

  // Get tasks with deadlines approaching (within 24 hours)
  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title, deadline, classroom_id')
    .gte('deadline', new Date().toISOString())
    .lte('deadline', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString())

  if (!tasks) return

  // For each task, get classroom members
  for (const task of tasks) {
    const { data: members } = await supabase
      .from('classroom_members')
      .select('profile_id')
      .eq('classroom_id', task.classroom_id)

    if (!members) continue

    const profileIds = members.map(m => m.profile_id)

    // Get push subscriptions for members who haven't completed the task
    const { data: completedProfiles } = await supabase
      .from('task_completions')
      .select('profile_id')
      .eq('task_id', task.id)

    const completedIds = completedProfiles?.map(c => c.profile_id) || []
    const pendingIds = profileIds.filter(id => !completedIds.includes(id))

    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('profile_id', pendingIds)

    if (!subscriptions || subscriptions.length === 0) continue

    // Send notifications
    const results = await Promise.allSettled(
      subscriptions.map(sub =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: sub.keys as { p256dh: string; auth: string },
          },
          JSON.stringify({
            title: 'Deadline Approaching!',
            message: `"${task.title}" is due soon. Don't forget to complete it!`,
          })
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
  }
}

export async function triggerTaskCompletionNotifications(taskId: string) {
  const supabase = await createClient()

  // Get task details
  const { data: task } = await supabase
    .from('tasks')
    .select('id, title, classroom_id')
    .eq('id', taskId)
    .single()

  if (!task) return

  // Get classroom members
  const { data: members } = await supabase
    .from('classroom_members')
    .select('profile_id')
    .eq('classroom_id', task.classroom_id)

  if (!members) return

  const profileIds = members.map(m => m.profile_id)

  // Get all subscriptions
  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('*')
    .in('profile_id', profileIds)

  if (!subscriptions || subscriptions.length === 0) return

  // Send notifications
  await Promise.allSettled(
    subscriptions.map(sub =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: sub.keys as { p256dh: string; auth: string },
        },
        JSON.stringify({
          title: 'Task Completed!',
          message: `Someone just completed "${task.title}". Keep up the momentum!`,
        })
      )
    )
  )
}
