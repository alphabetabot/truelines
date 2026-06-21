const CACHE_NAME = 'trueoddsiq-v22'
const STATIC_ASSETS = ['/']

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  )
  // Take over immediately without waiting
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  // Take control of all open tabs immediately
  self.clients.claim()
})

self.addEventListener('fetch', e => {
  // Never cache API calls — always fetch fresh
  if (
    e.request.url.includes('/api/') ||
    e.request.url.includes('odds-api') ||
    e.request.url.includes('statsapi') ||
    e.request.url.includes('anthropic') ||
    e.request.url.includes('openai')
  ) {
    e.respondWith(fetch(e.request))
    return
  }

  // For HTML pages — always go network first so updates show immediately
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match('/'))
    )
    return
  }

  // For JS/CSS assets — network first, fall back to cache
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone()
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone))
        return res
      })
      .catch(() => caches.match(e.request))
  )
})
