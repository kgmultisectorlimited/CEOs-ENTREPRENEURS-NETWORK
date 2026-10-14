const CACHE_NAME = 'kg-cec-network-shell-v2';
const OFFLINE_URL = './offline.html';
const PRECACHE_URLS = [
  OFFLINE_URL,
  './assets/kg-logo.png',
  './assets/apple-touch-icon.png',
  './assets/app-icon-192.png',
  './assets/app-icon-512.png',
  './css/styles.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key.startsWith('kg-cec-network-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () =>
        (await caches.match(OFFLINE_URL)) || Response.error()
      )
    );
    return;
  }

  const isLocalStaticAsset = ['/assets/', '/css/', '/js/'].some((path) => url.pathname.includes(path));
  if (!isLocalStaticAsset) return;

  event.respondWith(
    fetch(request).then((response) => {
      if (response.ok) {
        const copy = response.clone();
        void caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
      }
      return response;
    }).catch(async () =>
      (await caches.match(request)) || Response.error()
    )
  );
});
