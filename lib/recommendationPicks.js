import { getApprovedAddedPlaces } from "./addedPlaces.js";
import { getAllRankingsThemes } from "./themesServer.js";
import { DISHES, matchesDish } from "./recommendationShared.js";
import { recommendationFor, getRecommendations } from "./recommendations.js";
import { spotPath } from "./siteData.js";

// Places visitors suggested for Recommended and an admin approved as a Pick
// ("Approve as Pick"). They live in Firestore, so they join the file-based model at
// request time, using the added-places memo (5 min, in memory).
export function pickFromAddedPlace(p) {
  const tries = Object.values(p.pickNomination?.dishes || {}).slice(0, 3);
  return {
    id: p.id, name: p.name, path: spotPath(p), brandId: p.id, lat: p.lat, lng: p.lng,
    area: p.area || "Hyderabad", address: p.address || "", category: p.category, tier: "local",
    rating: p.rating ?? null, ratingCount: p.ratingCount ?? null, discoveredIn: p.area,
    recommended: true, seoEligible: false, research: null, editorial: false, editorialOrder: -1,
    reviewStatus: "community", redditBrandId: null, score: 0, dishes: [], signature: null,
    locals: 0, localDishes: [], communityDishes: tries.map((name) => ({ name, count: 0 })),
    nominations: p.pickNomination?.count || 0,
  };
}

export async function communityPicks() {
  const known = new Set(getRecommendations().places.map((p) => p.id));
  return (await getApprovedAddedPlaces()).filter((p) => p.pick && !known.has(p.id)).map(pickFromAddedPlace);
}

// Every place in the published weekly standings counts as Recommended and carries
// its ranking ("#1 Best Dosa in Hyderabad"). Zero-vote ballot options are not ranked.
// Themes come from getAllRankingsThemes (60 s in-memory memo).
export function rankingsBySpot(themes) {
  const out = new Map();
  for (const t of themes || []) {
    const dish = DISHES.find((d) => matchesDish(t.title || "", d));
    const voted = (t.results || []).filter((r) => r.spotId && ((r.count || 0) > 0 || t.winnerId === r.spotId));
    const winner = voted.find((r) => t.winnerId && t.winnerId === r.spotId);
    const standings = winner ? [winner, ...voted.filter((r) => r !== winner)] : voted;
    standings.forEach((r, i) => {
      const isWinner = t.winnerId && t.winnerId === r.spotId;
      const list = out.get(r.spotId) || [];
      list.push({ title: t.title, slug: t.slug, rank: i + 1, votes: r.count || 0, winner: !!isWinner, live: !!t.active && !t.winnerId, dishId: dish?.id || null, dishName: dish?.name || null });
      out.set(r.spotId, list);
    });
  }
  for (const list of out.values()) list.sort((a, b) => a.rank - b.rank || b.votes - a.votes);
  return out;
}
export async function rankedPlaces() {
  try { return rankingsBySpot(await getAllRankingsThemes(50)); } catch { return new Map(); }
}
export function withRankings(place, rankings) {
  if (!rankings?.length) return place;
  return { ...place, recommended: true, rankings, reviewStatus: place.recommended ? place.reviewStatus : "ranked" };
}

// Visitor-added places (approved, not already a Pick) that appear in our rankings.
export async function rankedAddedPlaces(ranked, skip = new Set()) {
  const ids = [...ranked.keys()].filter((id) => id.startsWith("user-") && !skip.has(id));
  if (!ids.length) return [];
  const added = await getApprovedAddedPlaces();
  return added.filter((p) => ids.includes(p.id) && !p.pick).map((p) => ({ ...pickFromAddedPlace(p), communityDishes: [], nominations: 0 }));
}

// recommendationFor, plus ranked places and approved community picks.
export async function findRecommendation(id) {
  const hit = recommendationFor(id);
  const ranked = await rankedPlaces();
  if (hit) return withRankings(hit, ranked.get(id));
  if (typeof id !== "string" || !id.startsWith("user-")) return null;
  const pick = (await communityPicks()).find((p) => p.id === id) || (await rankedAddedPlaces(ranked)).find((p) => p.id === id);
  return pick ? withRankings(pick, ranked.get(id)) : null;
}
