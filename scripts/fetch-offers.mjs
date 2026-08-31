/**
 * Scrape live Zomato offers — and amenities — via Jina Reader.
 *
 * Uses https://r.jina.ai (free, no API key) rather than Firecrawl. Beyond
 * costing nothing, it returns a far better shaped page: Zomato's "Dining
 * Offers" block survives as headed sections, so we get the offer *kind*
 * (PRE-BOOK / BANK OFFER / SURPRISE) instead of regexing percentages out of a
 * wall of text, and the "More Info" block gives real amenity flags
 * (wheelchair access, veg-friendly, outdoor seating) straight from the source.
 *
 * Swiggy is deliberately not scraped: its Dineout pages gate everything behind
 * a location session and return only "Setup your precise location". Verified.
 *
 * Offers are perishable — anything older than STALE_HOURS is cleared rather
 * than left on screen looking current.
 *
 * Run:  node scripts/fetch-offers.mjs
 *       LIMIT=40 node scripts/fetch-offers.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(__dirname, "..", "data", "eateries.json");
const LIMIT = Number(process.env.LIMIT ?? 300);
const STALE_HOURS = 36;
const DELAY_MS = 2500; // Jina's free tier is rate-limited; stay comfortably under

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

// Zomato renders each offer as a kind heading followed by the offer itself:
//   ### BANK OFFER
//   #### 25% OFF for up to ₹5,000 using RBL Bank ...
// "Dining Offers" is the block's own heading, not an offer — matching it would
// capture the tooltip line ("Tap on any offer to know more") as a deal.
const KINDS = /^#{2,4}\s*(PRE-?BOOK OFFER|BANK OFFER|SURPRISE|FLAT DEAL|OFFER)\s*$/i;

function parseOffers(md) {
  const lines = md.split("\n").map((l) => l.trim());
  const out = [];

  for (let i = 0; i < lines.length; i++) {
    if (!KINDS.test(lines[i])) continue;
    const kind = lines[i].replace(/^#+\s*/, "").toUpperCase();
    // Take the next couple of non-empty lines as the offer body + qualifier.
    const body = [];
    for (let j = i + 1; j < Math.min(i + 5, lines.length) && body.length < 2; j++) {
      const l = lines[j];
      if (!l) continue;
      if (KINDS.test(l)) break;
      body.push(l.replace(/^#+\s*/, ""));
    }
    const text = body.join(" — ").slice(0, 96);
    if (text && /\d|scratch|free|flat|off/i.test(text)) out.push({ kind, text });
  }

  // Fall back to a plain sweep if the structured block wasn't present.
  if (!out.length) {
    const seen = new Set();
    for (const m of md.match(/\b(?:flat\s*)?\d{1,2}%\s*off[^.\n]{0,44}|\bflat\s*₹\s?\d+\s*off[^.\n]{0,30}/gi) ?? []) {
      const t = m.trim().replace(/\s+/g, " ").slice(0, 96);
      if (!seen.has(t.toLowerCase())) { seen.add(t.toLowerCase()); out.push({ kind: "OFFER", text: t }); }
    }
  }
  return out.slice(0, 4);
}

// Amenity flags straight from Zomato's "More Info" block — more reliable than
// inferring accessibility or diet from review keywords.
const AMENITY_MAP = [
  [/wheelchair accessible|step-free entry/i, "wheelchair"],
  [/vegetarian friendly|pure veg/i, "veg-friendly"],
  [/outdoor seating/i, "outdoor"],
  [/live music|live entertainment/i, "live-music"],
  [/\bwifi\b/i, "work-friendly"],
  [/family friendly/i, "family"],
  [/valet parking|free parking|parking available/i, "parking"],
  [/takeaway available/i, "takeaway"],
  [/reservation required|table booking/i, "reservable"],
  [/full bar available|cocktails/i, "full-bar"],
  [/rooftop|great view/i, "view"],
];

function parseAmenities(md) {
  const block = md.split(/###\s*More Info/i)[1];
  if (!block) return [];
  const scope = block.slice(0, 1200);
  return AMENITY_MAP.filter(([re]) => re.test(scope)).map(([, tag]) => tag);
}

function parseCostForTwo(md) {
  const m = md.match(/₹\s?([\d,]+)\s*for two/i);
  return m ? Number(m[1].replace(/,/g, "")) : null;
}

const all = JSON.parse(fs.readFileSync(DATA, "utf-8"));

// Expire stale offers everywhere, including rows this run won't revisit.
const cutoff = Date.now() - STALE_HOURS * 3600 * 1000;
let expired = 0;
for (const e of all) {
  if (e.offers?.length && e.offersUpdatedAt && new Date(e.offersUpdatedAt).getTime() < cutoff) {
    e.offers = [];
    expired++;
  }
}

const score = (e) => (e.rating ?? 0) * Math.log10((e.ratingCount ?? 0) + 10);
const todo = all
  .filter((e) => e.zomatoSlugUrl)
  .sort((a, b) => score(b) - score(a))
  .slice(0, LIMIT);

console.log(
  `${all.length} total | ${all.filter((e) => e.zomatoSlugUrl).length} resolved | ` +
  `scraping ${todo.length} | expired ${expired}`
);

let ok = 0, fail = 0, withOffers = 0;
for (const e of todo) {
  const md = await read(e.zomatoSlugUrl);
  if (!md) { fail++; await sleep(DELAY_MS); continue; }

  const offers = parseOffers(md);
  const amenities = parseAmenities(md);
  const cost = parseCostForTwo(md);

  e.offers = offers.map((o) => (o.kind === "OFFER" ? o.text : `${o.kind}: ${o.text}`));
  e.offersUpdatedAt = new Date().toISOString();
  if (amenities.length) e.amenities = amenities;
  if (cost) e.costForTwo = cost;

  ok++;
  if (offers.length) {
    withOffers++;
    console.log(`  ${e.name}\n     ${e.offers.join("\n     ")}`);
  }
  if (ok % 20 === 0) fs.writeFileSync(DATA, JSON.stringify(all, null, 2));
  await sleep(DELAY_MS);
}

fs.writeFileSync(DATA, JSON.stringify(all, null, 2));
console.log(`\nscraped ${ok}, failed ${fail}, with offers ${withOffers}`);
console.log(`dataset: ${all.filter((e) => e.offers?.length).length} with live offers, ` +
            `${all.filter((e) => e.amenities?.length).length} with amenities`);
