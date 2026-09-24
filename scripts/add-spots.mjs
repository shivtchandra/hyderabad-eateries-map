/**
 * Targeted single-spot adder — for named restaurants the grid-tiled seed
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
  { query: "Kadali Kitchen Jubilee Hills Hyderabad", area: "Jubilee Hills", category: "local" },
  { query: "Iguru Yousufguda Hyderabad", area: "Yousufguda", category: "local" },
  { query: "Chaitanya Food Court Kukatpally Hyderabad", area: "Kukatpally", category: "local" },
  { query: "Meridian Restaurant Panjagutta Hyderabad", area: "Panjagutta", category: "local" },
  // Round 2 — gap-fill from LBB biryani list, Irani-cafe roundups, and
  // fine-dining lists (Condé Nast / wibest) cross-checked against our data.
  { query: "Dum Pukht Begum's ITC Kohenur Hyderabad", area: "Madhapur", category: "local" },
  { query: "Zyqa Durbar Banjara Hills Hyderabad", area: "Banjara Hills", category: "local" },
  { query: "Greenpark Hotel Ameerpet Hyderabad", area: "Ameerpet", category: "local" },
  { query: "Tansen restaurant Hyderabad", area: "Banjara Hills", category: "local" },
  { query: "Bidri restaurant Marriott Tank Bund Hyderabad", area: "Tank Bund", category: "local" },
  { query: "Spicy Venue restaurant Hyderabad", area: "Kondapur", category: "local" },
  { query: "Khaan Saab Gachibowli Hyderabad", area: "Gachibowli", category: "local" },
  { query: "Chichas restaurant Lakdikapul Hyderabad", area: "Lakdikapul", category: "local" },
  { query: "Tosh-E-Daan Hyderabad", area: "Banjara Hills", category: "local" },
  { query: "Grand Hotel Abids Hyderabad", area: "Abids", category: "local" },
  // NOTE: "Greenpark Hotel" and "Rajasthani Jalebi and Namkeens" queries were
  // dropped — Find Place kept matching the wrong low-signal entity (0 and 3
  // reviews). Correct matches were added by hand: "Once Upon A Time - Hotel
  // GreenPark" and "Raj Bhawani Jalebi & Namkeen". Don't re-add those queries.
  { query: "Jewel of Nizam The Golkonda Masab Tank Hyderabad", area: "Masab Tank", category: "local" },
  { query: "Firdaus Taj Krishna Banjara Hills Hyderabad", area: "Banjara Hills", category: "local" },
  { query: "Celeste Taj Falaknuma Palace Hyderabad", area: "Charminar", category: "local" },
  { query: "Dakshin ITC Kakatiya Begumpet Hyderabad", area: "Begumpet", category: "local" },
  { query: "Fusion 9 Banjara Hills Hyderabad", area: "Banjara Hills", category: "local" },
  { query: "Ohri's Jiva Imperia Banjara Hills Hyderabad", area: "Banjara Hills", category: "local" },
  { query: "Prost Brew Pub Gachibowli Hyderabad", area: "Gachibowli", category: "restro-bar" },
  // Round 3 — Zomato editorial "Iconic restaurants" + "The legends" collections
  // scraped and cross-checked, plus user-named "Inka" (Sainikpuri).
  { query: "Inka The Stories of Telugu Kitchen Sainikpuri Hyderabad", area: "Sainikpuri", category: "local" },
  { query: "Ru Craft Bar Jubilee Hills Hyderabad", area: "Jubilee Hills", category: "restro-bar" },
  { query: "Manam Chocolate Banjara Hills Hyderabad", area: "Banjara Hills", category: "cafe" },
  { query: "Telugu Medium Kitchen Bar Jubilee Hills Hyderabad", area: "Jubilee Hills", category: "restro-bar" },
  { query: "Babylon Brewery Club Nanakramguda Hyderabad", area: "Nanakramguda", category: "restro-bar" },
  { query: "All Seasons Restaurant Banjara Hills Hyderabad", area: "Banjara Hills", category: "local" },
  { query: "Rayalaseema Ruchulu Lakdikapul Hyderabad", area: "Lakdikapul", category: "local" },
  { query: "Hotel Sohail Malakpet Hyderabad", area: "Malakpet", category: "local" },
  { query: "Taj Mahal Hotel restaurant Abids Hyderabad", area: "Abids", category: "local" },
  { query: "Ram Ki Bandi Nampally Hyderabad", area: "Nampally", category: "local" },
  { query: "Gokul Chat Koti Hyderabad", area: "Koti", category: "local" },
  { query: "Almond House Himayatnagar Hyderabad", area: "Himayatnagar", category: "bakery" },
  { query: "Nanking restaurant Paradise Circle Secunderabad Hyderabad", area: "Secunderabad", category: "local" },
  { query: "Famous Ice Creams Nampally Hyderabad", area: "Nampally", category: "ice cream" },
  // Round 4 — wide net per "not only best but all with real traction": Zomato's
  // regional/dosa/kebab/mandi/thali collections cross-checked against our data.
  { query: "Tales of Telugu Madhapur Hyderabad", area: "Madhapur", category: "local" },
  { query: "TSK The Spice Kitchen Kukatpally Hyderabad", area: "Kukatpally", category: "local" },
  { query: "Teluguness Hitech City Hyderabad", area: "Hitech City", category: "local" },
  { query: "AnTeRa Courtyard Financial District Hyderabad", area: "Financial District", category: "local" },
  { query: "Murugan Kitchen Gachibowli Hyderabad", area: "Gachibowli", category: "local" },
  { query: "Flavours Of Andhra Whitefields Hyderabad", area: "Whitefields", category: "local" },
  { query: "Kodi Kura Chitti Gaare Kondapur Hyderabad", area: "Kondapur", category: "local" },
  { query: "Kritunga Restaurant Jagavi's LB Nagar Hyderabad", area: "LB Nagar", category: "local" },
  { query: "Naatu Kitchen And Bar Jubilee Hills Hyderabad", area: "Jubilee Hills", category: "restro-bar" },
  { query: "Itlu restaurant Jubilee Hills Hyderabad", area: "Jubilee Hills", category: "local" },
  { query: "House Of Bagaara Madhapur Hyderabad", area: "Madhapur", category: "local" },
  { query: "Anthe Kitchen Hitech City Hyderabad", area: "Hitech City", category: "local" },
  { query: "Krishnapatnam restaurant Jubilee Hills Hyderabad", area: "Jubilee Hills", category: "local" },
  { query: "Aaha Food Village Manikonda Hyderabad", area: "Manikonda", category: "local" },
  { query: "Kritaa Nagar Gachibowli Hyderabad", area: "Gachibowli", category: "local" },
  { query: "Palm Tree Arabian Restaurant Hafeezpet Hyderabad", area: "Hafeezpet", category: "local" },
  { query: "Theta Theta Telugu Jubilee Hills Hyderabad", area: "Jubilee Hills", category: "local" },
  { query: "7 Oceans restaurant Miyapur Hyderabad", area: "Miyapur", category: "local" },
  { query: "Mahamudra Jubilee Hills Hyderabad", area: "Jubilee Hills", category: "cafe" },
  { query: "Takita Takita Kitchen Kompally Hyderabad", area: "Kompally", category: "local" },
  { query: "Native Katha Madhapur Hyderabad", area: "Madhapur", category: "local" },
  { query: "Native South Gandipet Hyderabad", area: "Gandipet", category: "local" },
  { query: "Bezawada Junction Kondapur Hyderabad", area: "Kondapur", category: "local" },
  { query: "Mindspace Social Hitech City Hyderabad", area: "Hitech City", category: "restro-bar" },
  { query: "Dine Hill Masab Tank Hyderabad", area: "Masab Tank", category: "local" },
  { query: "Seasons Xprs Banjara Hills Hyderabad", area: "Banjara Hills", category: "local" },
  { query: "Golden Pavilion Banjara Hills Hyderabad", area: "Banjara Hills", category: "local" },
  { query: "Shahi Dastarkhwan Lakdikapul Hyderabad", area: "Lakdikapul", category: "local" },
  { query: "Captain Cook restaurant SR Nagar Hyderabad", area: "SR Nagar", category: "local" },
  { query: "Grill 9 Karkhana Secunderabad Hyderabad", area: "Secunderabad", category: "local" },
  { query: "4 Seasons restaurant Tolichowki Hyderabad", area: "Tolichowki", category: "local" },
  { query: "Mujtaba Grills Karkhana Secunderabad Hyderabad", area: "Secunderabad", category: "local" },
  { query: "Barkaas Indo Arabic Restaurant Kukatpally Hyderabad", area: "Kukatpally", category: "local" },
  { query: "Mandi@36 Banjara Hills Hyderabad", area: "Banjara Hills", category: "local" },
  { query: "Mandar restaurant Tolichowki Hyderabad", area: "Tolichowki", category: "local" },
  { query: "The Joint Al-Mandi Madhapur Hyderabad", area: "Madhapur", category: "local" },
  { query: "Yum Yum Tree Madhapur Hyderabad", area: "Madhapur", category: "local" },
  { query: "Mandi House Arabian Restaurant Banjara Hills Hyderabad", area: "Banjara Hills", category: "local" },
  { query: "Maraheb Arabian Restaurant Ameerpet Hyderabad", area: "Ameerpet", category: "local" },
  { query: "Mandi King Arabian Restaurant Malakpet Hyderabad", area: "Malakpet", category: "local" },
  { query: "Wah Mandi Kothaguda Hyderabad", area: "Kothaguda", category: "local" },
  { query: "Habibo restaurant Ameerpet Hyderabad", area: "Ameerpet", category: "local" },
  { query: "Tilak's Kitchen Madhapur Hyderabad", area: "Madhapur", category: "local" },
  { query: "Gaurang's Kitchen Jubilee Hills Hyderabad", area: "Jubilee Hills", category: "local" },
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

// One-off single spot: node scripts/add-spots.mjs "<query>" "<area>" <category>
const QUEUE = process.argv[2]
  ? [{ query: process.argv[2], area: process.argv[3] || "", category: process.argv[4] || "local" }]
  : TARGETS;

let added = 0, skipped = 0;
for (const t of QUEUE) {
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
