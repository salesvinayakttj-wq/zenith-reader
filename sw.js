/* Zenith Reader — service worker (makes it installable + the app works offline after first open) */
const CACHE = 'zenith-reader-v1';
const SHELL = ['./', './index.html', './pdf.min.js', './pdf.worker.min.js', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // Notes (in /samples/ or /notes/): fetch fresh, then cache — so they reopen offline later.
  if(/\/(samples|notes)\//.test(url.pathname)){
    e.respondWith(
      fetch(e.request).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); return r; })
        .catch(() => caches.match(e.request))
    );
    return;
  }
  // App shell: cache-first (works offline after first open).
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
