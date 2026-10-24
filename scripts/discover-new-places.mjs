/**
 * Weekly Google Places discovery -> Firestore review queue.
 *
 * This records places that are new to our map, not a claim that the venue
 * opened this week. Admin approval is required before anything becomes public.
 */
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { classifyPlace, IN_HYD } from "../lib/eateryUtils.js";
import { DISCOVERY_SOURCE } from "../lib/newPlaces.js";

try { (await import("dotenv")).config({ path: ".env.local", quiet: true }); } catch {}

const apiKey = process.env.GOOGLE_MAPS_API_KEY;
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!apiKey || !serviceAccount) throw new Error("GOOGLE_MAPS_API_KEY and FIREBASE_SERVICE_ACCOUNT are required");

const { initializeApp, cert, getApps } = await import("firebase-admin/app");
const { getFirestore } = await import("firebase-admin/firestore");
const app = getApps()[0] || initializeApp({ credential: cert(JSON.parse(serviceAccount)) });
const db = getFirestore(app);

const MAX_NEW = Number(process.env.MAX_NEW_PLACES || 24);
const MIN_RATING = 3.8;
const RADIUS_M = 7000;
const CENTRES = [
  [17.385, 78.486], // central
  [17.445, 78.385], // west
  [17.515, 78.405], // north-west
  [17.455, 78.585], // east
  [17.305, 78.47],  // south
];
const PASSES = [
  ["cafe", "cafe"],
  ["bar", "brewery pub"],
  ["bakery", "bakery dessert"],
  ["restaurant", "biryani tiffin restaurant"],
];

const local = JSON.parse(fs.readFileSync(new URL("../data/eateries.json", import.meta.url), "utf8"));
const existing = new Set(local.map((place) => place.placeId).filter(Boolean));
for (const source of ["user-suggested", DISCOVERY_SOURCE]) {
  const snap = await db.collection("eateries").where("source", "==", source).select("placeId").get();
  for (const doc of snap.docs) if (doc.data().placeId) existing.add(doc.data().placeId);
}

async function nearby(lat, lng, type, keyword) {
  const url = new URL("https://maps.googleapis.com/maps/api/place/nearbysearch/json");
  url.searchParams.set("location", `${lat},${lng}`);
  url.searchParams.set("radius", String(RADIUS_M));
  url.searchParams.set("type", type);
  url.searchParams.set("keyword", keyword);
  url.searchParams.set("key", apiKey);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Places API ${response.status}`);
  const data = await response.json();
  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") throw new Error(`Places API ${data.status}: ${data.error_message || "unknown error"}`);
  return data.results || [];
}

const queued = [];
for (const [lat, lng] of CENTRES) {
  for (const [type, keyword] of PASSES) {
    if (queued.length >= MAX_NEW) break;
    for (const place of await nearby(lat, lng, type, keyword)) {
      if (queued.length >= MAX_NEW || existing.has(place.place_id)) continue;
      const point = place.geometry?.location || {};
      if (!IN_HYD(point.lat, point.lng) || (place.rating || 0) < MIN_RATING) continue;
      const category = classifyPlace(place.name, place.types);
      if (!category) continue;
      const area = String(place.vicinity || "").split(",")[0].trim() || "Hyderabad";
      const now = new Date().toISOString();
      const entry = {
        id: randomUUID(), placeId: place.place_id, name: place.name, category,
        lat: point.lat, lng: point.lng, address: place.vicinity || null,
        area, discoveredIn: area, rating: place.rating ?? null,
        ratingCount: place.user_ratings_total ?? 0, priceLevel: place.price_level ?? null,
        photoRef: place.photos?.[0]?.photo_reference ?? null,
        source: DISCOVERY_SOURCE, status: "pending", createdAt: now,
      };
      await db.collection("eateries").doc(entry.id).set(entry);
      existing.add(entry.placeId);
      queued.push(entry);
    }
  }
}

console.log(JSON.stringify({ queued: queued.length, names: queued.map((place) => place.name) }));
