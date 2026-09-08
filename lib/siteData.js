import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { slugFromTitle } from "./rankings.js";

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

export function getEateries() {
  try {
    if (!_cache) _cache = JSON.parse(fs.readFileSync(dataPath("eateries.json"), "utf-8"));
    const content = venueContent();
    return _cache
      .filter((e) => e.status === "approved" && e.lat && e.lng)
      .map((e) => (content[e.id] ? { ...e, ...content[e.id] } : e));
  } catch (err) {
    console.error("[siteData] getEateries failed:", err?.message || err);
    return [];
  }
}

export function getEateryById(id) {
  return getEateries().find((e) => e.id === id) ?? null;
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
  const spots = getEateries().filter((e) => names.has(e.discoveredIn));
  return { area, slug, spots };
}

/** True when public/photos/{id}.jpg is on disk (avoids emitting broken image URLs). */
export function hasSpotPhoto(id) {
  try {
    return fs.existsSync(path.join(process.cwd(), "public", "photos", `${id}.jpg`))
      || fs.existsSync(path.join(__dirname, "..", "public", "photos", `${id}.jpg`));
  } catch {
    return false;
  }
}

export function getCategoryBySlug(slug) {
  const cat = CATEGORIES.find((c) => c.slug === slug);
  if (!cat) return null;
  const spots = getEateries()
    .filter((e) => (cat.filterFn ? cat.filterFn(e) : e.category === cat.key))
    .sort((a, b) => (b.ratingCount || 0) - (a.ratingCount || 0));
  return { ...cat, spots };
}

export function topSpots(limit = 20, filter = () => true) {
  return getEateries()
    .filter(filter)
    .sort((a, b) => (b.ratingCount || 0) - (a.ratingCount || 0))
    .slice(0, limit);
}

export function allAreaPages() {
  return TOP_AREAS.map((area) => ({ area, slug: areaSlug(area) }));
}

export function allCategoryPages() {
  return CATEGORIES.map((c) => ({ slug: c.slug, label: c.label }));
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
  return () => true;
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
      .filter(filter)
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
