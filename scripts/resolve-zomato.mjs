/**
 * Resolve real Zomato listing URLs.
 *
 * Every row's `zomatoUrl` was a fabricated search-query link — useful as a
 * "search this on Zomato" button, useless for scraping offers. Zomato slugs are
 * predictable (`/hyderabad/<name>-<area>`), so we generate candidates and keep
 * whichever returns 200. A plain fetch is enough to tell a real slug from a
 * 404, so this costs no Firecrawl credits.
 *
 * Writes `zomatoSlugUrl` (verified) and `zomatoResolvedAt`. Rows that fail are
 * marked so they aren't retried every day.
 *
 * Run:  node scripts/resolve-zomato.mjs
 *       LIMIT=50 node scripts/resolve-zomato.mjs
 *       RETRY=1 node scripts/resolve-zomato.mjs   # re-attempt past failures
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(__dirname, "..", "data", "eateries.json");
const LIMIT = process.env.LIMIT ? Number(process.env.LIMIT) : Infinity;
const RETRY = process.env.RETRY === "1";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

const slug = (s) =>
  (s || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[''`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// Zomato slugs are `name` or `name-locality`, and the locality is whichever
// neighbourhood Zomato filed it under — which can be any segment of the
// address, not the one our grid happened to discover it from. (Hotel Shadab is
// `hotel-shadab-ghansi-bazaar`.) So try every plausible address token, most
// specific first, and strip our own trailing "- Branch" suffixes too.
function candidates(e) {
  const raw = (e.name || "").replace(/\s*[-|·]\s*[^-|·]+$/, "");
  const names = [...new Set([slug(e.name), slug(raw)])].filter(Boolean);
  if (!names.length) return [];

  const parts = (e.address || "")
    .split(",")
    .map((s) => slug(s))
    .filter((s) => s && s.length > 3 && !/^\d/.test(s) && !/hyderabad|telangana|india|road|rd|street|floor|plot|opp|near/.test(s));

  const area = slug((e.discoveredIn || "").replace(/^text:.*$/, ""));
  const localities = [...new Set([area, ...parts])].filter(Boolean);

  const out = [];
  for (const n of names) {
    for (const loc of localities) if (!n.endsWith(loc)) out.push(`${n}-${loc}`);
    out.push(n);
  }
  return [...new Set(out)].slice(0, 6).map((s) => `https://www.zomato.com/hyderabad/${s}`);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function exists(url) {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: { "User-Agent": UA, "Accept-Language": "en-IN,en;q=0.9" },
      signal: AbortSignal.timeout(12000),
    });
    return res.status === 200;
  } catch {
    return null; // network error — distinct from a definitive 404
  }
}

const all = JSON.parse(fs.readFileSync(DATA, "utf-8"));

// Highest-scoring first: those are the spots users actually see as hero pins.
const score = (e) => (e.rating ?? 0) * Math.log10((e.ratingCount ?? 0) + 10);
const todo = all
  .filter((e) => (RETRY ? !e.zomatoSlugUrl : !e.zomatoResolvedAt))
  .sort((a, b) => score(b) - score(a))
  .slice(0, LIMIT);

console.log(`${all.length} total | ${todo.length} to resolve`);

let hit = 0, miss = 0;
for (const e of todo) {
  let found = null;
  for (const url of candidates(e)) {
    const ok = await exists(url);
    await sleep(350); // be a polite guest
    if (ok) { found = url; break; }
  }
  e.zomatoSlugUrl = found;
  e.zomatoResolvedAt = new Date().toISOString();
  found ? hit++ : miss++;

  if ((hit + miss) % 25 === 0) {
    console.log(`  ${hit + miss}/${todo.length}  resolved ${hit}`);
    fs.writeFileSync(DATA, JSON.stringify(all, null, 2));
  }
}

fs.writeFileSync(DATA, JSON.stringify(all, null, 2));
console.log(`\nresolved ${hit}, unresolved ${miss}`);
console.log(`total with a real Zomato URL: ${all.filter((e) => e.zomatoSlugUrl).length}`);
