const CACHE_NAME = 'bongshai-cache-v5';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/global-upgrades.js',
  '/js/bd-geo-data.js',
  '/js/bangla-translation.js',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const requestURL = new URL(event.request.url);

  // Cache-First for images, css, fonts, and js (stale-while-revalidate pattern)
  if (requestURL.pathname.match(/\.(png|jpg|jpeg|webp|svg|css|js|woff2)$/)) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        const fetchPromise = fetch(event.request).then(networkResponse => {
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, networkResponse.clone());
          });
          return networkResponse;
        }).catch(() => {}); // Ignore network errors in background
        return cachedResponse || fetchPromise;
      })
    );
  } else {
    // Network-First for HTML documents and other dynamic content
    event.respondWith(
      fetch(event.request).then(response => {
        const resClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, resClone);
        });
        return response;
      }).catch(() => {
        return caches.match(event.request);
      })
    );
  }
});
