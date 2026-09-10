/**
 * Gap-fill: Windmills Craftworks, Krishna's Kitchen, and nearby misses.
 * Run: node scripts/add-missed-spots.mjs
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

const TARGETS = [
  { query: "Windmills Craftworks Madhapur Hyderabad", area: "Madhapur", category: "restro-bar" },
  { query: "Krishna's Kitchen Kavuri Hills Madhapur Hyderabad", area: "Madhapur", category: "local" },
  { query: "Simply South Jubilee Hills Hyderabad", area: "Jubilee Hills", category: "local" },
  { query: "Sukoon Lake Side Bistro Hyderabad", area: "Madhapur", category: "cafe" },
  { query: "Fursat Kitchen and Bar Hyderabad", area: "Madhapur", category: "restro-bar" },
];

const FIELDS_DETAILS = [
  "name", "editorial_summary", "opening_hours", "website",
  "formatted_phone_number", "price_level", "reviews",
  "serves_beer", "serves_vegetarian_food", "serves_breakfast",
  "dine_in", "takeout", "delivery", "reservable",
  "wheelchair_accessible_entrance",
].join(",");

const KNOWN_AREAS = [
  "Jubilee Hills", "Film Nagar", "Madhapur", "HITEC City", "Gachibowli",
  "Kondapur", "Banjara Hills", "Financial District", "Kokapet", "Narsingi",
  "Nanakramguda", "Khajaguda", "Begumpet", "Himayatnagar", "Secunderabad",
  "Kukatpally", "Manikonda", "Nallagandla", "Miyapur", "Tarnaka", "Abids",
  "Attapur", "Kompally", "Charminar", "Malakpet", "Dilsukhnagar", "LB Nagar",
  "Uppal", "Habsiguda", "ECIL", "Alwal", "Sainikpuri", "Bowenpally",
  "Nampally", "Yousufguda", "Punjagutta", "Panjagutta", "Somajiguda",
  "Ameerpet", "SR Nagar", "Narayanguda", "Hafeezpet", "Kothaguda",
  "Whitefields", "Rai Durg", "Raidurg", "Kavuri Hills",
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
  { tag: "live-music", kw: ["live music", "jazz", "concert", "gig"] },
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
  if (details.serves_beer) tags.push("live-music"); // weak; prefer review tags
  if (details.reservable) tags.push("reservable");
  return [...new Set(tags.filter((t) => t !== "live-music" || blob.includes("live music") || blob.includes("jazz") || blob.includes("concert")))].slice(0, 6);
}

async function findPlace(query) {
  const url = new URL("https://maps.googleapis.com/maps/api/place/findplacefromtext/json");
  url.searchParams.set("input", query);
  url.searchParams.set("inputtype", "textquery");
  url.searchParams.set("fields", "place_id,name,geometry,formatted_address,rating,user_ratings_total,price_level,photos");
  url.searchParams.set("key", KEY);
  const res = await fetch(url);
  const data = await res.json();
  if (data.status !== "OK" || !data.candidates?.length) {
    console.log(`  find status=${data.status} ${data.error_message || ""}`);
    return null;
  }
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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const eateries = JSON.parse(fs.readFileSync(OUT_PATH, "utf-8"));
const existingIds = new Set(eateries.map((e) => e.placeId));

let added = 0, skipped = 0;
for (const t of TARGETS) {
  console.log(`\n→ ${t.query}`);
  const cand = await findPlace(t.query);
  if (!cand) { console.log(`MISS: ${t.query}`); skipped++; continue; }
  if (existingIds.has(cand.place_id)) {
    console.log(`already have: ${cand.name}`);
    skipped++;
    continue;
  }
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
    discoveredIn: areaFromAddress(cand.formatted_address) || t.area,
    createdAt: new Date().toISOString(),
    hours: d?.opening_hours?.weekday_text ?? null,
    website: d?.website ?? null,
    hasWebsite: !!d?.website,
    phone: d?.formatted_phone_number ?? null,
    blurb: d?.editorial_summary?.overview ?? null,
    tags: d ? mineTags(d.reviews || [], d) : [],
    tier: tierFor(cand.user_ratings_total ?? 0),
    detailsUpdatedAt: d ? new Date().toISOString() : null,
  };
  eateries.push(entry);
  existingIds.add(cand.place_id);
  console.log(`ADDED: ${entry.name} @ ${entry.discoveredIn} (${entry.rating}★, ${entry.ratingCount})`);
  added++;
  await sleep(150);
}

fs.writeFileSync(OUT_PATH, JSON.stringify(eateries, null, 2) + "\n");
console.log(`\nDone. added=${added} skipped=${skipped} total=${eateries.length}`);
