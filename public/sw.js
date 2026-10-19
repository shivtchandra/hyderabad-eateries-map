// Hyderabad Eats service worker. Kept deliberately small:
//  - pages: network first (with navigation preload), cached copy when offline or
//    when a slow phone connection takes longer than NAV_TIMEOUT_MS
//  - hashed build assets and fonts: cache first, never re-fetched (immutable)
//  - icons, photos, map tiles: cache first, fetched only on a miss
//  - API calls are never cached (votes, deals and dishes must be live)
const VERSION = "eats-v2";
const PAGES = `${VERSION}-pages`;
const ASSETS = `${VERSION}-assets`;
const SHELL = ["/", "/offers", "/stories", "/race/this-week", "/icon-192.png"];
const NAV_TIMEOUT_MS = 4000;
const MAX_ASSETS = 400;

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(PAGES).then((c) => c.addAll(SHELL).catch(() => {})));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== PAGES && k !== ASSETS).map((k) => caches.delete(k))))
      .then(() => self.registration.navigationPreload?.enable())
      .then(() => self.clients.claim())
  );
});

const isAsset = (url) =>
  url.pathname.startsWith("/_next/static/") ||
  /\.(png|jpg|jpeg|webp|svg|woff2?)$/.test(url.pathname) ||
  url.hostname.endsWith("tile.openstreetmap.org");

// Drop the oldest entries so the asset cache can't grow without bound on a phone.
async function trim(cache) {
  const keys = await cache.keys();
  if (keys.length > MAX_ASSETS) await Promise.all(keys.slice(0, keys.length - MAX_ASSETS).map((k) => cache.delete(k)));
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.pathname.startsWith("/api/")) return;

  if (req.mode === "navigate") {
    e.respondWith((async () => {
      const network = Promise.resolve(e.preloadResponse)
        .then((pre) => pre || fetch(req))
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            e.waitUntil(caches.open(PAGES).then((c) => c.put(req, copy)));
          }
          return res;
        });
      const cached = await caches.match(req);
      if (!cached) return network.catch(() => caches.match("/"));
      // Slow connection: show the cached copy rather than a blank screen.
      const slow = new Promise((resolve) => setTimeout(() => resolve(cached), NAV_TIMEOUT_MS));
      return Promise.race([network.catch(() => cached), slow]);
    })());
    return;
  }

  if (isAsset(url)) {
    e.respondWith(
      caches.open(ASSETS).then(async (c) => {
        const hit = await c.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) e.waitUntil(c.put(req, res.clone()).then(() => trim(c)));
        return res;
      })
    );
  }
});
