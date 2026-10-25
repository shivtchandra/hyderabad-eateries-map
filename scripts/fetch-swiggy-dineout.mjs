/**
 * Swiggy Dineout offers for Hyderabad spots, merged into data/curated-offers.json.
 *
 * How it works (all plain GETs of Swiggy's server-rendered city hubs):
 *   1. /dineout/hyderabad links ~285 locality hubs (/dineout/hyderabad/[area]).
 *      Each embeds __NEXT_DATA__ with restaurant cards: name, locality, detail
 *      link and the restaurant's own discount ("Flat 15% off", "on pre-booking").
 *   2. Each restaurant's detail page adds exact lat/long and the bank / coupon /
 *      cashback offers with their minimum bill.
 *   3. Restaurants are matched to our eateries by distance + name, and written to
 *      spots[id].swiggy in data/curated-offers.json. District data on the same
 *      record is left untouched.
 *
 * Runs anywhere (including standard GitHub Actions runners): /dineout/hyderabad
 * explicitly scopes to Hyderabad regardless of requester IP.
 *
 * Run:  node scripts/fetch-swiggy-dineout.mjs
 *       LIMIT=10 node scripts/fetch-swiggy-dineout.mjs   (quick sample)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OFFERS_FILE = process.env.OFFERS_FILE || path.join(ROOT, "data", "curated-offers.json");
const EATERIES_FILE = path.join(ROOT, "data", "eateries.json");
const LIMIT = Number(process.env.LIMIT || Infinity);
const MAX_LOCALITIES = Number(process.env.MAX_LOCALITIES || 80);
const DELAY_MS = Number(process.env.DELAY_MS || 1200);
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getNextData(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "text/html" },
        redirect: "follow",
        signal: AbortSignal.timeout(30000),
      });
      if (res.status === 429 || res.status === 202) {
        await sleep(8000 * (attempt + 1));
        continue;
      }
      if (!res.ok) return { html: null, data: null };
      const html = await res.text();
      const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
      return { html, data: m ? JSON.parse(m[1]) : null };
    } catch {
      await sleep(3000);
    }
  }
  return { html: null, data: null };
}

function collectRestaurants(node, out) {
  if (!node || typeof node !== "object") return;
  if (node.info?.id && (node.info?.locality || node.info?.name) && node.cta?.link) {
    if (node.cta.link.startsWith("/")) {
      node.cta.link = "https://www.swiggy.com" + node.cta.link;
    }
    out.push(node);
    return;
  }
  for (const k in node) collectRestaurants(node[k], out);
}

const num = (s) => (s ? Number(String(s).replace(/,/g, "")) : null);

// The restaurant's own discount, from a listing card.
function vendorDeal(info) {
  const v = info.vendorOffer?.vendorOfferInfos?.[0] || info.vendorOffer?.otherOffersInfo?.[0] || info.vendorOffer?.info;
  const v3 = info.offerInfoV3?.vendorOffer;
  if (!v && !v3) return null;
  const title = v3?.title || v?.description || v?.title;
  if (!title) return null;
  const allDayNote = (v?.tnc || []).find((t) => /applicable|valid|slot|between|from|till/i.test(t)) || null;
  const pctFromTitle = num((title.match(/(\d{1,2})\s*%/) || [])[1]);
  const flatFromTitle = num((title.match(/₹\s?([\d,]+)/) || [])[1]);
  return {
    title: title.replace(/\s+/g, " ").trim(), // "Flat 15% off"
    on: v3?.subtitle || v?.subtitle || null, // "on pre-booking" | "on walk-in" | "on total bill"
    pct: pctFromTitle ?? (v?.discountInfo?.discountType === "DISCOUNT_TYPE_PERCENTAGE" ? v.discountInfo.discountValue : null),
    flat: flatFromTitle ?? (v?.discountInfo?.discountType === "DISCOUNT_TYPE_FLAT" ? v.discountInfo.discountValue : null),
    applicableNow: v?.isOfferApplicableNow ?? null,
    allDay: allDayNote ? /throughout the day/i.test(allDayNote) : null,
    note: allDayNote,
  };
}

// Bank / coupon / cashback offers from the detail page's DealAndOfferInfo card.
function detailOffers(data) {
  const cards = data?.props?.pageProps?.widgetResponse?.cards || data?.props?.pageProps?.widgetResponse?.success?.cards || [];
  const entity = cards.find((c) => /EntityInfoWithMasthead/.test(c.card?.card?.["@type"] || ""))?.card?.card?.info;
  const deal = cards.find((c) => /DealAndOfferInfo/.test(c.card?.card?.["@type"] || ""))?.card?.card;
  const cardOffers = [];
  let cashback = null;
  for (const seg of deal?.dayWiseOfferInfo || []) {
    for (const o of seg.addOnOffer?.offers || []) {
      const sub = o.secondarySubtext?.title || "";
      cardOffers.push({
        title: o.title.replace(/\*$/, "").trim(), // "Flat 10% off" | "Cashback ₹125"
        via: (o.description || "").replace(/^use\s+/i, "").trim() || null, // coupon code or card name
        code: (sub.match(/coupon code\s+([A-Z0-9]+)/i) || [])[1] || null,
        minBill: num((sub.match(/₹\s?([\d,]+)\s*or more/i) || [])[1]),
        pct: num((o.title.match(/(\d{1,2})\s*%/) || [])[1]),
        flat: num((o.title.match(/₹\s?([\d,]+)/) || [])[1]),
      });
    }
    const dc = seg.dineCashInfo?.offers?.[0];
    if (dc?.title) cashback = `${dc.title} ${dc.description || ""}`.trim();
  }
  const lat = Number(entity?.locationInfo?.lat ?? entity?.locationInfo?.latitude);
  const lng = Number(entity?.locationInfo?.long ?? entity?.locationInfo?.lng ?? entity?.locationInfo?.longitude);
  return { lat: Number.isFinite(lat) ? lat : null, lng: Number.isFinite(lng) ? lng : null, cardOffers, cashback };
}

// ---- matching to our eateries ----
const STOP = new Set(["the", "restaurant", "restaurants", "cafe", "hyderabad", "and", "bar", "kitchen", "by", "&", "pvt", "ltd", "family", "dhaba"]);
const tokens = (s) => new Set((s || "").toLowerCase().normalize("NFKD").replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).filter((t) => t.length > 1 && !STOP.has(t)));
function nameScore(a, b) {
  const A = tokens(a), B = tokens(b);
  if (!A.size || !B.size) return 0;
  let hit = 0;
  for (const t of A) if (B.has(t)) hit++;
  return hit / Math.min(A.size, B.size);
}
function metres(a, b) {
  const R = 6371000, toR = (d) => (d * Math.PI) / 180;
  const dLat = toR(b.lat - a.lat), dLng = toR(b.lng - a.lng);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(toR(a.lat)) * Math.cos(toR(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}
function matchEatery(sw, eateries) {
  let best = null;
  for (const e of eateries) {
    if (!e.lat || !e.lng) continue;
    const d = metres(sw, e);
    if (d > 600) continue;
    const s = nameScore(sw.name, e.name);
    if (s < 0.5) continue;
    const ok = (s >= 0.99 && d <= 600) || (s >= 0.66 && d <= 300) || d <= 120;
    if (!ok) continue;
    const rank = s * 1000 - d;
    if (!best || rank > best.rank) best = { e, rank, d, s };
  }
  return best;
}

const PRIORITY_SLUGS = [
  "jubilee-hills", "banjara-hills", "gachibowli", "madhapur", "hitech-city",
  "kondapur", "begumpet", "himayatnagar", "secunderabad", "kukatpally",
  "somajiguda", "film-nagar", "financial-district", "sindhi-colony",
  "abids", "malakpet", "dilsukhnagar", "lb-nagar", "tarnaka", "ecil",
  "kompally", "sainikpuri", "nallagandla", "manikonda", "miyapur",
];

async function main() {
  const START_URL = "https://www.swiggy.com/dineout/hyderabad";
  const home = await getNextData(START_URL);
  if (!home.data && !home.html) {
    console.error("Failed to load Swiggy Dineout Hyderabad page.");
    return;
  }
  const city = home.data?.props?.pageProps?.addressObj?.city;
  console.log(`Requester IP geolocated city: "${city || "unknown"}". Scoping explicitly to Hyderabad hubs.`);

  const homeCards = home.data?.props?.pageProps?.widgetResponse?.success?.cards || home.data?.props?.pageProps?.widgetResponse?.cards || [];
  const localityInterlinks = [];
  for (const c of homeCards) {
    if (c.card?.card?.["@type"]?.includes("InterlinkingContent")) {
      for (const item of c.card?.card?.content || []) {
        if (item.link && /^https:\/\/www\.swiggy\.com\/dineout\/hyderabad\/[a-z0-9-]+$/.test(item.link)) {
          if (!item.link.endsWith("-restaurants") && !item.link.includes("-store-")) {
            localityInterlinks.push(item.link);
          }
        }
      }
    }
  }

  const htmlLinks = [
    ...[...(home.html || "").matchAll(/href="(https:\/\/www\.swiggy\.com\/dineout\/hyderabad\/[a-z0-9-]+)"/g)]
      .map((m) => m[1])
      .filter((l) => !l.endsWith("-restaurants") && !l.includes("-store-")),
    ...[...(home.html || "").matchAll(/href="(https:\/\/www\.swiggy\.com\/[a-z0-9-]+-dineout-near-me)"/g)].map((m) => m[1]),
  ];

  const allLocalities = [...new Set([...localityInterlinks, ...htmlLinks])];
  allLocalities.sort((a, b) => {
    const slugA = a.split("/").pop() || "";
    const slugB = b.split("/").pop() || "";
    const scoreA = PRIORITY_SLUGS.findIndex((p) => slugA.includes(p));
    const scoreB = PRIORITY_SLUGS.findIndex((p) => slugB.includes(p));
    if (scoreA !== -1 && scoreB !== -1) return scoreA - scoreB;
    if (scoreA !== -1) return -1;
    if (scoreB !== -1) return 1;
    return 0;
  });

  const collections = [START_URL, ...allLocalities.slice(0, MAX_LOCALITIES)];
  console.log(`Swiggy city OK (Hyderabad). Crawling ${collections.length} hubs (out of ${allLocalities.length} discovered).`);

  const byId = new Map();
  for (const url of collections) {
    const { data } = url === START_URL ? home : await getNextData(url);
    const found = [];
    collectRestaurants(data, found);
    for (const r of found) {
      if (r.info.locationInfo?.city?.name && r.info.locationInfo.city.name !== "Hyderabad") continue;
      if (!byId.has(r.info.id)) byId.set(r.info.id, r);
    }
    console.log(`  ${url.split("/").pop()}: ${found.length} (unique so far ${byId.size})`);
    if (url !== START_URL) await sleep(DELAY_MS);
  }

  const eateries = JSON.parse(fs.readFileSync(EATERIES_FILE, "utf8")).filter((e) => e.status === "approved");
  const results = [];
  let i = 0;
  const candidateRestaurants = [...byId.values()].slice(0, LIMIT);
  for (const r of candidateRestaurants) {
    i++;
    const { data } = await getNextData(r.cta.link);
    const det = detailOffers(data);
    await sleep(DELAY_MS);
    if (det.lat == null) {
      console.log(`[${i}/${candidateRestaurants.length}] ${r.info.name}: no location, skipped`);
      continue;
    }
    const match = matchEatery({ name: r.info.name, lat: det.lat, lng: det.lng }, eateries);
    const deal = vendorDeal(r.info);
    console.log(
      `[${i}/${candidateRestaurants.length}] ${r.info.name} (${r.info.locality || "Hyderabad"}) -> ` +
      `${match ? `${match.e.name} (${Math.round(match.d)}m)` : "no match"} | ` +
      `${deal?.title || "no own deal"} | ${det.cardOffers.length} card offers`
    );
    if (!match) continue;
    results.push({
      eatery: match.e,
      swiggy: {
        id: r.info.id,
        name: r.info.name,
        url: r.cta.link,
        hasOffers: Boolean(deal || det.cardOffers.length),
        fetchedAt: new Date().toISOString(),
        deal,
        cardOffers: det.cardOffers,
        cashback: det.cashback,
        // legacy shape for map sheet / spot page
        offers: [
          ...(deal ? [{ type: "FLAT", title: deal.title, desc: deal.on || "On total bill" }] : []),
          ...det.cardOffers.slice(0, 3).map((c) => ({
            type: "BANK",
            title: c.title,
            desc: [c.code ? `Code ${c.code}` : c.via, c.minBill ? `bills of ₹${c.minBill.toLocaleString("en-IN")}+` : null].filter(Boolean).join(", "),
          })),
          ...(det.cashback ? [{ type: "CASHBACK", title: det.cashback.split(" ")[0] || "Cashback", desc: det.cashback }] : []),
        ].slice(0, 5),
      },
    });
  }

  // Merge: re-read the file so a District run that finished meanwhile is kept.
  const cur = fs.existsSync(OFFERS_FILE) ? JSON.parse(fs.readFileSync(OFFERS_FILE, "utf8")) : { spots: {} };
  const spots = cur.spots || {};
  const seen = new Set();
  for (const { eatery, swiggy } of results) {
    seen.add(eatery.id);
    spots[eatery.id] = { name: eatery.name, area: eatery.area || eatery.discoveredIn || "", district: null, ...spots[eatery.id], swiggy };
  }

  // Only drop unseen swiggy data on a full (unlimited) run to avoid wiping on partial/dry runs.
  if (LIMIT === Infinity) {
    for (const [id, s] of Object.entries(spots)) if (!seen.has(id) && s.swiggy) s.swiggy = null;
  }

  const has = (s) => s.district?.hasOffers || s.swiggy?.hasOffers;
  fs.writeFileSync(OFFERS_FILE, JSON.stringify({
    ...cur,
    updatedAt: new Date().toISOString(),
    swiggyUpdatedAt: new Date().toISOString(),
    totalSpotsWithOffers: Object.values(spots).filter(has).length,
    spots,
  }, null, 2), "utf8");
  console.log(`\nDone: ${results.length} Swiggy restaurants matched to our spots (of ${byId.size} seen).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
