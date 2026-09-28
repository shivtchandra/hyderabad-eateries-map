import fs from "fs";
import path from "path";
import { getAdminDb } from "../../../lib/firebaseAdmin.js";

// "Must order" dishes per spot: locals' verdicts from the stamp sheet, merged with
// seed dishes from our editorial and the r/hyderabad guides.
//   GET  /api/dishes?spot=<id>            -> { dishes: [{ name, up, down, source }] }
//   POST /api/dishes { spotId, dishes: [names], again: true|false }
// Zero-auth like the Race votes: the client stops the same device voting twice per
// spot (lib/dishVotes.js). Doc per spot in Firestore `dishes`.

export const dynamic = "force-dynamic";

let SEEDS = null;
function seedsFor(id) {
  if (!SEEDS) {
    try { SEEDS = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "dish-seeds.json"), "utf8")); }
    catch { SEEDS = {}; }
  }
  return SEEDS[id] || [];
}

const key = (s) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, " ").trim().slice(0, 60);
const tidy = (s) => String(s || "").replace(/\s+/g, " ").trim().slice(0, 48);
const validId = (id) => typeof id === "string" && id.length > 0 && id.length <= 120 && !id.includes("/");

function merge(spotId, votes) {
  const out = new Map();
  for (const s of seedsFor(spotId)) out.set(key(s.name), { name: s.name, up: 0, down: 0, source: s.source });
  for (const [k, v] of Object.entries(votes || {})) {
    const cur = out.get(k) || { name: v.name, up: 0, down: 0, source: "locals" };
    out.set(k, { ...cur, up: v.up || 0, down: v.down || 0 });
  }
  // Voted dishes first (by net likes), then seeds in their editorial order.
  return [...out.values()]
    .filter((d) => d.up + d.down === 0 || d.up >= d.down) // hide dishes locals mostly say skip
    .sort((a, b) => (b.up - b.down) - (a.up - a.down) || (b.up + b.down) - (a.up + a.down));
}

export async function GET(req) {
  const spotId = new URL(req.url).searchParams.get("spot");
  if (!validId(spotId)) return Response.json({ error: "bad-request" }, { status: 400 });
  let votes = {};
  const db = await getAdminDb();
  if (db) {
    try {
      const doc = await db.collection("dishes").doc(spotId).get();
      if (doc.exists) votes = doc.data().votes || {};
    } catch {}
  }
  return Response.json({ spotId, dishes: merge(spotId, votes) }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const { spotId, again } = body;
  const names = (Array.isArray(body.dishes) ? body.dishes : []).map(tidy).filter((n) => n.length >= 2).slice(0, 5);
  if (!validId(spotId) || !names.length || typeof again !== "boolean") {
    return Response.json({ error: "bad-request" }, { status: 400 });
  }
  const db = await getAdminDb();
  if (!db) return Response.json({ error: "unavailable" }, { status: 503 });

  const ref = db.collection("dishes").doc(spotId);
  const votes = await db.runTransaction(async (tx) => {
    const doc = await tx.get(ref);
    const cur = (doc.exists && doc.data().votes) || {};
    for (const name of names) {
      const k = key(name);
      if (!k) continue;
      const d = cur[k] || { name, up: 0, down: 0 };
      if (again) d.up += 1; else d.down += 1;
      cur[k] = d;
    }
    // Keep the doc bounded: at most 40 dishes per spot, least-voted dropped.
    const trimmed = Object.fromEntries(Object.entries(cur).sort((a, b) => (b[1].up + b[1].down) - (a[1].up + a[1].down)).slice(0, 40));
    tx.set(ref, { votes: trimmed, updatedAt: new Date().toISOString() });
    return trimmed;
  });
  return Response.json({ spotId, dishes: merge(spotId, votes) });
}
