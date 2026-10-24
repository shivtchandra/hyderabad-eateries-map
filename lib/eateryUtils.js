import { NEW_PLACE_DAYS } from "./newPlaces.js";

export const CATEGORIES = {
  "restro-bar": {
    label: "Restro Bar",
    color: "#E05C2A",
    keywords: ["bar", "pub", "brewery", "lounge", "gastropub", "taproom", "brewpub"],
    types: ["bar", "night_club"],
  },
  cafe: {
    label: "Cafe",
    color: "#4A90D9",
    keywords: ["cafe", "coffee", "roastery", "espresso", "brew bar", "third wave"],
    types: ["cafe"],
  },
  bakery: {
    label: "Bakery",
    color: "#C97D3E",
    keywords: ["bakery", "pastry", "patisserie", "boulangerie", "cake", "bake"],
    types: ["bakery"],
  },
  "ice-cream": {
    label: "Ice Cream",
    color: "#E0899E",
    keywords: ["gelato", "ice cream", "creamery", "dessert bar", "frozen yogurt", "sorbet", "popsicle", "juice", "milkshake", "falooda"],
    types: [],
  },
  // Sit-down restaurants, regional Telugu/Andhra meals, North Indian,
  // multicuisine, pure-veg dining. Narrow keywords so it doesn't swallow
  // tiffin centres or biryani joints (those stay "local").
  restaurant: {
    label: "Restaurant",
    color: "#9d2f4f",
    keywords: ["fine dine", "fine dining", "multicuisine", "multi cuisine", "multi-cuisine"],
    types: [],
  },
  // Everyday Hyderabad, checked last so it only catches what the specialty
  // buckets miss: Irani chai, tiffin centres, biryani, dhabas.
  local: {
    label: "Local Eats",
    color: "#2E8B6B",
    keywords: ["irani", "chai", "tiffin", "biryani", "dhaba", "mess", "udupi", "dosa", "idli", "kebab", "haleem", "shawarma"],
    types: ["meal_takeaway"],
  },
};

// Classify a Google Places result into one of 4 categories, or null to skip.
export function classifyPlace(name, types = []) {
  const nameLower = name.toLowerCase();
  const typesSet = new Set(types);

  for (const [tag, cfg] of Object.entries(CATEGORIES)) {
    const nameMatch = cfg.keywords.some((k) => nameLower.includes(k));
    const typeMatch = cfg.types.some((t) => typesSet.has(t));
    if (nameMatch || typeMatch) return tag;
  }
  return null;
}

export function colorFor(category) {
  return CATEGORIES[category]?.color ?? "#888888";
}

export function labelFor(category) {
  return CATEGORIES[category]?.label ?? category;
}

const AREA_HINTS = [
  "Jubilee Hills", "Film Nagar", "Madhapur", "HITEC City", "Hitec City",
  "Gachibowli", "Kondapur", "Banjara Hills", "Financial District",
  "Kokapet", "Nallagandla", "Begumpet", "Himayatnagar", "Secunderabad",
  "Kukatpally", "Kompally", "Dilsukhnagar", "Tarnaka", "ECIL",
];

export function displayArea(e = {}) {
  const raw = String(e.discoveredIn || e.area || "").trim();
  if (raw && !raw.startsWith("text:") && raw.length <= 24) return raw;
  const addr = String(e.address || "").toLowerCase();
  if (!addr) return "";
  for (const a of AREA_HINTS) {
    if (addr.includes(a.toLowerCase())) return a;
  }
  return "";
}

// Great-circle distance in km between two {lat,lng} points.
export function haversineKm(a, b) {
  if (!a || !b) return null;
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

// Road distances via OSRM public API (no key, free, demo tier).
// Fetches driving distances from userLoc to all spots in one table call.
// Returns { [spotId]: distanceKm }. Falls back to {} on error.
export async function fetchRoadDistances(userLoc, spots) {
  if (!userLoc || !spots.length) return {};
  const coords = [
    `${userLoc.lng},${userLoc.lat}`,
    ...spots.map((s) => `${s.lng},${s.lat}`),
  ].join(";");
  try {
    const res = await fetch(
      `https://router.project-osrm.org/table/v1/driving/${coords}?sources=0&annotations=distance`,
      { cache: "no-store" }
    );
    if (!res.ok) return {};
    const data = await res.json();
    const dists = data.distances?.[0] ?? [];
    const result = {};
    spots.forEach((s, i) => {
      const meters = dists[i + 1]; // index 0 = user, +1 for each spot
      if (meters != null) result[s.id] = meters / 1000;
    });
    return result;
  } catch { return {}; }
}

// Shortest distance in meters from point p {lat,lng} to a polyline (array of
// {lat,lng}). Equirectangular projection around the polyline's midpoint is
// fine at city scale, not geodesically exact.
export function distanceToPolylineMeters(p, polyline) {
  if (!p || !polyline?.length) return Infinity;
  const R = 6371000;
  const lat0 = (polyline[Math.floor(polyline.length / 2)].lat * Math.PI) / 180;
  const toXY = (pt) => ({
    x: ((pt.lng * Math.PI) / 180) * Math.cos(lat0) * R,
    y: ((pt.lat * Math.PI) / 180) * R,
  });
  const P = toXY(p);
  let best = Infinity;
  for (let i = 0; i < polyline.length - 1; i++) {
    const A = toXY(polyline[i]);
    const B = toXY(polyline[i + 1]);
    const dx = B.x - A.x, dy = B.y - A.y;
    const lenSq = dx * dx + dy * dy || 1e-9;
    let t = ((P.x - A.x) * dx + (P.y - A.y) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const cx = A.x + t * dx, cy = A.y + t * dy;
    const d = Math.hypot(P.x - cx, P.y - cy);
    if (d < best) best = d;
  }
  return best;
}

// Index of the polyline vertex nearest to p. Used to order matched spots in
// the order you'd actually pass them along the route.
export function nearestPolylineIndex(p, polyline) {
  if (!p || !polyline?.length) return -1;
  let best = -1, bestD = Infinity;
  for (let i = 0; i < polyline.length; i++) {
    const d = haversineKm(p, polyline[i]);
    if (d != null && d < bestD) { bestD = d; best = i; }
  }
  return best;
}

// Centroid per discovered area, averaged from live spot lat/lngs. No
// geocoding API, no static build artifact, always in sync with the data.
export function buildAreaCentroids(eateries) {
  const groups = {};
  for (const e of eateries || []) {
    const a = displayArea(e);
    if (!a) continue;
    (groups[a] ??= []).push(e);
  }
  return Object.entries(groups).map(([area, list]) => ({
    area,
    lat: list.reduce((s, e) => s + e.lat, 0) / list.length,
    lng: list.reduce((s, e) => s + e.lng, 0) / list.length,
    count: list.length,
  }));
}

// Friendly label for a dropped map pin. Raw coordinates ("17.3813, 78.4121")
// mean nothing to a person; naming the nearest known area is instant, free,
// and needs no network round trip (unlike reverse geocoding).
export function nearestAreaLabel(point, areaCentroids) {
  let best = null, bestKm = Infinity;
  for (const a of areaCentroids || []) {
    const d = haversineKm(point, a);
    if (d != null && d < bestKm) { bestKm = d; best = a; }
  }
  if (!best) return "Dropped pin";
  return bestKm < 1 ? `Near ${best.area}` : `Near ${best.area} (${bestKm.toFixed(1)} km)`;
}

// Tags that only make sense for certain categories. Keeps review-mined tags from
// firing on biryani/dhaba spots whose reviews happen to use coffee-adjacent words.
const TAG_CATEGORY_GUARD = {
  specialty: ["cafe"],
};

export function validTagsFor(category, tags) {
  if (!tags) return [];
  return tags.filter((t) => {
    const allowed = TAG_CATEGORY_GUARD[t];
    return !allowed || allowed.includes(category);
  });
}

// Vibe tags, keys written by scripts/enrich-details.mjs
// Labels only, the matching glyph for each key lives in lib/iconPaths.js
// (TAG_ICON / TIER_ICON) and is drawn as SVG, never as emoji.
export const TAGS = {
  "work-friendly": { label: "Work-friendly" },
  quiet:           { label: "Quiet" },
  view:            { label: "Great view" },
  outdoor:         { label: "Outdoor" },
  date:            { label: "Date spot" },
  specialty:       { label: "Specialty coffee" },
  "live-music":    { label: "Live music" },
  breakfast:       { label: "Breakfast" },
  "pet-friendly":  { label: "Pet-friendly" },
  desserts:        { label: "Desserts" },
  "veg-friendly":  { label: "Veg-friendly" },
  "pure-veg":      { label: "Pure veg" },
  reservable:      { label: "Takes bookings" },

  // Dish/cuisine tags, name-keyword matched by scripts/tag-dishes.mjs.
  biryani:  { label: "Biryani" },
  tiffin:   { label: "Tiffin" },
  dosa:     { label: "Dosa" },
  mandi:    { label: "Mandi" },
  shawarma: { label: "Shawarma" },
  arabian:  { label: "Arabian" },
  irani:    { label: "Irani chai" },
  chai:     { label: "Chai" },
  juice:    { label: "Juice" },
  mithai:   { label: "Mithai" },
  thai:     { label: "Thai" },
  waffle:   { label: "Waffles" },
  lassi:    { label: "Lassi" },
  kebab:    { label: "Kebab" },
  chinese:  { label: "Chinese" },
  haleem:   { label: "Haleem" },
  tandoor:  { label: "Tandoor" },
  dhaba:    { label: "Dhaba" },
  momo:     { label: "Momos" },
  andhra:   { label: "Andhra" },
  chaat:    { label: "Chaat" },
  kulfi:    { label: "Kulfi" },
  grill:    { label: "Grill" },
};

export const TIERS = {
  landmark:     { label: "Landmark", hint: "1000+ reviews", points: 10, eg: "Paradise, Cafe Bahar" },
  established:  { label: "Established", hint: "200+ reviews", points: 15, eg: "Subhan Bakery, Bismillah" },
  "hidden-gem": { label: "Hidden gem", hint: "under 200 reviews", points: 25, eg: "Scoops, 7 Oceans" },
};

export function tierFor(ratingCount = 0) {
  if (ratingCount >= 1000) return "landmark";
  if (ratingCount >= 200) return "established";
  return "hidden-gem";
}

// Parse Google's weekday_text ("Monday: 8:00 AM – 11:00 PM") for today and
// decide open/closed client-side, so stored hours never go stale.
export function isOpenNow(hours) {
  if (!Array.isArray(hours) || !hours.length) return null;
  const now = new Date();
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata", weekday: "long", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(now).filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  const today = parts.weekday;
  const line = hours.find((h) => h.startsWith(today));
  if (!line) return null;

  const body = line.slice(today.length + 1).trim();
  if (/open 24 hours/i.test(body)) return true;
  if (/closed/i.test(body)) return false;

  const toMins = (s) => {
    const m = s.match(/(\d{1,2})(?::(\d{2}))?\s*([AP])M/i);
    if (!m) return null;
    let h = Number(m[1]) % 12;
    if (m[3].toUpperCase() === "P") h += 12;
    return h * 60 + Number(m[2] ?? 0);
  };

  const cur = Number(parts.hour) * 60 + Number(parts.minute);
  // A day can list several ranges ("8AM–2PM, 6PM–11PM").
  for (const range of body.split(",")) {
    const [openRaw, closeRaw] = range.split(/[–-]/);
    if (!openRaw || !closeRaw) continue;
    const open = toMins(openRaw);
    const close = toMins(closeRaw);
    if (open == null || close == null) continue;
    // Past-midnight close (e.g. 6PM–1AM) wraps to the next day.
    if (close < open ? cur >= open || cur < close : cur >= open && cur < close) return true;
  }
  return false;
}

// Hyderabad bounding box check
export const IN_HYD = (lat, lng) =>
  lat > 17.0 && lat < 17.75 && lng > 78.0 && lng < 78.85;


export function isNewSpot(createdAt) {
  if (!createdAt) return false;
  const ts = new Date(createdAt).getTime();
  if (Number.isNaN(ts)) return false;
  return Date.now() - ts < NEW_PLACE_DAYS * 86400000;
}
