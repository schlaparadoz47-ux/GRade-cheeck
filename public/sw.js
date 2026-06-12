/* Service Worker für Grade-Check Vault */
const CACHE_NAME = 'gradecheck-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/src/main.js',
  '/manifest.webmanifest'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(cacheNames
        .filter(name => name !== CACHE_NAME)
        .map(name => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  
  /* API-Anfragen: online first, dann offline cache */
  if (request.url.includes('api.tcgdex.net') || request.url.includes('api.pokemontcg.io')) {
    return event.respondWith(
      fetch(request)
        .then(response => {
          const cache = caches.open(CACHE_NAME);
          cache.then(c => c.put(request, response.clone()));
          return response;
        })
        .catch(() => caches.match(request))
    );
  }
  
  /* Statische Assets: offline first, dann online */
  event.respondWith(
    caches.match(request)
      .then(response => response || fetch(request))
      .catch(() => new Response('Offline'))
  );
});
