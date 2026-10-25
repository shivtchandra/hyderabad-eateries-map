/**
 * Resolve verified District by Zomato URLs for approved eateries.
 *
 * District URLs take the canonical form:
 *   https://www.district.in/dining/hyderabad/<slug>
 *
 * This script:
 *   1. Harvests restaurant slugs from District collection and category pages.
 *   2. Ingests known slugs from data/zomato-index.json.
 *   3. Tests candidate slug URLs for approved eateries.
 *   4. Verifies each URL returns HTTP 200 (avoiding 404s).
 *   5. Merges newly verified district.url entries into data/curated-offers.json.
 *
 * Run:  node scripts/resolve-district.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OFFERS_FILE = path.join(ROOT, "data", "curated-offers.json");
const EATERIES_FILE = path.join(ROOT, "data", "eateries.json");
const ZOMATO_INDEX_FILE = path.join(ROOT, "data", "zomato-index.json");
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const slugify = (s) =>
  (s || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const STOP = new Set(["the", "restaurant", "restaurants", "cafe", "hyderabad", "and", "bar", "kitchen", "by", "&", "pvt", "ltd", "family", "dhaba"]);
const tokens = (s) => new Set((s || "").toLowerCase().normalize("NFKD").replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).filter((t) => t.length > 1 && !STOP.has(t)));

function nameScore(a, b) {
  const A = typeof a === "string" ? tokens(a) : a;
  const B = typeof b === "string" ? tokens(b) : b;
  if (!A.size || !B.size) return 0;
  let hit = 0;
  for (const t of A) if (B.has(t)) hit++;
  return hit / Math.max(A.size, B.size);
}

const DISTRICT_COLLECTIONS = [
  "restaurants",
  "dinner-restaurants",
  "lunch-restaurants",
  "indoor-seating-restaurants",
  "non-vegetarian-restaurants",
  "breakfast-restaurants",
  "north-indian-dishes",
  "south-indian-dishes",
  "continental-dishes",
  "indo-chinese-dishes",
  "secunderabad-restaurants",
];

async function checkUrl(url) {
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { "User-Agent": UA },
      redirect: "manual",
      signal: AbortSignal.timeout(10000),
    });
    return res.status === 200;
  } catch {
    return false;
  }
}

async function harvestCollectionSlugs() {
  const discovered = new Set();
  for (const p of DISTRICT_COLLECTIONS) {
    const url = `https://www.district.in/dining/hyderabad/${p}`;
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow", signal: AbortSignal.timeout(15000) });
      if (!res.ok) continue;
      const html = await res.text();
      const matches = [...html.matchAll(/\/dining\/hyderabad\/([a-z0-9-]+)/g)].map((m) => m[1]);
      for (const s of matches) {
        if (!s.endsWith("-restaurants") && !s.endsWith("-dishes") && s !== "restaurants" && s !== "hyderabad-city") {
          discovered.add(s);
        }
      }
    } catch {}
    await sleep(400);
  }
  return [...discovered];
}

async function main() {
  const eateries = JSON.parse(fs.readFileSync(EATERIES_FILE, "utf8")).filter((e) => e.status === "approved");
  const offersData = fs.existsSync(OFFERS_FILE) ? JSON.parse(fs.readFileSync(OFFERS_FILE, "utf8")) : { spots: {} };
  const spots = offersData.spots || {};

  console.log(`Analyzing ${eateries.length} approved eateries against District...`);

  // 1. Ingest slugs from District collection pages
  console.log("Harvesting slugs from District category pages...");
  const collectionSlugs = await harvestCollectionSlugs();
  console.log(`Discovered ${collectionSlugs.length} slugs from District collections.`);

  // 2. Ingest slugs from zomato-index.json
  const indexSlugs = fs.existsSync(ZOMATO_INDEX_FILE) ? Object.keys(JSON.parse(fs.readFileSync(ZOMATO_INDEX_FILE, "utf8"))) : [];
  console.log(`Loaded ${indexSlugs.length} slugs from zomato-index.json.`);

  const allSlugs = [...new Set([...collectionSlugs, ...indexSlugs])];
  console.log(`Total unique slug candidates to match: ${allSlugs.length}`);

  // Map slugs to eatery spots
  const eateryTokenList = eateries.map((e) => ({ e, tok: tokens(e.name) }));
  const matchedSlugs = new Map();

  for (const s of allSlugs) {
    const sClean = s.replace(/-[a-z0-9]+$/, "").replace(/-/g, " ");
    const sTok = tokens(sClean);
    if (!sTok.size) continue;
    let best = null;
    for (const { e, tok } of eateryTokenList) {
      const score = nameScore(sTok, tok);
      if (score >= 0.75 && (!best || score > best.score)) {
        best = { e, score };
      }
    }
    if (best && !matchedSlugs.has(best.e.id)) {
      matchedSlugs.set(best.e.id, { eatery: best.e, slug: s });
    }
  }

  console.log(`Matched ${matchedSlugs.size} slugs to approved eateries.`);

  let newlyAdded = 0;
  let alreadyPresent = 0;

  for (const [spotId, { eatery, slug }] of matchedSlugs.entries()) {
    const existing = spots[spotId];
    if (existing?.district?.url) {
      alreadyPresent++;
      continue;
    }

    const url = `https://www.district.in/dining/hyderabad/${slug}`;
    const ok = await checkUrl(url);
    await sleep(250);

    if (ok) {
      newlyAdded++;
      console.log(`[+] Added District URL for ${eatery.name}: ${url}`);
      spots[spotId] = {
        name: eatery.name,
        area: eatery.area || eatery.discoveredIn || "",
        ...spots[spotId],
        district: {
          url,
          hasOffers: false,
          fetchedAt: null,
          hours: null,
          deals: [],
          bankOffers: [],
          offers: [],
        },
      };
    }
  }

  offersData.spots = spots;
  fs.writeFileSync(OFFERS_FILE, JSON.stringify(offersData, null, 2), "utf8");

  console.log(`\nSummary:`);
  console.log(`- Already had District URL: ${alreadyPresent}`);
  console.log(`- Newly verified District URLs: ${newlyAdded}`);
  console.log(`- Total spots with District tracking: ${Object.values(spots).filter((s) => s.district?.url).length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
