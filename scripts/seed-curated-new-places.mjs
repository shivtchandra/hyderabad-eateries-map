/**
 * Seed a researched weekly shortlist into the admin review queue.
 *
 * Sources:
 * - District, New Restaurants in Hyderabad for October 2026 (2026-10-08)
 * - Conde Nast Traveller India, New restaurants in Hyderabad in 2026 (2026-08-13)
 *
 * Google Places is used only to resolve exact venue identity and coordinates.
 * Nothing becomes public until it is approved in the admin queue.
 */
import fs from "node:fs";
import { createHash } from "node:crypto";
import { DISCOVERY_SOURCE } from "../lib/newPlaces.js";

try { (await import("dotenv")).config({ path: ".env.local", quiet: true }); } catch {}

const apiKey = process.env.GOOGLE_MAPS_API_KEY;
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!apiKey || !serviceAccount) throw new Error("GOOGLE_MAPS_API_KEY and FIREBASE_SERVICE_ACCOUNT are required");

const DISTRICT_SOURCE = "https://www.district.in/blog/new-restaurants-hyderabad-october-2026";
const CNT_SOURCE = "https://www.cntraveller.in/story/new-restaurants-in-hyderabad-in-2026/";
const CANDIDATES = [
  { name: "Kshana Coffee", query: "Kshana Coffee opposite Durgam Cheruvu Hyderabad", category: "cafe", area: "Madhapur", sourceUrl: DISTRICT_SOURCE },
  { name: "Karta", query: "Karta restaurant Gate 11 Sattva Knowledge City Hyderabad", category: "restaurant", area: "Hitech City", sourceUrl: DISTRICT_SOURCE },
  { name: "The All American Diner", query: "The All American Diner Hitech City Hyderabad", category: "restaurant", area: "Hitech City", sourceUrl: DISTRICT_SOURCE },
  { name: "Fireback", query: "Fireback The Loft RMZ Nexity Hyderabad", category: "restaurant", area: "Hitech City", sourceUrl: DISTRICT_SOURCE },
  { name: "Baan Phadthai", query: "Baan Phadthai Hitech City Hyderabad", category: "restaurant", area: "Hitech City", sourceUrl: CNT_SOURCE },
  { name: "Practically Sobar", query: "Practically Sobar Hyderabad", category: "cafe", area: "Hyderabad", sourceUrl: CNT_SOURCE },
  { name: "Venna", query: "Venna Manikonda Hyderabad", category: "local", area: "Manikonda", sourceUrl: CNT_SOURCE },
  { name: "Kissa", query: "Kissa cafe Hyderabad", category: "cafe", area: "Hyderabad", sourceUrl: CNT_SOURCE },
];

const { initializeApp, cert, getApps } = await import("firebase-admin/app");
const { getFirestore } = await import("firebase-admin/firestore");
const app = getApps()[0] || initializeApp({ credential: cert(JSON.parse(serviceAccount)) });
const db = getFirestore(app);

const local = JSON.parse(fs.readFileSync(new URL("../data/eateries.json", import.meta.url), "utf8"));
const localPlaceIds = new Set(local.map((place) => place.placeId).filter(Boolean));
const queued = await db.collection("eateries").where("source", "==", DISCOVERY_SOURCE).get();
const queuedByPlaceId = new Map(
  queued.docs.filter((doc) => doc.data().placeId).map((doc) => [doc.data().placeId, doc])
);

const normalized = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

async function findPlace(candidate) {
  const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
  url.searchParams.set("query", candidate.query);
  url.searchParams.set("key", apiKey);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Places API ${response.status}`);
  const data = await response.json();
  if (data.status !== "OK") throw new Error(`${candidate.query}: Places API ${data.status}`);
  const expected = normalized(candidate.name);
  return data.results?.find((place) => {
    const actual = normalized(place.name);
    return actual === expected || actual.includes(expected) || expected.includes(actual);
  }) || null;
}

const added = [];
const kept = [];
const skipped = [];
for (const candidate of CANDIDATES) {
  const place = await findPlace(candidate);
  if (!place?.place_id || localPlaceIds.has(place.place_id)) {
    skipped.push(candidate.name);
    continue;
  }
  const point = place.geometry?.location;
  if (!point || !(point.lat > 16.9 && point.lat < 17.9 && point.lng > 78 && point.lng < 79)) {
    skipped.push(candidate.name);
    continue;
  }
  const queuedDoc = queuedByPlaceId.get(place.place_id);
  if (queuedDoc) {
    kept.push(place.name);
    continue;
  }
  const id = `curated-${createHash("sha1").update(place.place_id).digest("hex").slice(0, 20)}`;
  const now = new Date().toISOString();
  await db.collection("eateries").doc(id).set({
    id,
    placeId: place.place_id,
    name: place.name,
    category: candidate.category,
    lat: point.lat,
    lng: point.lng,
    address: place.formatted_address || null,
    area: candidate.area,
    discoveredIn: candidate.area,
    rating: place.rating ?? null,
    ratingCount: place.user_ratings_total ?? 0,
    priceLevel: place.price_level ?? null,
    photoRef: place.photos?.[0]?.photo_reference ?? null,
    source: DISCOVERY_SOURCE,
    discoveryMethod: "editorial-curation",
    sourceUrl: candidate.sourceUrl,
    status: "pending",
    createdAt: now,
  }, { merge: true });
  added.push(place.name);
}

const falseMatch = queued.docs.find((doc) => {
  const place = doc.data();
  return place.name === "Sattva Knowledge City" &&
    place.discoveryMethod === "editorial-curation" &&
    place.sourceUrl === DISTRICT_SOURCE &&
    place.status === "pending";
});
const removed = [];
if (falseMatch) {
  await falseMatch.ref.delete();
  removed.push("Sattva Knowledge City");
}

console.log(JSON.stringify({ added, kept, skipped, removed }, null, 2));
