/**
 * Emit static JSON the app reads directly, so runtime page loads make ZERO
 * Firestore reads.
 *
 * Why: the app previously read all ~1600 docs from Firestore on every page
 * load, which blew the free-tier daily read quota (RESOURCE_EXHAUSTED) and
 * added ~400ms to first paint. This data changes only when the seed/enrich
 * scripts run, so it belongs in a cacheable static file, not a per-request query.
 *
 * Emits:
 *   public/eateries-index.json  — lean, everything the map + list need (~0.3MB)
 *   public/eateries-detail.json — hours/blurb/website/phone, lazy-loaded
 *
 * Run: node scripts/build-static.mjs   (also runs automatically via `npm run build`)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(__dirname, "..", "data", "eateries.json");
const PUBLIC = path.join(__dirname, "..", "public");

const all = JSON.parse(fs.readFileSync(DATA, "utf-8"));
fs.mkdirSync(PUBLIC, { recursive: true });

// Short keys keep the index small over the wire; the client re-expands them.
const index = all
  .filter((e) => e.lat && e.lng && e.status === "approved")
  .map((e) => ({
    id: e.id,
    n: e.name,
    c: e.category,
    lat: +e.lat.toFixed(5),
    lng: +e.lng.toFixed(5),
    r: e.rating ?? null,
    rc: e.ratingCount ?? 0,
    t: e.tier ?? null,
    g: e.tags ?? [],
    p: e.priceLevel ?? null,
    a: e.discoveredIn ?? null,
    ca: e.createdAt ?? null,
  }));

// photoRef strings are ~250 chars each — 1586 of them would dominate the index
// even though a session only ever displays a few dozen. They live here instead,
// alongside the rest of the per-spot detail, and load lazily.
const detail = {};
for (const e of all) {
  detail[e.id] = {
    photoRef: e.photoRef ?? null,
    address: e.address ?? null,
    hours: e.hours ?? null,
    website: e.website ?? null,
    phone: e.phone ?? null,
    blurb: e.blurb ?? null,
    zomatoUrl: e.zomatoUrl ?? null,
  };
}

fs.writeFileSync(path.join(PUBLIC, "eateries-index.json"), JSON.stringify(index));
fs.writeFileSync(path.join(PUBLIC, "eateries-detail.json"), JSON.stringify(detail));

// Featured editorial spots: origin stories or branch write-ups (regular note /
// highlight). Powers the home "Stories" rail and the ★ Story badge. Small +
// curated (order follows venue-content.json), regenerated here so it never drifts.
const CONTENT = path.join(__dirname, "..", "data", "venue-content.json");
let featured = [];
try {
  const content = JSON.parse(fs.readFileSync(CONTENT, "utf-8"));
  const byId = Object.fromEntries(all.map((e) => [e.id, e]));
  featured = Object.entries(content)
    .filter(([, c]) => c.originStory?.length || c.regularNote || c.highlight?.text)
    .map(([id, c]) => {
      const e = byId[id] || {};
      return {
        id,
        name: e.name ?? id,
        area: e.discoveredIn ?? null,
        category: e.category ?? null,
        teaser: c.signatureDish?.name ?? c.highlight?.label ?? null,
        image: c.gallery?.length ? `/photos/gallery/${c.gallery[0]}` : `/photos/${id}.jpg`,
      };
    });
} catch {}
fs.writeFileSync(path.join(PUBLIC, "featured.json"), JSON.stringify(featured));

const mb = (p) => (fs.statSync(path.join(PUBLIC, p)).size / 1048576).toFixed(2);
const photosDir = path.join(PUBLIC, "photos");
const photoIds = fs.existsSync(photosDir)
  ? fs.readdirSync(photosDir).filter((f) => f.endsWith(".jpg")).map((f) => f.replace(/\.jpg$/, ""))
  : [];
fs.writeFileSync(path.join(__dirname, "..", "data", "photo-ids.json"), JSON.stringify(photoIds));

console.log(`eateries-index.json  ${index.length} spots  ${mb("eateries-index.json")} MB`);
console.log(`eateries-detail.json ${Object.keys(detail).length} spots  ${mb("eateries-detail.json")} MB`);
console.log(`photo-ids.json       ${photoIds.length} thumbs`);
