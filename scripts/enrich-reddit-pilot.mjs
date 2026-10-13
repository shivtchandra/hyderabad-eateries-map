/**
 * Enrichment pilot from r/hyderabad (no AI, no Google calls): for spots in the
 * four biggest areas, read every comment that names them and pull out what
 * locals say about the place, not just whether they recommend it:
 *   - dishes named next to it (same dish words as reddit-picks)
 *   - vibe: work-friendly, quiet, date, view, family, late night, crowded
 *   - price: "cheap / value" vs "pricey" mentions and any ₹ amounts
 *   - the best short quote (with its link)
 * Same honesty rules as reddit-picks: distinct people, no promo/bot text,
 * negative sentences don't count as praise. A vibe needs 2+ different people.
 *
 * Input:  data/reddit/raw.json, data/eateries.json
 * Output: data/enrich/reddit-pilot.json + a coverage report on stdout
 *   node scripts/enrich-reddit-pilot.mjs
 *   node scripts/enrich-reddit-pilot.mjs --all   (every area; also writes
 *     data/locals-dishes.json: the dishes 2+ locals name, for Must order + Ask Eats)
 */
import fs from "fs";
import path from "path";
import { ROOT, eateries, norm, brands, RE, PROMO, NEG, DISHES_B, BOTS, sentenceOf, items, brandIds, offTopic } from "./lib/redditMatch.mjs";

const AREAS = ["Gachibowli", "Madhapur/HITEC", "Madhapur", "Jubilee Hills", "Banjara Hills"];
const VIBES = {
  "work-friendly": /\b(work from|wfh|laptop|working (here|there|from)|wifi|wi fi|charging points?|plug points?|sockets?)\b/,
  quiet: /\b(quiet|peaceful|calm|not (too )?crowded|less crowded|cozy|cosy)\b/,
  date: /\b(date|romantic|anniversary|with (my )?(partner|gf|bf|girlfriend|boyfriend|wife|husband))\b/,
  view: /\b(rooftop|roof top|lake view|great view|nice view|skyline)\b/,
  family: /\b(family|families|with kids|with parents|kid friendly)\b/,
  "late-night": /\b(late night|midnight|open till|24 ?[\/x] ?7|after 12|till 2|till 3|2 ?am|3 ?am)\b/,
  crowded: /\b(crowded|long wait|waiting time|queue|always packed|rush)\b/,
};
const CHEAP = /\b(cheap|affordable|budget|value for money|vfm|pocket friendly|reasonabl[ey]|worth the price)\b/;
const PRICEY = /\b(expensive|pricey|overpriced|over priced|costly)\b/;
const AMOUNT = /(?:₹|\brs\.? ?|\binr ?)(\d{2,4})\b/g;

const ALL = process.argv.includes("--all");
const inPilot = (e) => ALL || AREAS.includes(e.discoveredIn);
const pilot = eateries.filter(inPilot);
const pilotIds = new Set(pilot.map((e) => e.id));

// brand -> { people: Map(author -> {dishes,vibes,cheap,pricey,amounts}), quotes: [] }
const per = new Map();
for (const it of items) {
  if (BOTS.has(it.author) || !it.text || PROMO.test(it.text)) continue;
  const text = norm(it.text.replace(/\n/g, " . "));
  const rawLower = it.text.toLowerCase();
  const seen = new Set();
  for (const m of text.matchAll(RE)) {
    const b = brands.get(m[1]);
    if (!b || seen.has(b.brand)) continue;
    if (![...(brandIds.get(b.brand) || [])].some((id) => pilotIds.has(id))) continue;
    const at = Math.max(0, rawLower.indexOf(m[1].split(" ")[0]));
    const sent = sentenceOf(rawLower, at);
    if (offTopic(sent, text, m.index, m[1]) || NEG.test(sent)) continue;
    seen.add(b.brand);
    const win = rawLower.slice(Math.max(0, at - 160), at + m[1].length + 160) + "\n" + (it.ask || "");
    const rec = per.get(b.brand) || { people: new Map(), quotes: [] };
    const p = rec.people.get(it.author) || { dishes: new Set(), vibes: new Set(), cheap: false, pricey: false, amounts: [] };
    for (const [label, re] of Object.entries(DISHES_B)) if (re.test(win)) p.dishes.add(label);
    if (p.dishes.has("Mutton biryani") || p.dishes.has("Chicken biryani")) p.dishes.delete("Biryani");
    for (const [tag, re] of Object.entries(VIBES)) if (re.test(win)) p.vibes.add(tag);
    if (CHEAP.test(win)) p.cheap = true;
    if (PRICEY.test(win)) p.pricey = true;
    for (const a of win.matchAll(AMOUNT)) { const n = Number(a[1]); if (n >= 50 && n <= 5000) p.amounts.push(n); }
    rec.people.set(it.author, p);
    // A quote: the sentence that names the place, if it says something.
    const q = it.text.slice(Math.max(0, it.text.toLowerCase().lastIndexOf(".", at) + 1)).split(/(?<=[.!?])\s|\n/)[0].trim();
    if (q.length >= 40 && q.length <= 170 && !/http/.test(q)) rec.quotes.push({ text: q, url: it.permalink, score: it.score || 0 });
    per.set(b.brand, rec);
  }
}

const median = (xs) => { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
const spots = {};
for (const e of pilot) {
  const brand = [...brandIds.entries()].find(([, ids]) => ids.has(e.id))?.[0];
  const rec = brand && per.get(brand);
  if (!rec) continue;
  const ppl = [...rec.people.values()];
  const count = (fn) => ppl.filter(fn).length;
  const dishC = {}; const vibeC = {};
  for (const p of ppl) { p.dishes.forEach((d) => (dishC[d] = (dishC[d] || 0) + 1)); p.vibes.forEach((v) => (vibeC[v] = (vibeC[v] || 0) + 1)); }
  spots[e.id] = {
    name: e.name, area: e.discoveredIn, brand, people: ppl.length,
    dishes: Object.entries(dishC).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([dish, people]) => ({ dish, people })),
    vibes: Object.entries(vibeC).filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]).map(([tag, people]) => ({ tag, people })),
    price: { cheap: count((p) => p.cheap), pricey: count((p) => p.pricey), median: median(ppl.flatMap((p) => p.amounts)) },
    quote: rec.quotes.sort((a, b) => b.score - a.score)[0] || null,
  };
}

// Labels that name a kind of place, not something to order there.
const GENERIC = new Set(["Cocktails / bar", "Coffee", "Bakery / cakes", "Desserts", "Ice cream", "Breakfast", "Late night", "Buffet", "Healthy / salads", "Vegan"]);
if (ALL) {
  const lean = {};
  for (const [id, s] of Object.entries(spots)) {
    const d = s.dishes.filter((x) => x.people >= 2 && !GENERIC.has(x.dish)).slice(0, 4);
    if (d.length) lean[id] = d;
  }
  fs.writeFileSync(path.join(ROOT, "data", "locals-dishes.json"), JSON.stringify({
    _about: "Dishes 2+ different r/hyderabad locals name next to a spot (brand level). Built by scripts/enrich-reddit-pilot.mjs --all. Shown in Must order and used by Ask Eats.",
    updatedAt: new Date().toISOString(), spots: lean,
  }, null, 1));
  console.log(`locals-dishes.json: ${Object.keys(lean).length} spots`);
}
const OUT = path.join(ROOT, "data", "enrich", ALL ? "reddit-all.json" : "reddit-pilot.json");
fs.mkdirSync(path.dirname(OUT), { recursive: true });
const vals = Object.values(spots);
const stats = {
  pilotSpots: pilot.length,
  mentioned: vals.length,
  mentioned2plus: vals.filter((s) => s.people >= 2).length,
  withDishes: vals.filter((s) => s.dishes.length).length,
  withVibe: vals.filter((s) => s.vibes.length).length,
  withPrice: vals.filter((s) => s.price.cheap + s.price.pricey > 0 || s.price.median).length,
  withQuote: vals.filter((s) => s.quote).length,
};
fs.writeFileSync(OUT, JSON.stringify({ updatedAt: new Date().toISOString(), source: "r/hyderabad", areas: AREAS, stats, spots }, null, 2));
console.log(JSON.stringify(stats, null, 1));
for (const s of vals.sort((a, b) => b.people - a.people).slice(0, 12)) {
  console.log(`\n${s.name} (${s.area}) · ${s.people} people`);
  if (s.dishes.length) console.log("  dishes:", s.dishes.map((d) => `${d.dish} ${d.people}`).join(", "));
  if (s.vibes.length) console.log("  vibe:  ", s.vibes.map((v) => `${v.tag} ${v.people}`).join(", "));
  console.log("  price: ", `cheap ${s.price.cheap} · pricey ${s.price.pricey}${s.price.median ? ` · ~₹${s.price.median}` : ""}`);
  if (s.quote) console.log("  quote: ", `"${s.quote.text}"`);
}
