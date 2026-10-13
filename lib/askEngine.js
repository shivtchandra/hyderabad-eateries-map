// Ask Eats v1: "what's good near me?" answered from our own data first.
// Pure functions (no React, no fetch) so the sheet, tests and a future
// /api/ask can share them. Priority bands, best first:
//   0. Locals' vote: top 3 in a community ranking for what they want
//   1. Our picks: curator picks and r/hyderabad locals' picks
//   2. Yours: spots the user saved or stamped
//   3. Google: well-reviewed spots (rating weighted by review count)
// Within a band, closer wins; quality breaks ties.
import { haversineKm } from "./eateryUtils.js";

export const CRAVINGS = [
  { id: "near", label: "Near me now" },
  { id: "biryani", label: "Biryani", words: ["biryani", "biriyani"], tags: ["biryani"], rank: /biryani/i },
  { id: "chai", label: "Irani chai", words: ["chai", "irani", "tea", "osmania"], tags: ["irani", "chai"], rank: /irani|chai/i },
  { id: "breakfast", label: "Breakfast", words: ["breakfast", "tiffin", "tiffins", "idli", "dosa", "upma", "vada", "pesarattu"], tags: ["breakfast", "tiffin", "dosa"], rank: /dosa|tiffin|breakfast/i },
  { id: "cafe", label: "Cafe to work", words: ["cafe", "coffee", "work", "laptop", "study"], cats: ["cafe"], tags: ["work-friendly", "specialty"], rank: /cafe|coffee/i },
  { id: "dessert", label: "Dessert", words: ["dessert", "desserts", "ice cream", "icecream", "sweet", "sweets", "cake", "kulfi", "waffle", "gelato"], cats: ["ice-cream", "bakery"], tags: ["desserts", "kulfi", "waffle", "mithai"], rank: /ice cream|dessert|bakery|cake/i },
  { id: "mandi", label: "Mandi", words: ["mandi", "arabian"], tags: ["mandi", "arabian"], rank: /mandi/i },
  { id: "shawarma", label: "Shawarma", words: ["shawarma", "shwarma", "kebab", "kabab"], tags: ["shawarma", "kebab"], rank: /shawarma/i },
  { id: "haleem", label: "Haleem", words: ["haleem"], tags: ["haleem"], rank: /haleem/i },
  { id: "drinks", label: "Drinks", words: ["beer", "bar", "pub", "brewery", "drinks", "cocktail", "cocktails"], cats: ["restro-bar"], rank: /brew|bar|pub/i },
  { id: "date", label: "Date night", words: ["date", "romantic", "anniversary", "fancy"], tags: ["date", "view"] },
  { id: "veg", label: "Pure veg", words: ["veg", "vegetarian", "pure veg"], tags: ["pure-veg", "veg-friendly"] },
  { id: "surprise", label: "Surprise me" },
];
export const CRAVING_CHIPS = ["near", "biryani", "chai", "breakfast", "cafe", "dessert", "mandi", "drinks", "surprise"];

const norm = (s = "") => ` ${String(s).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()} `;

// Free text -> intent. Keyword matching only (v1); returns what it understood.
export function parseAsk(text = "", areaNames = []) {
  const t = norm(text);
  const craving = CRAVINGS.find((c) => c.words?.some((w) => t.includes(` ${w} `))) || null;
  const area = areaNames
    .flatMap((a) => a.split("/").map((part) => ({ a, part })))
    .find(({ part }) => part.length > 3 && t.includes(` ${part.toLowerCase()} `))?.a || null;
  return {
    craving: craving?.id || (/ (near|nearby|around|close) /.test(t) ? "near" : null),
    area,
    cheap: / (cheap|budget|affordable|under|less) /.test(t),
    openNow: / (open now|now|right now|tonight|late|midnight) /.test(t),
  };
}

export function matchesCraving(e, craving, rankings = []) {
  if (!craving || craving.id === "near" || craving.id === "surprise") return true;
  if (craving.cats?.includes(e.category)) return true;
  if (craving.tags && (e.tags || []).some((g) => craving.tags.includes(g))) return true;
  if (craving.words && craving.words.some((w) => norm(e.name).includes(` ${w} `))) return true;
  if (craving.rank && rankings.some((r) => craving.rank.test(r.title || ""))) return true;
  return false;
}

const quality = (e) => (e.rating || 0) * Math.log10((e.ratingCount || 0) + 10);
const shortRank = (t = "") => t.replace(/\s+in\s+hyderabad$/i, "");
const fmtKm = (d) => (d == null ? null : d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(1)} km`);

// ctx: { rankBySpot: {id: [{title, rank, votes}]}, picksMap: {id: pick},
//        localsMap: {id: n}, passport: {saved, visited}, safetyMap: {id: rec},
//        isOpen?: (e) => true|false|null }
export function askSpots(eateries, { origin, cravingId = "near", cheap = false, openNow = false, exclude = [], limit = 5, ctx = {} } = {}) {
  if (!origin) return { needLocation: true, results: [] };
  const craving = CRAVINGS.find((c) => c.id === cravingId) || CRAVINGS[0];
  const skip = new Set(exclude);
  const { rankBySpot = {}, picksMap = {}, localsMap = {}, passport = { saved: {}, visited: {} }, safetyMap = {}, isOpen } = ctx;

  let pool = [];
  let radius = 0;
  for (const r of [1.5, 3, 6, 12]) {
    radius = r;
    pool = [];
    for (const e of eateries) {
      if (skip.has(e.id) || e.lat == null) continue;
      const dist = haversineKm(origin, e);
      if (dist == null || dist > r) continue;
      const ranks = rankBySpot[e.id] || [];
      if (!matchesCraving(e, craving, ranks)) continue;
      if (cheap && e.priceLevel != null && e.priceLevel > 2) continue;
      if (openNow && isOpen && isOpen(e) === false) continue;
      pool.push({ e, dist, ranks });
    }
    if (pool.length >= limit * 2) break;
  }

  const scored = pool.map(({ e, dist, ranks }) => {
    const why = [];
    let band = 3;
    const vote = ranks
      .filter((r) => r.rank <= 3 && (!craving.rank || craving.rank.test(r.title || "")))
      .sort((a, b) => a.rank - b.rank)[0];
    if (vote) { band = 0; why.push(`#${vote.rank} ${shortRank(vote.title)} by locals`); }
    if (picksMap[e.id]) { band = Math.min(band, 1); why.push(picksMap[e.id].dishes?.length ? `Our pick: ${picksMap[e.id].dishes.slice(0, 2).join(", ")}` : "Our pick"); }
    if ((localsMap[e.id] || 0) >= 2) { band = Math.min(band, 1); why.push(`Recommended by ${localsMap[e.id]} locals on r/hyderabad`); }
    if (passport.saved?.[e.id]) { band = Math.min(band, 2); why.push("You saved this"); }
    else if (passport.visited?.[e.id]) { band = Math.min(band, 2); why.push("You've been here"); }
    if (e.rating) why.push(`${e.rating}★ from ${Number(e.ratingCount || 0).toLocaleString("en-IN")} Google reviews`);
    // Google-only spots need enough reviews to be worth suggesting.
    const ok = band < 3 || ((e.ratingCount || 0) >= 50 && (e.rating || 0) >= 4);
    const safety = safetyMap[e.id] ? `Food safety: ${safetyMap[e.id].label}, ${safetyMap[e.id].dateLabel}` : null;
    return { e, dist, band, why, ok, safety, distLabel: fmtKm(dist) };
  }).filter((s) => s.ok);

  // Closer wins inside a band (in 1 km steps), then quality.
  scored.sort((a, b) => a.band - b.band || Math.floor(a.dist) - Math.floor(b.dist) || quality(b.e) - quality(a.e));
  let results = scored.slice(0, limit);
  if (craving.id === "surprise") results = [...scored].sort(() => Math.random() - 0.5).slice(0, limit);
  return { needLocation: false, results, radius, craving };
}

// One friendly line above the answer.
export function answerLine({ results, craving, radius }, { areaName = null, cheap = false, openNow = false } = {}) {
  const where = areaName ? `around ${areaName}` : "near you";
  if (!results.length) return `I couldn't find a good ${craving?.id === "near" ? "spot" : craving?.label.toLowerCase()} ${where} within ${radius} km. Try something else?`;
  const what = !craving || craving.id === "near" ? "spots" : craving.id === "surprise" ? "surprises" : craving.label.toLowerCase();
  const extra = [cheap && "on a budget", openNow && "open now"].filter(Boolean).join(", ");
  return `Here's the best ${what} ${where}${extra ? `, ${extra}` : ""}. Locals' votes and our picks come first.`;
}
