const CACHE_NAME = 'ventech-erp-v4';
const OFFLINE_URL = '/offline';

const STATIC_ASSETS = [
  '/',
  '/pos',
  '/offline',
  '/manifest.json',
];

// Install: precachear assets principales
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: limpiar caches viejos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: Strategy Network First, fallback a cache (Offline First POS)
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Bypass: next.js internal / API calls usan red directa
  if (url.pathname.startsWith('/_next/') || url.pathname.startsWith('/api/')) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Guardar una copia en cache
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // Offline: servir desde cache o página offline
        return caches.match(request).then((cached) => {
          return cached || caches.match(OFFLINE_URL);
        });
      })
  );
});

// Push notifications support
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'VENTECH ERP', {
      body: data.body ?? 'Nueva notificación',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
    })
  );
});
