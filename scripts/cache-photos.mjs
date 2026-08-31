/**
 * Download one Google Place photo per spot and store it locally.
 *
 * Why: photo pins and photo cards are the core of the visual design, but the
 * Place Photo API bills per request — fetching on every pan/zoom would be both
 * slow and expensive. These are static images that rarely change, so we pay the
 * API cost once and serve from disk forever after.
 *
 * Resumable: existing files are skipped, so re-running only fills gaps.
 *
 * Run:  node scripts/cache-photos.mjs
 *       LIMIT=20 node scripts/cache-photos.mjs    # test slice
 *       WIDTH=320 node scripts/cache-photos.mjs   # override size
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, "..", ".env.local") });

const KEY = process.env.GOOGLE_MAPS_API_KEY;
if (!KEY) { console.error("GOOGLE_MAPS_API_KEY missing"); process.exit(1); }

const WIDTH = Number(process.env.WIDTH ?? 320);
const LIMIT = process.env.LIMIT ? Number(process.env.LIMIT) : Infinity;
const DATA = path.join(__dirname, "..", "data", "eateries.json");
const OUT = path.join(__dirname, "..", "public", "photos");

fs.mkdirSync(OUT, { recursive: true });

const all = JSON.parse(fs.readFileSync(DATA, "utf-8"));

// Highest-ranked first, so an interrupted run still covers what users see most.
const score = (e) => (e.rating ?? 0) * Math.log10((e.ratingCount ?? 0) + 10);
const todo = all
  .filter((e) => e.photoRef)
  .sort((a, b) => score(b) - score(a))
  .filter((e) => !fs.existsSync(path.join(OUT, `${e.id}.jpg`)))
  .slice(0, LIMIT);

console.log(`${all.length} spots | ${todo.length} photos to fetch (width ${WIDTH})`);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ok = 0, fail = 0;

for (const e of todo) {
  const url =
    `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${WIDTH}` +
    `&photo_reference=${e.photoRef}&key=${KEY}`;
  try {
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 1000) throw new Error("suspiciously small");
    fs.writeFileSync(path.join(OUT, `${e.id}.jpg`), buf);
    ok++;
  } catch {
    fail++;
  }
  if ((ok + fail) % 100 === 0) console.log(`  ${ok + fail}/${todo.length} (ok ${ok}, fail ${fail})`);
  await sleep(60);
}

const files = fs.readdirSync(OUT).filter((f) => f.endsWith(".jpg"));
const mb = files.reduce((n, f) => n + fs.statSync(path.join(OUT, f)).size, 0) / 1048576;
console.log(`\nfetched ${ok}, failed ${fail}`);
console.log(`cache: ${files.length} photos, ${mb.toFixed(1)} MB`);
