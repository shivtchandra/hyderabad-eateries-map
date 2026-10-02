import { getAdminDb } from "../../../../lib/firebaseAdmin.js";
import { clearAddedPlacesMemo } from "../../../../lib/addedPlaces.js";

// Review places visitors added from search or the rankings.
//   GET  ?status=pending|approved|removed -> { places: [...] }
//   POST { id, action: "approve", lat, lng, category } | { id, action: "remove" | "restore" }

export const dynamic = "force-dynamic";

const CATEGORIES = ["cafe", "restaurant", "restro-bar", "bakery", "ice-cream", "local"];

function parseLatLng(s) {
  const m =
    s.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) ||
    s.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) ||
    s.match(/[?&](?:q|query|ll|center)=(-?\d+\.\d+)(?:,|%2C)\s*(-?\d+\.\d+)/i);
  return m ? { lat: Number(m[1]), lng: Number(m[2]) } : null;
}

async function resolveMapsLink(link) {
  if (!/^https:\/\/(maps\.app\.goo\.gl|goo\.gl\/maps|(www\.)?google\.[a-z.]+\/maps|maps\.google\.[a-z.]+)\//i.test(link)) return null;
  try {
    const res = await fetch(link, { redirect: "follow", headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(8000) });
    return parseLatLng(decodeURIComponent(res.url)) || parseLatLng(await res.text());
  } catch {
    return null;
  }
}

function authOk(req) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  return (req.headers.get("Authorization") || "") === `Bearer ${secret}`;
}

export async function GET(req) {
  if (!authOk(req)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const db = await getAdminDb();
  if (!db) return Response.json({ places: [] });
  const status = new URL(req.url).searchParams.get("status") || "pending";
  const snap = await db.collection("eateries").where("source", "==", "user-suggested").limit(300).get();
  const places = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((p) => p.status === status)
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  return Response.json({ places });
}

export async function POST(req) {
  if (!authOk(req)) return Response.json({ error: "unauthorized" }, { status: 401 });
  let { id, action, lat, lng, category, link } = await req.json().catch(() => ({}));
  // Google Maps share links (maps.app.goo.gl/…) carry no coordinates: follow the
  // redirect to the full /maps/place/… URL and read them from there.
  if (action === "approve" && (lat == null || lng == null) && typeof link === "string") {
    const ll = await resolveMapsLink(link);
    if (ll) ({ lat, lng } = ll);
  }
  if (!id || typeof id !== "string" || !id.startsWith("user-")) {
    return Response.json({ error: "bad-request" }, { status: 400 });
  }
  const db = await getAdminDb();
  if (!db) return Response.json({ error: "unavailable" }, { status: 503 });
  const ref = db.collection("eateries").doc(id);

  if (action === "approve") {
    const la = Number(lat), ln = Number(lng);
    // Rough Hyderabad bounding box, so a pasted typo can't drop a pin in another city.
    if (!(la > 16.9 && la < 17.9 && ln > 78.0 && ln < 79.0)) {
      return Response.json({ error: "Location must be in Hyderabad (lat,lng)" }, { status: 400 });
    }
    if (!CATEGORIES.includes(category)) return Response.json({ error: "Pick a category" }, { status: 400 });
    await ref.set({ status: "approved", lat: la, lng: ln, category, approvedAt: new Date().toISOString() }, { merge: true });
  } else if (action === "remove") {
    await ref.set({ status: "removed", removedAt: new Date().toISOString() }, { merge: true });
  } else if (action === "restore") {
    await ref.set({ status: "pending" }, { merge: true });
  } else {
    return Response.json({ error: "bad-action" }, { status: 400 });
  }
  clearAddedPlacesMemo();
  return Response.json({ ok: true });
}
