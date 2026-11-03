// Guarda las pantallas de la app para que abran aunque la señal sea mala.
// Los datos de la finca nunca se guardan aquí: siempre se piden al servidor.
const CACHE = 'corral-v6';
const ARCHIVOS = ['./', './index.html', './config.js', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ARCHIVOS); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); })
      .then(function () { return self.clients.claim(); })
  );
});

// Primero la red, para que las actualizaciones lleguen de inmediato; si no hay señal, la copia guardada.
self.addEventListener('fetch', function (e) {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== self.location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then(function (r) {
        const copia = r.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copia); });
        return r;
      })
      .catch(function () {
        return caches.match(e.request).then(function (r) { return r || caches.match('./index.html'); });
      })
  );
});
