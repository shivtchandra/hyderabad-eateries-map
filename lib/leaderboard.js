"use client";

// Thin client over the /api/claim and /api/leaderboard routes. All scoring and
// the GPS gate live server-side (a client can't be trusted to score itself);
// this just carries the signed token and the current coordinates.

import { getIdToken, getName } from "./identity.js";

// Attempts to claim a spot for the race. Requires the caller's live coordinates
// so the server can verify they're actually there. Returns a small result:
//   { ok:true, awarded } | { ok:true, already:true }
//   { ok:false, reason:"too-far"|"not-authenticated"|"backend"|"no-location"|..., distanceKm? }
export async function claimSpot(spotId, coords) {
  if (!coords || typeof coords.lat !== "number") {
    return { ok: false, reason: "no-location" };
  }
  const token = await getIdToken();
  if (!token) return { ok: false, reason: "not-authenticated" };

  try {
    const res = await fetch("/api/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ spotId, lat: coords.lat, lng: coords.lng, name: getName() }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) return { ok: true, awarded: data.awarded, already: data.already, area: data.area };
    if (res.status === 403 && data.error === "too-far") {
      return { ok: false, reason: "too-far", distanceKm: data.distanceKm, radiusKm: data.radiusKm };
    }
    if (res.status === 401) return { ok: false, reason: "not-authenticated", detail: data.detail || null };
    return { ok: false, reason: data.error || "backend" };
  } catch {
    return { ok: false, reason: "network" };
  }
}

// The top list is a shared, edge-cached URL; the caller's own rank is a small live
// request run alongside it, so the board doesn't wait on an uncached Firestore read.
export async function fetchLeaderboard(uid, limit = 50) {
  const getJson = (url) => fetch(url, { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  const [top, mine] = await Promise.all([
    getJson(`/api/leaderboard?limit=${limit}`),
    uid ? getJson(`/api/leaderboard?uid=${encodeURIComponent(uid)}&me=1`) : null,
  ]);
  const players = top?.players || [];
  const me = mine?.me ?? (uid ? players.find((p) => p.uid === uid) ?? null : null);
  return { players, me, unavailable: Boolean(top?.unavailable) };
}
