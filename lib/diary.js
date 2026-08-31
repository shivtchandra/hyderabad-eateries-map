"use client";

// The food diary — the memory layer.
//
// A stamp records that you went; a diary entry records *what it was like*.
// Receipt photos are the unit of truth (Naver's receipt-review insight: proof
// you actually showed up) and simultaneously the memory object — date, dish,
// spend, a note to your future self.
//
// Photos live in IndexedDB, not localStorage: a single receipt JPEG is
// 100–400KB and localStorage's ~5MB ceiling would blow after a dozen visits.
// Text-only entry data stays in localStorage so the diary still lists and
// totals correctly even if IndexedDB is unavailable (private mode, quota).

const DB = "hyd-eats-diary";
const STORE = "receipts";
const KEY = "hyd-eats-diary-v1";

let dbPromise = null;
function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    try {
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => {
        const d = req.result;
        if (!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    } catch (e) {
      reject(e);
    }
  }).catch(() => null);
  return dbPromise;
}

export async function putReceipt(id, blob) {
  const db = await openDb();
  if (!db) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(blob, id);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

export async function getReceipt(id) {
  const db = await openDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, "readonly");
      const r = tx.objectStore(STORE).get(id);
      r.onsuccess = () => resolve(r.result ?? null);
      r.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function deleteReceipt(id) {
  const db = await openDb();
  if (!db) return;
  try {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
  } catch { /* nothing to clean up */ }
}

// ---- Entry metadata (text only) ----

export function getEntries() {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}");
  } catch {
    return {};
  }
}

function writeEntries(all) {
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch { /* private mode — session-only */ }
  return all;
}

// One entry per visit. Keyed by `${placeId}:${timestamp}` so revisits stack up
// into a history rather than overwriting each other.
export function addEntry(placeId, { dish = "", spend = null, note = "", rating = null, hasReceipt = false } = {}) {
  const all = getEntries();
  const at = new Date().toISOString();
  const id = `${placeId}:${Date.now()}`;
  all[id] = { id, placeId, at, dish, spend, note, rating, hasReceipt };
  writeEntries(all);
  return all[id];
}

export function updateEntry(id, patch) {
  const all = getEntries();
  if (!all[id]) return null;
  all[id] = { ...all[id], ...patch };
  writeEntries(all);
  return all[id];
}

export function removeEntry(id) {
  const all = getEntries();
  delete all[id];
  writeEntries(all);
  deleteReceipt(id);
  return all;
}

export function entriesFor(placeId) {
  return Object.values(getEntries())
    .filter((e) => e.placeId === placeId)
    .sort((a, b) => new Date(b.at) - new Date(a.at));
}

// ---- The payoff: the sentence Zomato can't write about you ----
export function diaryStats(eateries) {
  const entries = Object.values(getEntries());
  const byId = {};
  for (const e of eateries) byId[e.id] = e;

  const spends = entries.map((e) => Number(e.spend)).filter((n) => Number.isFinite(n) && n > 0);
  const totalSpend = spends.reduce((a, b) => a + b, 0);

  const dishCount = {};
  for (const e of entries) {
    const d = (e.dish || "").trim().toLowerCase();
    if (d) dishCount[d] = (dishCount[d] || 0) + 1;
  }
  const topDish = Object.entries(dishCount).sort((a, b) => b[1] - a[1])[0] ?? null;

  const visitCount = {};
  for (const e of entries) visitCount[e.placeId] = (visitCount[e.placeId] || 0) + 1;
  const mostVisitedId = Object.entries(visitCount).sort((a, b) => b[1] - a[1])[0] ?? null;

  const months = new Set(entries.map((e) => e.at.slice(0, 7)));

  return {
    entryCount: entries.length,
    receiptCount: entries.filter((e) => e.hasReceipt).length,
    totalSpend,
    avgSpend: spends.length ? Math.round(totalSpend / spends.length) : null,
    topDish: topDish ? { dish: topDish[0], times: topDish[1] } : null,
    mostVisited: mostVisitedId
      ? { place: byId[mostVisitedId[0]] ?? null, times: mostVisitedId[1] }
      : null,
    monthsActive: months.size,
    entries: entries.sort((a, b) => new Date(b.at) - new Date(a.at)),
  };
}
