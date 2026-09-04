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
  const names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const today = names[now.getDay()];
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

  const cur = now.getHours() * 60 + now.getMinutes();
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


const NEW_DAYS = 30;

export function isNewSpot(createdAt) {
  if (!createdAt) return false;
  const ts = new Date(createdAt).getTime();
  if (Number.isNaN(ts)) return false;
  return Date.now() - ts < NEW_DAYS * 86400000;
}
