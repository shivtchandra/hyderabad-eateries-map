// mapmyhyd API Worker: serves the site's /api/* with its own
// route handlers (bundled by build.mjs).
//
// Free-tier budget: public GETs are cached twice, so Firestore reads don't grow
// with visitors. 1) the colo's edge cache (Cache API, EDGE_TTL); 2) one shared
// Firestore doc per URL in `apiCache` (SHARED_TTL), so at most one recompute
// per URL per SHARED_TTL across all colos. Votes (revalidateTag) mark the
// shared entries stale, so new counts show within EDGE_TTL.
import { routes, site } from "./routes.gen.js";
import { pendingTags } from "./shims/next-cache.js";
import { getAdminDb } from "./shims/firebaseAdmin.js";

const CACHE = site.cache;
const ALLOWED_ORIGINS = new Set(site.origins);

function nextify(request) {
  const url = new URL(request.url);
  const cookieHeader = request.headers.get("cookie") || "";
  const jar = new Map(cookieHeader.split(/;\s*/).filter(Boolean).map((c) => {
    const i = c.indexOf("=");
    return [c.slice(0, i), decodeURIComponent(c.slice(i + 1))];
  }));
  request.cookies = {
    get: (name) => (jar.has(name) ? { name, value: jar.get(name) } : undefined),
    has: (name) => jar.has(name),
    getAll: () => [...jar].map(([name, value]) => ({ name, value })),
  };
  request.nextUrl = url;
  return request;
}

async function sharedKey(url) {
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(url.pathname + url.search)));
  return Array.from(bytes.slice(0, 12), (b) => b.toString(16).padStart(2, "0")).join("");
}

async function invalidate(tags) {
  const db = await getAdminDb();
  if (!db || !tags.length) return;
  for (const tag of tags) {
    const snap = await db.collection("apiCache").where("tags", "array-contains", tag).get();
    const batch = db.batch();
    snap.docs.forEach((d) => batch.update(d.ref, { at: 0 }));
    await batch.commit();
  }
}

async function run(route, request, params) {
  const handler = route.mod[request.method === "HEAD" ? "GET" : request.method];
  if (!handler) return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { "Content-Type": "application/json" } });
  return handler(nextify(request), { params });
}

async function cachedGet(route, request, params, policy, ctx) {
  const url = new URL(request.url);
  const edgeKey = new Request(url.toString(), { method: "GET" });
  const edge = caches.default;
  const hit = await edge.match(edgeKey);
  if (hit) return hit;

  const db = await getAdminDb();
  const key = await sharedKey(url);
  const ref = db?.collection("apiCache").doc(key);
  let body, status = 200;
  const doc = ref ? await ref.get().catch(() => null) : null;
  if (doc?.exists && Date.now() - (doc.data().at || 0) < policy.shared * 1000) {
    ({ body, status } = doc.data());
  } else {
    const res = await run(route, request, params);
    body = await res.text();
    status = res.status;
    if (ref && status === 200) ctx.waitUntil(ref.set({ body, status, at: Date.now(), path: route.path, tags: policy.tags }).catch(() => {}));
  }
  const res = new Response(body, {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": `public, max-age=${Math.min(policy.edge, 60)}, s-maxage=${policy.edge}` },
  });
  if (status === 200) ctx.waitUntil(edge.put(edgeKey, res.clone()));
  return res;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const route = routes.find((r) => r.re.test(url.pathname));
    if (!route) return Response.json({ error: "Not found" }, { status: 404 });
    const m = route.re.exec(url.pathname);
    const params = Object.fromEntries(route.params.map((p, i) => [p, decodeURIComponent(m[i + 1])]));

    // Browser writes must come from our own pages (webhooks/cron carry secrets instead).
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
      const origin = request.headers.get("origin");
      if (origin && !ALLOWED_ORIGINS.has(origin)) return Response.json({ error: "Invalid origin" }, { status: 403 });
    }

    try {
      const policy = CACHE[route.path];
      if (policy && request.method === "GET" && !(policy.privateParams || []).some((p) => url.searchParams.has(p))) return await cachedGet(route, request, params, policy, ctx);
      pendingTags.clear();
      const res = await run(route, request, params);
      if (pendingTags.size) ctx.waitUntil(invalidate([...pendingTags]).catch(() => {}));
      return res;
    } catch (err) {
      console.error(`[api] ${request.method} ${url.pathname}:`, err?.stack || err);
      return Response.json({ error: "Server error" }, { status: 500 });
    }
  },
};
