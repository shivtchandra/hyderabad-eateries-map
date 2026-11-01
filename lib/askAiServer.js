import fs from "node:fs";
import path from "node:path";
import OpenAI from "openai";
import { getEateries, chainKey } from "./siteData.js";
import { haversineKm } from "./eateryUtils.js";

let _openai = null;
export function getOpenAI() {
  if (!_openai) {
    const key = process.env.OPENAI_API_KEY;
    if (key) {
      _openai = new OpenAI({ apiKey: key });
    }
  }
  return _openai;
}

let _cache = null;
function loadDatasets() {
  if (_cache) return _cache;
  try {
    const dataDir = path.join(process.cwd(), "data");
    const redditPicks = JSON.parse(fs.readFileSync(path.join(dataDir, "reddit-picks.json"), "utf8")).spots || {};
    const locals = JSON.parse(fs.readFileSync(path.join(dataDir, "locals-dishes.json"), "utf8")).spots || {};
    const reddit = JSON.parse(fs.readFileSync(path.join(dataDir, "reddit-questions.json"), "utf8")).brands || {};
    const inspectionData = JSON.parse(fs.readFileSync(path.join(dataDir, "inspection-places.json"), "utf8")).places || {};

    const inspectionByPlaceId = {};
    for (const v of Object.values(inspectionData)) {
      if (v.placeId) inspectionByPlaceId[v.placeId] = v;
    }

    const brandBySpotId = new Map();
    const brandByName = new Map();
    for (const [key, b] of Object.entries(reddit)) {
      brandByName.set(b.name.toLowerCase(), { key, ...b });
      for (const id of b.ids || []) {
        brandBySpotId.set(id, { key, ...b });
      }
    }

    _cache = { redditPicks, locals, reddit, inspectionByPlaceId, brandBySpotId, brandByName };
  } catch (err) {
    console.error("[askAiServer] Failed to load data files:", err);
    _cache = { redditPicks: {}, locals: {}, reddit: {}, inspectionByPlaceId: {}, brandBySpotId: new Map(), brandByName: new Map() };
  }
  return _cache;
}

const STOPWORDS = new Set([
  "best", "good", "food", "near", "nearby", "close", "around", "place", "places",
  "spot", "spots", "restaurant", "restaurants", "hotel", "hotels", "hyderabad",
  "now", "city", "order", "eat", "love", "great", "famous", "top", "me", "in",
  "for", "with", "and", "the", "a", "an", "is", "of", "to", "what", "where",
  "recommend", "specialty", "different", "options", "something", "else", "tell",
  "another", "completely", "you", "they", "them", "from", "any", "some"
]);

const NON_DINING_REGEX = /\b(ghee store|supermarket|mart|grocer|provisions|liquor store|wines|sweet house|mithai wala|sweets|dry fruits|bakers & confectioners|fancy store|pharmacy|medical|residence kapil|hotel ashoka)\b/i;

const CAFE_DENY = /\b(food court|biryani|haleem|mandi|kebab|kabab|pub\b|bar\b|brewery|restro-bar|kitchen and bar|dhaba|mess\b|bhojanam|curry point|cream ?stone|baskin|naturals|ice ?cream|subway|domino|kfc|mcdonald|burger king|pizza)\b/i;

function cleanWords(str) {
  return String(str || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w));
}

const CRAVINGS = [
  { id: "biryani", words: ["biryani", "biriyani"], category: "biryani" },
  { id: "chai", words: ["chai", "tea", "irani", "osmania", "maska", "bun maska"], category: "cafe" },
  { id: "breakfast", words: ["breakfast", "tiffin", "tiffins", "dosa", "idli", "vada", "upma", "pesarattu", "puri"], category: "local" },
  { id: "cafe", words: ["cafe", "coffee", "roastery", "laptop", "work", "study", "quiet"], category: "cafe" },
  { id: "dessert", words: ["dessert", "desserts", "ice cream", "sweet", "sweets", "cake", "pastry", "waffle", "gelato"], category: "dessert" },
  { id: "mandi", words: ["mandi", "arabian", "faham", "al faham", "fahad"], category: "local" },
  { id: "shawarma", words: ["shawarma", "shwarma", "kebab", "kabab", "rolls", "roll"], category: "local" },
  { id: "haleem", words: ["haleem"], category: "local" },
  { id: "thali", words: ["thali", "meals", "andhra meals", "telugu meals", "bhojanam", "mess"], category: "restaurant" },
  { id: "veg", words: ["veg", "vegetarian", "pure veg", "sattvic", "jain"], category: null },
  { id: "drinks", words: ["beer", "bar", "brewery", "drinks", "cocktail", "cocktails", "pub"], category: "restro-bar" },
  { id: "late", words: ["late night", "midnight", "late", "2am", "3am", "4am", "night"], category: null }
];

export function findCandidates(query, {
  userLoc = null,
  areaName = null,
  rankBySpot = {},
  picksMap = {},
  savedSpots = [],
  visitedSpots = [],
  limit = 12
} = {}) {
  const { redditPicks, locals, inspectionByPlaceId, brandBySpotId } = loadDatasets();
  const qLower = String(query || "").toLowerCase();
  const qWords = cleanWords(query);
  const eateries = getEateries();

  const savedSet = new Set(savedSpots || []);
  const visitedSet = new Set(visitedSpots || []);

  const allowSweets = /sweet|mithai|jalebi|ghee/i.test(qLower);
  const isCafeQuery = /\b(cafe|cafes|coffee|work|laptop|study|roastery|espresso|barista)\b/i.test(qLower);
  const isBiryaniQuery = /\b(biryani|biriyani)\b/i.test(qLower);
  const isMandiQuery = /\b(mandi|arabian|faham)\b/i.test(qLower);
  const isShawarmaQuery = /\b(shawarma|shwarma|kebab|kabab)\b/i.test(qLower);
  const isTiffinsQuery = /\b(tiffin|tiffins|breakfast|dosa|idli|vada|upma|pesarattu)\b/i.test(qLower);
  const isBudgetQuery = /\b(cheap|budget|affordable|cheaper|under|pocket-friendly)\b/i.test(qLower);
  const isVegQuery = /\b(pure veg|pure-veg|vegetarian|sattvic|jain)\b/i.test(qLower);

  const scored = [];

  for (const e of eateries) {
    if (!e.name || !e.core) continue;

    if (NON_DINING_REGEX.test(e.name) && !allowSweets) {
      continue;
    }

    const rp = redditPicks[e.id];
    const ld = locals[e.id];
    const brandInfo = brandBySpotId.get(e.id);

    // STRICT CATEGORY GUARDRAILS
    if (isCafeQuery) {
      if (CAFE_DENY.test(e.name) || e.category === "restro-bar" || e.category === "ice-cream") {
        continue;
      }
      const topDishes = (rp?.dishes || []).map((d) => d.dish.toLowerCase()).join(" ");
      if (/\b(biryani|haleem|mandi|kebab|kabab)\b/i.test(topDishes)) {
        continue;
      }
      const isCafeType = e.category === "cafe" || e.category === "bakery"
        || (e.tags || []).some((t) => ["work-friendly", "specialty", "coffee"].includes(t))
        || /cafe|coffee|roast|espresso/i.test(e.name);
      if (!isCafeType) {
        continue;
      }
    }

    if (isBiryaniQuery && (e.category === "cafe" || e.category === "ice-cream" || e.category === "bakery")) {
      continue;
    }

    if (isMandiQuery && (e.category === "cafe" || e.category === "ice-cream" || e.category === "bakery")) {
      continue;
    }

    if (isShawarmaQuery && (e.category === "cafe" || e.category === "ice-cream" || e.category === "bakery")) {
      continue;
    }

    if (isTiffinsQuery && (e.category === "ice-cream" || e.category === "restro-bar")) {
      continue;
    }

    if (isVegQuery && /\b(paradise|bawarchi|shadab|shah ghouse|peshawar|meridian|mehfil)\b/i.test(e.name)) {
      continue;
    }

    // Check Community Rankings preference (#1, #2, #3 by locals)
    const spotRanks = (rankBySpot && rankBySpot[e.id]) || [];
    const topRank = spotRanks.find((r) => r.rank <= 3) || null;

    // Check Editorial Pick preference (our curator recos)
    const editorialPick = (picksMap && picksMap[e.id])
      || (e.editorial ? { dishes: (e.mustOrder || []).map((m) => m.name || m) } : null);

    // Check User Personal Preference (saved or visited)
    const isSaved = savedSet.has(e.id);
    const isVisited = visitedSet.has(e.id);

    const isLocalFav = !!(rp || (ld && ld.length > 0) || editorialPick || topRank);

    // Band priority:
    // Band 0: Community ranking winner or validated r/hyderabad local favorite
    // Band 1: Editorial pick or locals dishes
    // Band 2: User's saved or visited spots
    // Band 3: Pure Google-only spot
    let band = 3;
    if (topRank) band = 0;
    else if (rp) band = 0;
    else if (editorialPick) band = 1;
    else if (isLocalFav) band = 1;
    else if (isSaved || isVisited) band = 2;

    let score = (e.rating || 3.5) * Math.log10((e.ratingCount || 10) + 10);

    // PRIORITY BOOSTS:
    // 1. Community rankings get highest preference
    if (topRank) {
      score += 130 - (topRank.rank * 10); // #1 gets +120
    }

    // 2. Editorial curator picks get major boost
    if (editorialPick) {
      score += 85;
    }

    // 3. User's saved or visited favorites get strong personalized boost
    if (isSaved) {
      score += 75;
    } else if (isVisited) {
      score += 45;
    }

    // 4. Reddit crowd votes
    if (rp) {
      score += 90 + Math.min(50, (rp.locals || 0) * 0.5);
    } else if (isLocalFav) {
      score += 50;
    }

    let matched = false;

    // Brand name match
    if (brandInfo && qLower.includes(brandInfo.name.toLowerCase())) {
      score += 80;
      matched = true;
    }

    // Name word matches
    const nameWords = cleanWords(e.name);
    for (const nw of nameWords) {
      if (qWords.includes(nw)) {
        score += 45;
        matched = true;
      }
    }

    // Area match
    const spotArea = (e.discoveredIn || "").toLowerCase();
    if (spotArea && spotArea !== "hyderabad") {
      if (areaName && areaName.toLowerCase() !== "hyderabad" && spotArea.includes(areaName.toLowerCase())) {
        score += 40;
        matched = true;
      } else {
        const areaWords = cleanWords(spotArea);
        if (areaWords.some((aw) => qWords.includes(aw))) {
          score += 35;
          matched = true;
        }
      }
    }

    // Craving match
    for (const c of CRAVINGS) {
      if (c.words.some((w) => qLower.includes(w))) {
        const eDishes = (e.dishes || []).join(" ").toLowerCase();
        const eTags = (e.tags || []).join(" ").toLowerCase();
        const matchesCategory = c.category && e.category === c.category;
        const matchesWords = c.words.some((w) => nameWords.includes(w) || eDishes.includes(w) || eTags.includes(w));
        if (matchesCategory || matchesWords) {
          score += 35;
          matched = true;
        }
      }
    }

    if (isCafeQuery) {
      if (e.category === "cafe") score += 35;
      if ((e.tags || []).includes("work-friendly")) score += 30;
      if ((e.tags || []).includes("coffee") || (e.tags || []).includes("specialty")) score += 20;
      if ((e.tags || []).includes("quiet")) score += 20;
    }

    if (isBudgetQuery) {
      if (e.priceLevel === 1) score += 50;
      else if (e.priceLevel === 2) score += 20;
      else if (e.priceLevel === 3) score -= 35;
    }

    let dist = null;
    if (userLoc && e.lat && e.lng) {
      dist = haversineKm(userLoc, e);
      if (dist != null) {
        if (dist <= 3) score += 35;
        else if (dist <= 7) score += 15;
        else if (dist > 15) score -= 30;
      }
    }

    if (band === 3 && (!matched || (e.ratingCount || 0) < 250 || (e.rating || 0) < 4.1)) {
      continue;
    }

    if (!matched && !userLoc && band === 3) {
      continue;
    }

    const inspection = inspectionByPlaceId[e.id];
    scored.push({
      e,
      score,
      band,
      dist,
      rp,
      topRank,
      editorialPick,
      isSaved,
      isVisited,
      localDishes: ld,
      brandInfo,
      inspection,
      chain: chainKey(e.name) || e.name.toLowerCase()
    });
  }

  scored.sort((a, b) => b.score - a.score);

  const chainCounts = new Map();
  const deduped = [];
  for (const s of scored) {
    const cKey = s.chain || s.e.id;
    const count = chainCounts.get(cKey) || 0;
    if (count < 2) {
      chainCounts.set(cKey, count + 1);
      deduped.push(s);
    }
    if (deduped.length >= limit) break;
  }

  return deduped;
}

export function formatCandidatesContext(candidates) {
  if (!candidates.length) return "No specific spot candidates found for this query.";

  return candidates.map((c) => {
    const lines = [];
    lines.push(`- Spot ID: ${c.e.id}`);
    lines.push(`  Name: ${c.e.name}`);
    lines.push(`  Category: ${c.e.category}`);
    lines.push(`  Area: ${c.e.discoveredIn && c.e.discoveredIn !== "Hyderabad" ? c.e.discoveredIn : "Hyderabad"}`);
    lines.push(`  Rating: ${c.e.rating}★ (${Number(c.e.ratingCount || 0).toLocaleString("en-IN")} Google reviews)`);
    if (c.dist != null) lines.push(`  Distance from user: ${c.dist.toFixed(1)} km`);
    if (c.e.priceLevel != null) lines.push(`  Price level: ${["Budget (under ₹250)", "Moderate (₹250-600)", "Upscale (₹600+)"][c.e.priceLevel - 1] || "Normal"}`);
    if (c.e.tags?.length) lines.push(`  Tags: ${c.e.tags.join(", ")}`);

    // Prioritize community rankings
    if (c.topRank) {
      lines.push(`  COMMUNITY RANKING: Voted #${c.topRank.rank} for "${c.topRank.title}" by Hyderabad locals (${c.topRank.votes} votes)`);
    }

    // Editorial pick
    if (c.editorialPick) {
      const dishes = c.editorialPick.dishes?.length ? `Must try: ${c.editorialPick.dishes.map((d) => (typeof d === "string" ? d : d.name)).slice(0, 2).join(", ")}` : "Featured editorial recommendation";
      lines.push(`  EDITORIAL CURATION: ${dishes}`);
    }

    // User's personal favorites
    if (c.isSaved) {
      lines.push("  USER PREFERENCE: The user has personally saved/bookmarked this spot");
    }
    if (c.isVisited) {
      lines.push("  USER PREFERENCE: The user has marked this spot as visited in their food passport");
    }

    if (c.rp) {
      lines.push(`  r/hyderabad locals consensus: Endorsed by ${c.rp.locals} locals (${c.rp.negatives || 0} negatives).`);
      if (c.rp.dishes?.length) {
        lines.push(`  Top voted dishes: ${c.rp.dishes.slice(0, 3).map((d) => `${d.dish} (${d.people} votes)`).join(", ")}`);
      }
    } else if (c.brandInfo) {
      lines.push(`  r/hyderabad locals consensus: ${c.brandInfo.locals} locals recommend this brand.`);
      if (c.brandInfo.overrated) lines.push("  Note: Debated on r/hyderabad as potentially overrated.");
      if (c.brandInfo.dishes?.length) {
        lines.push(`  Top voted dishes: ${c.brandInfo.dishes.slice(0, 3).map((d) => `${d.dish} (${d.people} votes)`).join(", ")}`);
      }
    }

    if (c.localDishes?.length) {
      lines.push(`  Dishes named by locals: ${c.localDishes.slice(0, 3).map((d) => d.name || d.dish).join(", ")}`);
    }

    if (c.inspection) {
      lines.push(`  Food safety inspection: ${c.inspection.verified ? "Verified clean audit report" : "Inspected"}`);
    }

    return lines.join("\n");
  }).join("\n\n");
}

export const SYSTEM_PROMPT = `You are Ask Eats, Hyderabad's hyper-local AI food expert and insider concierge.
You know the city's food culture intimately: from Old City biryani and midnight Irani chai to Jubilee Hills cafes, Telugu bhojanam thalis, and late night street food.

HOUSE RULES (STRICT):
1. NEVER USE EM-DASHES (—) in any response. Per editorial house rules, always use a comma, hyphen, or period instead.
2. Voice: Snappy, warm, knowledgeable, direct. No generic corporate tourism filler (never say "rich culinary tapestry" or "mouthwatering delights"). Speak like a trusted local friend.
3. Interactive Spot Links: Whenever you recommend a specific spot from the provided candidates, attach its spot tag in the format [spot:SPOT_ID] immediately after the spot name.
   Example: "Head to **Roastery Coffee House** [spot:ChIJ...] for cold brew..."
4. PRIORITIZE COMMUNITY RANKINGS & EDITORIAL PICKS:
   - When a candidate has won or placed in community rankings (e.g. "#1 for Best Momos" or "#1 for Biryani"), highlight that standing with pride.
   - When a candidate is an editorial recommendation, highlight our team's must-order dish picks.
   - If a candidate is marked "USER PREFERENCE" (the user saved it or visited it), warmly acknowledge it (e.g. "Since you already have this saved...", "As a spot already on your list...").
5. STRICT CATEGORY INTEGRITY (DO NOT HALLUCINATE VENUE TYPES):
   - NEVER misrepresent a venue or pretend it fits a category it does not belong to.
   - A Biryani restaurant (Paradise, Bawarchi, Shadab, Cafe Bahar) is NEVER a cafe, never a workspace, and never a coffee spot.
   - A bar, pub, or regional Andhra dining hall (AnTeRa) is NEVER a quiet work cafe.
   - A cafe, bakery, or ice cream parlor is NEVER a biryani house.
   - If asked for cafes to work from, recommend ONLY actual cafes, coffee shops, or work-friendly bakeries.
   - If no suitable spots exist in the retrieved candidates that fit the exact category requested, say so honestly rather than trying to force-fit an incompatible venue.
6. NEVER recommend grocery stores, ghee shops, pharmacies, or generic multi-cuisine banquet halls as meal destinations. Focus strictly on authentic eateries, cafes, and iconic food spots.
7. Ground your recommendations strictly in the retrieved candidates and local data.
8. Keep answers concise: 2 to 4 crisp paragraphs or structured bullets. Respect the user's time.`;
