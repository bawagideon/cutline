// Cutline Studio PWA Service Worker — Strict Private Cache Isolation
const CACHE_NAME = 'cutline-static-v2';

// Only public, static, non-authenticated shell assets
const STATIC_ASSETS = [
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/offline.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Pre-cache partial fail:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Purge cache message handler for clean sign-out
self.addEventListener('message', (event) => {
  if (event.data && (event.data.type === 'PURGE_PRIVATE_CACHE' || event.data.type === 'LOGOUT')) {
    event.waitUntil(
      caches.keys().then((keys) => {
        return Promise.all(keys.map((key) => caches.delete(key)));
      })
    );
  }
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. NEVER cache mutations or non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // 2. NEVER cache authenticated APIs, RSC payloads, or private user requests
  if (
    url.pathname.startsWith('/api/') ||
    url.searchParams.has('_rsc') ||
    url.pathname.includes('/_next/data/')
  ) {
    return;
  }

  // 3. Navigation requests: Network-first, offline fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/offline.html').then((offlineResponse) => {
          return offlineResponse || new Response('Offline — Cutline Studio', {
            status: 503,
            headers: { 'Content-Type': 'text/html' }
          });
        });
      })
    );
    return;
  }

  // 4. Cache-first ONLY for immutable static assets (_next/static, public icons)
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return networkResponse;
        });
      })
    );
    return;
  }
});
