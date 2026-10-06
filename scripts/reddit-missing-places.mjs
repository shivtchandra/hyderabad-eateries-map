/**
 * Places r/hyderabad recommends that aren't on our map yet (report only, never adds).
 * Finds capitalised names (1-4 words) in positive comments from 5+ different people that
 * match none of our place aliases, e.g. "Maks Kitchen". Review in admin, add the real ones.
 * Input: data/reddit/raw.json, data/eateries.json · Output: data/reddit-missing-places.json
 */
import fs from "fs";
import path from "path";
import { ROOT, items, norm, brands, NEG, PROMO, BOTS } from "./lib/redditMatch.mjs";

const known = new Set([...brands.keys()]);
const STOP = new Set(("i the a an and or but if so to of in on at for with my our your their his her it this that these those is was are were be " +
  "hyderabad hyd secunderabad telangana india reddit edit update also try tried go went best good great nice love really very just " +
  "biryani haleem mandi chai coffee dosa idli pizza burger shawarma chicken mutton veg food restaurant cafe hotel place places " +
  "monday tuesday wednesday thursday friday saturday sunday january february march april may june july august september october november december " +
  "ramzan ramadan eid diwali swiggy zomato google maps instagram uber ola rapido metro road hills nagar city old new").split(" "));
const FOODY = /\b(biryani|haleem|mandi|kitchen|cafe|restaurant|hotel|dhaba|mess|tiffins?|bakery|grill|house|point|corner|bar|pub|brewery|food|eats?|try|tried|recommend|best|go to|amazing|love)\b/i;
const NAME = /\b([A-Z][a-zA-Z'&]+(?:\s+(?:[A-Z][a-zA-Z'&]+|&|of|the|ka|ki)){0,3})\b/g;
const BRAND_SUFFIX = /\b(kitchen|cafe|restaurant|hotel|dhaba|mess|tiffins?|bakery|grill|house|point|corner|bar|pub|brewery|biryani|mandi)$/i;

const seen = new Map(); // name -> { authors:Set, examples: [] }
for (const it of items) {
  if (BOTS.has(it.author) || !it.text || !it.post || PROMO.test(it.text) || !FOODY.test(it.text)) continue;
  for (const sent of it.text.split(/(?<=[.!?\n])/)) {
    if (NEG.test(sent.toLowerCase())) continue;
    for (const m of sent.matchAll(NAME)) {
      const name = m[1].replace(/\s+(of|the|ka|ki|&)$/i, "").trim();
      const key = norm(name);
      const words = key.split(" ");
      if (key.length < 4 || words.every((w) => STOP.has(w)) || known.has(key) || words.some((w) => known.has(w)) || known.has(words.filter((w) => !STOP.has(w)).join(" "))) continue;
      if (words.length === 1 && !/^[A-Z][a-z]+s$/.test(name) && STOP.has(key)) continue;
      if (!seen.has(key)) seen.set(key, { name, authors: new Set(), examples: [], suffix: BRAND_SUFFIX.test(name) });
      const e = seen.get(key);
      e.authors.add(it.author);
      if (e.examples.length < 2) e.examples.push({ text: sent.trim().slice(0, 160), url: it.permalink });
    }
  }
}
// Multi-word names only ("Maks Kitchen", "Naidu Gari Kunda"): single capitalised words are mostly sentence starts.
const multi = (e) => e.name.split(/\s+/).length >= 2 && !e.name.split(/\s+/).some((w) => STOP.has(norm(w)) && !BRAND_SUFFIX.test(w));
const out = [...seen.values()].filter((e) => e.authors.size >= (e.suffix ? 3 : 5) && multi(e))
  .sort((a, b) => b.authors.size - a.authors.size).slice(0, 80)
  .map((e) => ({ name: e.name, people: e.authors.size, looksLikePlace: e.suffix, examples: e.examples }));
fs.writeFileSync(path.join(ROOT, "data/reddit-missing-places.json"), JSON.stringify({ updatedAt: new Date().toISOString(), note: "Report only. Check each name before adding it to the map.", candidates: out }, null, 1));
console.log(`[missing] ${out.length} candidates`);
console.log(out.slice(0, 25).map((e) => `  ${e.people} ${e.name}${e.looksLikePlace ? "" : " (?)"}`).join("\n"));
