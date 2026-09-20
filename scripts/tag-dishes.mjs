/**
 * Name-keyword dish/cuisine tagging pass. Zero API cost — scans each spot's
 * name for known dish/cuisine keywords and appends matching tags.
 *
 * This is the cheap first tier: catches spots that name their dish
 * ("Bangaru Babu Biryani"), misses spots that don't. A richer pass (Zomato
 * menu scrape + LLM classify) is scoped separately for full coverage.
 *
 * Run:  node scripts/tag-dishes.mjs
 *       DRY=1 node scripts/tag-dishes.mjs   # report only, no write
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_PATH = path.join(__dirname, "..", "data", "eateries.json");
const DRY = process.env.DRY === "1";

// keyword -> tag. Multiple keywords can fold into the same tag (synonyms/plurals).
// Only keywords with meaningful name-frequency and not already implied by
// category (bakery/cake/cream skipped — category already covers those).
const KEYWORD_RULES = [
  { tag: "biryani", kw: ["biryani"] },
  { tag: "tiffin", kw: ["tiffin"] },
  { tag: "dosa", kw: ["dosa"] },
  { tag: "mandi", kw: ["mandi"] },
  { tag: "shawarma", kw: ["shawarma"] },
  { tag: "arabian", kw: ["arabian"] },
  { tag: "irani", kw: ["irani"] },
  { tag: "chai", kw: ["chai", " tea "] },
  { tag: "juice", kw: ["juice"] },
  { tag: "mithai", kw: ["mithai", "sweets", " sweet "] },
  { tag: "thai", kw: ["thai"] },
  { tag: "waffle", kw: ["waffle"] },
  { tag: "lassi", kw: ["lassi"] },
  { tag: "kebab", kw: ["kebab", "kabab"] },
  { tag: "chinese", kw: ["chinese"] },
  { tag: "haleem", kw: ["haleem"] },
  { tag: "tandoor", kw: ["tandoor"] },
  { tag: "dhaba", kw: ["dhaba"] },
  { tag: "momo", kw: ["momo"] },
  { tag: "andhra", kw: ["andhra"] },
  { tag: "chaat", kw: ["chaat"] },
  { tag: "kulfi", kw: ["kulfi"] },
  { tag: "grill", kw: ["grill"] },
];

function matchTags(name) {
  const n = ` ${name.toLowerCase()} `;
  const tags = [];
  for (const rule of KEYWORD_RULES) {
    if (rule.kw.some((k) => n.includes(k))) tags.push(rule.tag);
  }
  return tags;
}

const eateries = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));

let touched = 0;
const added = {};
for (const e of eateries) {
  const matched = matchTags(e.name || "");
  if (!matched.length) continue;
  const existing = new Set(e.tags || []);
  let changed = false;
  for (const t of matched) {
    if (!existing.has(t)) { existing.add(t); changed = true; added[t] = (added[t] || 0) + 1; }
  }
  if (changed) { e.tags = [...existing]; touched++; }
}

console.log(`spots touched: ${touched} / ${eateries.length}`);
console.log("tags added:", added);

const withAnyTags = eateries.filter((e) => e.tags?.length).length;
console.log(`spots with any tags now: ${withAnyTags} / ${eateries.length}`);

if (!DRY) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(eateries, null, 2));
  console.log("written.");
} else {
  console.log("DRY run, not written.");
}
