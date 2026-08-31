// Ranking and aggregation for spatial browsing.
//
// A map has no top-to-bottom, so quality can't be expressed by position — it
// has to be expressed visually. Rendering all ~1600 spots identically means the
// good ones are invisible. So: rank, then show only the best few as full photo
// pins and demote the rest to dots. (Airbnb found the same thing — capping the
// map to the top-ranked listings raised bookings and cut time-to-decide.)

// Rating alone is noisy: a 5.0 from 16 people is weaker evidence than a 4.5
// from 3000. Weighting by log(review count) balances the two.
export function scoreOf(e) {
  const r = e.rating ?? 0;
  const n = e.ratingCount ?? 0;
  const tierBoost = e.tier === "landmark" ? 1.08 : e.tier === "established" ? 1.03 : 1;
  return r * Math.log10(n + 10) * tierBoost;
}

// Zoom at which we stop showing area blobs and start showing individual spots.
export const AREA_ZOOM_MAX = 13.2;

// Pick the best spots inside the viewport, spread out so they don't stack.
// minPx keeps chosen pins visually separated: a cluster of five great cafes on
// one street should contribute one hero pin, not five overlapping ones.
// Heroes are chosen by a world-anchored grid: divide the map into cells and
// promote the best-scoring spot in each.
//
// The earlier approach ranked globally and skipped screen-space collisions,
// which made the result depend on the viewport — panning a few pixels changed
// who collided with whom, so pins popped in and out mid-drag. Because these
// cells are keyed off absolute lat/lng, a spot is the winner of its cell no
// matter where the viewport sits, and the set stays stable while you pan.
// Choosing cell winners is computed over the whole city and cached: it depends
// only on the cell size (i.e. zoom) and the active filter, never on where the
// viewport happens to sit. Panning then just slices the cached set to bounds.
let cache = { key: null, chosen: null };

function chooseHeroes(eateries, cellLat, cellLng, key) {
  if (cache.key === key) return cache.chosen;

  // One winner per cell...
  const best = new Map();
  for (const e of eateries) {
    const k = `${Math.floor(e.lat / cellLat)}:${Math.floor(e.lng / cellLng)}`;
    const cur = best.get(k);
    if (!cur || scoreOf(e) > scoreOf(cur)) best.set(k, e);
  }

  // ...but a cell only guarantees one pin per cell, not distance *between*
  // pins: two winners either side of a boundary can sit almost on top of each
  // other. So enforce a minimum separation as well. Measured in degrees, not
  // pixels, so the outcome stays identical no matter where the map is panned.
  const ranked = [...best.values()].sort((a, b) => scoreOf(b) - scoreOf(a));
  const chosen = [];
  for (const e of ranked) {
    const clash = chosen.some((q) => {
      const dLat = (q.lat - e.lat) / cellLat;
      const dLng = (q.lng - e.lng) / cellLng;
      return dLat * dLat + dLng * dLng < 1;
    });
    if (!clash) chosen.push(e);
  }

  cache = { key, chosen };
  return chosen;
}

export function spotlight(eateries, bounds, { cellLat, cellLng, filterKey = "" } = {}) {
  if (!bounds || !cellLat || !cellLng) return { heroes: [], rest: eateries };

  const key = `${cellLat.toFixed(6)}:${cellLng.toFixed(6)}:${filterKey}:${eateries.length}`;
  const chosen = chooseHeroes(eateries, cellLat, cellLng, key);

  const visible = (e) =>
    e.lat >= bounds.south && e.lat <= bounds.north && e.lng >= bounds.west && e.lng <= bounds.east;

  const heroes = chosen.filter(visible);
  const heroIds = new Set(heroes.map((e) => e.id));

  return { heroes, rest: eateries.filter((e) => visible(e) && !heroIds.has(e.id)) };
}

// Group spots into neighbourhoods for the zoomed-out entry view. Areas come
// from the `discoveredIn` field the seed script writes; text-search rows carry a
// provenance marker instead of a place name, so those are placed by proximity
// to the nearest real area rather than dumped into an "Other" pile.
export function buildAreas(eateries) {
  const named = {};
  for (const e of eateries) {
    const a = e.discoveredIn;
    if (!a || a.startsWith("text:")) continue;
    (named[a] ??= []).push(e);
  }

  const centroids = Object.entries(named).map(([area, list]) => ({
    area,
    lat: list.reduce((s, e) => s + e.lat, 0) / list.length,
    lng: list.reduce((s, e) => s + e.lng, 0) / list.length,
  }));

  const assign = (e) => {
    const a = e.discoveredIn;
    if (a && !a.startsWith("text:")) return a;
    let best = null, bestD = Infinity;
    for (const c of centroids) {
      const d = (c.lat - e.lat) ** 2 + (c.lng - e.lng) ** 2;
      if (d < bestD) { bestD = d; best = c.area; }
    }
    return best ?? "Hyderabad";
  };

  const groups = {};
  for (const e of eateries) (groups[assign(e)] ??= []).push(e);

  return Object.entries(groups)
    .map(([area, list]) => {
      const best = list.reduce((a, b) => (scoreOf(b) > scoreOf(a) ? b : a));
      return {
        area,
        count: list.length,
        best,
        lat: list.reduce((s, e) => s + e.lat, 0) / list.length,
        lng: list.reduce((s, e) => s + e.lng, 0) / list.length,
        spots: list,
      };
    })
    .filter((a) => a.count >= 4)
    .sort((a, b) => b.count - a.count);
}

export function photoUrl(id) {
  return `/photos/${id}.jpg`;
}
