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
const UNMATCHED_FILE = path.join(ROOT, "data", "offer-unmatched.json");
const MODE = process.env.OFFER_MODE || "active"; // active | verified | discover

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const STOP = new Set(["the", "restaurant", "restaurants", "cafe", "hyderabad", "and", "bar", "kitchen", "by", "&", "pvt", "ltd", "family", "dhaba", "hotel", "house", "diner", "co"]);
const LOCATION_STOP = new Set([...STOP, "road", "street", "nagar", "hills", "city", "colony", "near", "opposite", "shop", "floor", "main", "telangana", "india"]);
const decodeEntities = (value) => String(value || "")
  .replace(/&amp;/gi, "&").replace(/&#x27;|&#39;|&apos;/gi, "'").replace(/&quot;/gi, '"').replace(/&nbsp;/gi, " ");
const clean = (s) => decodeEntities(s).toLowerCase().normalize("NFKD").replace(/[^a-z0-9 ]+/g, " ");
const tokens = (s) => new Set(clean(s).split(/\s+/).filter((t) => t.length > 1 && !STOP.has(t)));
const brandTokens = (s) => {
  const strong = new Set([...tokens(s)].filter((token) => token.length > 2));
  return strong.size ? strong : tokens(s);
};
const LOCALITY_ALIAS = new Map([
  ["himayath", "himayatnagar"], ["himayathnagar", "himayatnagar"],
  ["hitech", "hitec"], ["secundrabad", "secunderabad"], ["chandanagar", "chanda"],
  ["lanco", "manikonda"],
]);
const locationTokens = (s) => new Set(clean(s).split(/\s+/)
  .filter((token) => token.length > 1 && !LOCATION_STOP.has(token))
  .map((token) => LOCALITY_ALIAS.get(token) || token));

const explicitBranchLocality = (name) => {
  const branch = String(name || "").split(/\s(?:\||~|-|–)\s/).pop();
  const found = locationTokens(branch);
  return new Set([...found].filter((token) => HYD_LOCALITIES.has(token)));
};

export function validateDistrictBranch({ spot, eatery, slug, pageTitle = "" }) {
  const namedLocality = explicitBranchLocality(spot?.name || eatery?.name);
  const expectedLocality = namedLocality.size
    ? namedLocality
    : locationTokens([spot?.area, eatery?.area, eatery?.discoveredIn, eatery?.address].filter(Boolean).join(" "));
  const rawExpectedName = brandTokens(spot?.name || eatery?.name || "");
  const expectedName = new Set([...rawExpectedName].filter((token) => !expectedLocality.has(LOCALITY_ALIAS.get(token) || token)));
  if (!expectedName.size) for (const token of rawExpectedName) expectedName.add(token);
  const titleParts = decodeEntities(pageTitle).replace(/\s*\|\s*District\s*$/i, "").split("|");
  const pageName = titleParts.length > 1 ? titleParts[0] : slug.replace(/-/g, " ");
  const pageNameTokens = brandTokens(pageName);
  const nameHits = [...expectedName].filter((token) => pageNameTokens.has(token)).length;
  const nameScore = expectedName.size && pageNameTokens.size ? nameHits / Math.min(expectedName.size, pageNameTokens.size) : 0;

  const pageLocalityText = titleParts.length > 1 ? titleParts.slice(1).join(" ").replace(/,?\s*Hyderabad.*$/i, "") : slug.replace(/-/g, " ");
  const titleLocality = locationTokens(pageLocalityText);
  const pageLocality = titleLocality.size ? titleLocality : locationTokens(slug.replace(/-/g, " "));
  const localityHits = [...expectedLocality].filter((token) => pageLocality.has(token));

  if (nameScore < 0.75) return { valid: false, reason: "response-name-mismatch", nameScore, localityHits };
  if (!expectedLocality.size || !localityHits.length) return { valid: false, reason: "response-locality-mismatch", nameScore, localityHits };
  return { valid: true, reason: null, nameScore, localityHits };
}

const HYD_LOCALITIES = new Set([
  "jubilee", "hills", "banjara", "madhapur", "hitec", "city", "gachibowli", "kondapur", "kukatpally",
  "begumpet", "secunderabad", "sainikpuri", "alwal", "kompally", "himayatnagar", "himayath", "narayanguda", "abids",
  "koti", "charminar", "tolichowki", "mehdipatnam", "attapur", "panjagutta", "somajiguda", "ameerpet",
  "sr", "nagar", "dilsukhnagar", "lb", "nagole", "uppal", "tarnaka", "habsiguda", "ecil", "malkajgiri",
  "bowenpally", "marredpally", "karkhana", "shamshabad", "gandipet", "kokapet", "narsingi", "manikonda",
  "financial", "district", "nanakramguda", "raidurgam", "lingampally", "chandanagar", "miyapur", "nizampet",
  "kollur", "tellapur", "nallagandla", "hafeezpet", "khajaguda", "film", "lanco", "bhel", "karmanghat"
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
    if (!res.ok) {
      const probe = { server: res.headers.get("server") || "", ray: res.headers.get("cf-ray") || "", body: (await res.text()).slice(0, 160).replace(/\s+/g, " ") };
      return { status: res.status, url, deals: [], bankOffers: [], hours: null, probe };
    }
    const html = await res.text();
    // What the page looked like, so a blocked run says why in the log.
    const probe = { bytes: html.length, title: (html.match(/<title>([^<]*)/) || [])[1] || "", highlights: (html.match(/Offer Highlights/g) || []).length };

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
      const bookingMode = /no booking required|walk-?in|instant offer/i.test(`${whenStr} ${slotsStr}`) ? "walkin" : "prebook";
      deals.push({
        title: rawTitle,
        when: parseWhen(whenStr),
        slotsLeft: slotsLeftM ? Number(slotsLeftM[1]) : null,
        bookingMode,
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

    return { status: 200, url, deals, bankOffers, hours, probe };
  } catch (err) {
    return { status: 0, url, deals: [], bankOffers: [], hours: null, error: err.name };
  }
}

function legacyOffers(deals, bankOffers) {
  const out = [];
  for (const d of deals) out.push({
    type: d.bookingMode === "walkin" ? "WALK_IN" : "SLOT",
    title: d.title,
    desc: d.bookingMode === "walkin" ? "No booking required" : d.when?.label ? `${d.when.label}${d.slotsLeft ? ` (${d.slotsLeft} slots)` : ""}` : "Pre-book offer",
  });
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
  const slugIndex = new Map();
  for (const item of parsedSlugs) {
    for (const token of item.tok) {
      const bucket = slugIndex.get(token) || [];
      bucket.push(item);
      slugIndex.set(token, bucket);
    }
  }

  const approved = eateries.filter((eatery) => eatery.status === "approved");
  const candidateSpots = MODE === "discover"
    ? approved.map((eatery) => [eatery.id, spots[eatery.id] || { name: eatery.name, area: eatery.area || eatery.discoveredIn || "" }])
    : MODE === "verified"
      ? Object.entries(spots).filter(([, spot]) => spot.district?.url)
      : Object.entries(spots).filter(([, spot]) => spot.swiggy?.hasOffers || spot.district?.hasOffers);
  console.log(`Found ${candidateSpots.length} candidate spots in ${MODE} mode.`);

  const targets = [];
  const rejected = [];
  for (const [id, s] of candidateSpots) {
    let slug = null;
    let matchMethod = "existing-url";
    let matchScore = null;
    const e = eateriesMap.get(id);
    let savedSlugRejected = false;
    if (s.district?.url) {
      const savedSlug = s.district.url.replace(/^.*\/hyderabad\//, "").replace(/\/+$/, "");
      const savedValidation = validateDistrictBranch({ spot: s, eatery: e, slug: savedSlug });
      if (savedValidation.valid) {
        slug = savedSlug;
        matchScore = Number((savedValidation.nameScore * 100).toFixed(2));
      } else {
        savedSlugRejected = true;
      }
    }
    if (!slug) {
      const rawName = s.swiggy?.name || s.name || "";
      const areaSource = [s.area, e?.area, e?.discoveredIn, e?.address, s.swiggy?.url].filter(Boolean).join(" ");
      const venueLocTok = locationTokens(areaSource);
      const rawNameTok = brandTokens(rawName);
      const nameTok = new Set([...rawNameTok].filter((token) => !venueLocTok.has(token)));
      if (!nameTok.size) for (const token of rawNameTok) nameTok.add(token);
      if (!nameTok.size) continue;

      const possible = new Set();
      for (const token of nameTok) for (const item of slugIndex.get(token) || []) possible.add(item);
      const ranked = [];
      for (const item of possible) {
        const venueLocHit = [...venueLocTok].filter((token) => item.tok.has(token)).length;
        if (!venueLocHit) continue;
        let nameHit = 0;
        for (const t of nameTok) if (item.tok.has(t)) nameHit++;
        if (!nameHit) continue;
        const likelyNameTokenCount = Math.max(1, item.tok.size - venueLocHit);
        const nameScore = nameHit / Math.min(nameTok.size, likelyNameTokenCount);
        if (nameScore < 0.85) continue;

        const score = nameScore * 100 + venueLocHit * 20;
        ranked.push({ slug: item.slug, score, nameScore, venueLocHit });
      }
      ranked.sort((a, b) => b.score - a.score);
      const best = ranked[0];
      const ambiguous = best && ranked[1] && best.score - ranked[1].score < 2;
      if (best && best.nameScore >= 0.85 && best.venueLocHit > 0 && !ambiguous) {
        slug = best.slug;
        matchMethod = "name-locality";
        matchScore = Number(best.score.toFixed(2));
      } else {
        rejected.push({ id, name: s.name, area: s.area || eateriesMap.get(id)?.area || eateriesMap.get(id)?.discoveredIn || "", reason: ambiguous ? "ambiguous-branch" : "no-strict-name-locality-match" });
        if (savedSlugRejected && s.district) {
          s.district = {
            ...s.district,
            hasOffers: false,
            deals: [], bankOffers: [], offers: [],
            match: { status: "rejected", method: "saved-url-name-locality", reason: "no-strict-name-locality-match", matchedAt: new Date().toISOString() },
          };
        }
      }
    }

    if (slug) {
      spots[id] = s;
      targets.push({ id, spot: s, slug, matchMethod, matchScore });
    }
  }

  console.log(`\nReady to scrape ${targets.length} target District spots for comparison...`);

  let newlyActiveDistrict = 0;
  let totalCompSpots = 0;
  let pagesWithDeals = 0;
  let acceptedTargets = 0;
  const statusCounts = {};
  const samples = [];
  const now = new Date().toISOString();

  for (let i = 0; i < targets.length; i++) {
    const { id, spot, slug, matchMethod, matchScore } = targets[i];
    const data = await scrapeDistrictPage(slug);
    const has = data.deals.length > 0 || data.bankOffers.length > 0;
    const key = data.status === 0 ? `error:${data.error}` : String(data.status);
    statusCounts[key] = (statusCounts[key] || 0) + 1;
    if (has) pagesWithDeals++;
    if (!has && samples.length < 3 && (data.status !== 404)) samples.push({ slug, status: data.status, error: data.error, ...data.probe });

    const hadBefore = Boolean(spot.district?.hasOffers && spot.district?.deals?.length > 0);
    // Network failures must never replace the last verified response.
    if (data.status !== 200) {
      if (spot.swiggy?.hasOffers && spot.district?.hasOffers) totalCompSpots++;
      process.stdout.write(`.`);
      await sleep(250);
      continue;
    }

    const eatery = eateriesMap.get(id);
    const validation = validateDistrictBranch({ spot, eatery, slug, pageTitle: data.probe?.title || "" });
    if (!validation.valid) {
      rejected.push({
        id, name: spot.name, area: spot.area || eatery?.area || eatery?.discoveredIn || "",
        slug, pageTitle: data.probe?.title || "", reason: validation.reason,
        nameScore: Number(validation.nameScore.toFixed(3)), localityHits: validation.localityHits,
      });
      spot.district = {
        ...spot.district,
        url: data.url,
        hasOffers: false,
        fetchedAt: now,
        deals: [], bankOffers: [], offers: [],
        match: { status: "rejected", method: "response-name-locality", reason: validation.reason, matchedAt: now },
      };
      console.log(`[${i + 1}/${targets.length}] ✗ ${spot.name}: rejected ${data.probe?.title || slug} (${validation.reason})`);
      await sleep(250);
      continue;
    }
    acceptedTargets++;

    spot.district = {
      url: data.url,
      venue: {
        id: slug, name: spot.name,
        locality: spot.area || eateriesMap.get(id)?.area || eateriesMap.get(id)?.discoveredIn || "",
        lat: eateriesMap.get(id)?.lat ?? null, lng: eateriesMap.get(id)?.lng ?? null,
        url: data.url,
      },
      match: {
        status: "verified", method: matchMethod,
        score: matchScore ?? Number((validation.nameScore * 100).toFixed(2)),
        localityHits: validation.localityHits, matchedAt: now,
      },
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

  console.log(`\nDistrict responses: ${JSON.stringify(statusCounts)}, pages with deals: ${pagesWithDeals}/${targets.length}`);
  if (samples.length) console.log(`Sample empty pages: ${JSON.stringify(samples)}`);
  // Every page empty means District served this machine a blocked or
  // stripped page (seen on GitHub's US runners). Keep the last good data
  // and its timestamps, and fail so the run shows red instead of green.
  if (targets.length >= 20 && pagesWithDeals === 0) {
    console.log(`::error::District returned no deals on any of ${targets.length} pages; kept previous data. Responses: ${JSON.stringify(statusCounts)}`);
    process.exit(2);
  }

  curated.updatedAt = now;
  curated.totalSpotsWithOffers = Object.values(spots).filter(s => s.district?.hasOffers || s.swiggy?.hasOffers).length;
  curated.coverage = {
    ...(curated.coverage || {}),
    districtDiscovery: {
      mode: MODE, discovered: sitemapSlugs.length, candidates: candidateSpots.length, matched: acceptedTargets,
      unmatched: rejected.filter((item) => item.reason !== "ambiguous-branch" && !item.reason.startsWith("response-")).length,
      rejectedMatches: rejected.filter((item) => item.reason === "ambiguous-branch" || item.reason.startsWith("response-")).length,
      refreshedAt: now,
    },
  };

  fs.writeFileSync(OFFERS_FILE, JSON.stringify(curated, null, 2), "utf8");
  const unmatched = fs.existsSync(UNMATCHED_FILE) ? JSON.parse(fs.readFileSync(UNMATCHED_FILE, "utf8")) : {};
  fs.writeFileSync(UNMATCHED_FILE, JSON.stringify({ ...unmatched, updatedAt: now, district: rejected }, null, 2) + "\n", "utf8");

  console.log(`\n\n=== SCRAPE COMPLETE ===`);
  console.log(`- Targets checked: ${targets.length}`);
  console.log(`- Exact branches accepted: ${acceptedTargets}`);
  console.log(`- Branch matches rejected: ${rejected.filter((item) => item.reason === "ambiguous-branch" || item.reason.startsWith("response-")).length}`);
  console.log(`- Newly activated District offers: ${newlyActiveDistrict}`);
  console.log(`- TOTAL COMPARISON SPOTS (both apps): ${totalCompSpots}`);
  console.log(`- Total spots with any deal: ${curated.totalSpotsWithOffers}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
