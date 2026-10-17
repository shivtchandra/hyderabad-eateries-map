import fs from "fs";
import { fixCategory } from "./categoryFix.js";
import path from "path";
import { fileURLToPath } from "url";
import { slugFromTitle } from "./rankings.js";
import { coreIdSet } from "./coreSpots.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Prefer process.cwd() so Vercel serverless traces/finds data/ the same way
// as /api/eateries. import.meta.url paths often omit the JSON from the
// rankings force-dynamic bundle, which emptied the Google-review baseline.
function dataPath(file) {
  const cwd = path.join(process.cwd(), "data", file);
  if (fs.existsSync(cwd)) return cwd;
  return path.join(__dirname, "..", "data", file);
}

let _cache = null;
let _content = null;

function venueContent() {
  if (!_content) {
    try {
      _content = JSON.parse(fs.readFileSync(dataPath("venue-content.json"), "utf-8"));
    } catch {
      _content = {};
    }
  }
  return _content;
}

let _merged = null;

// Memoized: this used to re-filter and re-merge all ~3.7k venues on every call,
// and a single page render calls it several times (slug index, chain siblings,
// area lookups). Now that most spot pages render on demand rather than at build
// time, that waste lands on Fluid CPU. Callers never mutate the result, they
// filter or sort copies.
export function getEateries() {
  if (_merged) return _merged;
  try {
    if (!_cache) _cache = JSON.parse(fs.readFileSync(dataPath("eateries.json"), "utf-8"));
    const content = venueContent();
    // A few ids appear twice in eateries.json; keep one per id (most reviews).
    const byId = new Map();
    let extraPlaces = [];
    try { extraPlaces = JSON.parse(fs.readFileSync(dataPath("recommendation-extra-places.json"), "utf-8")); } catch {}
    for (const e of [..._cache, ...extraPlaces]) {
      if (e.status !== "approved" || !e.lat || !e.lng) continue;
      const prev = byId.get(e.id);
      if (!prev || (Number(e.ratingCount) || 0) > (Number(prev.ratingCount) || 0)) byId.set(e.id, e);
    }
    const approved = [...byId.values()];
    // `core`: the curated list shown by default (lib/coreSpots.js); others are noindexed, not removed.
    const core = coreIdSet(approved, { editorialIds: new Set(Object.keys(content)) });
    _merged = approved.map((e) => ({ ...(content[e.id] ? { ...e, ...content[e.id] } : e), category: fixCategory(e), core: core.has(e.id) }));
    return _merged;
  } catch (err) {
    console.error("[siteData] getEateries failed:", err?.message || err);
    return [];
  }
}

export function getEateryById(id) {
  return getEateries().find((e) => e.id === id) ?? null;
}


/** URL slug for a spot: name + area when useful, collision-safe. */
export function spotSlugBase(e) {
  const areaName =
    e?.discoveredIn && !String(e.discoveredIn).startsWith("text:")
      ? e.discoveredIn
      : "";
  const name = slugFromTitle(e?.name || "");
  const area = slugFromTitle(areaName);
  // Google names often already include the branch area (for example,
  // "Glens Bakehouse Film Nagar"). Do not emit ...film-nagar-film-nagar.
  const nameHasArea = area && `-${name}-`.includes(`-${area}-`);
  const base = nameHasArea ? name : slugFromTitle([e?.name, areaName].filter(Boolean).join(" "));
  return base || slugFromTitle(e?.id || "spot");
}

// Canonical slugs used to append the area unconditionally. Keep those exact
// paths as aliases so bookmarks and already-indexed URLs permanently redirect.
function legacySpotSlugBase(e) {
  const area =
    e?.discoveredIn && !String(e.discoveredIn).startsWith("text:")
      ? e.discoveredIn
      : "";
  return slugFromTitle([e?.name, area].filter(Boolean).join(" ")) || slugFromTitle(e?.id || "spot");
}

let _slugIndex = null;
function slugIndex() {
  if (_slugIndex) return _slugIndex;
  const eats = getEateries();
  const bySlug = new Map();
  const byId = new Map();

  // Calculate the exact historical routes first. Clean canonical slugs must
  // never steal an old URL that already belongs to a different venue.
  const legacySlugs = new Set();
  const legacyBySlug = new Map();
  for (const e of eats) {
    const base = legacySpotSlugBase(e);
    let slug = base;
    if (legacySlugs.has(slug)) {
      const tail = String(e.id).replace(/[^a-zA-Z0-9]/g, "").slice(-8).toLowerCase();
      slug = `${base}-${tail}`;
      let n = 2;
      while (legacySlugs.has(slug)) slug = `${base}-${tail}-${n++}`;
    }
    legacySlugs.add(slug);
    legacyBySlug.set(slug, e);
  }

  for (const e of eats) {
    const base = spotSlugBase(e);
    let slug = base;
    // Keep name+area slugs readable; only disambiguate when two spots collide.
    if (bySlug.has(slug) || (legacyBySlug.has(slug) && legacyBySlug.get(slug).id !== e.id)) {
      const tail = String(e.id).replace(/[^a-zA-Z0-9]/g, "").slice(-8).toLowerCase();
      slug = `${base}-${tail}`;
      let n = 2;
      while (bySlug.has(slug) || (legacyBySlug.has(slug) && legacyBySlug.get(slug).id !== e.id)) {
        slug = `${base}-${tail}-${n++}`;
      }
    }
    bySlug.set(slug, e);
    byId.set(e.id, slug);
  }

  // Recreate the former collision handling and register every former canonical
  // URL as an alias after the clean canonical routes have been assigned.
  for (const [slug, e] of legacyBySlug) {
    if (!bySlug.has(slug)) bySlug.set(slug, e);
  }

  // Name-only links are commonly shared by search engines and external cards.
  // Resolve them when unambiguous; branch-name collisions stay collision-safe.
  const nameAliases = new Map();
  for (const e of eats) {
    const alias = slugFromTitle(e.name || "");
    if (!alias) continue;
    nameAliases.set(alias, nameAliases.has(alias) ? null : e);
  }
  for (const [alias, e] of nameAliases) {
    if (e && !bySlug.has(alias)) bySlug.set(alias, e);
  }
  _slugIndex = { bySlug, byId };
  return _slugIndex;
}

export function spotSlug(e) {
  if (!e?.id) return spotSlugBase(e || {});
  return slugIndex().byId.get(e.id) || spotSlugBase(e);
}

export function spotPath(e) {
  return `/spot/${spotSlug(e)}`;
}

export function getEateryBySlugOrId(param) {
  if (!param) return null;
  const decoded = decodeURIComponent(param);
  const { bySlug } = slugIndex();
  if (bySlug.has(decoded)) return bySlug.get(decoded);
  return getEateryById(decoded);
}

export function pathForSpotId(id) {
  const e = getEateryById(id);
  return e ? spotPath(e) : `/spot/${encodeURIComponent(id)}`;
}



/** Soft brand key so "Cafe Niloufer Himayatnagar" groups with "Cafe Niloufer". */
export function chainKey(name) {
  let s = (name || "").toLowerCase();
  s = s.replace(
    /\b(himayatnagar|hitech|hitec|city|jubilee|hills|premium|lounge|madhapur|gachibowli|shamshabad|hyderabad|secunderabad|uppal|tolichowki|charminar|airport)\b/g,
    " "
  );
  s = s.replace(/\bold city\b/g, " ");
  s = s.replace(/@.*/g, " ");
  s = s.replace(/\b(cafe|the|and|bakery|restaurant|restro|&)\b/g, " ");
  s = s.replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
  const parts = s.split(" ").filter(Boolean);
  if (parts.includes("niloufer")) return "niloufer";
  if (parts.includes("nimrah")) return "nimrah";
  if (parts.includes("rameshwaram")) return "rameshwaram";
  if (parts.includes("pista") && parts.includes("house")) return "pista house";
  if (parts.includes("paradise")) return "paradise";
  if (parts.length >= 2) return parts.slice(0, 2).join(" ");
  return parts[0] || "";
}

export function getEditorialSpotIds() {
  return Object.keys(venueContent());
}

/** Other branches of the same chain (e.g. all Cafe Niloufer locations). */
export function getChainSiblings(spot, { limit = 12 } = {}) {
  if (!spot?.name) return [];
  const key = chainKey(spot.name);
  if (!key || key.length < 4) return [];
  return getEateries()
    .filter((e) => e.id !== spot.id && chainKey(e.name) === key)
    .sort((a, b) => (b.ratingCount || 0) - (a.ratingCount || 0))
    .slice(0, limit);
}

export const CATEGORIES = [
  { key: "cafe", slug: "cafes", label: "Cafes", seoTitle: "Best Cafes in Hyderabad", description: "Best cafes in Hyderabad for work, dates, Irani chai, breakfast and new openings." },
  { key: "restaurant", slug: "restaurants", label: "Restaurants", seoTitle: "Best Restaurants in Hyderabad", description: "Restaurants in Hyderabad for dinner, family meals, Telugu and Andhra food, and weeknight sit-downs." },
  { key: "local", slug: "biryani-and-local", label: "Biryani & Local Eats", seoTitle: "Best Biryani in Hyderabad", description: "Best biryani in Hyderabad, dum and chicken, plus mandi, Irani chai and local eats on the map." },
  { key: "restro-bar", slug: "bars", label: "Restro Bars", seoTitle: "Best Bars & Restro Bars in Hyderabad", description: "Breweries, pubs and restro-bars worth a night out in Hyderabad." },
  { key: "bakery", slug: "bakeries", label: "Bakeries", seoTitle: "Best Bakeries in Hyderabad", description: "Patisseries, bakeries and dessert spots across Hyderabad." },
  { key: "ice-cream", slug: "ice-cream", label: "Ice Cream", seoTitle: "Best Ice Cream in Hyderabad", description: "Ice cream parlours, gelato and falooda spots in Hyderabad." },
  { key: "veg", slug: "veg-friendly", label: "Veg-Friendly", seoTitle: "Best Veg Restaurants in Hyderabad", description: "Vegetarian-friendly restaurants and cafes in Hyderabad.", filterFn: (e) => e.tags?.includes("veg-friendly") },
];

export const TOP_AREAS = [
  "Jubilee Hills", "Banjara Hills", "Kukatpally", "Gachibowli", "Begumpet",
  "Kompally", "Himayatnagar", "Madhapur/HITEC", "Secunderabad", "ECIL",
  "Film Nagar", "Nallagandla", "Financial District", "Dilsukhnagar", "Tarnaka",
  "Kondapur",
];

/** Map free-text discoveredIn values onto a TOP_AREAS hub when we have one. */
const AREA_ALIASES = {
  Madhapur: "Madhapur/HITEC",
  "HITEC City": "Madhapur/HITEC",
  "Hitec City": "Madhapur/HITEC",
  "Hitech City": "Madhapur/HITEC",
  "Road No.36 JH": "Jubilee Hills",
  Dilshuknagar: "Dilsukhnagar",
};

export function areaSlug(area) {
  return slugFromTitle(area);
}

/** Resolve discoveredIn to a real /areas/{slug} page, or null if none exists. */
export function resolveAreaPage(discoveredIn) {
  if (!discoveredIn || discoveredIn.startsWith("text:")) return null;
  const canonical = AREA_ALIASES[discoveredIn] || discoveredIn;
  const area = TOP_AREAS.find(
    (a) => a === canonical || areaSlug(a) === areaSlug(canonical),
  );
  if (!area) return null;
  return { area, slug: areaSlug(area) };
}

export function areaPageHref(discoveredIn) {
  const resolved = resolveAreaPage(discoveredIn);
  return resolved ? `/areas/${resolved.slug}` : null;
}

function discoveredInNamesForArea(area) {
  const names = new Set([area]);
  for (const [alias, canonical] of Object.entries(AREA_ALIASES)) {
    if (canonical === area) names.add(alias);
  }
  return names;
}

export function getAreaBySlug(slug) {
  const area = TOP_AREAS.find((a) => areaSlug(a) === slug);
  if (!area) return null;
  const names = discoveredInNamesForArea(area);
  const spots = getEateries().filter((e) => e.core && names.has(e.discoveredIn)); // curated list only
  return { area, slug, spots };
}

/** True when public/photos/{id}.jpg is on disk (avoids emitting broken image URLs). */
let _photoIds = null;
function photoIdSet() {
  if (_photoIds) return _photoIds;
  try {
    _photoIds = new Set(JSON.parse(fs.readFileSync(dataPath("photo-ids.json"), "utf-8")));
  } catch {
    _photoIds = new Set();
  }
  return _photoIds;
}

export function hasSpotPhoto(id) {
  return photoIdSet().has(id);
}

export function getCategoryBySlug(slug) {
  const cat = CATEGORIES.find((c) => c.slug === slug);
  if (!cat) return null;
  const spots = getEateries()
    .filter((e) => e.core && (cat.filterFn ? cat.filterFn(e) : e.category === cat.key))
    .sort((a, b) => (b.ratingCount || 0) - (a.ratingCount || 0));
  return { ...cat, spots };
}

export function topSpots(limit = 20, filter = () => true) {
  return getEateries()
    .filter((e) => e.core && filter(e))
    .sort((a, b) => (b.ratingCount || 0) - (a.ratingCount || 0))
    .slice(0, limit);
}

export function allAreaPages() {
  return TOP_AREAS.map((area) => ({ area, slug: areaSlug(area) }));
}

export function allCategoryPages() {
  return CATEGORIES.map((c) => ({ slug: c.slug, label: c.label }));
}

export function allAreaCategoryCombinations() {
  const eats = getEateries();
  const combinations = [];
  for (const area of TOP_AREAS) {
    const aSlug = areaSlug(area);
    const names = discoveredInNamesForArea(area);
    for (const cat of CATEGORIES) {
      const spots = eats.filter((e) => e.core && names.has(e.discoveredIn) && (cat.filterFn ? cat.filterFn(e) : e.category === cat.key));
      if (spots.length >= 3) {
        combinations.push({
          area,
          areaSlug: aSlug,
          categoryKey: cat.key,
          categorySlug: cat.slug,
          categoryLabel: cat.label,
          spotCount: spots.length,
        });
      }
    }
  }
  return combinations;
}

export function getAreaCategoryData(areaSlugInput, categorySlugInput) {
  const area = TOP_AREAS.find((a) => areaSlug(a) === areaSlugInput);
  const cat = CATEGORIES.find((c) => c.slug === categorySlugInput);
  if (!area || !cat) return null;
  const names = discoveredInNamesForArea(area);
  const spots = getEateries()
    .filter((e) => e.core && names.has(e.discoveredIn) && (cat.filterFn ? cat.filterFn(e) : e.category === cat.key))
    .sort((a, b) => (b.ratingCount || 0) - (a.ratingCount || 0));
  if (spots.length < 3) return null;
  return {
    area,
    areaSlug: areaSlugInput,
    category: cat,
    spots,
  };
}

// Keyword matchers so an SEO theme resolves to real venues even before any
// community votes exist. Keyed by ranking slug (slugFromTitle of the title).
const THEME_KEYWORDS = {
  "best-biryani-in-hyderabad": ["biryani"],
  "best-chicken-biryani-in-hyderabad": ["biryani"],
  "best-veg-biryani-in-hyderabad": ["biryani"],
  "best-haleem-in-hyderabad": ["haleem"],
  "best-mandi-in-hyderabad": ["mandi"],
  "best-shawarma-in-hyderabad": ["shawarma", "shawrma"],
  "best-dosa-in-hyderabad": ["dosa", "tiffin"],
  "best-irani-cafe-in-hyderabad": ["irani", "niloufer", "nimrah"],
  "best-street-food-in-hyderabad": ["chaat", "tiffin", "point", "corner"],
  "best-buffet-in-hyderabad": ["buffet", "barbeque", "barbecue", "bbq"],
  "best-fine-dining-in-hyderabad": [],
};

function themeFilter(pick, slug) {
  if (slug === "best-fine-dining-in-hyderabad") {
    return (e) => {
      const hay = `${e.name || ""} ${(e.tags || []).join(" ")} ${(e.blurb || "")}`.toLowerCase();
      if (/buffet|barbeque|barbecue|\bbbq\b/.test(hay)) return false;
      const price = e.priceLevel || 0;
      return (e.category === "restaurant" || e.category === "restro-bar") && price >= 3 && (e.rating || 0) >= 4.1;
    };
  }
  if (slug === "best-buffet-in-hyderabad") {
    return (e) => {
      const hay = `${e.name || ""} ${(e.tags || []).join(" ")} ${(e.blurb || "")}`.toLowerCase();
      return /buffet|barbeque|barbecue|\bbbq\b/.test(hay);
    };
  }
  const kws = THEME_KEYWORDS[slug];
  if (kws && kws.length) {
    const vegOnly = slug.includes("veg-biryani");
    return (e) => {
      const hay = `${e.name || ""} ${(e.tags || []).join(" ")}`.toLowerCase();
      const hit = kws.some((k) => hay.includes(k));
      if (!hit) return false;
      if (vegOnly) return e.tags?.includes("veg-friendly");
      return true;
    };
  }
  if (pick && pick.category) return (e) => e.category === pick.category;
  // Unknown dish (e.g. "best-chicken-pizza-in-hyderabad"): match on the head
  // noun from the slug. No keyword means no list, never an unrelated one.
  const words = (slug || "")
    .split("-")
    .filter((w) => w && !["best", "top", "in", "hyderabad", "hyd", "the", "of", "and", "near", "me"].includes(w));
  const head = words[words.length - 1];
  if (!head) return () => false;
  return (e) => {
    const hay = `${e.name || ""} ${(e.tags || []).join(" ")} ${e.blurb || ""}`.toLowerCase();
    return hay.includes(head);
  };
}

/** Quality score balancing rating against review volume. */
function qualityScore(e) {
  const r = e.rating || 0;
  const n = e.ratingCount || 0;
  return r * Math.log(n + 1);
}

/**
 * Real ranked list for an SEO theme, drawn from actual venue data.
 * Gives the rankings page indexable, named, described content before any votes
 * land. Facts come straight from the dataset — no invented claims.
 */
function cleanArea(a) {
  if (!a || typeof a !== "string") return "";
  if (a.includes(":") || a.length > 24) return ""; // drop junk discoveredIn values
  return a;
}

export function editorialRanking(pick, slug, limit = 12) {
  try {
    const filter = themeFilter(pick, slug);
    const ranked = getEateries()
      .filter((e) => e.core && filter(e))
      .filter((e) => (e.ratingCount || 0) >= 30)
      .sort((a, b) => qualityScore(b) - qualityScore(a));

    // Keep the strongest outlet per chain so the list reads as a ranking, not
    // five branches of the same brand.
    const seen = new Set();
    const out = [];
    for (const e of ranked) {
      const key = chainKey(e.name);
      if (key && seen.has(key)) continue;
      if (key) seen.add(key);
      out.push({
        spotId: e.id,
        name: e.name,
        area: cleanArea(e.discoveredIn),
        rating: e.rating || null,
        ratingCount: e.ratingCount || 0,
        blurb: e.blurb || null,
      });
      if (out.length >= limit) break;
    }
    return out;
  } catch (err) {
    console.error("[siteData] editorialRanking failed:", err?.message || err);
    return [];
  }
}
