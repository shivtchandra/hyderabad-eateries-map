/**
 * Enrich each eatery with Google Place Details: hours, website, phone, blurb,
 * and vibe tags mined from review text.
 *
 * Resumable — rows already carrying detailsUpdatedAt are skipped, so an
 * interrupted run continues instead of restarting.
 *
 * Run:  node scripts/enrich-details.mjs
 *       LIMIT=20 node scripts/enrich-details.mjs     # test slice
 *       FORCE=1  node scripts/enrich-details.mjs     # re-enrich everything
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, "..", ".env.local") });

const KEY = process.env.GOOGLE_MAPS_API_KEY;
if (!KEY) { console.error("GOOGLE_MAPS_API_KEY missing"); process.exit(1); }

const DATA_PATH = path.join(__dirname, "..", "data", "eateries.json");
const LIMIT = process.env.LIMIT ? Number(process.env.LIMIT) : Infinity;
const FORCE = process.env.FORCE === "1";

const FIELDS = [
  "name", "editorial_summary", "opening_hours", "website",
  "formatted_phone_number", "price_level", "reviews",
  "serves_beer", "serves_vegetarian_food", "serves_breakfast",
  "dine_in", "takeout", "delivery", "reservable",
  "wheelchair_accessible_entrance",
].join(",");

// Vibe tags mined from review text. Each tag needs >=2 keyword hits across the
// review set to qualify — a single passing mention isn't a defining vibe.
const TAG_RULES = [
  { tag: "work-friendly", emoji: "💻", label: "Work-friendly", kw: ["laptop", "wifi", "wi-fi", "work from", "working", "plug point", "co-work"] },
  { tag: "quiet",         emoji: "🤫", label: "Quiet",          kw: ["quiet", "peaceful", "calm", "serene", "away from the busy", "tucked away"] },
  { tag: "view",          emoji: "🌇", label: "Great view",     kw: ["view", "lake", "rooftop", "terrace", "skyline", "sunset"] },
  { tag: "outdoor",       emoji: "🌿", label: "Outdoor seating",kw: ["outdoor", "garden", "alfresco", "al fresco", "open air", "patio"] },
  { tag: "date",          emoji: "💕", label: "Date spot",      kw: ["date night", "romantic", "cozy", "cosy", "intimate", "ambience is"] },
  { tag: "specialty",     emoji: "☕", label: "Specialty coffee", kw: ["single origin", "pour over", "pourover", "specialty coffee", "speciality coffee", "coffee roast", "third wave", "barista", "espresso bar"] },
  { tag: "live-music",    emoji: "🎵", label: "Live music",     kw: ["live music", "live band", "dj ", "karaoke", "live gig"] },
  { tag: "breakfast",     emoji: "🍳", label: "Breakfast",      kw: ["breakfast", "brunch", "morning"] },
  { tag: "pet-friendly",  emoji: "🐕", label: "Pet-friendly",   kw: ["pet friendly", "pet-friendly", "dog friendly", "dog-friendly", "pets allowed"] },
  { tag: "desserts",      emoji: "🍰", label: "Great desserts", kw: ["dessert", "cheesecake", "tiramisu", "brownie", "croissant", "pastries"] },
];

function mineTags(reviews = [], details = {}) {
  const blob = reviews.map((r) => (r.text || "").toLowerCase()).join(" \n ");
  const tags = [];

  // Google returns only ~5 reviews, so score rather than count raw hits:
  // a specific multi-word phrase ("single origin") is worth a full point on its
  // own; a generic single word ("view", "work") needs two mentions.
  for (const rule of TAG_RULES) {
    let score = 0;
    for (const k of rule.kw) {
      const matches = blob.split(k).length - 1;
      if (!matches) continue;
      score += k.includes(" ") ? matches * 2 : matches;
      if (score >= 2) break;
    }
    if (score >= 2) tags.push(rule.tag);
  }

  // Flag-derived tags (authoritative, no keyword guessing)
  if (details.serves_vegetarian_food) tags.push("veg-friendly");
  if (details.reservable) tags.push("reservable");

  return [...new Set(tags)].slice(0, 6);
}

// Scale tier from review volume — p50 in our data is ~198.
function tierFor(ratingCount = 0) {
  if (ratingCount >= 1000) return "landmark";
  if (ratingCount >= 200) return "established";
  return "hidden-gem";
}

async function placeDetails(placeId) {
  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", FIELDS);
  url.searchParams.set("key", KEY);
  const res = await fetch(url);
  const data = await res.json();
  if (data.status !== "OK") return null;
  return data.result;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const eateries = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
const todo = eateries.filter((e) => FORCE || !e.detailsUpdatedAt).slice(0, LIMIT);

console.log(`${eateries.length} total | ${todo.length} to enrich${LIMIT !== Infinity ? ` (LIMIT=${LIMIT})` : ""}`);

let done = 0, failed = 0;
for (const e of todo) {
  const d = await placeDetails(e.placeId);

  if (!d) {
    failed++;
    e.detailsUpdatedAt = new Date().toISOString(); // don't retry forever
    e.tier = tierFor(e.ratingCount);
  } else {
    e.hours = d.opening_hours?.weekday_text ?? null;
    e.website = d.website ?? null;
    e.hasWebsite = !!d.website;
    e.phone = d.formatted_phone_number ?? null;
    e.blurb = d.editorial_summary?.overview ?? null;
    e.tags = mineTags(d.reviews, d);
    e.tier = tierFor(e.ratingCount);
    if (d.price_level != null) e.priceLevel = d.price_level;
    e.detailsUpdatedAt = new Date().toISOString();
    done++;
  }

  if ((done + failed) % 50 === 0) {
    console.log(`  ${done + failed}/${todo.length}  (ok ${done}, fail ${failed})`);
    fs.writeFileSync(DATA_PATH, JSON.stringify(eateries, null, 2)); // checkpoint
  }
  await sleep(120);
}

fs.writeFileSync(DATA_PATH, JSON.stringify(eateries, null, 2));
console.log(`\nEnriched ${done}, failed ${failed}`);

const withTags = eateries.filter((e) => e.tags?.length).length;
const withSite = eateries.filter((e) => e.hasWebsite).length;
const tiers = eateries.reduce((m, e) => ((m[e.tier] = (m[e.tier] || 0) + 1), m), {});
console.log(`tags: ${withTags} | website: ${withSite} | tiers:`, tiers);

// Push to Firestore
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  const { initializeApp, cert, getApps } = await import("firebase-admin/app");
  const { getFirestore } = await import("firebase-admin/firestore");
  const app = getApps().length ? getApps()[0]
    : initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
  const db = getFirestore(app);
  const col = db.collection("eateries");

  const enriched = eateries.filter((e) => e.detailsUpdatedAt);
  for (let i = 0; i < enriched.length; i += 400) {
    const batch = db.batch();
    for (const e of enriched.slice(i, i + 400)) batch.set(col.doc(e.id), e, { merge: true });
    await batch.commit();
  }
  console.log(`Firestore: updated ${enriched.length} docs`);
}
