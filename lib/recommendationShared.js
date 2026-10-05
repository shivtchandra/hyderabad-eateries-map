// Pure, shared rules: the browser, server pages, and tests use the same model.
export const recommendationsEnabled = () => process.env.NEXT_PUBLIC_CURATED_RECOMMENDATIONS === "1";
export const BRAND_NOTICE = "Recommendations concern the brand; this branch was not specified.";
export const DISHES = [
  ["biryani", "Biryani", ["biryani", "biriyani"]],
  ["haleem", "Haleem", ["haleem"]],
  ["mandi", "Mandi", ["mandi"]],
  ["shawarma", "Shawarma", ["shawarma", "shwarma"]],
  ["dosa", "Dosa", ["dosa", "dosas"]],
  ["tiffins", "Tiffins", ["tiffin", "tiffins", "idli", "idlis", "dosa", "dosas", "pungaralu"]],
  ["irani-chai", "Irani chai", ["irani chai", "irani tea"]],
  ["osmania-biscuits", "Osmania biscuits", ["osmania biscuit", "osmania biscuits"]],
  ["pizza", "Pizza", ["pizza", "pizzas"]],
  ["ice-cream", "Ice cream", ["ice cream", "gelato"]],
  ["coffee", "Coffee", ["coffee", "kaapi"]],
  ["sushi", "Sushi", ["sushi"]],
].map(([id, name, aliases]) => ({ id, name, aliases }));
export const normalize = (s) => String(s || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
export function matchesDish(text, dish) {
  const haystack = ` ${normalize(text)} `;
  return dish.aliases.some((a) => haystack.includes(` ${a} `));
}
// Map filter: reviewed/editorial dish tags, or dishes locals named for this place
// (r/hyderabad mentions and site adds). SEO pages stay on the stricter reviewed tags.
export function servesDish(place, dishId) {
  if (place.dishes?.some((d) => d.id === dishId) || place.rankings?.some((r) => r.dishId === dishId)) return true;
  const dish = DISHES.find((d) => d.id === dishId);
  const named = [place.signature?.name, ...(place.localDishes || []).map((d) => d.name), ...(place.communityDishes || []).map((d) => d.name)].filter(Boolean);
  return !!dish && named.some((n) => matchesDish(n, dish));
}
export function validCoordinates(p) {
  return Number.isFinite(p.lat) && Number.isFinite(p.lng) && p.lat >= 17 && p.lat <= 18 && p.lng >= 78 && p.lng <= 79;
}
export function inBounds(p, b) {
  return !b || (p.lat >= b.south && p.lat <= b.north && p.lng >= b.west && p.lng <= b.east);
}
export function filterRecommendations(places, state) {
  const q = normalize(state.q);
  return places.filter((p) => (state.mode === "all" || p.recommended)
    && (!state.dish || servesDish(p, state.dish))
    && (!state.area || p.area === state.area)
    && inBounds(p, state.bounds)
    && (!q || normalize([p.name, p.area, p.signature?.name, ...(p.localDishes || []).map((d) => d.name), ...(p.communityDishes || []).map((d) => d.name),
      ...p.dishes.flatMap((d) => [d.name, ...(DISHES.find((x) => x.id === d.id)?.aliases || [])])].join(" ")).includes(q)));
}
export function groupRecommendations(places) {
  const groups = new Map();
  for (const p of places) {
    if (!groups.has(p.brandId)) groups.set(p.brandId, { id: p.brandId, branches: [] });
    groups.get(p.brandId).branches.push(p);
  }
  return [...groups.values()];
}
export function publishableDishes(places) {
  return DISHES.map((d) => ({ ...d, brands: new Set(places.filter((p) => p.recommended && p.dishes.some((x) => x.id === d.id)).map((p) => p.brandId)).size }))
    .filter((d) => d.brands >= 3);
}
export function parseMapState(search, initialDish = "") {
  const p = new URLSearchParams(search);
  const numbers = (s, n) => { const a = (s || "").split(",").map(Number); return a.length === n && a.every(Number.isFinite) ? a : null; };
  const b = numbers(p.get("bounds"), 4);
  const v = numbers(p.get("view"), 3);
  return { mode: p.get("mode") === "all" ? "all" : "recommended", q: (p.get("q") || "").slice(0, 160),
    dish: DISHES.some((d) => d.id === (p.get("dish") || initialDish)) ? (p.get("dish") || initialDish) : "",
    area: (p.get("area") || "").slice(0, 100), spot: p.get("spot") || "", list: p.get("list") === "1",
    bounds: b && b[0] <= b[1] && b[2] <= b[3] ? { south: b[0], north: b[1], west: b[2], east: b[3] } : null,
    view: v && validCoordinates({ lat: v[0], lng: v[1] }) && v[2] >= 10.5 && v[2] <= 18 ? v : null };
}
export function mapSearch(state) {
  const p = new URLSearchParams();
  for (const k of ["q", "dish", "area", "spot"]) if (state[k]) p.set(k, state[k]);
  if (state.mode === "all") p.set("mode", "all");
  if (state.list) p.set("list", "1");
  if (state.view) p.set("view", state.view.map((v) => Number(v.toFixed(5))).join(","));
  if (state.bounds) p.set("bounds", [state.bounds.south, state.bounds.north, state.bounds.west, state.bounds.east].map((v) => Number(v.toFixed(5))).join(","));
  return p.toString();
}

// What to try at a place, best first: the editorial signature, then dishes people back
// (site adds + r/hyderabad mentions, merged by name), then editorial dish tags.
export function mustTry(place, limit = 4) {
  const out = new Map();
  const words = (k) => k.split(" ");
  const within = (a, b) => words(a).every((w) => words(b).includes(w)); // "biryani" within "mutton biryani"
  const put = (name, extra = {}) => {
    let k = normalize(name);
    if (!k) return;
    // A generic dish folds into a more specific one already listed, and vice versa.
    const near = [...out.keys()].find((x) => x !== k && (within(k, x) || within(x, k)));
    if (near && !out.has(k)) {
      const cur = out.get(near);
      if (within(near, k)) { out.delete(near); out.set(k, { ...cur, name }); } else k = near;
    }
    const cur = out.get(k);
    if (!cur) { out.set(k, { name, count: 0, ...extra, count: extra.count || 0 }); return; }
    cur.count += extra.count || 0;
    if (extra.star) cur.star = true;
    if (extra.id && !cur.id) cur.id = extra.id;
  };
  if (place.signature?.name) put(place.signature.name, { star: true });
  for (const d of place.communityDishes || []) put(d.name, { count: d.count, community: true });
  for (const r of place.rankings || []) if (r.dishName) put(r.dishName, { count: r.votes, id: r.dishId });
  for (const d of place.localDishes || []) put(d.name, { count: d.people });
  for (const d of place.dishes || []) put(d.name, { id: d.id });
  return [...out.values()].sort((a, b) => Number(!!b.star) - Number(!!a.star) || b.count - a.count).slice(0, limit);
}

// How many people name this dish at this place: r/hyderabad (largest matching label, so
// "Biryani" and "Mutton biryani" don't double count), plus site adds and ranking votes.
export function dishMentions(place, dish) {
  let reddit = 0, site = 0;
  for (const d of place.localDishes || []) if (matchesDish(d.name, dish)) reddit = Math.max(reddit, d.people || 0);
  for (const d of place.communityDishes || []) if (matchesDish(d.name, dish)) site += d.count || 0;
  for (const r of place.rankings || []) if (r.dishId === dish.id) site += r.votes || 0;
  return reddit + site;
}
// A dish page needs 5+ recommended brands serving it and 20+ people naming it overall.
export const DISH_PAGE_MIN_BRANDS = 5;
export const DISH_PAGE_MIN_MENTIONS = 20;
export function dishBrandStats(places, dish) {
  const best = new Map();
  for (const p of places) {
    if (!p.recommended || !servesDish(p, dish.id)) continue;
    best.set(p.brandId, Math.max(best.get(p.brandId) || 0, dishMentions(p, dish)));
  }
  return { brands: best.size, mentions: [...best.values()].reduce((s, n) => s + n, 0) };
}
export function dishPageEligible(places, dish) {
  const s = dishBrandStats(places, dish);
  return s.brands >= DISH_PAGE_MIN_BRANDS && s.mentions >= DISH_PAGE_MIN_MENTIONS;
}
