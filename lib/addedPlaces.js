import { getAdminDb } from "./firebaseAdmin.js";

// Approved places that visitors added. They aren't in the static eateries index (built
// at deploy), so the map merges these in at runtime. A handful of docs, kept in this
// server instance's memory for 5 minutes (no Vercel cache: plan limits).
const MEMO_MS = 5 * 60_000;
let memo = null;

export function clearAddedPlacesMemo() {
  memo = null;
}

export async function getApprovedAddedPlaces() {
  if (memo && Date.now() - memo.at < MEMO_MS) return memo.value;
  const value = (async () => {
    const db = await getAdminDb();
    if (!db) return [];
    const snap = await db.collection("eateries").where("source", "==", "user-suggested").limit(500).get();
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((p) => p.status === "approved" && Number.isFinite(p.lat) && Number.isFinite(p.lng));
  })().catch(() => []);
  memo = { at: Date.now(), value };
  return value;
}

export async function getAddedPlace(id) {
  const all = await getApprovedAddedPlaces();
  return all.find((p) => p.id === id) || null;
}
