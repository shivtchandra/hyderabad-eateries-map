import { randomUUID } from "crypto";
import { getAdminDb } from "../../../../lib/firebaseAdmin.js";
import { classifyPlace as classify, IN_HYD } from "../../../../lib/eateryUtils.js";

// Never prerender: this route has side effects (Places calls + Firestore writes).
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const KEY = process.env.GOOGLE_MAPS_API_KEY;
const HYD_CENTER = { lat: 17.385, lng: 78.486 };
const RADIUS_M = 15000;
const MIN_RATING = 3.8;
const MAX_NEW = 20; // max new places per cron run

function authOk(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // dev: skip auth
  // Vercel's native Cron Jobs call with `Authorization: Bearer <CRON_SECRET>`
  // automatically once the env var is set — no custom header needed.
  return req.headers.get("Authorization") === `Bearer ${secret}`;
}

async function nearbySearch(type, keyword) {
  const url = new URL("https://maps.googleapis.com/maps/api/place/nearbysearch/json");
  url.searchParams.set("location", `${HYD_CENTER.lat},${HYD_CENTER.lng}`);
  url.searchParams.set("radius", String(RADIUS_M));
  url.searchParams.set("key", KEY);
  if (type) url.searchParams.set("type", type);
  if (keyword) url.searchParams.set("keyword", keyword);
  const res = await fetch(url);
  return res.json();
}

export async function GET(req) {
  if (!authOk(req)) return Response.json({ error: "forbidden" }, { status: 403 });

  const db = await getAdminDb();
  if (!db) return Response.json({ error: "Firestore not configured" }, { status: 500 });

  // Load existing placeIds to avoid duplicates
  const snap = await db.collection("eateries").select("placeId").get();
  const existing = new Set(snap.docs.map((d) => d.data().placeId));

  const passes = [
    { type: "cafe", keyword: null },
    { type: "bar", keyword: null },
    { type: "bakery", keyword: null },
    { type: "restaurant", keyword: "gelato OR ice cream" },
  ];

  const added = [];

  for (const { type, keyword } of passes) {
    if (added.length >= MAX_NEW) break;
    const data = await nearbySearch(type, keyword);
    if (!data.results) continue;

    for (const place of data.results) {
      if (added.length >= MAX_NEW) break;
      if (existing.has(place.place_id)) continue;

      const { lat, lng } = place.geometry?.location ?? {};
      if (!lat || !lng || !IN_HYD(lat, lng)) continue;
      if ((place.rating ?? 0) < MIN_RATING) continue;

      const category = classify(place.name, place.types);
      if (!category) continue;

      const entry = {
        id: randomUUID(),
        placeId: place.place_id,
        name: place.name,
        category,
        lat,
        lng,
        address: place.vicinity,
        rating: place.rating ?? null,
        ratingCount: place.user_ratings_total ?? 0,
        priceLevel: place.price_level ?? null,
        photoRef: place.photos?.[0]?.photo_reference ?? null,
        zomatoUrl: `https://www.zomato.com/hyderabad/search?q=${encodeURIComponent(place.name)}`,
        offers: [],
        offersUpdatedAt: null,
        status: "approved",
        createdAt: new Date().toISOString(),
      };

      await db.collection("eateries").doc(entry.id).set(entry);
      existing.add(place.place_id);
      added.push(entry.name);
    }
  }

  return Response.json({ added: added.length, names: added });
}
