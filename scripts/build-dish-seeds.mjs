/**
 * Seed "Must order" dishes per spot from our own editorial and the Reddit guides,
 * so the dish block isn't empty before locals start voting.
 *
 * Sources (in priority order):
 *   editor  data/venue-content.json mustOrder, eateries.json mustTry
 *   reddit  app/guides/*-reddit/page.jsx SPOTS[].whatToOrder (r/hyderabad consensus)
 *
 * Writes data/dish-seeds.json: { spotId: [{ name, source }] }
 * Run: node scripts/build-dish-seeds.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), "utf8"));

const eateries = read("data/eateries.json").filter((e) => e.status === "approved");
const venue = read("data/venue-content.json");
const venues = venue.venues || venue;

const clean = (s) => s.replace(/\(.*?\)/g, "").replace(/\s+/g, " ").replace(/^(and|or)\s+/i, "").replace(/[.;:]+$/, "").trim();
const split = (s) => String(s || "").split(/,|;|\s+&\s+(?=[A-Z])|\s+and\s+(?=[A-Z])|\/(?=\s*[A-Z])|\.\s+/).map(clean).filter((x) => x.length > 2 && x.length < 48);
const key = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const seeds = {};
function add(id, name, source) {
  if (!id || !name) return;
  const list = (seeds[id] ||= []);
  if (list.some((d) => key(d.name) === key(name))) return;
  if (list.length < 6) list.push({ name, source });
}

// Editor: venue write-ups, then eateries mustTry.
for (const [id, v] of Object.entries(venues)) for (const d of v.mustOrder || []) add(id, clean(d.name), "editor");
for (const e of eateries) for (const d of split(e.mustTry)) add(e.id, d, "editor");

// Reddit guides: map /spot/<slug> -> id by matching our slug scheme loosely.
const slugOf = (e) => (e.name + " " + (e.area || e.discoveredIn || "")).toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const bySlug = new Map(eateries.map((e) => [slugOf(e), e.id]));
const byName = new Map(eateries.map((e) => [key(e.name), e.id]));
let redditHits = 0, redditMiss = [];
const guidesDir = path.join(ROOT, "app", "guides");
for (const dir of fs.readdirSync(guidesDir)) {
  const file = path.join(guidesDir, dir, "page.jsx");
  if (!fs.existsSync(file) || !/reddit/.test(dir)) continue;
  const src = fs.readFileSync(file, "utf8");
  for (const block of src.split(/\n\s*\{\s*\n\s*id:/).slice(1)) {
    const name = (block.match(/name:\s*"([^"]+)"/) || [])[1];
    const href = (block.match(/href:\s*"\/spot\/([^"]+)"/) || [])[1];
    const order = (block.match(/whatToOrder:\s*"([^"]+)"/) || [])[1];
    if (!order) continue;
    const loose = name && eateries.find((e) => key(e.name).startsWith(key(name)));
    const id = (href && bySlug.get(href)) || (name && byName.get(key(name))) || loose?.id;
    if (!id) { redditMiss.push(name || href); continue; }
    redditHits++;
    for (const d of split(order)) add(id, d, "reddit");
  }
}

fs.writeFileSync(path.join(ROOT, "data", "dish-seeds.json"), JSON.stringify(seeds, null, 1));
const total = Object.values(seeds).reduce((s, l) => s + l.length, 0);
console.log(`dish-seeds: ${Object.keys(seeds).length} spots, ${total} dishes (${redditHits} Reddit guide spots matched)`);
if (redditMiss.length) console.log(`Reddit spots not matched to the map: ${redditMiss.join(", ")}`);
