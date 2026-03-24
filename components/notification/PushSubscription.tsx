'use client'

import { useEffect, useState } from 'react'

export function PushSubscription() {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkSubscription()
  }, [])

  const checkSubscription = async () => {
    try {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()
        setIsSubscribed(!!subscription)
      }
    } catch (err) {
      console.error('Error checking subscription:', err)
      setError('Push notifications not supported in this browser')
    } finally {
      setLoading(false)
    }
  }

  const subscribe = async () => {
    try {
      if (!('serviceWorker' in navigator)) {
        setError('Service workers are not supported in your browser')
        return
      }

      if (!('PushManager' in window)) {
        setError('Push notifications are not supported in your browser')
        return
      }

      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidPublicKey) {
        setError('VAPID public key not configured')
        return
      }

      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      })
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey,
      })

      // Send subscription to server
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.toJSON().keys?.p256dh,
            auth: subscription.toJSON().keys?.auth,
          },
        }),
      })

      if (response.ok) {
        setIsSubscribed(true)
        setError(null)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to subscribe')
      }
    } catch (err) {
      console.error('Error subscribing to push notifications:', err)
      setError('Failed to subscribe to notifications')
    }
  }

  const unsubscribe = async () => {
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        await subscription.unsubscribe()

        // Remove from server
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        })

        setIsSubscribed(false)
        setError(null)
      }
    } catch (err) {
      console.error('Error unsubscribing from push notifications:', err)
      setError('Failed to unsubscribe')
    }
  }

  if (error) {
    return (
      <div className="text-sm text-red-600 dark:text-red-400">
        {error}
      </div>
    )
  }

  if (loading) {
    return <div className="text-sm text-zinc-500">Loading...</div>
  }

  return (
    <button
      onClick={isSubscribed ? unsubscribe : subscribe}
      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
        isSubscribed
          ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400'
          : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
      }`}
    >
      {isSubscribed ? 'Notifications On' : 'Enable Notifications'}
    </button>
  )
}
