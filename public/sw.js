const CACHE = 'neetirth-shell-v1'
const SHELL = ['/', '/index.html', '/manifest.webmanifest']

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()))
})

self.addEventListener('fetch', event => {
  const request = event.request
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return

  const isDocument = request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname === '/'
  if (isDocument) {
    // HTML is network-first so a new Vercel deployment is picked up quickly;
    // the cached shell is only the offline fallback.
    event.respondWith(fetch(request).then(response => {
      if (response.ok) caches.open(CACHE).then(cache => cache.put(request, response.clone()))
      return response
    }).catch(() => caches.match(request).then(cached => cached || caches.match('/index.html'))))
    return
  }

  // Hashed JS/CSS and public assets are cache-first after the first visit.
  event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
    if (response.ok) caches.open(CACHE).then(cache => cache.put(request, response.clone()))
    return response
  })))
})
