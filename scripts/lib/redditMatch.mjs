/**
 * Shared r/hyderabad matcher: loads raw Reddit data + our eateries, builds the brand alias
 * index, and exposes the regexes the scripts use. Used by reddit-picks.mjs (locals' picks)
 * and reddit-questions.mjs (question pages). Matching rules live here so both agree.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const raw = JSON.parse(fs.readFileSync(path.join(ROOT, "data/reddit/raw.json"), "utf8"));
export const eateries = JSON.parse(fs.readFileSync(path.join(ROOT, "data/eateries.json"), "utf8")).filter((e) => e.status === "approved");
export const MIN_PEOPLE = Number(process.env.MIN_PEOPLE || 3);
export const NOW = Date.now() / 1000;

export const norm = (s) => (s || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/&/g, " and ").replace(/['’`]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

// Words that don't identify a place on their own.
const GENERIC = new Set(("the a an and of hotel restaurant restaurants cafe bar kitchen family dhaba bakery bakers foods food court hyderabad hyd new " +
  "original multicuisine multi cuisine pure veg vegetarian nonveg non fine dine dining lounge bistro pub brewery brewing co company pvt ltd " +
  "and grill grills bbq barbeque barbecue house point corner centre center express tiffins tiffin mess hall palace junction spot outlet").split(" "));
// Single words that are also everyday words or dishes: never a name on their own.
const AMBIGUOUS = new Set(("biryani mandi chai haleem kebab kebabs shawarma pizza burger burgers momos dosa idli coffee tea juice social chutneys " +
  "roast spice spices flavours flavors aroma delight garden taste bowl fusion local street grand royal heaven classic urban " +
  "treat treats cravings crave yummy tasty bliss nest harvest rice curry wings sweets sweet cake cakes desserts dessert falooda lassi " +
  "chicken mutton fish prawns biscuits biscuit bakes cream stone ice magic moon sky blue green red golden silver star " +
  "udupi balaji ganesh sagar ayyappa lakshmi laxmi krishna rama venkateswara srinivasa durga sai hanuman annapurna narsing maruthi " +
  "gayathri swathi anand raghavendra vinayaka mahalakshmi padmavathi saibaba shiva siva ganapathi varalakshmi tirumala amma ammas").split(" "));

// Cuisines, dish words and areas: never a restaurant name, even in pairs ("irani chai", "hyderabadi biryani").
const FOOD_GEO = new Set(("hyderabadi hyderabadis hyderabad secunderabad telangana telugu andhra indian india north south kerala punjabi mughlai " +
  "chinese arabian italian continental irani biryanis paneer pista tiffin tiffins meals thali chaat chai tandoori " +
  "jubilee banjara hills gachibowli madhapur kondapur hitech hitec charminar kukatpally ameerpet begumpet abids " +
  "himayatnagar tolichowki mehdipatnam kothaguda manikonda narsingi kokapet uppal dilsukhnagar secunderabad old city osmania chennai mumbai delhi bangalore bengaluru kolkata begum bazar koti nampally sindhi colony tarnaka malakpet lakdikapul panjagutta somajiguda masab tank basheerbagh barkas chandrayangutta attapur nallagandla miyapur bachupally kompally sainikpuri ecil").split(" "));
// Everyday dictionary words that appear in our names (data/reddit/common-words.json, built from the system
// dictionary). Hand-checked exceptions below are real Hyderabad brands locals say on their own.
const COMMON = new Set(JSON.parse(fs.readFileSync(path.join(ROOT, "data/reddit/common-words.json"), "utf8")));
const ALLOW = new Set(["bawarchi", "paradise", "bahar", "meridian", "nawabs", "chichas", "potful", "pista house", "shah ghouse",
  "blue sea", "taj mahal", "pizza den", "blue fox", "famous ice cream"]);
// Locals' picks are about local places: national/international chains come up mostly as comparisons.
const CHAINS = /\b(mcdonald|kfc|domino|pizza hut|burger king|subway|starbucks|cafe coffee day|barista|third wave|haldiram|bikanervala|hard rock|ibaco|baskin|naturals|keventers|chaayos|wow momo|behrouz|faasos|theobroma|smoor|social|havmor|chai point|chaayos)/i;
// Telugu/Hinglish chat words, everyday phrases and names that collide with a place name
// (hand-checked against r/hyderabad comments: "okati" = "one", "anthe" = "that's it" ...).
// Also aliases where locals mean a different place than ours ("harsha" = Harsha Mess).
const NOT_NAMES = new Set(["okati", "anthe", "chinna", "aunty", "all day", "bharat", "24 hours", "tea 24 hours", "1 more", "ugadi",
  "garam", "narayana", "pragathi", "basheer", "ashok", "rajasthan", "deccan", "sai ram", "harsha", "mayur", "smokey", "kalyani",
  "rayalaseema", "chaitanya", "tansen", "girlfriend"]);
const PHRASES = new Set(["dil se", "this is it", "once upon a time", "cup of tea", "good vibes only", "du jour"]);
export const AREAS = new Set();
for (const e of eateries) {
  const a = norm((e.discoveredIn || "").replace(/^text:.*/, ""));
  if (a) { AREAS.add(a); a.split(" ").forEach((t) => t.length > 3 && AREAS.add(t)); }
}
const isNoise = (t) => GENERIC.has(t) || AMBIGUOUS.has(t) || FOOD_GEO.has(t) || AREAS.has(t);

function aliasesFor(name) {
  const base = norm(name.split(/\s[-|@]\s|\s\(|,|\|/)[0]);
  const toks = base.split(" ").filter(Boolean);
  const core = toks.filter((t) => !GENERIC.has(t));
  const out = new Set();
  const add = (a) => {
    if (ALLOW.has(a)) { out.add(a); return; }
    const t = a.split(" ");
    if (a.length < 4) return;
    if (t.length === 1 && (a.length < 5 || isNoise(a) || COMMON.has(a))) return;
    if (t.every(isNoise)) return;
    // two everyday words ("blue sea" is fine, "good food" isn't): need one non-dictionary word or 3+ words
    // everyday phrases ("this is it", "cup of tea", "good food"): every word ordinary → not a name
    if (PHRASES.has(a) || t.every((x) => COMMON.has(x) || isNoise(x))) return;
    out.add(a);
  };
  if (toks.length) add(toks.join(" "));
  if (core.length) add(core.join(" "));
  // distinctive words only ("Paradise Biryani" → "paradise"), so a dish word in the name doesn't hide the brand
  const distinct = core.filter((t) => !AMBIGUOUS.has(t) && !FOOD_GEO.has(t));
  if (distinct.length && distinct.length < core.length) add(distinct.join(" "));
  return [...out];
}

// brand = the core alias; several branches share one brand
const sharers = new Map();
for (const e of eateries) for (const a of aliasesFor(e.name)) {
  if (a.includes(" ")) continue;
  if (!sharers.has(a)) sharers.set(a, new Set());
  sharers.get(a).add(norm(e.name).replace(/\s+(\d+|branch|outlet)$/, "").split(" ").slice(0, 3).join(" "));
}
const SHARED = new Set([...sharers].filter(([a, names]) => !ALLOW.has(a) && names.size >= 3).map(([a]) => a));
export const brands = new Map(); // alias -> { brand, ids: [] }
for (const e of eateries) {
  const al = aliasesFor(e.name);
  if (!al.length) continue;
  if (CHAINS.test(norm(e.name))) continue;
  const brand = al[al.length - 1];
  const lead = norm(e.name).replace(/^(the|hotel|cafe|new|sri|shri) /, "");
  for (const a of al) {
    if (!a.includes(" ") && !ALLOW.has(a) && (!lead.startsWith(a) || SHARED.has(a))) continue;
    if (!a.includes(" ") && ALLOW.has(a) && !lead.startsWith(a)) continue;
    if (NOT_NAMES.has(a)) continue;
    if (AREAS.has(a) && !ALLOW.has(a)) continue;
    // a longer name whose only distinctive words are shared or areas ("udupi tiffin center") is still ambiguous
    const dist = a.split(" ").filter((t) => !isNoise(t));
    if (a.includes(" ") && !ALLOW.has(a) && dist.length && dist.every((t) => SHARED.has(t) || AREAS.has(t))) continue;
    if (!brands.has(a)) brands.set(a, { brand, ids: new Set() });
    brands.get(a).ids.add(e.id);
  }
}
const aliasList = [...brands.keys()].sort((a, b) => b.length - a.length);
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export const RE = new RegExp(`\\b(${aliasList.map(esc).join("|")})\\b`, "g");

export const PROMO = /(instagram\.com|instagr\.am|youtu\.?be|use (my |the )?code|promo code|discount code|dm (me|us)|we (have|are|just) (opened|launched)|our (restaurant|cafe|outlet|kitchen|brand|menu)|collab|follow us|swiggy\.com\/menu|zomato\.com\/hyderabad)/i;
export const NEG = /\b(avoid|overrated|over rated|worst|pathetic|went downhill|gone downhill|not worth|not good|disappoint\w*|terrible|horrible|mediocre|bland|stale|food poisoning|unhygienic|hygiene issue|never again|rip off|ripoff|meh|lost (its|their) (charm|taste|touch))\b/i;
// Dishes and cuisines locals name next to a place ("Shadab for mutton biryani"). Key = label shown on site.
const DISHES = {
  "Mutton biryani": /mutton biryani|mutton dum/, "Chicken biryani": /chicken biryani|chicken dum/, "Biryani": /biryani|biriyani/,
  "Haleem": /haleem/, "Mandi": /mandi/, "Irani chai": /irani chai|irani tea|chai/, "Osmania biscuits": /osmania/, "Bun maska": /bun maska|maska bun|bun butter/,
  "Paya / nihari": /paya|nihari|nahari/, "Kebabs": /kebab|kabab|seekh|shikampuri|tunde/, "Tandoori": /tandoori|tikka/, "Shawarma": /shawarma|shawarama/,
  "Dosa": /dosa/, "Idli / tiffins": /idli|idly|tiffin|vada|upma|pesarattu|poori/, "Andhra meals": /andhra|meals|thali|gongura/, "Pulao": /pulao/,
  "Chaat": /chaat|pani puri|panipuri|dahi puri|ragda|pav bhaji/, "Momos": /momo/, "Chinese": /chinese|noodles|manchurian|fried rice/,
  "Pizza": /pizza/, "Burger": /burger/, "Pasta / Italian": /pasta|italian|lasagna|risotto/, "Sushi / Japanese": /sushi|japanese|sashimi|maki|uramaki|tempura/,
  "Arabian": /arabian|kunafa|hummus|falafel|shawafel/, "Fish / seafood": /fish|prawn|seafood|crab/, "Desserts": /dessert|qubani|double ka meetha|falooda|kulfi|gulab jamun|halwa/,
  "Ice cream": /ice cream|icecream|gelato/, "Bakery / cakes": /cake|pastry|pastries|bakery|cookie|dil pasand|puff/, "Coffee": /coffee|filter coffee|cold brew|latte/,
  "Breakfast": /breakfast/, "Late night": /late night|midnight|2 ?am|3 ?am/,
  "Ramen": /ramen/, "Korean": /korean|kimchi|bibimbap|tteokbokki|korean bbq/, "Thai": /thai|pad thai|green curry/, "Dim sum": /dim ?sum|dumpling|bao|gyoza/,
  "Vietnamese": /vietnamese|pho|banh mi/, "Mexican": /mexican|taco|burrito|nachos|quesadilla/, "Lebanese / Turkish": /lebanese|turkish|baklava|kunafa|knafeh|kebab platter/,
  "Mediterranean / Greek": /mediterranean|greek|gyro|souvlaki/, "Steak / BBQ": /steak|ribs|brisket|bbq|barbecue/, "Waffles / pancakes": /waffle|pancake|crepe/,
  "Croissant / sourdough": /croissant|sourdough|bagel|focaccia/, "Bubble tea": /boba|bubble tea/, "Matcha": /matcha/, "Cheesecake": /cheesecake/,
  "Donuts": /donut|doughnut/, "Healthy / salads": /salad|healthy|bowl|keto|protein/, "Vegan": /vegan|plant based/, "Fried chicken / wings": /fried chicken|wings|popeyes/,
  "Cocktails / bar": /cocktail|bar|pub|brewery|beer/, "Buffet": /buffet/, "Falooda / kulfi / lassi": /falooda|kulfi|lassi/,
};
// whole words only ("chai" must not match inside "Chaitanya")
export const DISHES_B = Object.fromEntries(Object.entries(DISHES).map(([k, re]) => [k, new RegExp(`\\b(?:${re.source})(?:s|es)?\\b`)]));
export const BOTS = new Set(["[deleted]", "AutoModerator", "", undefined, null]);

export const sentenceOf = (text, idx) => {
  const start = Math.max(text.lastIndexOf(".", idx), text.lastIndexOf("!", idx), text.lastIndexOf("?", idx), text.lastIndexOf("\n", idx)) + 1;
  const ends = [".", "!", "?", "\n"].map((c) => text.indexOf(c, idx)).filter((x) => x >= 0);
  return text.slice(start, ends.length ? Math.min(...ends) : text.length);
};

// Comments + posts as one stream. Short direct answers ("Haiku" under "Best sushi spots?")
// carry the thread title in `ask`, so a dish can come from the question.
// Short direct answers ("Haiku" under "Best sushi spots?") take their dish from the thread title.
export const titles = new Map(raw.posts.map((p) => [p.id, p.title.toLowerCase()]));
export const items = [
  ...raw.comments.map((c) => ({ ...c, text: c.body, ask: c.topLevel && c.body.length < 300 ? titles.get(c.post) || "" : "" })),
  ...raw.posts.map((p) => ({ id: p.id, author: p.author, text: `${p.title}\n${p.body}`, score: p.score, created: p.created, permalink: p.permalink })),
];

// brand -> every eatery id that shares it
export const brandIds = new Map();
for (const { brand, ids } of brands.values()) {
  if (!brandIds.has(brand)) brandIds.set(brand, new Set());
  ids.forEach((id) => brandIds.get(brand).add(id));
}

// A brand word used for something else: a movie/song ("Paradise movie"), or a landmark
// ("near Paradise metro", "Paradise circle"). Those mentions don't count for the place.
const OFF_TOPIC = /\b(movie|film|trailer|teaser|box office|ott|song|actor|actress|hero)\b/;
const LANDMARK_AFTER = /^\s*(metro|station|circle|signal|junction|x ?roads?|cross ?roads?|bus stop|flyover|lane|road|side|area|colony|ka pul)\b/;
export function offTopic(sentenceLower, textLower, at, alias) {
  if (OFF_TOPIC.test(sentenceLower)) return true;
  const end = at + alias.length;
  return LANDMARK_AFTER.test(textLower.slice(end, end + 24));
}

