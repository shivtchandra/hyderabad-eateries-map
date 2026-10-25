/**
 * Expand Comparison Spots by matching Swiggy Dineout spots to District and scraping them directly.
 *
 * Runs without third-party proxies (direct to District):
 *   1. Matches all Swiggy spots in data/curated-offers.json to District sitemap slugs.
 *   2. Directly fetches each matched District page (~400ms per spot).
 *   3. Extracts live slot deals, booking times, and bank offers.
 *   4. Updates data/curated-offers.json so comparison ("comp spots") are maximized.
 *
 * Run:  node scripts/expand-comp-spots.mjs
 */

import fs from "fs";
import path from "path";
import zlib from "zlib";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OFFERS_FILE = path.join(ROOT, "data", "curated-offers.json");
const EATERIES_FILE = path.join(ROOT, "data", "eateries.json");
const CACHE_SITEMAP = path.join(ROOT, "data", "district-sitemap.json");

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const STOP = new Set(["the", "restaurant", "restaurants", "cafe", "hyderabad", "and", "bar", "kitchen", "by", "&", "pvt", "ltd", "family", "dhaba", "hotel", "house", "diner"]);
const clean = (s) => (s || "").toLowerCase().normalize("NFKD").replace(/[^a-z0-9 ]+/g, " ");
const tokens = (s) => new Set(clean(s).split(/\s+/).filter((t) => t.length > 1 && !STOP.has(t)));

const HYD_LOCALITIES = new Set([
  "jubilee", "hills", "banjara", "madhapur", "hitec", "city", "gachibowli", "kondapur", "kukatpally",
  "begumpet", "secunderabad", "sainikpuri", "alwal", "kompally", "himayatnagar", "himayath", "narayanguda", "abids",
  "koti", "charminar", "tolichowki", "mehdipatnam", "attapur", "panjagutta", "somajiguda", "ameerpet",
  "sr", "nagar", "dilsukhnagar", "lb", "nagole", "uppal", "tarnaka", "habsiguda", "ecil", "malkajgiri",
  "bowenpally", "marredpally", "karkhana", "shamshabad", "gandipet", "kokapet", "narsingi", "manikonda",
  "financial", "district", "nanakramguda", "raidurgam", "lingampally", "chandanagar", "miyapur", "nizampet",
  "kollur", "tellapur", "nallagandla", "hafeezpet", "khajaguda", "film"
]);

const CLUSTERS = [
  new Set(["financial", "district", "gachibowli", "nanakramguda", "gowlidoddy", "waverock"]),
  new Set(["hitec", "city", "madhapur", "kondapur", "whitefields", "inorbit"]),
  new Set(["jubilee", "hills", "film", "nagar"]),
  new Set(["banjara", "hills", "somajiguda", "panjagutta", "punjagutta", "irrum", "manzil"]),
  new Set(["begumpet", "prakash", "nagar", "kundanbagh", "greenlands"]),
  new Set(["sainikpuri", "as", "rao", "nagar", "ecil", "kapra", "dr as rao"]),
  new Set(["secunderabad", "karkhana", "marredpally", "trimulgherry", "bowenpally", "sd", "road"]),
  new Set(["himayatnagar", "himayath", "nagar", "narayanguda", "hyderguda", "basheer", "bagh"]),
  new Set(["charminar", "old", "city", "ghansi", "bazaar", "madina", "nayapul"]),
  new Set(["gandipet", "narsingi", "kokapet", "manikonda", "puppetlaguda"]),
  new Set(["lb", "nagar", "saroornagar", "nagole", "dilsukhnagar", "kothapet"]),
  new Set(["kukatpally", "kphb", "nizampet", "miyapur", "chanda", "nagar"]),
];

function sameCluster(a, b) {
  for (const c of CLUSTERS) {
    let hasA = false, hasB = false;
    for (const t of c) {
      if (a.has(t)) hasA = true;
      if (b.has(t)) hasB = true;
    }
    if (hasA && hasB) return true;
  }
  return false;
}

function toMinutes(t) {
  const m = t.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (!m) return null;
  let h = Number(m[1]) % 12;
  if (/pm/i.test(m[3])) h += 12;
  return h * 60 + Number(m[2] || 0);
}

function parseWhen(line) {
  const TIME = "\\d{1,2}(?::\\d{2})?\\s*(?:AM|PM)";
  const range = line.match(new RegExp(`(${TIME})\\s*(?:-|–|to)\\s*(${TIME})`, "i"));
  const from = line.match(new RegExp(`from\\s*(${TIME})`, "i"));
  const till = line.match(new RegExp(`(?:till|until|before)\\s*(${TIME})`, "i"));
  const day = (line.match(/\b(today|tomorrow|mon|tue|wed|thu|fri|sat|sun)[a-z]*\b/i) || [])[0] || null;
  const out = { label: line.replace(/\s+/g, " ").trim(), day: day ? day.toLowerCase() : null, from: null, to: null };
  if (range) { out.from = toMinutes(range[1]); out.to = toMinutes(range[2]); }
  else if (from) out.from = toMinutes(from[1]);
  else if (till) out.to = toMinutes(till[1]);
  return out.from != null || out.to != null || out.day ? out : null;
}

function bankOf(title) {
  const m = title.match(/(?:using|on|with)\s+(.+?)\s*(?:credit|debit)?\s*cards?\b/i);
  if (!m) return null;
  const name = m[1].replace(/\s+(credit|debit)$/i, "").trim();
  return /^(credit|debit|premier|visa infinite and signature)$/i.test(name) ? null : name;
}

async function getDistrictSlugs() {
  if (fs.existsSync(CACHE_SITEMAP)) {
    try {
      const data = JSON.parse(fs.readFileSync(CACHE_SITEMAP, "utf8"));
      if (Array.isArray(data) && data.length > 5000) {
        console.log(`Loaded ${data.length} District slugs from cache.`);
        return data;
      }
    } catch {}
  }

  console.log("Fetching District sitemap...");
  const res = await fetch("https://cdn.district.in/sitemap/sitemap-restaurant-pages3.xml.gz");
  const buf = Buffer.from(await res.arrayBuffer());
  const xml = zlib.gunzipSync(buf).toString("utf8");
  const slugs = [...xml.matchAll(/<loc>https:\/\/www\.district\.in\/dining\/hyderabad\/([^<]+)<\/loc>/g)].map(m => m[1]);
  console.log(`Extracted ${slugs.length} District slugs from official sitemap.`);
  fs.writeFileSync(CACHE_SITEMAP, JSON.stringify(slugs), "utf8");
  return slugs;
}

async function scrapeDistrictPage(slug) {
  const url = `https://www.district.in/dining/hyderabad/${slug}`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA },
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });
    if (res.status === 404) return { status: 404, url, deals: [], bankOffers: [], hours: null };
    if (!res.ok) return { status: res.status, url, deals: [], bankOffers: [], hours: null };
    const html = await res.text();

    const hours = (html.match(/Open\s*•\s*([^\n<]+)/) || [])[1]?.trim() || null;

    const deals = [];
    const slotMatches = [...html.matchAll(/aria-label="Offer Highlights"[^>]*>[\s\S]*?<h2[^>]*>([\s\S]*?)<\/h2>[\s\S]*?aria-label="Offer Details"[^>]*>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/g)];
    for (const m of slotMatches) {
      const rawTitle = m[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      const whenStr = m[2].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      const slotsStr = m[3].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      const pctM = rawTitle.match(/(\d+)%/);
      const flatM = rawTitle.match(/₹\s?([\d,]+)/);
      const slotsLeftM = slotsStr.match(/(\d+)\s*slots\s*left/i);
      deals.push({
        title: rawTitle,
        when: parseWhen(whenStr),
        slotsLeft: slotsLeftM ? Number(slotsLeftM[1]) : null,
        pct: pctM ? Number(pctM[1]) : null,
        flat: flatM ? Number(flatM[1].replace(/,/g, "")) : null,
      });
    }

    const bankOffers = [];
    const bankMatches = [...html.matchAll(/<h2[^>]*class="[^"]*text-gray-800[^"]*"[^>]*>([\s\S]*?)<\/h2>(?:[\s\S]*?<p[^>]*class="[^"]*text-gray-500[^"]*"[^>]*>([\s\S]*?)<\/p>)?/g)];
    for (const m of bankMatches) {
      const title = m[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      const desc = m[2] ? m[2].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim() : "";
      if (/off|cashback|flat|free/i.test(title)) {
        const pctM = title.match(/(\d+)%/);
        const capM = title.match(/up to ₹\s?([\d,]+)/i);
        const minM = desc.match(/(?:payable amount of|minimum bill of|bills of|orders? of)\s*₹\s?([\d,]+)/i);
        bankOffers.push({
          title,
          desc,
          bank: bankOf(title),
          pct: pctM ? Number(pctM[1]) : null,
          cap: capM ? Number(capM[1].replace(/,/g, "")) : null,
          minBill: minM ? Number(minM[1].replace(/,/g, "")) : null,
        });
      }
    }

    return { status: 200, url, deals, bankOffers, hours };
  } catch (err) {
    return { status: 0, url, deals: [], bankOffers: [], hours: null };
  }
}

function legacyOffers(deals, bankOffers) {
  const out = [];
  for (const d of deals) out.push({ type: "SLOT", title: d.title, desc: d.when?.label ? `${d.when.label}${d.slotsLeft ? ` (${d.slotsLeft} slots)` : ""}` : "Pre-book offer" });
  for (const b of bankOffers) out.push({ type: "BANK", title: b.title, desc: b.desc || (b.minBill ? `Bills of ₹${b.minBill.toLocaleString("en-IN")}+` : "") });
  return out;
}

async function main() {
  const sitemapSlugs = await getDistrictSlugs();
  const curated = JSON.parse(fs.readFileSync(OFFERS_FILE, "utf8"));
  const eateries = JSON.parse(fs.readFileSync(EATERIES_FILE, "utf8"));
  const eateriesMap = new Map(eateries.map(e => [e.id, e]));

  const spots = curated.spots || {};

  // Pre-parse District slugs
  const parsedSlugs = sitemapSlugs.map(slug => {
    const cleanSlug = slug.replace(/-\d+(?=-|$)/g, "");
    const parts = cleanSlug.split("-");
    return {
      slug,
      tok: new Set(parts.filter(t => t.length > 1 && !STOP.has(t))),
    };
  });

  // Target all spots with Swiggy offers OR existing District URLs
  const candidateSpots = Object.entries(spots).filter(([id, s]) => s.swiggy?.hasOffers || s.district?.url);
  console.log(`Found ${candidateSpots.length} candidate spots (Swiggy offers or District URLs).`);

  const targets = [];
  for (const [id, s] of candidateSpots) {
    let slug = null;
    if (s.district?.url) {
      slug = s.district.url.replace(/^.*\/hyderabad\//, "").replace(/\/+$/, "");
    } else {
      const e = eateriesMap.get(id);
      const rawName = s.swiggy?.name || s.name || "";
      const coreName = rawName.replace(/\s*[-|·]\s*[^-|·]+$/, "").trim();
      const nameTok = tokens(coreName);
      if (!nameTok.size) continue;

      const areaSource = [s.area, e?.area, e?.discoveredIn, e?.address, s.swiggy?.url].filter(Boolean).join(" ");
      const venueLocTok = new Set([...tokens(areaSource)].filter(t => HYD_LOCALITIES.has(t)));

      let best = null;
      for (const item of parsedSlugs) {
        let nameHit = 0;
        for (const t of nameTok) if (item.tok.has(t)) nameHit++;
        if (!nameHit) continue;
        const nameScore = nameHit / nameTok.size;
        if (nameScore < 0.75) continue;

        let venueLocHit = 0;
        let foreignLocHit = 0;
        for (const t of item.tok) {
          if (HYD_LOCALITIES.has(t)) {
            if (venueLocTok.has(t)) venueLocHit++;
            else foreignLocHit++;
          }
        }
        const clusterHit = sameCluster(venueLocTok, item.tok);

        // Heavy penalty if foreign locality without venue locality or cluster
        if (venueLocTok.size > 0 && foreignLocHit > 0 && venueLocHit === 0 && !clusterHit) continue;

        const score = nameScore * 10 + venueLocHit * 8 + (clusterHit ? 4 : 0) - (foreignLocHit && !clusterHit ? 12 : 0);
        if (!best || score > best.score) {
          best = { slug: item.slug, score };
        }
      }

      if (best && best.score > 6) {
        slug = best.slug;
      }
    }

    if (slug) {
      targets.push({ id, spot: s, slug });
    }
  }

  console.log(`\nReady to scrape ${targets.length} target District spots for comparison...`);

  let newlyActiveDistrict = 0;
  let totalCompSpots = 0;
  const now = new Date().toISOString();

  for (let i = 0; i < targets.length; i++) {
    const { id, spot, slug } = targets[i];
    const data = await scrapeDistrictPage(slug);
    const has = data.deals.length > 0 || data.bankOffers.length > 0;

    const hadBefore = spot.district?.hasOffers;
    spot.district = {
      url: data.url,
      hasOffers: has,
      fetchedAt: now,
      hours: data.hours,
      deals: data.deals,
      bankOffers: data.bankOffers,
      offers: legacyOffers(data.deals, data.bankOffers),
    };

    if (has && !hadBefore) newlyActiveDistrict++;
    if (spot.swiggy?.hasOffers && spot.district?.hasOffers) totalCompSpots++;

    if (has) {
      console.log(`[${i + 1}/${targets.length}] ✓ ${spot.name}: ${data.deals.length} slot deals, ${data.bankOffers.length} bank offers (${slug})`);
    } else {
      process.stdout.write(`.`);
    }

    await sleep(250); // fast polite delay
  }

  curated.updatedAt = now;
  curated.totalSpotsWithOffers = Object.values(spots).filter(s => s.district?.hasOffers || s.swiggy?.hasOffers).length;

  fs.writeFileSync(OFFERS_FILE, JSON.stringify(curated, null, 2), "utf8");

  console.log(`\n\n=== SCRAPE COMPLETE ===`);
  console.log(`- Targets checked: ${targets.length}`);
  console.log(`- Newly activated District offers: ${newlyActiveDistrict}`);
  console.log(`- TOTAL COMPARISON SPOTS (both apps): ${totalCompSpots}`);
  console.log(`- Total spots with any deal: ${curated.totalSpotsWithOffers}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
