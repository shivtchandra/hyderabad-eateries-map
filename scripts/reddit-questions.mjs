/**
 * Question pages data (/ask/[slug]) from r/hyderabad: what locals praise and complain about
 * per place, which places they compare head to head, and which places they name for
 * specific needs ("fewer bones", "late night"). No AI text: counts, themes and short quotes,
 * every quote linked to its comment. raw.json is gitignored, so everything the site needs
 * is precomputed here into a committed file.
 *
 * Input:  data/reddit/raw.json, data/eateries.json, data/reddit-picks.json,
 *         data/recommendation-shortlist.json (display names)
 * Output: data/reddit-questions.json
 *
 * Gates (a page only exists with enough evidence):
 *   what-to-order  >= 8 people recommending, >= 2 dishes named by 2+ people
 *   worth-it       >= 15 people recommending and >= 3 people complaining
 *   vs             >= 10 people naming both places in one comment
 *   need           >= 4 places, each named for the need by 2+ people
 */
import fs from "fs";
import path from "path";
import { ROOT, raw, eateries, NOW, norm, brands, RE, PROMO, NEG, BOTS, sentenceOf, items, brandIds, offTopic } from "./lib/redditMatch.mjs";

const picks = JSON.parse(fs.readFileSync(path.join(ROOT, "data/reddit-picks.json"), "utf8"));
const shortlist = JSON.parse(fs.readFileSync(path.join(ROOT, "data/recommendation-shortlist.json"), "utf8"));
const byId = new Map(eateries.map((e) => [e.id, e]));
const DAY = 86400;

// Brands that made locals' picks (>= 3 people, positives >= 2x negatives).
const kept = new Map();
for (const [id, p] of Object.entries(picks.spots || {})) {
  if (!kept.has(p.brand)) kept.set(p.brand, { ...p, ids: [] });
  kept.get(p.brand).ids.push(id);
}

// Display name: the shortlist's brand name when we have one, else the best branch name, cleaned.
const shortlistName = new Map();
for (const b of shortlist.brands || []) for (const id of b.branchIds || []) shortlistName.set(id, b.name);
function displayName(brand) {
  const ids = [...(brandIds.get(brand) || [])];
  for (const id of ids) if (shortlistName.has(id)) return shortlistName.get(id);
  const best = ids.map((id) => byId.get(id)).filter(Boolean).sort((a, b) => (b.ratingCount || 0) - (a.ratingCount || 0))[0];
  return (best?.name || brand).split(/\s[-|@]\s|\s\(|,|\|/)[0].replace(/\s+/g, " ").trim();
}
const slug = (s) => norm(s).replace(/\s+/g, "-");

// What people complain about / praise. Phrased so a match is already the complaint (or praise).
const COMPLAINTS = {
  bones: /\b((too many|lots? of|full of|only|mostly|all) bones?|bony|more bones?|bones? (and|&) (fat|cartilage)|bone lottery)\b/,
  price: /\b(overpriced|over priced|too expensive|rip ?off|not worth the (price|money)|pricey)\b/,
  hygiene: /\b(unhygienic|hygiene|cockroach|food poisoning|upset stomach|got sick|fell sick|mou?ld|fssai)\b/,
  wait: /\b((long|huge) (wait|queue|line)|waited (for )?\d+|overcrowded|too crowded)\b/,
  consistency: /\b(downhill|not the same|used to be (good|better|great|the best)|inconsistent|lost (its|their) (charm|taste|touch)|quality (has )?(dropped|gone down|declined))\b/,
  oily: /\b(too spicy|too oily|oily|greasy)\b/,
  portion: /\b((small|less|tiny) (portions?|quantity)|less meat|very little meat)\b/,
};
const PRAISE = {
  meat: /\b((soft|tender|juicy|succulent|melt\w*) (mutton|meat|chicken|pieces?)|boneless|more meat|meaty|good meat)\b/,
  value: /\b(value for money|worth (it|the money)|cheap|affordable|reasonabl\w+)\b/,
  flavour: /\b(flavou?rful|aromatic|aroma|delicious|authentic|best taste|tastes? (great|amazing))\b/,
  consistency: /\b(consistent(ly)?|never disappoint\w*|always good|still (good|great|the best))\b/,
  portion: /\b(huge portions?|generous|big portions?|full plate|quantity is (good|great|huge))\b/,
};
const POSITIVE = /\b(best|great|amazing|awesome|love[ds]?|loving|must try|must have|recommend\w*|favou?rite|my go to|go-to|top notch|underrated|delicious|fantastic|excellent|superb|solid|legit|never disappoints?|worth (it|trying|a try))\b/;
const OVERRATED = /\b(overrated|over rated|overhyped|over hyped|tourist trap)\b/;

// Needs: a positive mention in a sentence that names the need (or a short answer to a thread asking it).
const NEEDS = [
  { slug: "mutton-biryani-with-fewer-bones-hyderabad", need: "fewer bones", re: /\b(boneless|less bones?|no bones?|fewer bones?|meaty|more meat|meat pieces|soft mutton|tender mutton)\b/, ask: /\bbones?\b|\bmeat\b/ },
  { slug: "late-night-food-hyderabad", need: "late night", re: /\b(late night|midnight|after midnight|[1-4] ?am|open (till|until) late|open late|night owls?)\b/, ask: /\blate night|midnight|[1-4] ?am\b/ },
  { slug: "pure-veg-restaurants-hyderabad-locals-love", need: "pure veg", re: /\b(pure veg|pure vegetarian|veg only|jain food|best veg)\b/, ask: /\b(pure veg|vegetarian|veg restaurants?|veg food)\b/, min: 5 },
  { slug: "date-spots-hyderabad-under-1500", need: "date", re: /\b(date|romantic|anniversary|girlfriend|boyfriend|candle ?light)\b/, ask: /\b(date|romantic|anniversary)\b/, filter: (ids) => ids.some((id) => { const e = byId.get(id); return e && (e.costForTwo || 9999) <= 1500 && (e.tags || []).includes("date"); }) },
  { slug: "haleem-outside-ramzan-hyderabad", need: "haleem all year", re: /\bhaleem\b.*\b(all year|year round|throughout the year|outside ramz?an|non ramz?an|available (all|every))|\b(all year|year round|throughout the year)\b.*\bhaleem\b/, ask: /\b(all year|year round|outside ramz?an|non ramz?an|after ramz?an)\b/ },
];

const clean = (s) => s.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/https?:\/\/\S+/g, "").replace(/\bu\/[\w-]+/g, "someone").replace(/[*_>#`~]/g, "").replace(/\s+/g, " ").trim();
function clip(s, max = 160) {
  const t = clean(s);
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:\-]+$/, "") + "…";
}
const BAD_WORDS = /\b(fuck\w*|shit\w*|bitch\w*|bc|mc|madarchod|bhenchod|behenchod|chutiya|gandu|randi|lund)\b/i;
const month = (t) => new Date(t * 1000).toISOString().slice(0, 7);
const date = (t) => new Date(t * 1000).toISOString().slice(0, 10);

const B = new Map(); // brand -> stats
const stat = (brand) => {
  if (!B.has(brand)) B.set(brand, { pos: new Set(), neg: new Set(), recent: new Set(), prior: new Set(), months: {},
    complaints: Object.fromEntries(Object.keys(COMPLAINTS).map((k) => [k, new Set()])), praise: Object.fromEntries(Object.keys(PRAISE).map((k) => [k, new Set()])),
    overrated: new Set(), praiseQuotes: [], complaintQuotes: [] });
  return B.get(brand);
};
const co = new Map();     // "a|b" -> Set(author)
const prefer = new Map(); // "a>b" -> Set(author)
const needHits = new Map(NEEDS.map((n) => [n.slug, new Map()])); // slug -> brand -> Set(author)

for (const it of items) {
  if (BOTS.has(it.author) || !it.text || PROMO.test(it.text)) continue;
  const text = norm(it.text.replace(/\n/g, " . "));
  const rawLower = it.text.toLowerCase();
  const found = [];
  for (const m of text.matchAll(RE)) {
    const b = brands.get(m[1]);
    if (!b || found.some((f) => f.brand === b.brand)) continue;
    const at = Math.max(0, rawLower.indexOf(m[1].split(" ")[0]));
    if (offTopic(sentenceOf(rawLower, at), text, m.index, m[1])) continue;
    found.push({ brand: b.brand, alias: m[1] });
  }
  if (!found.length) continue;
  const age = NOW - it.created;
  for (const { brand, alias } of found) {
    const s = stat(brand);
    const at = Math.max(0, rawLower.indexOf(alias.split(" ")[0]));
    const sentRaw = sentenceOf(it.text, at);
    const sent = sentRaw.toLowerCase();
    const negative = NEG.test(sent);
    (negative ? s.neg : s.pos).add(it.author);
    s.months[month(it.created)] = (s.months[month(it.created)] || 0) + 1;
    if (age <= 90 * DAY) s.recent.add(it.author); else if (age <= 180 * DAY) s.prior.add(it.author);
    if (OVERRATED.test(sent)) s.overrated.add(it.author);
    let complained = false;
    for (const [k, re] of Object.entries(COMPLAINTS)) if (re.test(sent)) { s.complaints[k].add(it.author); complained = true; }
    if (!negative) for (const [k, re] of Object.entries(PRAISE)) if (re.test(sent)) s.praise[k].add(it.author);
    const quote = { text: clip(sentRaw), url: it.permalink, date: date(it.created), score: it.score || 0, author: it.author };
    // quotes only from comments (post titles are questions/news), and only when the sentence says something
    const okQuote = it.post && quote.text.length >= 35 && !BAD_WORDS.test(quote.text) && quote.url && !/\?\s*$/.test(quote.text)
      && !/^(why|is|are|does|do|should|can|any|which|where|what|how|has|have)\b/i.test(quote.text);
    const soured = negative || /\b(barely|biggest fall|declin\w*|not what it (was|used to be))\b/.test(sent);
    if (okQuote && soured && !/\b(improved|better now|still good)\b/.test(sent)) s.complaintQuotes.push(quote);
    else if (okQuote && !soured && POSITIVE.test(sent)) s.praiseQuotes.push(quote);
    // needs: positive mention + need words in the sentence, or a short direct answer to a thread asking it
    if (!negative) for (const n of NEEDS) {
      if (n.re.test(sent) || (it.ask && n.ask.test(it.ask) && it.text.length < 200)) {
        const per = needHits.get(n.slug);
        if (!per.has(brand)) per.set(brand, new Set());
        per.get(brand).add(it.author);
      }
    }
  }
  // head to head: both places in one comment, and explicit preferences
  const names = found.map((f) => f.brand).filter((b) => kept.has(b));
  for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) {
    const key = [names[i], names[j]].sort().join("|");
    if (!co.has(key)) co.set(key, new Set());
    co.get(key).add(it.author);
  }
  for (const a of found) for (const b of found) {
    if (a.brand === b.brand) continue;
    const re = new RegExp(`\\b${a.alias}\\b( is| was)?( way| much| far| so much)? (better than|over|>) \\b${b.alias}\\b|\\bprefer \\b${a.alias}\\b (over|to) \\b${b.alias}\\b`);
    if (re.test(text)) {
      const key = `${a.brand}>${b.brand}`;
      if (!prefer.has(key)) prefer.set(key, new Set());
      prefer.get(key).add(it.author);
    }
  }
}

// Best quotes: highest upvotes, one per thread, one per author.
function pickQuotes(list, n = 3) {
  const out = [], threads = new Set(), authors = new Set();
  for (const q of list.sort((a, b) => b.score - a.score)) {
    const thread = q.url.split("/comments/")[1]?.split("/")[0];
    if (threads.has(thread) || authors.has(q.author)) continue;
    threads.add(thread); authors.add(q.author);
    out.push({ text: q.text, url: q.url.startsWith("http") ? q.url : `https://www.reddit.com${q.url}`, date: q.date });
    if (out.length >= n) break;
  }
  return out;
}
const counts = (obj) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, v.size]).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]));
function trend(s) {
  const r = s.recent.size, p = s.prior.size;
  const label = r >= 3 && r >= p * 1.3 ? "rising" : p >= 3 && r <= p * 0.7 ? "cooling" : "steady";
  return { recent90: r, prior90: p, label };
}

const brandOut = {};
for (const [brand, k] of kept) {
  const s = B.get(brand);
  if (!s) continue;
  brandOut[brand] = {
    name: displayName(brand),
    // the shortlist's branches when we curated this brand (drops same-name strangers like other "Bahar" cafes)
    ids: ((all) => (all.some((id) => shortlistName.has(id)) ? all.filter((id) => shortlistName.has(id)) : all))([...(brandIds.get(brand) || [])]),
    locals: k.locals, negatives: k.negatives,
    dishes: k.dishes || [],
    trend: trend(s),
    overrated: s.overrated.size,
    complaints: counts(s.complaints),
    praise: counts(s.praise),
    quotes: { praise: pickQuotes(s.praiseQuotes), complaints: pickQuotes(s.complaintQuotes, 2) },
  };
}

// Pages (gated + capped).
const pages = [];
const ranked = Object.entries(brandOut).sort((a, b) => b[1].locals - a[1].locals);
for (const [brand, b] of ranked.filter(([, b]) => b.locals >= 8 && b.dishes.filter((d) => d.people >= 2).length >= 2).slice(0, 15)) {
  pages.push({ slug: `what-to-order-at-${slug(b.name)}`, type: "what-to-order", brands: [brand] });
}
const complaintsOf = (b) => Object.values(b.complaints).reduce((s, n) => s + n, 0) + b.negatives;
for (const [brand, b] of ranked.filter(([, b]) => b.locals >= 15 && complaintsOf(b) >= 3).sort((a, b) => complaintsOf(b[1]) - complaintsOf(a[1])).slice(0, 10)) {
  const overrated = b.overrated >= 3;
  pages.push({ slug: overrated ? `is-${slug(b.name)}-overrated` : `is-${slug(b.name)}-worth-it`, type: "worth-it", overrated, brands: [brand] });
}
const pairs = [...co].filter(([, a]) => a.size >= 10).sort((a, b) => b[1].size - a[1].size).slice(0, 8);
for (const [key, authors] of pairs) {
  const [a, b] = key.split("|");
  if (!brandOut[a] || !brandOut[b]) continue;
  const ab = prefer.get(`${a}>${b}`)?.size || 0, ba = prefer.get(`${b}>${a}`)?.size || 0;
  const [x, y] = brandOut[a].locals >= brandOut[b].locals ? [a, b] : [b, a];
  pages.push({ slug: `${slug(brandOut[x].name)}-vs-${slug(brandOut[y].name)}`, type: "vs", brands: [x, y], together: authors.size,
    prefer: { [a]: ab, [b]: ba } });
}
for (const n of NEEDS) {
  const per = needHits.get(n.slug);
  const list = [...per].filter(([brand, a]) => brandOut[brand] && a.size >= (n.min || 2) && (!n.filter || n.filter(brandOut[brand].ids)))
    .sort((a, b) => b[1].size - a[1].size).slice(0, 10).map(([brand, a]) => ({ brand, people: a.size }));
  if (list.length >= 4) pages.push({ slug: n.slug, type: "need", need: n.need, places: list, brands: list.map((l) => l.brand) });
}

const used = new Set(pages.flatMap((p) => p.brands));
const out = {
  updatedAt: new Date().toISOString(), source: "r/hyderabad", months: raw.months, threads: raw.posts.length, comments: raw.comments.length,
  brands: Object.fromEntries(Object.entries(brandOut).filter(([b]) => used.has(b))),
  pages,
};
fs.writeFileSync(path.join(ROOT, "data/reddit-questions.json"), JSON.stringify(out, null, 1));
const by = pages.reduce((m, p) => ({ ...m, [p.type]: (m[p.type] || 0) + 1 }), {});
console.log(`[questions] ${pages.length} pages ${JSON.stringify(by)} · ${Object.keys(out.brands).length} brands`);
for (const p of pages) console.log(`  ${p.type.padEnd(13)} /ask/${p.slug}`);
