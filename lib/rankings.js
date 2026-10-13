// SEO slug helpers and theme quick-picks aligned to Google Trends search queries.
import { seasonYear } from "./voteDecay.js";

export function slugFromTitle(title) {
  return (title || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const SEO_THEME_PICKS = [
  { title: "Best Biryani in Hyderabad", description: "Vote for the top dum biryani spot this week" },
  { title: "Best Chicken Biryani in Hyderabad", description: "Which chicken biryani wins Hyderabad this week?" },
  { title: "Best Restaurants in Hyderabad", description: "Community vote for the best restaurant in town" },
  { title: "Best Veg Biryani in Hyderabad", description: "Vote for the best vegetarian biryani" },
  { title: "Best Cafe in Hyderabad", description: "Vote for your favourite cafe this week" },
  { title: "Best New Cafe in Hyderabad", description: "Which newly opened cafe deserves the crown?" },
  { title: "Best Haleem in Hyderabad", description: "Ramadan special, vote for the best haleem" },
  { title: "Best Late Night Cafe in Hyderabad", description: "Open late and worth the drive, you decide" },
  { title: "Best Bakery in Hyderabad", description: "Vote for the best bakery and patisserie" },
  { title: "Best Ice Cream in Hyderabad", description: "Vote for the best ice cream and dessert spot" },
  { title: "Best Restro Bar in Hyderabad", description: "Vote for the best bar and brewery" },
  { title: "Best Dosa in Hyderabad", description: "Vote for the crispiest dosa in town" },
  { title: "Best Dinner Restaurants in Hyderabad", category: "restaurant", description: "Top dinner spots in Hyderabad, voted by locals on the map." },
  { title: "Best Brewery in Hyderabad", category: "restro-bar", description: "Best microbreweries and craft beer bars in Hyderabad." },
  { title: "Best Breweries in Hyderabad", category: "restro-bar", description: "Top microbreweries, craft beer flights and brewpubs in Hyderabad." },
  { title: "Best Late Night Restaurants in Hyderabad", category: "restaurant", description: "Best places to eat late night in Hyderabad, open past midnight." },
  { title: "New Restaurants in Hyderabad", category: "restaurant", description: "Newly opened restaurants and cafes in Hyderabad, community-voted best new spots." },
  { title: "Best Rooftop Restaurants in Hyderabad", category: "restaurant", description: "Best rooftop dining in Hyderabad, views, ambience, and food voted by locals." },
  { title: "Best Work-Friendly Cafes in Hyderabad", category: "cafe", description: "Cafes in Hyderabad with good wifi, power points, and quiet seating for working." },
  { title: "Best Irani Cafe in Hyderabad", category: "cafe", description: "Hyderabad's iconic Irani cafes, vote for the best Osmania biscuit and Irani chai." },
  { title: "Best Breakfast Places in Hyderabad", category: "restaurant", description: "Best breakfast spots in Hyderabad, voted by locals who actually wake up early." },
  { title: "Best Shawarma in Hyderabad", category: "restaurant", description: "Vote for the best shawarma in Hyderabad, the city's most underrated street obsession." },
  { title: "Best Mandi in Hyderabad", category: "local", description: "Vote for the best mandi in Hyderabad, Yemeni-style rice and slow meat." },
  { title: "Best Street Food in Hyderabad", category: "local", description: "Vote for Hyderabad street food locals actually queue for." },
  { title: "Best Buffet in Hyderabad", category: "restaurant", description: "Best buffet and barbeque spreads in Hyderabad, voted by locals." },
  { title: "Best Fine Dining in Hyderabad", category: "restaurant", description: "Fine dining restaurants in Hyderabad for special occasions and upscale meals." },
];

// Snap an admin-typed theme to the closest canonical SEO pick, so a messy
// title like "Best Biryani or pulao in Hyderabad" is saved as the exact slug
// we want to rank ("best-biryani-in-hyderabad"). Genuinely new themes with no
// close match pass through untouched. Returns { title, slug, snapped }.
const SNAP_STOP = new Set(["best", "in", "hyderabad", "the", "and", "a", "or", "of", "this", "week", "hyd", "top"]);

function themeTokens(s) {
  return new Set(slugFromTitle(s).split("-").filter((t) => t && !SNAP_STOP.has(t)));
}

export function snapToSeoTheme(rawTitle) {
  const typedSlug = slugFromTitle(rawTitle);
  const exact = SEO_THEME_PICKS.find((p) => slugFromTitle(p.title) === typedSlug);
  if (exact) return { title: exact.title, slug: slugFromTitle(exact.title), snapped: true };

  const typed = themeTokens(rawTitle);
  if (typed.size === 0) return { title: rawTitle, slug: typedSlug, snapped: false };

  let best = null;
  let bestScore = 0;
  for (const p of SEO_THEME_PICKS) {
    const cand = themeTokens(p.title);
    let inter = 0;
    for (const t of cand) if (typed.has(t)) inter += 1;
    const union = new Set([...typed, ...cand]).size;
    const score = union ? inter / union : 0;
    if (score > bestScore) { bestScore = score; best = p; }
  }
  if (best && bestScore >= 0.5) {
    return { title: best.title, slug: slugFromTitle(best.title), snapped: true };
  }
  return { title: rawTitle, slug: typedSlug, snapped: false };
}

// A description copied from a different SEO pick (admin clicked a preset, then
// retyped the title) is stale copy for another dish. Swap in the matching
// pick's description, or drop it.
export function themeDescription(theme) {
  const desc = (theme?.description || "").trim();
  const slug = theme?.slug || slugFromTitle(theme?.title || "");
  const own = SEO_THEME_PICKS.find((p) => slugFromTitle(p.title) === slug);
  if (!desc) return own?.description || "";
  const borrowed = SEO_THEME_PICKS.some(
    (p) => p.description === desc && slugFromTitle(p.title) !== slug
  );
  if (borrowed) return own?.description || "";
  return desc;
}

// Two theme docs can share a slug (same dish featured twice in a season). Keep
// one per slug per season year, preferring the one with more votes, then the
// newer one. Reruns in a later year are separate contests and both stay.
export function dedupeThemesBySlug(themes = []) {
  const votes = (t) => (t.results || []).reduce((s, r) => s + (r.count || 0), 0);
  const bySlug = new Map();
  for (const t of themes) {
    const key = `${t.slug || slugFromTitle(t.title || "")}:${seasonYear(t) || ""}`;
    const prev = bySlug.get(key);
    if (!prev || votes(t) > votes(prev)) bySlug.set(key, t);
  }
  const keep = new Set(bySlug.values());
  return themes.filter((t) => keep.has(t));
}

export function rankingMeta(theme, editorial = []) {
  const year = new Date().getFullYear();
  const rawTitle = theme.title || "Best Spots";
  const base = /best|top/i.test(rawTitle) ? rawTitle : `Best ${rawTitle} in Hyderabad`;
  // The layout template appends " | Mapping HYD Eats" (18 chars); keep the whole title near 60.
  const title = [`${base} ${year}: Local Votes`, `${base} ${year}`, base].find((t) => t.length <= 44) || base;
  const totalVotes = (theme.results || []).reduce((s, r) => s + (r.count || 0), 0);
  const leader = theme.results?.[0];
  const leaderLine = leader?.name ? `Current #1: ${leader.name}. ` : "";
  const topNames = [
    ...(theme.results || []).map((r) => r.name),
    ...(editorial || []).map((r) => r.name),
  ].filter(Boolean).slice(0, 3);
  const namesHook = topNames.length ? `Top picks include ${topNames.join(", ")}. ` : "";
  const description = totalVotes > 0
    ? `${leaderLine}${totalVotes.toLocaleString("en-IN")} local votes so far for ${rawTitle.toLowerCase()} (${year}). ${namesHook}See the full Hyderabad ranking, must-orders, and cast your vote.`
    : `The top spots for ${rawTitle.toLowerCase()} (${year}), ranked by Hyderabad locals and verified reviews. ${namesHook}Compare ratings, prices, and cast your vote.`;
  return { title, description };
}

export function itemListJsonLd(theme, siteUrl, spotUrlFn) {
  const items = (theme.results || []).slice(0, 10).map((r, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: r.name,
    url: spotUrlFn
      ? `${siteUrl}${spotUrlFn(r.spotId)}`
      : `${siteUrl}/spot/${encodeURIComponent(r.spotId)}`,
  }));
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: theme.title,
    description: themeDescription(theme) || `Community-voted ranking: ${theme.title}`,
    numberOfItems: items.length,
    itemListElement: items,
  };
}

// "Best Biryani in Hyderabad" -> "biryani": the word a vote is about, for the
// question headline ("Hyderabad's best biryani?") on the Vote tab and pages.
export function dishOfTitle(title = "") {
  const m = title.match(/^best (.+?) in hyderabad$/i);
  return m ? m[1].toLowerCase() : null;
}

// The debate line from the reels, from real counts only. "N votes flip the
// crown" is how many more the runner-up needs to pass #1.
export function debateLineFromCounts(raw = []) {
  const counts = [...raw].sort((x, y) => y - x);
  const total = counts.reduce((a, n) => a + n, 0);
  if (!total) return "No votes yet. Yours starts it.";
  const so = `${total} ${total === 1 ? "vote" : "votes"} so far.`;
  if (counts.length < 2 || !counts[1]) return `${so} One vote gives #1 a rival.`;
  if (counts[0] === counts[1]) return `${so} One more breaks the tie.`;
  const flip = counts[0] - counts[1] + 1;
  return `${so} ${flip} ${flip === 1 ? "vote flips" : "votes flip"} the crown.`;
}
