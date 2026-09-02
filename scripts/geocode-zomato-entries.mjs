/**
 * Geocode the 68 pending zomato-* entries added from Zomato collection pastes.
 * Uses Google Places Find Place + Details to set lat/lng, placeId, hours, etc.
 * Resumable — skips entries that already have lat set.
 *
 * Run: node scripts/geocode-zomato-entries.mjs
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
const DELAY_MS = 120; // stay well under QPM limit

const FIELDS_FIND = "place_id,name,geometry,formatted_address,rating,user_ratings_total,price_level,photos";
const FIELDS_DETAILS = [
  "name", "editorial_summary", "opening_hours", "website",
  "formatted_phone_number", "price_level", "reviews",
  "serves_beer", "serves_vegetarian_food", "dine_in",
  "takeout", "delivery", "reservable",
].join(",");

const KNOWN_AREAS = [
  "Jubilee Hills", "Film Nagar", "Madhapur", "HITEC City", "Hitech City",
  "Gachibowli", "Kondapur", "Banjara Hills", "Financial District", "Kokapet",
  "Nanakramguda", "Begumpet", "Himayatnagar", "Himayath Nagar", "Secunderabad",
  "Kukatpally", "Manikonda", "Miyapur", "Abids", "Kompally", "Malakpet",
  "LB Nagar", "Uppal", "Ameerpet", "Somajiguda", "Khairatabad", "Nagole",
  "Falaknuma", "Ghansi Bazaar", "Kothapet", "Sangareddy", "Hafeezpet",
  "Necklace Road", "Gandipet", "Nanakramguda", "Tolichowki", "Charminar",
];

function areaFromAddress(addr = "") {
  for (const a of KNOWN_AREAS) {
    if (addr.toLowerCase().includes(a.toLowerCase())) return a;
  }
  return null;
}

function tierFor(n = 0) {
  if (n >= 1000) return "landmark";
  if (n >= 200) return "established";
  return "popular";
}

const TAG_RULES = [
  { tag: "work-friendly", kw: ["laptop", "wifi", "wi-fi", "work from", "working"] },
  { tag: "quiet", kw: ["quiet", "peaceful", "calm", "serene"] },
  { tag: "view", kw: ["view", "lake", "rooftop", "terrace", "skyline"] },
  { tag: "outdoor", kw: ["outdoor", "garden", "alfresco", "open air", "patio"] },
  { tag: "date", kw: ["date night", "romantic", "cozy", "cosy", "intimate"] },
  { tag: "live-music", kw: ["live music", "live band", "dj ", "karaoke"] },
  { tag: "breakfast", kw: ["breakfast", "brunch"] },
  { tag: "pet-friendly", kw: ["pet friendly", "pet-friendly", "dog friendly"] },
  { tag: "desserts", kw: ["dessert", "cheesecake", "brownie", "pastries"] },
  { tag: "veg-friendly", kw: ["veg", "vegetarian"] },
];

function mineTags(reviews = []) {
  const text = reviews.map(r => r.text?.toLowerCase() ?? "").join(" ");
  const tags = [];
  for (const rule of TAG_RULES) {
    if (rule.kw.filter(k => text.includes(k)).length >= 2) tags.push(rule.tag);
  }
  return tags;
}

async function findPlace(name, area) {
  const query = `${name} ${area} Hyderabad`;
  const url = new URL("https://maps.googleapis.com/maps/api/place/findplacefromtext/json");
  url.searchParams.set("input", query);
  url.searchParams.set("inputtype", "textquery");
  url.searchParams.set("fields", FIELDS_FIND);
  url.searchParams.set("locationbias", "circle:25000@17.4065,78.4772");
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

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function save(eateries) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(eateries, null, 2), "utf8");
}

const eateries = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
const pending = eateries
  .map((e, i) => ({ e, i }))
  .filter(({ e }) => e.id?.startsWith("zomato-") && e.lat === null);

console.log(`Pending entries to geocode: ${pending.length}`);

let done = 0, notFound = 0;

for (const { e, i } of pending) {
  const areaHint = e.discoveredIn || e.address?.replace(", Hyderabad", "") || "";
  process.stdout.write(`[${done + notFound + 1}/${pending.length}] ${e.name} (${areaHint})... `);

  const candidate = await findPlace(e.name, areaHint);
  if (!candidate) {
    console.log("NOT FOUND");
    notFound++;
    await sleep(DELAY_MS);
    continue;
  }

  const { place_id, geometry, formatted_address, rating: gRating, user_ratings_total, price_level, photos } = candidate;

  const details = await placeDetails(place_id);
  await sleep(DELAY_MS);

  const detectedArea = areaFromAddress(formatted_address) || areaHint;
  const reviewTags = mineTags(details?.reviews || []);
  const existingTags = e.tags || [];
  const mergedTags = [...new Set([...existingTags, ...reviewTags])];

  eateries[i] = {
    ...e,
    id: place_id,
    placeId: place_id,
    lat: geometry.location.lat,
    lng: geometry.location.lng,
    address: formatted_address || e.address,
    rating: e.rating ?? gRating ?? null,
    ratingCount: user_ratings_total ?? null,
    priceLevel: price_level ?? null,
    photoRef: photos?.[0]?.photo_reference ?? null,
    discoveredIn: detectedArea,
    status: "approved",
    hours: details?.opening_hours?.weekday_text ?? null,
    website: details?.website ?? null,
    hasWebsite: !!(details?.website),
    phone: details?.formatted_phone_number ?? null,
    blurb: details?.editorial_summary?.overview ?? e.blurb ?? null,
    tags: mergedTags,
    tier: tierFor(user_ratings_total),
    detailsUpdatedAt: new Date().toISOString(),
  };
  // costForTwo already set from Zomato data — keep it

  save(eateries);
  done++;
  console.log(`OK (${geometry.location.lat.toFixed(4)}, ${geometry.location.lng.toFixed(4)})`);
  await sleep(DELAY_MS);
}

console.log(`\nDone. Geocoded: ${done}, Not found: ${notFound}`);
