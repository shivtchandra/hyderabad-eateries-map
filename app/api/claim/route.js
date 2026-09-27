import { getAdminDb, verifyUidDetailed } from "../../../lib/firebaseAdmin.js";

export const dynamic = "force-dynamic";

// You must physically be near a spot to claim it. This is the whole anti-cheat
// of the race: without it "covered" is a spammable button and the board is
// fiction. 250m is generous enough for large landmark campuses and GPS drift,
// tight enough that you can't claim a place across town.
const CLAIM_RADIUS_KM = 0.25;

// Exploration beats box-ticking: a hidden gem is worth more than a landmark
// everyone already knows. This nudges the race toward discovery.
const POINTS_BY_TIER = { "hidden-gem": 25, established: 15, landmark: 10 };
const DEFAULT_POINTS = 10;

let indexCache = null;
async function loadIndex() {
  if (indexCache) return indexCache;
  const { readFileSync } = await import("fs");
  const { join } = await import("path");
  // data/eateries.json is traced into every /api/* function (next.config.mjs). public/ is not
  // readable from a serverless function, so the old public/eateries-index.json read crashed every
  // authenticated claim. Same filter + short keys as scripts/build-static.mjs.
  const raw = readFileSync(join(process.cwd(), "data", "eateries.json"), "utf-8");
  const rows = JSON.parse(raw).filter((e) => e.lat && e.lng && e.status === "approved");
  indexCache = new Map(rows.map((e) => [e.id, { id: e.id, lat: +e.lat, lng: +e.lng, t: e.tier ?? null, c: e.category ?? null, a: /^text:/.test(e.discoveredIn || "") ? null : e.discoveredIn ?? null }]));
  return indexCache;
}

function haversineKm(a, b) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export async function POST(req) {
  const db = await getAdminDb();
  if (!db) return Response.json({ error: "backend-unavailable" }, { status: 503 });

  // Identity: a signed token, never a raw uid from the body.
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const { uid, code, hint } = await verifyUidDetailed(token);
  if (!uid) return Response.json({ error: "not-authenticated", detail: code, hint }, { status: 401 });

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "bad-request" }, { status: 400 });
  }
  const { spotId, lat, lng, name } = body || {};
  if (!spotId || typeof lat !== "number" || typeof lng !== "number") {
    return Response.json({ error: "bad-request" }, { status: 400 });
  }

  const index = await loadIndex();
  const spot = index.get(spotId);
  if (!spot) return Response.json({ error: "unknown-spot" }, { status: 404 });

  const dist = haversineKm({ lat: spot.lat, lng: spot.lng }, { lat, lng });
  if (dist > CLAIM_RADIUS_KM) {
    return Response.json(
      { error: "too-far", distanceKm: Math.round(dist * 100) / 100, radiusKm: CLAIM_RADIUS_KM },
      { status: 403 }
    );
  }

  const points = POINTS_BY_TIER[spot.t] ?? DEFAULT_POINTS;
  const area = spot.a || "Hyderabad";
  const cleanName = (name || "").toString().trim().slice(0, 24) || "Explorer";

  const { FieldValue } = await import("firebase-admin/firestore");
  const claimRef = db.collection("claims").doc(`${uid}__${spotId}`);
  const playerRef = db.collection("players").doc(uid);

  try {
    const result = await db.runTransaction(async (tx) => {
      const existing = await tx.get(claimRef);
      if (existing.exists) {
        const p = await tx.get(playerRef);
        return { already: true, player: p.data() ?? null };
      }
      tx.set(claimRef, {
        uid, spotId, area, tier: spot.t ?? null, category: spot.c ?? null,
        points, lat, lng, createdAt: FieldValue.serverTimestamp(),
      });
      tx.set(
        playerRef,
        {
          name: cleanName,
          score: FieldValue.increment(points),
          covered: FieldValue.increment(1),
          [`areas.${area}`]: FieldValue.increment(1),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      return { already: false, awarded: points };
    });

    if (result.already) {
      return Response.json({ ok: true, already: true }, { status: 200 });
    }
    return Response.json({ ok: true, awarded: result.awarded, area }, { status: 200 });
  } catch (e) {
    return Response.json({ error: "write-failed" }, { status: 500 });
  }
}
