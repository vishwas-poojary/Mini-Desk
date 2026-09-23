const sw = self as any;
const CACHE_NAME = 'minidesk-cache-v1';
const STATIC_ASSETS = ['/', '/index.html'];

sw.addEventListener('install', (event: any) => {
  console.log('[ServiceWorker] Installing new service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  sw.skipWaiting();
});

sw.addEventListener('activate', (event: any) => {
  console.log('[ServiceWorker] Activating service worker...');
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
  sw.clients.claim();
});

// Fetch strategy: Network first with Cache fallback for navigation requests
sw.addEventListener('fetch', (event: any) => {
  if (event.request && event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match('/index.html');
        return cachedResponse || new Response('Offline', { status: 503 });
      })
    );
  }
});
