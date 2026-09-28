// Hyderabad Eats service worker. Kept deliberately small:
//  - pages: network first, cached copy when offline (so the app still opens)
//  - build assets, icons, photos, map tiles: cache first, refreshed in the background
//  - API calls are never cached (votes, deals and dishes must be live)
const VERSION = "eats-v1";
const SHELL = ["/", "/offers", "/stories", "/race/this-week", "/icon-192.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL).catch(() => {})));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const isAsset = (url) =>
  url.pathname.startsWith("/_next/static/") ||
  /\.(png|jpg|jpeg|webp|svg|woff2?)$/.test(url.pathname) ||
  url.hostname.endsWith("tile.openstreetmap.org");

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.pathname.startsWith("/api/")) return;

  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || caches.match("/")))
    );
    return;
  }

  if (isAsset(url)) {
    e.respondWith(
      caches.open(VERSION).then(async (c) => {
        const hit = await c.match(req);
        const net = fetch(req).then((res) => { if (res.ok) c.put(req, res.clone()); return res; }).catch(() => hit);
        return hit || net;
      })
    );
  }
});
