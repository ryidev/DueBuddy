'use client'

import { useEffect, useState } from 'react'

// Safely convert base64 VAPID key to Uint8Array (required by PushManager)
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const output = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    output[i] = rawData.charCodeAt(i)
  }
  return output
}

function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

type Status = 'loading' | 'unsupported' | 'denied' | 'subscribed' | 'unsubscribed' | 'error'

export function PushSubscription() {
  const [status, setStatus] = useState<Status>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!isPushSupported()) {
      setStatus('unsupported')
      return
    }
    checkExistingSubscription()
  }, [])

  const checkExistingSubscription = async () => {
    try {
      const reg = await navigator.serviceWorker.getRegistration()
      if (!reg) {
        setStatus('unsubscribed')
        return
      }
      const sub = await reg.pushManager.getSubscription()
      setStatus(sub ? 'subscribed' : 'unsubscribed')
    } catch {
      setStatus('unsubscribed')
    }
  }

  const subscribe = async () => {
    if (!isPushSupported()) return

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!vapidKey) {
      setStatus('error')
      setErrorMsg('VAPID public key belum dikonfigurasi.')
      return
    }

    setBusy(true)
    try {
      // 1. Request browser permission
      const permission = await Notification.requestPermission()
      if (permission === 'denied') {
        setStatus('denied')
        setBusy(false)
        return
      }
      if (permission !== 'granted') {
        setBusy(false)
        return
      }

      // 2. Register SW if not yet registered
      if (!navigator.serviceWorker.controller) {
        await navigator.serviceWorker.register('/sw.js', { scope: '/' })
      }

      // 3. Wait until SW is truly active
      const reg = await navigator.serviceWorker.ready

      // 4. Subscribe with converted VAPID key
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })

      // 5. Save subscription to server
      const keys = sub.toJSON().keys
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint, keys }),
      })

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`)
      }

      setStatus('subscribed')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setStatus('error')
      setErrorMsg(msg)
    } finally {
      setBusy(false)
    }
  }

  const unsubscribe = async () => {
    setBusy(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        const endpoint = sub.endpoint
        await sub.unsubscribe()
        fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint }),
        }).catch(() => {/* fire and forget */})
      }
      setStatus('unsubscribed')
    } catch {
      setStatus('unsubscribed')
    } finally {
      setBusy(false)
    }
  }

  // --- Renders ---

  if (status === 'loading') {
    return (
      <button disabled className="px-4 py-2 rounded-lg text-sm text-text-muted bg-black/5 dark:bg-white/5">
        Memuat...
      </button>
    )
  }

  if (status === 'unsupported') {
    return (
      <span className="text-xs text-text-muted px-3 py-1.5 rounded-lg bg-black/5 dark:bg-white/5">
        Tidak didukung browser ini
      </span>
    )
  }

  if (status === 'denied') {
    return (
      <span className="text-xs text-amber-600 dark:text-amber-400 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700">
        Izin notifikasi ditolak. Aktifkan di pengaturan browser.
      </span>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col gap-2">
        <span className="text-xs text-red-500 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          {errorMsg || 'Gagal mengaktifkan notifikasi'}
        </span>
        <button onClick={subscribe} disabled={busy} className="text-xs text-text-muted underline">
          Coba lagi
        </button>
      </div>
    )
  }

  if (status === 'subscribed') {
    return (
      <button
        onClick={unsubscribe}
        disabled={busy}
        className="px-4 py-2 rounded-lg text-sm font-medium bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40 transition-colors disabled:opacity-50"
      >
        {busy ? 'Menonaktifkan...' : '🔔 Notifikasi Aktif'}
      </button>
    )
  }

  // 'unsubscribed'
  return (
    <button
      onClick={subscribe}
      disabled={busy}
      className="px-4 py-2 rounded-lg text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:opacity-50"
    >
      {busy ? 'Mengaktifkan...' : '🔔 Aktifkan Notifikasi'}
    </button>
  )
}
