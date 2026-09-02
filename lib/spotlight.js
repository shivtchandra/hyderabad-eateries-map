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

// Pick the best spots across the whole city, spread out so they do not stack.
// The selection is independent of the viewport, so panning never changes which
// restaurant wins. Ranking every spot directly also makes zoom monotonic: as the
// separation radius shrinks, existing heroes stay and only new ones are added.
// The result is cached by separation size and filter; bounds only slice it later.
let cache = { key: null, chosen: null };

function chooseHeroes(eateries, cellLat, cellLng, key) {
  if (cache.key === key) return cache.chosen;

  // A restaurant is visible when it is within 10% of the strongest place in
  // its current separation radius. This local-dominance rule is monotonic: when
  // zooming in shrinks the radius, an existing hero cannot be displaced by a
  // newly revealed restaurant. Comparable nearby places naturally rise together.
  const scored = eateries.map((eatery) => ({ eatery, score: scoreOf(eatery) }));
  const buckets = new Map();
  for (const candidate of scored) {
    const row = Math.floor(candidate.eatery.lat / cellLat);
    const col = Math.floor(candidate.eatery.lng / cellLng);
    const bucketKey = `${row}:${col}`;
    if (!buckets.has(bucketKey)) buckets.set(bucketKey, []);
    buckets.get(bucketKey).push(candidate);
  }

  const chosen = scored
    .filter(({ eatery, score }) => {
      if (score <= 0) return false;

      const row = Math.floor(eatery.lat / cellLat);
      const col = Math.floor(eatery.lng / cellLng);
      let strongestNearbyScore = score;

      // A radius can only reach the current bucket and its eight neighbours.
      // Buckets make the lookup fast; the exact distance below makes their
      // moving boundaries irrelevant to the result.
      for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
        for (let colOffset = -1; colOffset <= 1; colOffset += 1) {
          const nearby = buckets.get(`${row + rowOffset}:${col + colOffset}`) ?? [];
          for (const candidate of nearby) {
            if (candidate.score <= strongestNearbyScore) continue;
            const dLat = (candidate.eatery.lat - eatery.lat) / cellLat;
            const dLng = (candidate.eatery.lng - eatery.lng) / cellLng;
            if (dLat * dLat + dLng * dLng < 1) {
              strongestNearbyScore = candidate.score;
            }
          }
        }
      }

      return score >= strongestNearbyScore * 0.9;
    })
    .map(({ eatery }) => eatery)
    .sort((a, b) => scoreOf(b) - scoreOf(a));
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
