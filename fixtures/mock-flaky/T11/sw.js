const CACHE_NAME = 'checklist-governanca-v1';
const PRECACHE_ASSETS = ['./index.html', './manifest.webmanifest'];

self.addEventListener('install', function (evento) {
  evento.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});
