'use strict';

const MAHIDA_ADMIN_SHELL_CACHE = 'mahida-admin-shell-v3';
const MAHIDA_ADMIN_SHELL = [
  './',
  './index.html',
  './styles.css?v=1',
  './app.js?v=1',
  './manifest.webmanifest',
  './assets/icon-192.png',
  './assets/icon-512.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(MAHIDA_ADMIN_SHELL_CACHE)
      .then(function (cache) {
        return cache.addAll(MAHIDA_ADMIN_SHELL);
      })
      .then(function () {
        return self.skipWaiting();
      })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(
          keys
            .filter(function (key) {
              return key !== MAHIDA_ADMIN_SHELL_CACHE &&
                key.indexOf('mahida-admin-shell-') === 0;
            })
            .map(function (key) {
              return caches.delete(key);
            })
        );
      })
      .then(function () {
        return self.clients.claim();
      })
  );
});

self.addEventListener('fetch', function (event) {
  const request = event.request;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  /* Apps Script, QR scanner, dan origin lain tidak disentuh service worker. */
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(function (response) {
          const copy = response.clone();
          caches.open(MAHIDA_ADMIN_SHELL_CACHE).then(function (cache) {
            cache.put('./index.html', copy);
          });
          return response;
        })
        .catch(function () {
          return caches.match('./index.html');
        })
    );
    return;
  }

  event.respondWith(
    caches.match(request)
      .then(function (cached) {
        return cached || fetch(request).then(function (response) {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(MAHIDA_ADMIN_SHELL_CACHE).then(function (cache) {
              cache.put(request, copy);
            });
          }
          return response;
        });
      })
  );
});
