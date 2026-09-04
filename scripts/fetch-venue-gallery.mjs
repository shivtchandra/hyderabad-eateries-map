/**
 * Fetch a multi-photo gallery (hero + gallery) for a handful of featured venues
 * and record the filenames in data/venue-content.json.
 *
 * Why: the single 320px thumbnail from cache-photos.mjs is enough for map pins,
 * but the full-blown /spot/[id] pages for high-search venues (Niloufer, Nimrah,
 * Rameshwaram, Heart Cup) need real, higher-res imagery. Google Place Details
 * returns up to 10 photo_references per place; we pull several at maxwidth=1200
 * and cache them on disk once (the Photo API bills per request).
 *
 * Resumable: existing gallery files are skipped, so re-running only fills gaps.
 *
 * Run:  node scripts/fetch-venue-gallery.mjs
 *       IDS=placeId1,placeId2 node scripts/fetch-venue-gallery.mjs   # override set
 *       MAX=8 node scripts/fetch-venue-gallery.mjs                   # photos per venue
 *       WIDTH=1600 node scripts/fetch-venue-gallery.mjs              # override size
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, "..", ".env.local") });

const KEY = process.env.GOOGLE_MAPS_API_KEY;
if (!KEY) { console.error("GOOGLE_MAPS_API_KEY missing"); process.exit(1); }

const WIDTH = Number(process.env.WIDTH ?? 1200);
const MAX = Number(process.env.MAX ?? 6);
const CONTENT = path.join(__dirname, "..", "data", "venue-content.json");
const OUT = path.join(__dirname, "..", "public", "photos", "gallery");

const content = JSON.parse(fs.readFileSync(CONTENT, "utf-8"));
const ids = process.env.IDS ? process.env.IDS.split(",").map((s) => s.trim()) : Object.keys(content);

fs.mkdirSync(OUT, { recursive: true });

async function placePhotos(placeId) {
  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", "photos");
  url.searchParams.set("key", KEY);
  const res = await fetch(url);
  const data = await res.json();
  if (data.status !== "OK") return [];
  return (data.result?.photos ?? []).map((p) => p.photo_reference);
}

async function fetchPhoto(ref) {
  const url =
    `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${WIDTH}` +
    `&photo_reference=${ref}&key=${KEY}`;
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 1000) throw new Error("suspiciously small");
  return buf;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

console.log(`${ids.length} venue(s) | up to ${MAX} photos each (width ${WIDTH})`);

let ok = 0, fail = 0;
for (const id of ids) {
  const refs = (await placePhotos(id)).slice(0, MAX);
  const files = [];
  for (let i = 0; i < refs.length; i++) {
    const name = `${id}-${i + 1}.jpg`;
    const dest = path.join(OUT, name);
    if (fs.existsSync(dest)) { files.push(name); continue; }
    try {
      fs.writeFileSync(dest, await fetchPhoto(refs[i]));
      files.push(name);
      ok++;
    } catch (e) {
      fail++;
      console.warn(`  ${name}: ${e.message}`);
    }
    await sleep(80);
  }
  content[id] = { ...(content[id] || {}), gallery: files };
  console.log(`  ${id}: ${files.length} photo(s)`);
}

fs.writeFileSync(CONTENT, JSON.stringify(content, null, 2) + "\n");
console.log(`\nfetched ${ok}, failed ${fail} — gallery filenames written to venue-content.json`);
