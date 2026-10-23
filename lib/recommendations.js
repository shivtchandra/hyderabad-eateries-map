import fs from "node:fs";
import path from "node:path";
import { getEateries, getEditorialSpotIds, spotPath, chainKey } from "./siteData.js";
import { DISHES, matchesDish, validCoordinates, servesDish, dishMentions, dishBrandStats, dishPageEligible, groupRecommendations, publishableDishes } from "./recommendationShared.js";
import { resolveAreaPage } from "./siteData.js";

function read(name, fallback) {
  try { return JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", name), "utf8")); } catch { return fallback; }
}
export function buildRecommendations(eateries, editorialIds, reviews, candidates, shortlist = { brands: [] }) {
  const shortlistByPlace = new Map((shortlist.brands || []).filter((b) => b.status === "shortlisted").flatMap((b) => b.branchIds.map((id) => [id, b])));
  const editorial = new Set(editorialIds);
  const brands = {};
  const reviewed = new Map();
  for (const review of reviews.brands || []) {
    const candidate = Object.values(candidates.spots || {}).find((p) => p.brand === review.id);
    if (review.status !== "approved" || !candidate || candidate.locals < 3 || candidate.locals < 2 * candidate.negatives) continue;
    const dishes = (review.dishes || []).filter((d) => DISHES.some((x) => x.id === d.id) && d.accounts >= 3 && d.evidence?.length >= 3
      && d.evidence.every((e) => /^https:\/\/www\.reddit\.com\/r\/hyderabad\/comments\//.test(e.url) && /^\d{4}-\d{2}-\d{2}$/.test(e.date)));
    if (!dishes.length) continue;
    brands[review.id] = { id: review.id, scope: "brand", dishes, reviewedAt: reviews.reviewedAt, score: candidate.score, status: "approved" };
    for (const branch of review.branches || []) if (branch.status === "approved" && branch.statusSource && branch.checkedAt) reviewed.set(branch.id, review.id);
  }
  const places = eateries.filter(validCoordinates).map((e) => {
    const isEditorial = editorial.has(e.id);
    const research = shortlistByPlace.get(e.id) || null;
    const brandId = reviewed.get(e.id) || (candidates.spots?.[e.id]?.brand) || research?.id || chainKey(e.name) || e.id;
    const brand = reviewed.has(e.id) ? brands[brandId] : null;
    const names = [e.signatureDish?.name, ...(e.mustOrder || []).map((d) => d.name)].filter(Boolean).join("; ");
    const dishes = isEditorial ? DISHES.filter((d) => matchesDish(names, d)).map((d) => ({ id: d.id, name: d.name, source: "editorial", scope: "branch", evidence: [{ url: spotPath(e), date: null }] })) : [];
    for (const d of brand?.dishes || []) if (!dishes.some((x) => x.id === d.id)) dishes.push({ id: d.id, name: DISHES.find((x) => x.id === d.id).name, source: "reddit", scope: "brand", accounts: d.accounts });
    return { id: e.id, name: e.name, path: spotPath(e), brandId, lat: e.lat, lng: e.lng,
      area: e.discoveredIn && !e.discoveredIn.startsWith("text:") ? e.discoveredIn : "Hyderabad", address: e.address || "",
      category: e.category, tier: e.tier, rating: e.rating, ratingCount: e.ratingCount, discoveredIn: e.discoveredIn,
      recommended: isEditorial || !!brand || !!research, seoEligible: isEditorial || !!brand,
      research: research ? { name: research.name, evidence: research.evidence, note: research.note } : null,
      editorial: isEditorial, editorialOrder: editorialIds.indexOf(e.id),
      reviewStatus: isEditorial || brand ? "approved" : research ? "shortlisted" : "pending", redditBrandId: brand ? brandId : null,
      score: brand?.score || 0, dishes, signature: isEditorial ? e.signatureDish || null : null,
      editorialDishes: isEditorial ? (e.mustOrder || []).map((d) => ({ name: d.name, note: d.note || "" })) : [],
      locals: candidates.spots?.[e.id]?.locals || 0,
      localDishes: (candidates.spots?.[e.id]?.dishes || []).filter((d) => d.people >= 2).slice(0, 3).map((d) => ({ name: d.dish, people: d.people })) };
  }).sort((a, b) => Number(b.editorial) - Number(a.editorial) || (a.editorial && b.editorial ? a.editorialOrder - b.editorialOrder : b.score - a.score) || a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
  // Dish pages: enough recommended brands and enough people naming the dish (dishPageEligible).
  // Dishes that passed the earlier reviewed-evidence gate keep their pages (live URLs).
  const reviewedDishes = new Set(publishableDishes(places).map((d) => d.id));
  const dishes = DISHES.filter((d) => reviewedDishes.has(d.id) || dishPageEligible(places, d)).map((d) => ({ ...d, ...dishBrandStats(places, d) }));
  return { updatedAt: reviews.reviewedAt, brands, places, dishes };
}
let cached;
export function getRecommendations() {
  if (!cached) cached = buildRecommendations(getEateries(), getEditorialSpotIds(), read("recommendation-reviews.json", { brands: [] }), read("reddit-picks.json", {}), read("recommendation-shortlist.json", { brands: [] }));
  return cached;
}
export const recommendationFor = (id) => getRecommendations().places.find((p) => p.id === id);
export const recommendedIds = () => new Set(getRecommendations().places.filter((p) => p.seoEligible).map((p) => p.id));
// Brands serving a dish, best first: one row per brand (its most-reviewed branch), ranked by
// how many people name the dish there. `areaSlug` narrows to one /areas page.
export function dishLeaders(id, areaSlug = null) {
  const model = getRecommendations();
  const dish = DISHES.find((d) => d.id === id);
  if (!dish) return [];
  const places = model.places.filter((p) => p.recommended && servesDish(p, id) && (!areaSlug || resolveAreaPage(p.discoveredIn)?.slug === areaSlug));
  return groupRecommendations(places).map((g) => {
    const branches = [...g.branches].sort((a, b) => (b.ratingCount || 0) - (a.ratingCount || 0));
    return { id: g.id, place: branches[0], branches, mentions: Math.max(...branches.map((b) => dishMentions(b, dish))) };
  }).sort((a, b) => b.mentions - a.mentions || Number(b.place.editorial) - Number(a.place.editorial) || (b.place.ratingCount || 0) - (a.place.ratingCount || 0));
}
export function dishPage(id) {
  const dish = getRecommendations().dishes.find((d) => d.id === id);
  return dish ? { ...dish, leaders: dishLeaders(id) } : null;
}
// Dish x area pages only where the area has 3+ brands for the dish (no thin pages).
export const DISH_AREA_SLUGS = ["gachibowli", "madhapur-hitec", "jubilee-hills", "banjara-hills", "kondapur", "secunderabad"];
export function dishAreaPages() {
  const out = [];
  for (const d of getRecommendations().dishes) for (const area of DISH_AREA_SLUGS) {
    const leaders = dishLeaders(d.id, area);
    if (leaders.length >= 3) out.push({ dish: d.id, area, count: leaders.length });
  }
  return out;
}
