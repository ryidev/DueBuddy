// DeadlineFocus Service Worker for Push Notifications
console.log('[SW] Service Worker loaded')

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event)

  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch (e) {
    console.warn('[SW] Error parsing push data:', e)
    data = event.data ? { message: event.data.toString() } : {}
  }

  const title = data.title || 'DeadlineFocus'
  const message = data.message || 'New notification'

  const options = {
    body: message,
    icon: '/icon-192x192.svg',
    badge: '/badge-72x72.svg',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    tag: 'deadlinefocus-notification',
    renotify: true,
    requireInteraction: false,
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
      .then((notification) => {
        console.log('[SW] Notification shown:', notification)
      })
      .catch((err) => {
        console.error('[SW] Error showing notification:', err)
      })
  )
})

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action)

  event.notification.close()

  if (event.action === 'explore') {
    event.waitUntil(
      clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      }).then((clientList) => {
        // Try to open existing window
        for (const client of clientList) {
          if (client.url.includes('/') && 'focus' in client) {
            return client.focus()
          }
        }
        // If no focused window, open new one
        return clients.openWindow('/')
      })
    )
  }
})

// Skip waiting and activate immediately
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...')
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...')
  self.clients.claim()
})

console.log('[SW] Event listeners registered')
