/**
 * Locals' picks from r/hyderabad: match real comments to our spots and score them.
 * No AI and no Google data: names are matched literally, and every pick links back to
 * the comments that earned it.
 *
 * Input:  data/reddit/raw.json (scripts/reddit-collect.mjs), data/eateries.json
 * Output: data/reddit-picks.json      (full: per spot evidence, for spot pages)
 *         public/locals-picks.json    (tiny: id → locals count, for the map filter)
 *
 * Rules (honest + hard to game):
 *  - count distinct people, not comments; deleted/bot/promo authors don't count
 *  - promo-looking text (insta/youtube links, "use code", "our restaurant", "DM us") is dropped
 *  - a mention is negative if its sentence says avoid / overrated / worst / went downhill …
 *  - recency-weighted (≤6 mo 1.0, ≤12 mo 0.75, older 0.5), upvotes add at most +0.5 per person
 *  - a place needs ≥3 different people positive, and positives ≥ 2× negatives
 */
import fs from "fs";
import path from "path";
import { ROOT, raw, NOW, MIN_PEOPLE, norm, brands, RE, PROMO, NEG, DISHES_B, BOTS, sentenceOf, items, brandIds, offTopic } from "./lib/redditMatch.mjs";

const recencyW = (t) => { const mo = (NOW - t) / (30.4 * 86400); return mo <= 6 ? 1 : mo <= 12 ? 0.75 : 0.5; };

// people[brand] = Map(author -> { pos, neg, w, best })
const people = new Map();
let matched = 0, promo = 0;
for (const it of items) {
  if (BOTS.has(it.author) || !it.text) continue;
  if (PROMO.test(it.text)) { promo++; continue; }
  const text = norm(it.text.replace(/\n/g, " . "));
  const rawLower = it.text.toLowerCase();
  const seen = new Set();
  for (const m of text.matchAll(RE)) {
    const b = brands.get(m[1]);
    if (!b || seen.has(b.brand)) continue;
    const sent = sentenceOf(rawLower, Math.max(0, rawLower.indexOf(m[1].split(" ")[0])));
    if (offTopic(sent, text, m.index, m[1])) continue;
    seen.add(b.brand);
    matched++;
    const negative = NEG.test(sent);
    if (!people.has(b.brand)) people.set(b.brand, new Map());
    const per = people.get(b.brand);
    const cur = per.get(it.author) || { pos: false, neg: false, w: 0, best: null, last: 0 };
    if (negative) cur.neg = true; else cur.pos = true;
    const w = recencyW(it.created) + Math.min(Math.log10(1 + Math.max(0, it.score || 0)) / 2, 0.5);
    if (!negative && w > cur.w) cur.w = w;
    if (!negative) {
      const at = rawLower.indexOf(m[1].split(" ")[0]);
      const win = rawLower.slice(Math.max(0, at - 140), at + m[1].length + 140) + "\n" + (it.ask || "");
      cur.dishes = cur.dishes || new Set();
      for (const [label, re] of Object.entries(DISHES_B)) if (re.test(win)) cur.dishes.add(label);
      // "Biryani" is the umbrella; drop it when a specific biryani was named
      if (cur.dishes.has("Mutton biryani") || cur.dishes.has("Chicken biryani")) cur.dishes.delete("Biryani");
    }
    if (!negative && (!cur.best || (it.score || 0) > cur.best.score)) cur.best = { url: it.permalink, date: new Date(it.created * 1000).toISOString().slice(0, 10), score: it.score || 0 };
    cur.last = Math.max(cur.last, it.created);
    per.set(it.author, cur);
  }
}

const picks = {};
const byDish = {};
const light = {};
let kept = 0;
for (const [brand, per] of people) {
  const pos = [...per.values()].filter((p) => p.pos && !p.neg);
  const neg = [...per.values()].filter((p) => p.neg && !p.pos);
  if (pos.length < MIN_PEOPLE || pos.length < 2 * neg.length) continue;
  kept++;
  const score = Math.round((pos.reduce((s, p) => s + p.w, 0) - neg.length) * 100) / 100;
  const last = Math.max(...pos.map((p) => p.last));
  const evidence = pos.map((p) => p.best).filter(Boolean).sort((a, b) => b.score - a.score).slice(0, 4);
  const dishCount = {};
  for (const p of pos) for (const d of p.dishes || []) dishCount[d] = (dishCount[d] || 0) + 1;
  const dishes = Object.entries(dishCount).filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([dish, people]) => ({ dish, people }));
  for (const { dish, people } of dishes) (byDish[dish] ||= []).push({ brand, people, ids: [...(brandIds.get(brand) || [])] });
  for (const id of brandIds.get(brand) || []) {
    picks[id] = { brand, locals: pos.length, negatives: neg.length, score, lastMentioned: new Date(last * 1000).toISOString().slice(0, 7), dishes, evidence };
    light[id] = pos.length;
  }
}

for (const d of Object.keys(byDish)) byDish[d] = byDish[d].sort((a, b) => b.people - a.people).slice(0, 15);
const out = { updatedAt: new Date().toISOString(), source: "r/hyderabad", months: raw.months, threads: raw.posts.length, comments: raw.comments.length, spots: picks, byDish };
fs.writeFileSync(path.join(ROOT, "data/reddit-picks.json"), JSON.stringify(out, null, 1));
fs.writeFileSync(path.join(ROOT, "public/locals-picks.json"), JSON.stringify({ updatedAt: out.updatedAt, spots: light }));
const top = Object.values(picks).filter((p, i, a) => a.findIndex((q) => q.brand === p.brand) === i).sort((a, b) => b.score - a.score);
console.log(`[picks] ${raw.posts.length} threads · ${items.length} texts · ${matched} mentions · ${promo} promo dropped · ${kept} brands kept → ${Object.keys(picks).length} spots`);
console.log(top.slice(0, 25).map((p) => `${p.brand} (${p.locals} locals, -${p.negatives}, ${p.lastMentioned})`).join("\n"));
