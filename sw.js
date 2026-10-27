// Bonjourly offline support. Serves the cached copy immediately and refreshes it in the background
// (stale-while-revalidate), so the app works offline and still picks up new content on the next visit.
// build.py rewrites VERSION whenever the content changes, which clears old caches.
const VERSION = 'e882529f4c';
const CACHE = `bonjourly-${VERSION}`;
const CORE = [
  './', 'index.html', 'styles.css', 'core.js', 'coach.js', 'views-extra.js', 'views.js',
  'content/roadmap.js', 'content/weeks.js', 'content/extra.js',
  'logo.svg', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-180.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('bonjourly-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const fonts = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (url.origin !== location.origin && !fonts) return;
  e.respondWith(caches.open(CACHE).then(async cache => {
    const key = req.mode === 'navigate' ? 'index.html' : req;
    const hit = await cache.match(key, { ignoreSearch: true });
    const fresh = fetch(req).then(res => {
      if (res && (res.ok || res.type === 'opaque')) cache.put(key, res.clone());
      return res;
    }).catch(() => hit || Response.error());
    return hit || fresh;
  }));
});
