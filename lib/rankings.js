// SEO slug helpers and theme quick-picks aligned to search demand.

export function slugFromTitle(title) {
  return (title || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const SEO_THEME_PICKS = [
  { title: "Best Biryani in Hyderabad", description: "Vote for Hyderabad's top dum biryani and compare all-time with monthly results" },
  { title: "Best Chicken Biryani in Hyderabad", description: "Which chicken biryani leads Hyderabad right now?" },
  { title: "Best Restaurants in Hyderabad", description: "Community vote for the best restaurant in town" },
  { title: "Best Veg Biryani in Hyderabad", description: "Vote for the best vegetarian biryani" },
  { title: "Best Cafe in Hyderabad", description: "Vote for your favourite cafe and compare all-time with monthly results" },
  { title: "Best New Cafe in Hyderabad", description: "Which newly opened cafe deserves the crown?" },
  { title: "Best Haleem in Hyderabad", description: "Ramadan special, vote for the best haleem" },
  { title: "Best Late Night Cafe in Hyderabad", description: "Open late and worth the drive, you decide" },
  { title: "Best Bakery in Hyderabad", description: "Vote for the best bakery and patisserie" },
  { title: "Best Ice Cream in Hyderabad", description: "Vote for the best ice cream and dessert spot" },
  { title: "Best Restro Bar in Hyderabad", description: "Vote for the best bar and brewery" },
  { title: "Best Dosa in Hyderabad", description: "Vote for the crispiest dosa in town" },
  { title: "Best Dinner Restaurants in Hyderabad", category: "restaurant", description: "Top dinner spots in Hyderabad, voted by locals on the map." },
  { title: "Best Brewery in Hyderabad", category: "restro-bar", description: "Best microbreweries and craft beer bars in Hyderabad." },
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

// Legacy data can contain several documents for one topic. Keep a single
// continuous canonical pool: active first, then the one with the most votes.
export function dedupeThemesBySlug(themes = []) {
  const votes = (t) => (t.results || []).reduce((s, r) => s + (r.count || 0), 0);
  const bySlug = new Map();
  for (const t of themes) {
    const key = t.slug || slugFromTitle(t.title || "");
    const prev = bySlug.get(key);
    const shouldReplace = !prev
      || (Boolean(t.active) && !prev.active)
      || (Boolean(t.active) === Boolean(prev.active) && votes(t) > votes(prev))
      || (Boolean(t.active) === Boolean(prev.active) && votes(t) === votes(prev) && (t.createdAt || 0) > (prev.createdAt || 0));
    if (shouldReplace) bySlug.set(key, t);
  }
  const keep = new Set(bySlug.values());
  return themes.filter((t) => keep.has(t));
}

export function rankingMeta(theme, editorial = []) {
  const year = new Date().getFullYear();
  const rawTitle = theme.title || "Best Spots";
  const base = /best|top/i.test(rawTitle) ? rawTitle : `Best ${rawTitle} in Hyderabad`;
  // The layout template appends " | Mapping HYD Eats" (18 chars); keep the whole title near 60.
  const title = slugFromTitle(rawTitle) === "best-biryani-in-hyderabad"
    ? `Hyderabad Biryani Vote ${year}: Live Results`
    : [`${base} ${year}: Local Votes`, `${base} ${year}`, base].find((t) => t.length <= 44) || base;
  const totalVotes = (theme.results || []).reduce((s, r) => s + (r.count || 0), 0);
  const leader = theme.results?.[0];
  const leaderLine = leader?.name ? `Current #1: ${leader.name}. ` : "";
  const topNames = [
    ...(theme.results || []).map((r) => r.name),
    ...(editorial || []).map((r) => r.name),
  ].filter(Boolean).slice(0, 3);
  const namesHook = topNames.length ? `${totalVotes > 0 ? "Top picks" : "Ballot candidates"} include ${topNames.join(", ")}. ` : "";
  const description = totalVotes > 0
    ? `${leaderLine}${totalVotes.toLocaleString("en-IN")} local votes so far for ${rawTitle.toLowerCase()} (${year}). ${namesHook}Compare freshness-weighted all-time, weekly and monthly results, see must-orders, and cast your vote.`
    : `Continuous community ballot for ${rawTitle.toLowerCase()} (${year}), with freshness-weighted all-time, weekly and monthly results. ${namesHook}There are no standings until locals vote; third-party star ratings do not decide the order.`;
  return { title, description };
}

export function rankingAnswer(theme, editorial = []) {
  const topic = (theme?.title || "Hyderabad food spots")
    .replace(/^best\s+/i, "")
    .replace(/\s+in\s+hyderabad$/i, "")
    .toLowerCase();
  const voted = (theme?.results || [])
    .filter((row) => (row.count || 0) > 0)
    .sort((a, b) => (b.count || 0) - (a.count || 0));
  const winner = theme?.winnerId ? voted.find((row) => row.spotId === theme.winnerId) : null;
  const leader = winner || voted[0];
  const ordered = leader ? [leader, ...voted.filter((row) => row !== leader)] : [];
  if (leader) {
    const total = voted.reduce((sum, row) => sum + (row.count || 0), 0);
    const next = ordered.slice(1, 3).map((row) => row.name).filter(Boolean);
    return `${leader.name} is currently #1 for ${topic} in Hyderabad with ${leader.count} of ${total} local votes${next.length ? `, followed by ${next.join(" and ")}` : ""}.`;
  }
  const names = editorial.slice(0, 3).map((row) => row.name).filter(Boolean);
  return names.length
    ? `Voting for ${topic} in Hyderabad has not started yet; the current editorial shortlist includes ${names.join(", ")}.`
    : `The ${topic} ranking is decided by votes from Hyderabad locals, with the highest-voted place holding #1.`;
}

export function itemListJsonLd(theme, siteUrl, spotUrlFn, updated = null) {
  const items = (theme.results || []).slice(0, 10).map((r, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: r.name,
    url: spotUrlFn
      ? `${siteUrl}${spotUrlFn(r.spotId)}`
      : `${siteUrl}/spot/${encodeURIComponent(r.spotId)}`,
    item: {
      "@type": "FoodEstablishment",
      name: r.name,
      url: spotUrlFn
        ? `${siteUrl}${spotUrlFn(r.spotId)}`
        : `${siteUrl}/spot/${encodeURIComponent(r.spotId)}`,
    },
  }));
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: theme.title,
    description: themeDescription(theme) || `Community-voted ranking: ${theme.title}`,
    itemListOrder: "https://schema.org/ItemListOrderDescending",
    numberOfItems: items.length,
    itemListElement: items,
    about: { "@type": "City", name: "Hyderabad", containedInPlace: { "@type": "State", name: "Telangana" } },
    spatialCoverage: { "@type": "City", name: "Hyderabad", containedInPlace: { "@type": "State", name: "Telangana" } },
    isPartOf: { "@type": "WebSite", name: "Hyderabad Eats", url: siteUrl },
    ...(updated ? { dateModified: updated } : {}),
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

const PERIOD_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const WEEK_RE = /^\d{4}-W(0[1-9]|[1-4]\d|5[0-3])$/;
const DAY_MS = 24 * 60 * 60 * 1000;

function hyderabadCalendarDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return new Date(Date.UTC(Number(value.year), Number(value.month) - 1, Number(value.day)));
}

function isoWeekStart(period) {
  if (!WEEK_RE.test(period || "")) return null;
  const [yearText, weekText] = period.split("-W");
  const jan4 = new Date(Date.UTC(Number(yearText), 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const monday = new Date(jan4.getTime() - (jan4Day - 1) * DAY_MS);
  return new Date(monday.getTime() + (Number(weekText) - 1) * 7 * DAY_MS);
}

/** Calendar month in Hyderabad, used for every monthly vote bucket. */
export function rankingPeriod(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${value.year}-${value.month}`;
}

export function previousRankingPeriod(period) {
  if (!PERIOD_RE.test(period || "")) return null;
  const [year, month] = period.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 2, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function isRankingPeriod(period, current = rankingPeriod()) {
  return PERIOD_RE.test(period || "") && period <= current;
}

export function rankingPeriodLabel(period) {
  if (!PERIOD_RE.test(period || "")) return "";
  const [year, month] = period.split("-").map(Number);
  return new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "Asia/Kolkata" })
    .format(new Date(Date.UTC(year, month - 1, 15)));
}

/** ISO Monday-Sunday week in Hyderabad, used for the recent weekly board. */
export function rankingWeek(date = new Date()) {
  const local = hyderabadCalendarDate(date);
  const weekday = local.getUTCDay() || 7;
  const thursday = new Date(local.getTime() + (4 - weekday) * DAY_MS);
  const weekYear = thursday.getUTCFullYear();
  const yearStart = new Date(Date.UTC(weekYear, 0, 1));
  const week = Math.ceil((((thursday - yearStart) / DAY_MS) + 1) / 7);
  return `${weekYear}-W${String(week).padStart(2, "0")}`;
}

export function previousRankingWeek(period) {
  const start = isoWeekStart(period);
  return start ? rankingWeek(new Date(start.getTime() - DAY_MS)) : null;
}

export function isRankingWeek(period, current = rankingWeek()) {
  return WEEK_RE.test(period || "") && period <= current;
}

export function rankingWeekLabel(period) {
  const start = isoWeekStart(period);
  if (!start) return "";
  const end = new Date(start.getTime() + 6 * DAY_MS);
  const fmt = (date, includeYear = false) => new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    ...(includeYear ? { year: "numeric" } : {}),
    timeZone: "Asia/Kolkata",
  }).format(date);
  return `${fmt(start)}–${fmt(end, true)}`;
}

export function rankingInsights(results = [], previous = []) {
  const board = results.filter((r) => (r.count || 0) > 0);
  const totalVotes = board.reduce((sum, row) => sum + (row.count || 0), 0);
  const leader = board[0] || null;
  const runnerUp = board[1] || null;
  const winningMargin = leader ? (leader.count || 0) - (runnerUp?.count || 0) : 0;
  const leaderShare = leader && totalVotes ? Math.round(((leader.count || 0) / totalVotes) * 1000) / 10 : 0;
  const closeRace = Boolean(leader && runnerUp && winningMargin <= Math.max(1, Math.ceil(totalVotes * 0.1)));
  const confidence = totalVotes === 0 ? "No votes yet"
    : totalVotes < 10 ? "Early result"
      : totalVotes < 25 ? "Taking shape"
        : "Established local signal";
  const priorRanks = new Map(previous.filter((r) => (r.count || 0) > 0).map((r, i) => [r.spotId, i + 1]));
  const movement = Object.fromEntries(board.map((row, i) => {
    const rank = i + 1;
    const prior = priorRanks.get(row.spotId);
    return [row.spotId, prior == null
      ? { status: "new", rank, previousRank: null, delta: null }
      : { status: prior === rank ? "same" : prior > rank ? "up" : "down", rank, previousRank: prior, delta: prior - rank }];
  }));
  return { totalVotes, leaderShare, winningMargin, closeRace, confidence, movement };
}

export function rankingAreaQualification(results = []) {
  const board = results.filter((r) => (r.count || 0) > 0);
  const totalVotes = board.reduce((sum, row) => sum + (row.count || 0), 0);
  const candidateCount = results.length;
  const votedVenueCount = board.length;
  const leaderVotes = board[0]?.count || 0;
  return {
    candidateCount,
    votedVenueCount,
    totalVotes,
    leaderVotes,
    indexable: candidateCount >= 5 && votedVenueCount >= 3 && totalVotes >= 10 && leaderVotes >= 3,
  };
}
