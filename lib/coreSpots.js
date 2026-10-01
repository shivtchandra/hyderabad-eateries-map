// The "core" list: places people actually go, out of every approved listing.
// Used by scripts/build-static.mjs (map index flag `k`) and lib/siteData.js (server pages,
// sitemap, noindex). Nothing is deleted: non-core spots are hidden by default on the map,
// still found by name search / "Show all spots", and their pages are noindexed.
//
// A spot is core when any of these hold:
//   - it has editorial content (venue-content.json),
//   - it is a branch of a known chain (3+ listings) with 50+ Google reviews (all branches kept),
//   - established: 500+ reviews and 3.8+ rating,
//   - small but loved: 150+ reviews and 4.5+ rating.
// Banquet halls, catering, marts, hostels and similar non-eatery listings are never core
// unless they carry editorial content.

const NOISE = /banquet|convention|function hall|catering|supermarket|\bmart\b|kiosk|cloud kitchen|tiffin service|\bpg\b|hostel/i;
export const CORE_RULES = { chainMin: 2, chainReviews: 30, established: { reviews: 150, rating: 3.6 }, gem: { reviews: 30, rating: 4.0 } };

export const brandOf = (name) => String(name || "").toLowerCase().split(/\s*[-|,(]\s*/)[0].trim();

// eateries: [{ id, name, rating, ratingCount }] (full records or index rows mapped to these keys)
export function coreIdSet(eateries, { editorialIds = new Set() } = {}) {
  const counts = new Map();
  for (const e of eateries) {
    const b = brandOf(e.name);
    if (b.length > 3) counts.set(b, (counts.get(b) || 0) + 1);
  }
  const out = new Set();
  for (const e of eateries) {
    if (editorialIds.has(e.id)) { out.add(e.id); continue; }
    if (NOISE.test(e.name || "")) continue;
    const rc = Number(e.ratingCount) || 0, r = Number(e.rating) || 0;
    const isChain = (counts.get(brandOf(e.name)) || 0) >= CORE_RULES.chainMin;
    if ((isChain && rc >= CORE_RULES.chainReviews)
      || (rc >= CORE_RULES.established.reviews && r >= CORE_RULES.established.rating)
      || (rc >= CORE_RULES.gem.reviews && r >= CORE_RULES.gem.rating)) out.add(e.id);
  }
  return out;
}
