/**
 * r/hyderabad favorites gap-fill (one-shot) — for named restaurants the grid-tiled seed
 * missed (word-of-mouth places outside the hotspot grid, or exact spellings
 * Nearby Search didn't surface). Cost-conscious: 1 Find Place + 1 Details
 * call per spot, NOT a full city re-seed.
 *
 * Run: node scripts/add-spots.mjs
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

// Researched via web search (homegrown.co.in, zomato, LBB, mehfilbiryani.com) —
// name + query string tuned to hit the right branch on Find Place.
const TARGETS = [
  // Round 5 — r/hyderabad "favorite restaurants" thread gap-fill (2024 post, checked 2026-09)
  { query: "Simhapuri Deluxe meals Hyderabad", area: "Hyderabad", category: "local" },
  { query: "Palle Vindu restaurant Hyderabad", area: "Hyderabad", category: "local" },
  { query: "Aazebo The Royal Arabian Restaurant Hyderabad", area: "Hyderabad", category: "local" },
  { query: "Nawaabs Restaurant Gachibowli Hyderabad", area: "Gachibowli", category: "local" },
  { query: "Reshmi Classic Restaurant Hyderabad", area: "Hyderabad", category: "local" },
  { query: "Shalimar Burger City Light Hyderabad", area: "Hyderabad", category: "local" },
  { query: "Desi Cheeni Necklace Road Hyderabad", area: "Necklace Road", category: "local" },
  { query: "Kebabwala Hyderabad", area: "Hyderabad", category: "local" },
  { query: "Lavish Restaurant Hyderabad", area: "Hyderabad", category: "local" },
  { query: "Wimpy Fast Food Center Hyderabad", area: "Hyderabad", category: "local" },
  { query: "Alex Kitchen Liberty Hyderabad", area: "Secunderabad", category: "local" },
  { query: "Megacity Bar and Restaurant Hyderabad", area: "Hyderabad", category: "restro-bar" },
  { query: "Woodlands Restaurant AS Rao Nagar Hyderabad", area: "AS Rao Nagar", category: "local" },
  { query: "Belsons Patny Centre Secunderabad", area: "Secunderabad", category: "local" },
  { query: "Bikanerwala Banjara Hills Hyderabad", area: "Banjara Hills", category: "local" },
  { query: "Bikanerwala Basheerbagh Hyderabad", area: "Basheerbagh", category: "local" },
  { query: "Tattva Begumpet Hyderabad", area: "Begumpet", category: "local" },
  { query: "Basil Restaurant Banjara Hills Hyderabad", area: "Banjara Hills", category: "local" },
  { query: "Blue Basil Himayatnagar Hyderabad", area: "Himayatnagar", category: "local" },
  { query: "Jalpaan Somajiguda Hyderabad", area: "Somajiguda", category: "local" },
  { query: "Kamaths Restaurant Lakdi ka pul Hyderabad", area: "Lakdikapul", category: "local" },
  { query: "Swati Snacks Kacheguda Hyderabad", area: "Kacheguda", category: "local" },
  { query: "Santosh Dhaba Paradise Secunderabad", area: "Secunderabad", category: "local" },
  { query: "Santosh Dhaba Hanuman Tekdi Hyderabad", area: "Hyderabad", category: "local" },
  { query: "Emerald Sweet Shop Lower Tank Bund Hyderabad", area: "Tank Bund", category: "bakery" },
  { query: "Chung Hua Chinese Restaurant Secunderabad", area: "Secunderabad", category: "local" },
  { query: "Flying Spaghetti Monster Hyderabad", area: "Hyderabad", category: "restaurant" },
  { query: "E-Woke Hyderabad", area: "Hyderabad", category: "cafe" },
  { query: "Burma Burma Begumpet Hyderabad", area: "Begumpet", category: "restaurant" },
  { query: "Hashi Hyderabad", area: "Hyderabad", category: "restaurant" },
  { query: "Haiku Hyderabad", area: "Hyderabad", category: "restaurant" },
  { query: "Tre Forni Park Hyatt Hyderabad", area: "Banjara Hills", category: "restaurant" },
  { query: "Tosh-E-Daan Hyderabad", area: "Banjara Hills", category: "local" },
  { query: "Hibacci Hyderabad", area: "Hyderabad", category: "restaurant" },
  { query: "Kathmandu Momos Somajiguda Hyderabad", area: "Somajiguda", category: "local" },
  { query: "Prince Restaurant Biryani Mehdipatnam Hyderabad", area: "Mehdipatnam", category: "local" },
  { query: "Deccan Kitchen Tolichowki Hyderabad", area: "Tolichowki", category: "local" },
  { query: "Terrace Mandi GVK Hyderabad", area: "Banjara Hills", category: "local" },
  { query: "Writers Room Film Nagar Hyderabad", area: "Film Nagar", category: "cafe" },
  { query: "Al Taza Shawarma Kompally Hyderabad", area: "Kompally", category: "local" },
  { query: "Istah Shawarma Hyderabad", area: "Hyderabad", category: "local" },
  { query: "Capital Shawarma Hyderguda Hyderabad", area: "Hyderguda", category: "local" },
  { query: "Shawafel Jubilee Hills Hyderabad", area: "Jubilee Hills", category: "local" },
  { query: "Zouq Levantine Shawarma Hyderabad", area: "Hyderabad", category: "local" },
  { query: "Feel in Saudia Nampally Hyderabad", area: "Nampally", category: "local" },
  { query: "Mandi Elite Dilsukhnagar Hyderabad", area: "Dilsukhnagar", category: "local" },
  { query: "Pizza Den Paradise Circle Secunderabad", area: "Secunderabad", category: "restaurant" },
  { query: "Mrugan Ghee Badichowdi Hyderabad", area: "Hyderabad", category: "local" },
  { query: "Munshi Naan Purani Haveli Hyderabad", area: "Charminar", category: "bakery" },
  { query: "Levante Banjara Hills Hyderabad", area: "Banjara Hills", category: "restaurant" },
  { query: "Peshawar Restaurant Hyderabad", area: "Hyderabad", category: "local" },
  { query: "Maryada Ramanna Hyderabad", area: "Hyderabad", category: "local" },
  { query: "United Kitchens of India Karkhana Secunderabad", area: "Secunderabad", category: "local" },
  { query: "Felfelah Hyderabad", area: "Hyderabad", category: "restaurant" },
  { query: "Tafosha Hyderabad", area: "Hyderabad", category: "cafe" },
  { query: "Moyaah Hyderabad", area: "Hyderabad", category: "restaurant" },
  { query: "Grand Four Seasons Kondapur Hyderabad", area: "Kondapur", category: "local" },
  { query: "Abidis Kitchen Hyderabad", area: "Hyderabad", category: "local" },
  { query: "Mandi@36 Jubilee Hills Hyderabad", area: "Jubilee Hills", category: "local" },
  { query: "Spice 6 Hyderabad", area: "Hyderabad", category: "local" },
  { query: "Original Matam Al Arabia Hyderabad", area: "Hyderabad", category: "local" },
  { query: "Chinese Pavilion Hyderabad", area: "Hyderabad", category: "restaurant" },
  { query: "Yousufain Food Corner Hyderabad", area: "Hyderabad", category: "local" },
  { query: "Dimmy Pan Palace Necklace Road Hyderabad", area: "Necklace Road", category: "local" },
  { query: "Shivnath Mithai Esamiya Bazaar Hyderabad", area: "Hyderabad", category: "bakery" },
  { query: "Burhanpur Jalebi Hyderabad", area: "Hyderabad", category: "bakery" },
  { query: "Nayaab Hotel Afzalgunj Hyderabad", area: "Afzalgunj", category: "local" },
  { query: "Subhan Bakery Nampally Hyderabad", area: "Nampally", category: "bakery" },
  { query: "Iqbal Hotel Purani Haveli Hyderabad", area: "Charminar", category: "local" },
  { query: "Rika Park Hyatt Hyderabad", area: "Banjara Hills", category: "restaurant" },
  { query: "Utsav by Moksh Tivoli Hyderabad", area: "Hyderabad", category: "restaurant" },
  { query: "Taj TriStar Dakshina Mandap Patny Secunderabad", area: "Secunderabad", category: "local" },
  { query: "Narsing Restaurant Abids Hyderabad", area: "Abids", category: "local" },
  { query: "Nani's Kitchen Tank Bund Hyderabad", area: "Tank Bund", category: "local" },
  { query: "Dosa Gaadi Durgam Cheruvu Hyderabad", area: "Madhapur", category: "local" },
  { query: "F3 Cafe Sainikpuri Hyderabad", area: "Sainikpuri", category: "cafe" },
  { query: "Mirosa Hyderabad", area: "Hyderabad", category: "restaurant" },
  { query: "Palace Restaurant Dhaba Sangareddy Road Hyderabad", area: "Hyderabad", category: "local" },
  { query: "Blue Diamond Restaurant Hyderabad", area: "Hyderabad", category: "local" },
  { query: "Nataka Kitchen Hyderabad", area: "Hyderabad", category: "local" },
];

const FIELDS_DETAILS = [
  "name", "editorial_summary", "opening_hours", "website",
  "formatted_phone_number", "price_level", "reviews",
  "serves_beer", "serves_vegetarian_food", "serves_breakfast",
  "dine_in", "takeout", "delivery", "reservable",
  "wheelchair_accessible_entrance",
].join(",");

async function findPlace(query) {
  const url = new URL("https://maps.googleapis.com/maps/api/place/findplacefromtext/json");
  url.searchParams.set("input", query);
  url.searchParams.set("inputtype", "textquery");
  url.searchParams.set("fields", "place_id,name,geometry,formatted_address,rating,user_ratings_total,price_level,photos");
  url.searchParams.set("key", KEY);
  const res = await fetch(url);
  const data = await res.json();
  if (data.status !== "OK" || !data.candidates?.length) return null;
  return data.candidates[0];
}

async function placeDetails(placeId) {
  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", FIELDS_DETAILS);
  url.searchParams.set("key", KEY);
  const res = await fetch(url);
  const data = await res.json();
  if (data.status !== "OK") return null;
  return data.result;
}

// Known locality names (mirrors the HOTSPOTS list in seed-eateries.mjs) —
// matched against the actual formatted_address so discoveredIn reflects
// where Google says the place IS, not where we guessed it'd be.
const KNOWN_AREAS = [
  "Jubilee Hills", "Film Nagar", "Madhapur", "HITEC City", "Gachibowli",
  "Kondapur", "Banjara Hills", "Financial District", "Kokapet", "Narsingi",
  "Nanakramguda", "Khajaguda", "Begumpet", "Himayatnagar", "Secunderabad",
  "Kukatpally", "Manikonda", "Nallagandla", "Miyapur", "Tarnaka", "Abids",
  "Attapur", "Kompally", "Charminar", "Malakpet", "Dilsukhnagar", "LB Nagar",
  "Uppal", "Habsiguda", "ECIL", "Alwal", "Sainikpuri", "Bowenpally",
  "Nampally", "Yousufguda", "Punjagutta", "Panjagutta", "Somajiguda",
  "Ameerpet", "SR Nagar", "Narayanguda", "RTC Cross Road",
];
function areaFromAddress(address = "") {
  for (const area of KNOWN_AREAS) {
    if (address.toLowerCase().includes(area.toLowerCase())) return area;
  }
  return null;
}

function tierFor(ratingCount = 0) {
  if (ratingCount >= 1000) return "landmark";
  if (ratingCount >= 200) return "established";
  return "hidden-gem";
}

const TAG_RULES = [
  { tag: "work-friendly", kw: ["laptop", "wifi", "wi-fi", "work from", "working", "plug point", "co-work"] },
  { tag: "quiet", kw: ["quiet", "peaceful", "calm", "serene", "tucked away"] },
  { tag: "view", kw: ["view", "lake", "rooftop", "terrace", "skyline", "sunset"] },
  { tag: "outdoor", kw: ["outdoor", "garden", "alfresco", "al fresco", "open air", "patio"] },
  { tag: "date", kw: ["date night", "romantic", "cozy", "cosy", "intimate"] },
  { tag: "breakfast", kw: ["breakfast", "brunch", "morning"] },
  { tag: "desserts", kw: ["dessert", "cheesecake", "brownie"] },
];
function mineTags(reviews = [], details = {}) {
  const blob = reviews.map((r) => (r.text || "").toLowerCase()).join(" \n ");
  const tags = [];
  for (const rule of TAG_RULES) {
    let score = 0;
    for (const k of rule.kw) {
      const m = blob.split(k).length - 1;
      if (!m) continue;
      score += k.includes(" ") ? m * 2 : m;
      if (score >= 2) break;
    }
    if (score >= 2) tags.push(rule.tag);
  }
  if (details.serves_vegetarian_food) tags.push("veg-friendly");
  if (details.reservable) tags.push("reservable");
  return [...new Set(tags)].slice(0, 6);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const eateries = JSON.parse(fs.readFileSync(OUT_PATH, "utf-8"));
const existingIds = new Set(eateries.map((e) => e.placeId));

let added = 0, skipped = 0;
for (const t of TARGETS) {
  const cand = await findPlace(t.query);
  if (!cand) { console.log(`MISS: ${t.query}`); skipped++; continue; }
  if (existingIds.has(cand.place_id)) { console.log(`already have: ${cand.name}`); skipped++; continue; }

  await sleep(150);
  const d = await placeDetails(cand.place_id);

  const entry = {
    id: cand.place_id,
    placeId: cand.place_id,
    name: cand.name,
    category: t.category,
    lat: cand.geometry.location.lat,
    lng: cand.geometry.location.lng,
    address: cand.formatted_address || "",
    rating: cand.rating ?? null,
    ratingCount: cand.user_ratings_total ?? 0,
    priceLevel: cand.price_level ?? null,
    photoRef: cand.photos?.[0]?.photo_reference ?? null,
    zomatoUrl: `https://www.zomato.com/hyderabad/search?q=${encodeURIComponent(cand.name)}`,
    offers: [],
    offersUpdatedAt: null,
    status: "approved",
    // Derive from the ACTUAL matched address, not the guessed query area —
    // Find Place can return a different branch than intended (e.g. querying
    // "Iguru Yousufguda" can surface the Khajaguda branch instead).
    discoveredIn: areaFromAddress(cand.formatted_address) || t.area,
    createdAt: new Date().toISOString(),
    hours: d?.opening_hours?.weekday_text ?? null,
    website: d?.website ?? null,
    hasWebsite: !!d?.website,
    phone: d?.formatted_phone_number ?? null,
    blurb: d?.editorial_summary?.overview ?? null,
    tags: d ? mineTags(d.reviews, d) : [],
    tier: tierFor(cand.user_ratings_total ?? 0),
    detailsUpdatedAt: d ? new Date().toISOString() : null,
  };

  eateries.push(entry);
  existingIds.add(cand.place_id);
  console.log(`ADDED: ${entry.name} @ ${entry.address} (${entry.rating}★, ${entry.ratingCount} reviews)`);
  added++;
  await sleep(150);
}

fs.writeFileSync(OUT_PATH, JSON.stringify(eateries, null, 2));
console.log(`\nDone. added=${added} skipped=${skipped}`);

// Push to Firestore if configured
if (process.env.FIREBASE_SERVICE_ACCOUNT && added > 0) {
  const { initializeApp, cert, getApps } = await import("firebase-admin/app");
  const { getFirestore } = await import("firebase-admin/firestore");
  const app = getApps().length ? getApps()[0]
    : initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
  const db = getFirestore(app);
  const col = db.collection("eateries");
  const batch = db.batch();
  for (const e of eateries.slice(-added)) batch.set(col.doc(e.id), e, { merge: true });
  await batch.commit();
  console.log(`Firestore: upserted ${added} docs`);
}
