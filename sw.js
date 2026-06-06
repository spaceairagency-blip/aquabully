// ── bump this string every time you deploy a new version ──
const CACHE = 'aquabully-v3';

self.addEventListener('install', e => {
  // Do NOT skipWaiting automatically — let the page control activation
  // so we can show the user an "update ready" banner first.
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => {
      // Notify all open tabs that a new version is active
      return self.clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then(clients => clients.forEach(c => c.postMessage({ type: 'SW_ACTIVATED' })));
    }).then(() => self.clients.claim())
  );
});

// Allow the page to trigger skipWaiting (used by the update banner)
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', e => {
  // Network-first with cache fallback (offline support)
  e.respondWith(
    fetch(e.request).then(res => {
      const clone = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, clone));
      return res;
    }).catch(() => caches.match(e.request))
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) { if ('focus' in c) return c.focus(); }
      if (clients.openWindow) return clients.openWindow('.');
    })
  );
});

self.addEventListener('push', e => {
  const d = e.data ? e.data.json() : {};
  e.waitUntil(
    self.registration.showNotification(d.title || 'AquaBully', {
      body: d.body || 'Drink water. Now.',
      icon: 'https://fav.farm/%F0%9F%92%A7',
      badge: 'https://fav.farm/%F0%9F%92%A7',
      tag: 'aquabully-nudge',
      renotify: true,
      vibrate: [200, 100, 200],
      actions: [
        { action: 'log250', title: 'Log 250ml' },
        { action: 'dismiss', title: 'Later...' }
      ]
    })
  );
});
