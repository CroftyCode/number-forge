// Number Forge service worker.
// Job: make the app launch instantly and survive a flaky connection.
// It deliberately never caches Supabase traffic, because stale progress
// is worse than no progress.

// Everything is resolved against wherever this worker is served from, so
// the app works at a domain root or under a sub-path like /number-forge/.
const BASE = new URL('./', self.location).pathname

const SHELL = 'forge-shell-v2'
const RUNTIME = 'forge-runtime-v2'

const PRECACHE = [
  BASE,
  BASE + 'manifest.webmanifest',
  BASE + 'icon-192.png',
  BASE + 'icon-512.png',
  BASE + 'apple-touch-icon.png'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== SHELL && k !== RUNTIME).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Anything going to the database or the auth endpoint goes straight
  // to the network. No caching, no stale answers.
  if (url.hostname.endsWith('.supabase.co')) return

  // Page loads: try the network so he gets updates, fall back to cache.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone()
          caches.open(SHELL).then((c) => c.put(BASE, copy))
          return res
        })
        .catch(() => caches.match(BASE).then((r) => r || caches.match(request)))
    )
    return
  }

  // Built assets and fonts: cache first, they are hashed so they never go stale.
  if (url.origin === location.origin || url.hostname.includes('fonts.')) {
    event.respondWith(
      caches.match(request).then((hit) => {
        if (hit) return hit
        return fetch(request).then((res) => {
          if (res.ok) {
            const copy = res.clone()
            caches.open(RUNTIME).then((c) => c.put(request, copy))
          }
          return res
        })
      })
    )
  }
})
