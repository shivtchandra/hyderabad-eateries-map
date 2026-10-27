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
import { galleryPhotoUrl, spotPhotoUrl } from "../lib/photos.js";
import { coreIdSet } from "../lib/coreSpots.js";
import { fixCategory } from "../lib/categoryFix.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(__dirname, "..", "data", "eateries.json");
const PUBLIC = path.join(__dirname, "..", "public");

const all = JSON.parse(fs.readFileSync(DATA, "utf-8"));
fs.mkdirSync(PUBLIC, { recursive: true });

// Core list (lib/coreSpots.js): the map shows these by default; the rest stay searchable.
let editorialIds = new Set();
let recommendedEditorialIds = new Set();
try {
  const content = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "venue-content.json"), "utf-8"));
  editorialIds = new Set(Object.keys(content));
  recommendedEditorialIds = new Set(Object.entries(content).filter(([, value]) => value.recommendationStatus === "recommended").map(([id]) => id));
} catch {}
// eateries.json has a few duplicate ids (same place saved twice); keep the one with most reviews.
const byIdBest = new Map();
for (const e of all.filter((x) => x.lat && x.lng && x.status === "approved")) {
  const prev = byIdBest.get(e.id);
  const currentUpdated = Date.parse(e.detailsUpdatedAt || "") || 0;
  const previousUpdated = Date.parse(prev?.detailsUpdatedAt || "") || 0;
  if (!prev || currentUpdated > previousUpdated || (currentUpdated === previousUpdated && (Number(e.ratingCount) || 0) > (Number(prev.ratingCount) || 0))) byIdBest.set(e.id, e);
}
const approved = [...byIdBest.values()];
const core = coreIdSet(approved, { editorialIds });
// "Recos" chip: explicit editorial recommendations and entity-reviewed Reddit
// branches only. Content, raw dish seeds and shortlist research are not endorsements.
const readData = (f, fb) => { try { return JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", f), "utf-8")); } catch { return fb; } };
const reviewedBranchIds = new Set((readData("recommendation-reviews.json", { brands: [] }).brands || [])
  .filter((brand) => brand.status === "approved")
  .flatMap((brand) => (brand.branches || [])
    .filter((branch) => branch.status === "approved" && branch.checkedAt && branch.statusSource)
    .map((branch) => branch.id)));
const isReco = (e) => recommendedEditorialIds.has(e.id) || reviewedBranchIds.has(e.id);
let localsDishes = {};
try { localsDishes = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "locals-dishes.json"), "utf-8")).spots || {}; } catch {}

// Short keys keep the index small over the wire; the client re-expands them.
const index = approved
  .map((e) => ({
    id: e.id,
    n: e.name,
    c: fixCategory(e),
    ...(localsDishes[e.id] ? { d: localsDishes[e.id].map((x) => x.dish) } : {}), // dishes locals name (Ask Eats)
    ...(isReco(e) ? { ro: 1 } : {}), // "Recos" chip (rc is the rating count)
    lat: +e.lat.toFixed(5),
    lng: +e.lng.toFixed(5),
    r: e.rating ?? null,
    rc: e.ratingCount ?? 0,
    t: e.tier ?? null,
    g: e.tags ?? [],
    p: e.priceLevel ?? null,
    a: e.discoveredIn ?? null,
    ca: e.createdAt ?? null,
    k: core.has(e.id) ? 1 : 0,
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
        category: fixCategory(e),
        teaser: c.signatureDish?.name ?? c.highlight?.label ?? null,
        image: c.gallery?.length ? galleryPhotoUrl(c.gallery[0]) : spotPhotoUrl(id),
      };
    });
} catch {}
fs.writeFileSync(path.join(PUBLIC, "featured.json"), JSON.stringify(featured));

// Recos map pins from the CDN. /api/recommendations rebuilds this on every call on
// the Worker and intermittently 503s, which left the Recos map empty; the app now
// draws from this file first and only layers live community data from the API.
const { getRecommendations } = await import("../lib/recommendations.js");
fs.writeFileSync(path.join(PUBLIC, "recommendations.json"), JSON.stringify(getRecommendations()));

const mb = (p) => (fs.statSync(path.join(PUBLIC, p)).size / 1048576).toFixed(2);

// data/photo-ids.json is the committed manifest of which venues have a photo on
// the CDN. Only regenerate it when public/photos is actually present locally.
// On Vercel it is not (see .vercelignore), and blindly rewriting it there would
// leave an empty list, which silently drops every photo and OG image.
const photosDir = path.join(PUBLIC, "photos");
const manifest = path.join(__dirname, "..", "data", "photo-ids.json");
let photoIds;
if (fs.existsSync(photosDir)) {
  photoIds = fs
    .readdirSync(photosDir)
    .filter((f) => f.endsWith(".jpg"))
    .map((f) => f.replace(/\.jpg$/, ""));
  fs.writeFileSync(manifest, JSON.stringify(photoIds));
} else {
  photoIds = JSON.parse(fs.readFileSync(manifest, "utf-8"));
}

console.log(`eateries-index.json  ${index.length} spots (${core.size} core)  ${mb("eateries-index.json")} MB`);
console.log(`eateries-detail.json ${Object.keys(detail).length} spots  ${mb("eateries-detail.json")} MB`);
console.log(
  `photo-ids.json       ${photoIds.length} thumbs  ${fs.existsSync(photosDir) ? "(regenerated)" : "(kept, no local photos dir)"}`
);

if (process.env.REQUIRE_LIVE_RANKINGS === "1") {
  const { getAllRankingsThemes } = await import("../lib/themesServer.js");
  const themes = await getAllRankingsThemes(50);
  if (!themes.some((theme) => theme.active || theme.winnerId || theme.results?.some((result) => (result.count || 0) > 0))) {
    throw new Error("Release blocked: live ranking data is empty while REQUIRE_LIVE_RANKINGS=1.");
  }
  console.log(`ranking release gate ${themes.length} live/completed themes verified`);
}
