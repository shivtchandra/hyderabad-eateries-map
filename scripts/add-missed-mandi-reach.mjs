/**
 * Add missing mandi spots using Agent Reach (Jina Reader for Zomato pages)
 * + OpenStreetMap Nominatim for lat/lng. No Google Maps API.
 *
 * Run: node scripts/add-missed-mandi-reach.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_PATH = path.join(__dirname, "..", "data", "eateries.json");
const UA = "hyderabad-eateries-map/1.0 (agent-reach import; contact: eats.mapmyhyd.com)";

/**
 * Seed list: user callouts + popular Zomato mandi cards that were missing.
 * zomatoSlug is optional; when set we enrich via r.jina.ai.
 */
const TARGETS = [
  {
    name: "New Indo Arabian Mandi House",
    area: "Nizampet",
    address: "1/123, C1, 2nd Floor, Nizampet, Hyderabad",
    rating: 3.8,
    ratingCount: 2434,
    costForTwo: 1200,
    zomatoSlug: "new-indo-arabian-mandi-house-nizampet",
  },
  {
    name: "Indo Arabian Mandi House And Bakers",
    area: "Srinagar Colony",
    address: "8-3-833/166, 1st Floor, Kamalapuri Colony Main Road, Srinagar Colony, Hyderabad",
    rating: 4.3,
    ratingCount: 47,
    costForTwo: 500,
    zomatoSlug: "indo-arabian-mandi-house-and-bakers-srinagar-colony",
  },
  { name: "Maraheb Arabian Restaurant", area: "Ameerpet", rating: 4.6, costForTwo: 800, zomatoSlug: "maraheb-arabian-restaurant-1-ameerpet" },
  { name: "Habibo", area: "Ameerpet", rating: 4.3, costForTwo: 1500, zomatoSlug: "habibo-ameerpet" },
  { name: "Yum Yum Tree Arabian Food Court", area: "Madhapur", rating: 4.1, costForTwo: 950, zomatoSlug: "yum-yum-tree-madhapur" },
  { name: "The Joint Al-Mandi", area: "Kukatpally", rating: 4.3, costForTwo: 1000, zomatoSlug: "the-joint-al-mandi-kukatpally" },
  { name: "Barkaas Indo Arabic Restaurant", area: "Kompally", rating: 4.6, costForTwo: 1100, zomatoSlug: "barkaas-indo-arabic-restaurant-kompally" },
  { name: "Barkaas Indo Arabic Restaurant", area: "Gachibowli", rating: 4.2, costForTwo: 1000, zomatoSlug: "barkaas-indo-arabic-restaurant-gachibowli" },
  { name: "Arabian Mandi @ 10", area: "Banjara Hills", rating: 4.4, costForTwo: 600 },
  { name: "Mandi 68", area: "Langer Houz", rating: 4.5, costForTwo: 1000 },
  { name: "Lucky's Arabian Mandi", area: "Padmarao Nagar", rating: 4.3, costForTwo: 850 },
  { name: "Wow Mandi Restaurant", area: "Malkajgiri", rating: 4.3, costForTwo: 850 },
  { name: "Tollywood Mandi", area: "SR Nagar", rating: 4.3, costForTwo: 700 },
  { name: "Forest Arabian Mandi House", area: "Madhapur", rating: 4.3, costForTwo: 700 },
  { name: "Mandi Delight", area: "Amberpet", rating: 4.4, costForTwo: 600 },
  { name: "Chirag Arabian Mandi", area: "Medchal Road", rating: 4.4, costForTwo: 600 },
  { name: "Live Kitchen", area: "Medchal Road", rating: 4.4, costForTwo: 1000 },
  { name: "Mataam Al Arabi", area: "Chandrayangutta", rating: 4.4, costForTwo: 700 },
  { name: "Zaffran Mataam Alarabi", area: "Falaknuma", rating: 4.2, costForTwo: 950 },
  { name: "Girl Friend Mandi", area: "Banjara Hills", rating: 4.2, costForTwo: 1000 },
  { name: "Animal Park Mandi House", area: "Jubilee Hills", rating: 3.8, costForTwo: 1200 },
  { name: "Gismat Jail Mandi", area: "Nizampet", rating: 3.7, costForTwo: 1500 },
  { name: "888 The Mandi Spot", area: "ECIL", rating: 4.3, costForTwo: 1300 },
  { name: "Hadramaut Mandi", area: "Chandrayangutta", rating: 3.8, costForTwo: 550 },
  { name: "Dar-Al-Mandi", area: "Shamshabad", rating: 4.1, costForTwo: 800 },
  { name: "Dosthugaallu Mandi & Restaurant", area: "Kukatpally", rating: 3.9, costForTwo: 1000 },
  { name: "The Village Mandi Restaurant", area: "Kompally", rating: 3.8, costForTwo: 1000 },
  { name: "Flash Back Arabian Mandi", area: "Kompally", rating: 3.9, costForTwo: 500 },
  { name: "Kabul Darbar", area: "Tolichowki", rating: 4.2, costForTwo: 1200 },
  { name: "Mandi@365", area: "LB Nagar", rating: 3.9, costForTwo: 1000 },
  { name: "Aazebo The Royal Arabian Restaurant", area: "Lakdikapul", rating: 3.8, costForTwo: 1800 },
  { name: "Mataam Al Yamani", area: "Lakdikapul", rating: 3.6, costForTwo: 700 },
  { name: "Prince Arabian Mandi Restaurant", area: "Lingampally", rating: 3.8, costForTwo: 1000 },
  { name: "Al Zara Mandi", area: "Vanasthalipuram", rating: 4.0, costForTwo: 450 },
  { name: "Impression Mandi House", area: "Hafeezpet", rating: 3.8, costForTwo: 1100 },
  { name: "Palm Tree Arabian Restaurant", area: "Hafeezpet", rating: 4.2, costForTwo: 600 },
  { name: "King's Mandi", area: "Madhapur", rating: 3.5, costForTwo: 600 },
  { name: "The Express Train Mandi", area: "Madhapur", rating: 3.6, costForTwo: 1000 },
  { name: "Concept Mandi No. 1", area: "Manikonda", rating: 3.8, costForTwo: 1200 },
  { name: "Mandi Vibes", area: "Manikonda", rating: 3.8, costForTwo: 700 },
  { name: "Nfs Aadaab Restaurant", area: "Kukatpally", rating: 4.2, costForTwo: 850 },
  { name: "Mandi King Arabian Restaurant", area: "Gachibowli", rating: 3.6, costForTwo: 600 },
  { name: "Mandi King Arabian Restaurant", area: "Kukatpally", rating: 3.4, costForTwo: 800 },
  { name: "Mandi King Arabian Restaurant", area: "Nagole", rating: 3.6, costForTwo: 950 },
  { name: "Mandi King Elite Arabian Restaurant", area: "Nallagandla", rating: 3.5, costForTwo: 1200 },
  { name: "The Majlis by Mandi King", area: "Attapur", rating: 4.1, costForTwo: 1000 },
  { name: "Yum Yum Tree Arabian Food Court", area: "Financial District", rating: 4.0, costForTwo: 950 },
  { name: "Yum Yum Tree Arabian Food Court", area: "Nizampet", rating: 4.1, costForTwo: 300 },
  { name: "Baith Al Mandi-The Arabian Restaurant", area: "Medchal Road", rating: 3.9, costForTwo: 600 },
  { name: "Grill House Arabian Mandi", area: "Jeedimetla", rating: 3.8, costForTwo: 500 },
  { name: "Sagar Arabian Mandi", area: "Suraram", rating: 3.6, costForTwo: 500 },
  { name: "Mandi Delight Arabian Restaurant", area: "Boduppal", rating: 3.6, costForTwo: 500 },
  { name: "MS Mandi & Shawarma", area: "Charminar", rating: 4.1, costForTwo: 1000 },
  { name: "Al Faizan Arabian Mandi", area: "SR Nagar", rating: 4.1, costForTwo: 600 },
  { name: "Shabab Bait Al Mandi", area: "Abids", rating: 4.1, costForTwo: 700 },
  { name: "Azaan Bait Al Mandi", area: "RTC X roads", rating: 4.1, costForTwo: 850 },
  { name: "Abu Zayed Bait Al Mandi", area: "Hafeezpet", rating: 3.8, costForTwo: 400 },
  { name: "Coalspark Restaurant", area: "Gachibowli", rating: 4.3, costForTwo: 850 },
  { name: "AL Markaz Mandi", area: "Sainikpuri", rating: 3.6, costForTwo: 1000 },
  { name: "Mandi Bistro", area: "Kompally", rating: 4.0, costForTwo: 700 },
  { name: "Mandi Bistro", area: "Chanda Nagar", rating: 4.2, costForTwo: 800 },
  { name: "Forest Arabian Mandi House", area: "Boduppal", rating: 4.0, costForTwo: 700 },
  { name: "Forest Arabian Mandi House", area: "Vanasthalipuram", rating: 3.9, costForTwo: 1000 },
  { name: "Bab Al Mandi", area: "Tolichowki", rating: 4.0, costForTwo: 950 },
  { name: "The Old Town Mandi", area: "Nagole", rating: 4.1, costForTwo: 1000 },
  { name: "Mandi@36 Arabian Kitchen", area: "Gachibowli", rating: 2.8, costForTwo: 1000 },
  { name: "Ladhidh Mandi", area: "Rajendra Nagar", rating: 3.5, costForTwo: 2000 },
  { name: "Gismat Jail Mandi Restaurant", area: "Kondapur", rating: 4.0, costForTwo: 1000 },
  { name: "Food In Forest Arabian Mandi", area: "Nizampet", rating: 3.3, costForTwo: 1300 },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function norm(s = "") {
  return s
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function slugId(name, area) {
  const base = `${norm(name)}-${norm(area)}`.replace(/\s+/g, "-").slice(0, 60);
  const hash = crypto.createHash("sha1").update(`${name}|${area}`).digest("hex").slice(0, 8);
  return `reach-${base}-${hash}`;
}

function priceLevelFromCost(cost) {
  if (!cost) return null;
  if (cost <= 400) return 1;
  if (cost <= 800) return 2;
  if (cost <= 1400) return 3;
  return 4;
}

function tierFor(n = 0) {
  if (n >= 1000) return "landmark";
  if (n >= 200) return "established";
  return "hidden-gem";
}

function alreadyHave(eateries, name, area) {
  const n = norm(name);
  const a = norm(area);
  return eateries.find((e) => {
    const en = norm(e.name);
    if (!en.includes(n.slice(0, 12)) && !n.includes(en.slice(0, 12))) return false;
    // same-ish name: require area match when both known
    const ea = norm(e.discoveredIn || "");
    if (!a || !ea) return en === n || en.includes(n) || n.includes(en);
    return ea.includes(a) || a.includes(ea) || en === n;
  });
}

async function readJina(url) {
  const res = await fetch(`https://r.jina.ai/${url}`, {
    headers: { Accept: "text/plain", "User-Agent": UA },
    signal: AbortSignal.timeout(45000),
  });
  if (!res.ok) return null;
  return res.text();
}

function parseZomatoMarkdown(md = "") {
  const out = {};
  const addr =
    md.match(/Direction\s*\n+([^\n]+)/i)?.[1]?.trim() ||
    md.match(/\n([0-9][^,\n]{5,120},[^,\n]+Hyderabad[^\n]*)/i)?.[1]?.trim();
  if (addr && addr.length < 180) out.address = addr.replace(/\s+/g, " ");

  const dining = md.match(/([\d.]+)\s*\n+\s*([\d,]+)\s*\n+\s*Dining Ratings/i);
  if (dining) {
    out.rating = Number(dining[1]);
    out.ratingCount = Number(dining[2].replace(/,/g, ""));
  }
  const cost = md.match(/₹\s*([\d,]+)\s*for two/i);
  if (cost) out.costForTwo = Number(cost[1].replace(/,/g, ""));
  const phone = md.match(/\+91[\s-]?\d[\d\s-]{8,}/);
  if (phone) out.phone = phone[0].replace(/\s+/g, " ").trim();
  return out;
}

async function nominatim(query) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "in");
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data?.[0]) return null;
  return { lat: Number(data[0].lat), lng: Number(data[0].lon), display: data[0].display_name };
}

function areaCentroids(eateries) {
  const map = {};
  for (const e of eateries) {
    const a = e.discoveredIn;
    if (!a || String(a).startsWith("text:") || !e.lat || !e.lng) continue;
    if (!map[a]) map[a] = { n: 0, lat: 0, lng: 0 };
    map[a].n++;
    map[a].lat += e.lat;
    map[a].lng += e.lng;
  }
  for (const v of Object.values(map)) {
    v.lat /= v.n;
    v.lng /= v.n;
  }
  return map;
}

const eateries = JSON.parse(fs.readFileSync(OUT_PATH, "utf-8"));
const centroids = areaCentroids(eateries);

let added = 0;
let skipped = 0;
let failed = 0;

for (const t of TARGETS) {
  const hit = alreadyHave(eateries, t.name, t.area);
  if (hit) {
    console.log(`SKIP (have): ${t.name} @ ${t.area} → ${hit.name}`);
    skipped++;
    continue;
  }

  let meta = { ...t };
  if (t.zomatoSlug) {
    const zurl = `https://www.zomato.com/hyderabad/${t.zomatoSlug}`;
    console.log(`Jina ← ${zurl}`);
    try {
      const md = await readJina(zurl);
      if (md) {
        const parsed = parseZomatoMarkdown(md);
        meta = { ...meta, ...parsed, address: parsed.address || meta.address };
      }
    } catch (err) {
      console.log(`  jina fail: ${err.message}`);
    }
    await sleep(800);
  }

  const queries = [
    meta.address ? `${meta.address}` : null,
    `${meta.name}, ${meta.area}, Hyderabad`,
    `${meta.name} Hyderabad`,
    `${meta.area}, Hyderabad, Telangana`,
  ].filter(Boolean);

  let geo = null;
  for (const q of queries) {
    console.log(`OSM ← ${q}`);
    try {
      geo = await nominatim(q);
    } catch (err) {
      console.log(`  nominatim fail: ${err.message}`);
    }
    await sleep(1100);
    if (geo) break;
  }

  if (!geo) {
    const c = centroids[meta.area];
    if (c) {
      // Slight deterministic offset so pins don't stack
      const h = crypto.createHash("sha1").update(`${meta.name}|${meta.area}`).digest();
      const dLat = ((h[0] - 128) / 128) * 0.004;
      const dLng = ((h[1] - 128) / 128) * 0.004;
      geo = { lat: c.lat + dLat, lng: c.lng + dLng, display: `${meta.area} centroid` };
      console.log(`  fallback centroid ${meta.area}`);
    }
  }

  if (!geo) {
    console.log(`FAIL (no coords): ${meta.name} @ ${meta.area}`);
    failed++;
    continue;
  }

  const id = slugId(meta.name, meta.area);
  const zomatoSlugUrl = meta.zomatoSlug
    ? `https://www.zomato.com/hyderabad/${meta.zomatoSlug}`
    : null;

  const entry = {
    id,
    placeId: id,
    name: meta.name,
    category: "local",
    lat: geo.lat,
    lng: geo.lng,
    address: meta.address || `${meta.area}, Hyderabad`,
    rating: meta.rating ?? null,
    ratingCount: meta.ratingCount ?? 0,
    priceLevel: priceLevelFromCost(meta.costForTwo),
    costForTwo: meta.costForTwo ?? null,
    photoRef: null,
    zomatoUrl: zomatoSlugUrl || `https://www.zomato.com/hyderabad/search?q=${encodeURIComponent(meta.name)}`,
    ...(zomatoSlugUrl ? { zomatoSlugUrl, zomatoResolvedAt: new Date().toISOString() } : {}),
    offers: [],
    offersUpdatedAt: null,
    status: "approved",
    discoveredIn: meta.area,
    createdAt: new Date().toISOString(),
    hours: null,
    website: null,
    hasWebsite: false,
    phone: meta.phone ?? null,
    blurb: null,
    tags: ["mandi"],
    tier: tierFor(meta.ratingCount ?? 0),
    detailsUpdatedAt: new Date().toISOString(),
    source: "agent-reach+nominatim",
  };

  eateries.push(entry);
  console.log(`ADDED: ${entry.name} @ ${entry.discoveredIn} (${entry.rating || "?"}★) [${geo.display?.slice(0, 60) || "ok"}]`);
  added++;
}

fs.writeFileSync(OUT_PATH, JSON.stringify(eateries, null, 2));
console.log(`\nDone. added=${added} skipped=${skipped} failed=${failed} total=${eateries.length}`);
