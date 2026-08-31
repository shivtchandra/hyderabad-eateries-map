/**
 * Build a name → Zomato-slug index by harvesting Zomato's own listing pages.
 *
 * Why this shape: Zomato's search is client-rendered, so a search URL returns
 * no results server-side, and guessing slugs from the name only resolved ~32%.
 * But Zomato's locality and category pages are server-rendered and each links
 * out to real listings. Crawling ~100 of those yields a slug index for the
 * popular half of the city in one pass — after which matching is local, free
 * and instant, instead of a lookup per restaurant.
 *
 * Uses Jina Reader (r.jina.ai): free, no key, returns clean markdown.
 * Firecrawl is not used here — it costs credits per page for the same result.
 *
 * Run:  node scripts/index-zomato.mjs
 *       PAGES=20 node scripts/index-zomato.mjs    # short test run
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "data", "zomato-index.json");
const DATA = path.join(__dirname, "..", "data", "eateries.json");
const MAX_PAGES = process.env.PAGES ? Number(process.env.PAGES) : Infinity;

// Localities Zomato files Hyderabad restaurants under.
const LOCALITIES = [
  "jubilee-hills", "banjara-hills", "madhapur", "gachibowli", "kondapur",
  "hitech-city", "kukatpally", "begumpet", "secunderabad", "himayath-nagar",
  "somajiguda", "ameerpet", "manikonda", "financial-district", "kokapet",
  "narsingi", "nallagandla", "miyapur", "attapur", "mehdipatnam",
  "tolichowki", "charminar", "abids", "malakpet", "dilsukhnagar",
  "lb-nagar", "uppal", "habsiguda", "tarnaka", "ecil", "alwal",
  "sainikpuri", "kompally", "nizampet", "bachupally", "shamshabad",
  "chanda-nagar", "lingampally", "sanath-nagar", "panjagutta",
];

// Category pages cut across localities and surface different sets.
const CATEGORIES = [
  "microbreweries", "best-bars-and-pubs", "iconic-restaurants", "night-clubs",
  "cafes", "bakeries", "ice-cream", "biryani", "north-indian", "chinese",
  "desserts", "street-food", "rooftop-restaurants", "buffet", "fine-dining",
  "family-restaurants", "pure-veg", "great-breakfasts", "late-night-restaurants",
];

const urls = [
  ...LOCALITIES.map((l) => `https://www.zomato.com/hyderabad/${l}-restaurants`),
  ...CATEGORIES.map((c) => `https://www.zomato.com/hyderabad/${c}`),
].slice(0, MAX_PAGES);

// Slugs that are navigation, not restaurants.
const NOT_A_LISTING = new RegExp(
  `^(${[...LOCALITIES, ...CATEGORIES].join("|")})$|` +
  `^(restaurants|collections|order-online|delivery|dine-out|nightlife|` +
  `hyderabad-city|newyear|christmas|best-.*|iconic-.*|.*-restaurants|` +
  `.*-order-online|.*-near-me)$`
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function read(url) {
  try {
    const res = await fetch(`https://r.jina.ai/${url}`, {
      headers: { Accept: "text/plain" },
      signal: AbortSignal.timeout(45000),
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

const index = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf-8")) : {};
let added = 0, pages = 0, failed = 0;

for (const url of urls) {
  const md = await read(url);
  pages++;
  if (!md) { failed++; console.log(`  ! ${url.split("/").pop()}`); await sleep(2500); continue; }

  const slugs = new Set(
    (md.match(/zomato\.com\/hyderabad\/[a-z0-9-]+/g) ?? [])
      .map((s) => s.split("/").pop())
      .filter((s) => s && !NOT_A_LISTING.test(s))
  );

  let fresh = 0;
  for (const s of slugs) {
    if (!index[s]) { index[s] = true; fresh++; added++; }
  }
  console.log(`  ${String(pages).padStart(3)}/${urls.length} ${url.split("/").pop().padEnd(32)} +${fresh} (index ${Object.keys(index).length})`);

  fs.writeFileSync(OUT, JSON.stringify(index, null, 0));
  await sleep(2500); // Jina's free tier is rate-limited; stay well under it
}

console.log(`\npages ${pages}, failed ${failed}, slugs indexed ${Object.keys(index).length} (+${added} new)`);

// Report how much of our dataset this index can now match.
if (fs.existsSync(DATA)) {
  const norm = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const keys = Object.keys(index).map((s) => ({ slug: s, n: norm(s) }));
  const all = JSON.parse(fs.readFileSync(DATA, "utf-8"));
  let match = 0;
  for (const e of all) {
    const n = norm(e.name);
    if (n.length > 4 && keys.some((k) => k.n.startsWith(n) || n.startsWith(k.n))) match++;
  }
  console.log(`potential matches against ${all.length} spots: ${match}`);
}
