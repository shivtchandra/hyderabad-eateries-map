/**
 * Soft check: does this spot look off for the weekly theme?
 * Used before confirming a theme vote. Prefer false negatives
 * (skip the warn) over nagging people about places that clearly fit.
 */

// Word-boundary rules so "bar" does not match "barbecue".
const RULES = [
  {
    match: /\bbiryani\b/i,
    categories: ["local", "restaurant", "cafe"],
    hints: ["biryani", "dum", "mandi", "mehfil", "paradise", "bawarchi", "shadab", "bahar"],
  },
  {
    match: /\bhaleem\b/i,
    categories: ["local", "restaurant", "cafe"],
    hints: ["haleem"],
  },
  {
    match: /\bmandi\b/i,
    categories: ["local", "restaurant", "cafe"],
    hints: ["mandi"],
  },
  {
    match: /\b(chai|irani)\b/i,
    categories: ["cafe", "local", "bakery"],
    hints: ["chai", "irani", "niloufer", "nimrah", "osmania"],
  },
  {
    match: /\bcoffee\b/i,
    categories: ["cafe"],
    hints: ["coffee", "espresso", "cafe", "café"],
  },
  {
    match: /\b(ice\s*cream|gelato)\b/i,
    categories: ["ice-cream", "cafe", "bakery"],
    hints: ["ice cream", "icecream", "gelato", "kulfi"],
  },
  {
    match: /\bdessert\b/i,
    categories: ["cafe", "bakery", "ice-cream"],
    hints: ["dessert", "sweet", "bakery", "cake"],
  },
  {
    match: /\b(bars?|pubs?|nightlife)\b/i,
    categories: ["restro-bar"],
    hints: ["bar", "pub", "lounge"],
  },
  {
    match: /\b(dosa|idli|tiffin|breakfast)\b/i,
    categories: ["local", "restaurant", "cafe"],
    hints: ["dosa", "idli", "tiffin", "uttapam", "pungaralu"],
  },
];

function haystack(spot) {
  const parts = [
    spot?.name,
    spot?.area,
    spot?.discoveredIn,
    ...(spot?.tags || []),
  ];
  return parts.filter(Boolean).join(" ").toLowerCase();
}

/**
 * @param {string} themeTitle
 * @param {{ category?: string, name?: string, tags?: string[], area?: string, discoveredIn?: string }} spot
 * @returns {boolean} true if we should warn "doesn't look like it fits"
 */
export function themeSpotMismatch(themeTitle, spot) {
  if (!themeTitle || !spot?.category) return false;

  const text = haystack(spot);

  for (const rule of RULES) {
    if (!rule.match.test(themeTitle)) continue;

    // Name/tags already shout the dish, trust the voter
    if (rule.hints.some((h) => text.includes(h))) return false;

    // Category is in the expected set for this theme
    if (rule.categories.includes(spot.category)) return false;

    return true;
  }

  // Theme title did not match a dish rule, no category warning
  return false;
}
