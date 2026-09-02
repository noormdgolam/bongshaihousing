const CACHE_NAME = 'bongshai-cache-v37';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/css/style.min.css?v=4.16',
  '/js/global-upgrades.min.js?v=3.15',
  '/js/bd-geo-data.js',
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

  // Ignore non-GET requests
  if (event.request.method !== 'GET') return;

  // Cache-First for images, css, fonts, and js (stale-while-revalidate pattern)
  if (requestURL.pathname.match(/\.(png|jpg|jpeg|webp|svg|css|js|woff2)$/)) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        const fetchPromise = fetch(event.request).then(networkResponse => {
          // Only cache real, successful responses - an error page (522/500/etc)
          // must never get written into the cache as if it were the real
          // asset, or every future load keeps serving that error forever.
          if (networkResponse && networkResponse.ok) {
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, networkResponse.clone());
            });
          }
          return networkResponse;
        }).catch(() => {}); // Ignore network errors in background
        return cachedResponse || fetchPromise;
      })
    );
  } else {
    // Network-First for HTML documents and other dynamic content
    event.respondWith(
      fetch(event.request).then(response => {
        // Same rule as above: never cache an error response as if it were
        // the real page - that would serve the error again on the next
        // offline/failed request instead of falling through correctly.
        if (response && response.ok) {
          const resClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, resClone);
          });
        }
        return response;
      }).catch(() => {
        // Network failed, try to get from cache
        return caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If it's a navigation request and not in cache, show offline page
          if (event.request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
          return new Response('', { status: 404, statusText: 'Not Found' });
        });
      })
    );
  }
});
