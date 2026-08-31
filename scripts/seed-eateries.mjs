/**
 * Seed script v2 — GRID-TILED discovery.
 *
 * Why v2: a single search center + Google "prominence" ranking + the 60-result
 * Nearby Search cap missed long-tail specialty cafes (e.g. LastHouse, Kissa).
 * Fix: sweep ~20 dining hotspots with rankby=distance (nearest-first, no
 * prominence bias), dedupe by place_id, keep a quality gate. Docs are keyed by
 * place_id so re-runs UPSERT (no duplicates) and can top up over time.
 *
 * Run: npm run seed
 * Needs: GOOGLE_MAPS_API_KEY in .env.local
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, "..", ".env.local") });

const KEY = process.env.GOOGLE_MAPS_API_KEY;
if (!KEY) { console.error("GOOGLE_MAPS_API_KEY missing"); process.exit(1); }

const OUT_PATH = path.join(__dirname, "..", "data", "eateries.json");

// Quality gate. A flat 4.0 favours polished, expensive places and quietly
// excludes cheap legendary spots — a mobbed ₹20 chai counter often sits at 3.8
// with thousands of reviews. Volume at a slightly lower rating is its own proof,
// so either clears the bar.
const MIN_RATING = 4.0;
const MIN_REVIEWS = 15;
const BUSY_RATING = 3.8;    // legendary-but-divisive
const BUSY_REVIEWS = 400;   // ...proven by sheer footfall

function passesQuality(rating = 0, count = 0) {
  if (count < MIN_REVIEWS) return false;
  if (rating >= MIN_RATING) return true;
  return rating >= BUSY_RATING && count >= BUSY_REVIEWS;
}

// Hyderabad bounding box
const IN_HYD = (lat, lng) => lat > 17.0 && lat < 17.75 && lng > 78.0 && lng < 78.85;

// ~20 dining hotspots — heavy on the west-side cafe belt where gems cluster.
const HOTSPOTS = [
  { name: "Jubilee Hills", lat: 17.4310, lng: 78.4120 },
  { name: "Film Nagar", lat: 17.4155, lng: 78.4080 },
  { name: "Road No.36 JH", lat: 17.4260, lng: 78.4020 },
  { name: "Madhapur/HITEC", lat: 17.4480, lng: 78.3910 },
  { name: "Gachibowli", lat: 17.4400, lng: 78.3480 },
  { name: "Kondapur", lat: 17.4640, lng: 78.3620 },
  { name: "Banjara Hills", lat: 17.4120, lng: 78.4420 },
  { name: "Financial District", lat: 17.4140, lng: 78.3410 },
  { name: "Kokapet", lat: 17.4100, lng: 78.3250 },
  { name: "Narsingi", lat: 17.3960, lng: 78.3520 },
  { name: "Nanakramguda", lat: 17.4210, lng: 78.3400 },
  { name: "Begumpet", lat: 17.4440, lng: 78.4660 },
  { name: "Himayatnagar", lat: 17.4010, lng: 78.4780 },
  { name: "Secunderabad", lat: 17.4400, lng: 78.4980 },
  { name: "Kukatpally", lat: 17.4940, lng: 78.3990 },
  { name: "Manikonda", lat: 17.4020, lng: 78.3860 },
  { name: "Nallagandla", lat: 17.4620, lng: 78.3160 },
  { name: "Miyapur", lat: 17.4960, lng: 78.3580 },
  { name: "Tarnaka", lat: 17.4270, lng: 78.5290 },
  { name: "Abids", lat: 17.3900, lng: 78.4760 },
  { name: "Attapur", lat: 17.3750, lng: 78.4250 },
  { name: "Kompally", lat: 17.5400, lng: 78.4870 },
  // East / south / old city — the half of Hyderabad the west-heavy grid missed
  { name: "Charminar/Old City", lat: 17.3616, lng: 78.4747 },
  { name: "Malakpet", lat: 17.3730, lng: 78.5030 },
  { name: "Dilsukhnagar", lat: 17.3687, lng: 78.5247 },
  { name: "LB Nagar", lat: 17.3457, lng: 78.5522 },
  { name: "Uppal", lat: 17.4010, lng: 78.5590 },
  { name: "Habsiguda", lat: 17.4060, lng: 78.5430 },
  { name: "ECIL", lat: 17.4760, lng: 78.5720 },
  { name: "Alwal", lat: 17.5030, lng: 78.5100 },
  { name: "Sainikpuri", lat: 17.4930, lng: 78.5490 },
  { name: "Bowenpally", lat: 17.4750, lng: 78.4820 },
  { name: "Nampally", lat: 17.3870, lng: 78.4670 },
  { name: "Vanasthalipuram", lat: 17.3300, lng: 78.5810 },
  { name: "Shamshabad", lat: 17.2600, lng: 78.4000 },
  { name: "Mehdipatnam", lat: 17.3950, lng: 78.4380 },
];

// Per-hotspot passes. rankby=distance returns the 60 NEAREST of each — dense,
// long-tail coverage inside each zone (no prominence bias, no radius cap).
const PASSES = [
  { type: "cafe" },
  { type: "bar" },
  { type: "bakery" },
  { keyword: "specialty coffee roastery" },
  { keyword: "gelato ice cream dessert" },
  { keyword: "patisserie pastry bakery" },
  // Everyday Hyderabad
  { keyword: "irani chai cafe" },
  { keyword: "tiffin centre breakfast idli dosa" },
  { keyword: "biryani" },
  { keyword: "shawarma kebab haleem" },
  { keyword: "sweets mithai" },
  { keyword: "juice milkshake falooda" },
];

// Category classification
const CATEGORIES = {
  "restro-bar": {
    keywords: ["bar", "pub", "brewery", "lounge", "gastropub", "taproom", "brewpub", "kitchen & bar"],
    types: ["bar", "night_club"],
  },
  cafe: {
    keywords: ["cafe", "café", "coffee", "roastery", "roasters", "espresso", "brew", "bistro", "coffee house"],
    types: ["cafe"],
  },
  bakery: {
    keywords: ["bakery", "pastry", "patisserie", "boulangerie", "cake", "bake", "confection"],
    types: ["bakery"],
  },
  "ice-cream": {
    keywords: ["gelato", "ice cream", "creamery", "dessert bar", "frozen yogurt", "sorbet", "scoop", "juice", "milkshake", "falooda"],
    types: [],
  },
  // Checked last, so it only catches what the specialty buckets don't. This is
  // the Hyderabad the earlier passes were missing entirely: Irani chai houses,
  // tiffin centres, biryani, dhabas — most of the city's actual eating.
  local: {
    keywords: [
      "irani", "chai", "tea stall", "tiffin", "tiffins", "biryani", "biriyani",
      "dhaba", "mess", "bhavan", "bhawan", "udupi", "dosa", "idli", "vada",
      "shawarma", "kebab", "kabab", "haleem", "pista house", "military hotel",
      "canteen", "darbar", "hotel ",
    ],
    types: ["meal_takeaway"],
  },
};

function classify(name, types = []) {
  const nameLower = name.toLowerCase();
  const typesSet = new Set(types);
  // Prefer name keywords first (more specific), then Google types.
  for (const [tag, cfg] of Object.entries(CATEGORIES)) {
    if (cfg.keywords.some((k) => nameLower.includes(k))) return tag;
  }
  for (const [tag, cfg] of Object.entries(CATEGORIES)) {
    if (cfg.types.some((t) => typesSet.has(t))) return tag;
  }
  return null;
}

// Text Search — surfaces branded/boutique spots the nearby grid's 60-cap misses
// (Glen's Bakehouse, Summer Bistro, etc.). Prominence-ranked, but a DIFFERENT
// result set, so it fills the long-tail gaps.
const TEXT_QUERIES = [
  "specialty coffee hyderabad", "artisan bakery hyderabad", "bakehouse hyderabad",
  "patisserie hyderabad", "dessert cafe hyderabad", "gelato hyderabad",
  "ice cream parlour hyderabad", "microbrewery hyderabad", "cocktail bar hyderabad",
  "coffee roastery hyderabad", "cafe jubilee hills", "cafe banjara hills",
  "cafe madhapur", "cafe gachibowli", "cafe kondapur", "cafe financial district",
  "cake shop hyderabad", "bistro hyderabad", "brunch cafe hyderabad", "tea room hyderabad",
  "bistro jubilee hills", "cafe road no 12 banjara hills", "cafe film nagar",
  "cafe kokapet", "cafe narsingi", "cafe nallagandla", "cafe manikonda",
  "cafe secunderabad", "cafe himayatnagar", "cafe begumpet", "cafe hitech city",
  "eatery jubilee hills", "dessert bar hyderabad", "waffle hyderabad", "creamery hyderabad",
  // Everyday / old-city Hyderabad
  "irani chai hyderabad", "famous chai hyderabad", "tiffin centre hyderabad",
  "idli dosa hyderabad", "biryani hyderabad", "haleem hyderabad",
  "shawarma hyderabad", "kebab old city hyderabad", "sweets hyderabad",
  "bakery old city hyderabad", "cafe charminar", "cafe dilsukhnagar",
  "cafe secunderabad", "cafe uppal", "cafe lb nagar", "cafe malakpet",
  "breakfast hyderabad", "street food hyderabad", "juice centre hyderabad",
];

async function textSearch(query, pagetoken) {
  const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
  url.searchParams.set("key", KEY);
  if (pagetoken) url.searchParams.set("pagetoken", pagetoken);
  else url.searchParams.set("query", query);
  const res = await fetch(url);
  return res.json();
}

async function collectTextPages(query) {
  const results = [];
  let token = null;
  let page = 0;
  do {
    if (token) await sleep(2000);
    const data = await textSearch(query, token);
    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") break;
    results.push(...(data.results || []));
    token = data.next_page_token || null;
    page++;
  } while (token && page < 3);
  return results;
}

// Google Places Nearby Search — rankby=distance (no radius allowed with it).
async function nearbySearch({ lat, lng }, { type, keyword }, pagetoken) {
  const url = new URL("https://maps.googleapis.com/maps/api/place/nearbysearch/json");
  url.searchParams.set("key", KEY);
  if (pagetoken) {
    url.searchParams.set("pagetoken", pagetoken);
  } else {
    url.searchParams.set("location", `${lat},${lng}`);
    url.searchParams.set("rankby", "distance");
    if (type) url.searchParams.set("type", type);
    if (keyword) url.searchParams.set("keyword", keyword);
  }
  const res = await fetch(url);
  return res.json();
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function collectPages(center, pass) {
  const results = [];
  let token = null;
  let page = 0;
  do {
    if (token) await sleep(2000); // Google requires delay before next_page_token
    const data = await nearbySearch(center, pass, token);
    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      if (data.status !== "INVALID_REQUEST") {
        console.warn(`  ! ${data.status} @ ${center.name} ${JSON.stringify(pass)}`);
      }
      break;
    }
    results.push(...(data.results || []));
    token = data.next_page_token || null;
    page++;
  } while (token && page < 3);
  return results;
}

const byPlaceId = new Map(); // place_id -> entry (dedupe across all sources)

// Carry enrichment forward. Discovery rebuilds every row from the Places
// response, which has no hours/tags/tier/website — so without this a re-seed
// silently wipes the work of enrich-details.mjs for spots we already knew.
const prior = {};
if (fs.existsSync(OUT_PATH)) {
  for (const e of JSON.parse(fs.readFileSync(OUT_PATH, "utf-8"))) {
    if (e.detailsUpdatedAt) prior[e.placeId] = e;
  }
}
const ENRICHED_FIELDS = [
  "hours", "website", "hasWebsite", "phone", "blurb",
  "tags", "tier", "detailsUpdatedAt", "offers", "offersUpdatedAt",
];

// Gate + classify + insert. Returns 1 if newly added, else 0.
function consider(place, source) {
  if (byPlaceId.has(place.place_id)) return 0;
  const { lat, lng } = place.geometry?.location ?? {};
  if (!lat || !lng || !IN_HYD(lat, lng)) return 0;
  if (!passesQuality(place.rating ?? 0, place.user_ratings_total ?? 0)) return 0;
  const category = classify(place.name, place.types);
  if (!category) return 0;

  const kept = {};
  const was = prior[place.place_id];
  if (was) for (const f of ENRICHED_FIELDS) if (was[f] !== undefined) kept[f] = was[f];

  byPlaceId.set(place.place_id, {
    id: place.place_id, // stable id — upsert-safe
    placeId: place.place_id,
    name: place.name,
    category,
    lat,
    lng,
    address: place.vicinity || place.formatted_address,
    rating: place.rating ?? null,
    ratingCount: place.user_ratings_total ?? 0,
    priceLevel: place.price_level ?? null,
    photoRef: place.photos?.[0]?.photo_reference ?? null,
    zomatoUrl: `https://www.zomato.com/hyderabad/search?q=${encodeURIComponent(place.name)}`,
    offers: [],
    offersUpdatedAt: null,
    status: "approved",
    discoveredIn: source,
    createdAt: was?.createdAt ?? new Date().toISOString(),
    ...kept,
  });
  return 1;
}

// TOPUP=1 skips the 15-min grid: preload existing set, run text stage only.
const TOPUP = process.env.TOPUP === "1";
if (TOPUP && fs.existsSync(OUT_PATH)) {
  for (const e of JSON.parse(fs.readFileSync(OUT_PATH, "utf-8"))) byPlaceId.set(e.id, e);
  console.log(`TOPUP: preloaded ${byPlaceId.size} existing`);
}

// Stage 1 — grid-tiled nearby sweep (skipped in topup mode)
if (!TOPUP) {
  for (const center of HOTSPOTS) {
    let addedHere = 0;
    for (const pass of PASSES) {
      const results = await collectPages(center, pass);
      for (const place of results) addedHere += consider(place, center.name);
    }
    console.log(`${center.name.padEnd(20)} +${addedHere}  (total ${byPlaceId.size})`);
  }
}

// Stage 2 — text-search top-up for boutique/branded long tail
console.log("\n--- Text search stage ---");
for (const q of TEXT_QUERIES) {
  const results = await collectTextPages(q);
  let addedHere = 0;
  for (const place of results) addedHere += consider(place, `text:${q}`);
  console.log(`"${q}"`.padEnd(34) + ` +${addedHere}  (total ${byPlaceId.size})`);
}

// Rank by a quality score (rating weighted by log review count). No cap.
const all = [...byPlaceId.values()]
  .sort((a, b) => (b.rating * Math.log10(b.ratingCount + 10)) - (a.rating * Math.log10(a.ratingCount + 10)));

const byCat = all.reduce((m, e) => ((m[e.category] = (m[e.category] || 0) + 1), m), {});
console.log(`\nTotal: ${all.length} eateries`, byCat);
fs.writeFileSync(OUT_PATH, JSON.stringify(all, null, 2));
console.log(`Written to ${OUT_PATH}`);

// Upsert to Firestore (doc id = place_id, so re-runs don't duplicate)
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  const { initializeApp, cert } = await import("firebase-admin/app");
  const { getFirestore } = await import("firebase-admin/firestore");
  const app = initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
  const db = getFirestore(app);
  const col = db.collection("eateries");

  // Purge stale docs (old random-uuid format + spots no longer in the set) so
  // the collection exactly matches this curated sweep.
  const keep = new Set(all.map((e) => e.id));
  const existing = await col.get();
  let purged = 0;
  for (let i = 0; i < existing.docs.length; i += 400) {
    const batch = db.batch();
    let n = 0;
    for (const doc of existing.docs.slice(i, i + 400)) {
      if (!keep.has(doc.id)) { batch.delete(doc.ref); n++; }
    }
    if (n) { await batch.commit(); purged += n; }
  }
  console.log(`Firestore: purged ${purged} stale docs`);

  // Batched writes (500/batch limit)
  let written = 0;
  for (let i = 0; i < all.length; i += 400) {
    const batch = db.batch();
    for (const e of all.slice(i, i + 400)) batch.set(col.doc(e.id), e, { merge: true });
    await batch.commit();
    written += Math.min(400, all.length - i);
  }
  console.log(`Firestore: upserted ${written} docs`);
} else {
  console.log("FIREBASE_SERVICE_ACCOUNT not set — skipped Firestore write");
}
