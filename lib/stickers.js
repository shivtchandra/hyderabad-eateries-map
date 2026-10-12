"use client";

// The Sticker Book, the visual layer of the collection.
//
// A dish photo becomes a background-removed cutout with a white sticker border,
// saved against the spot you ate it at. Cutouts run fully client-side
// (@imgly/background-removal): the photo never leaves the device, which matches
// the app's whole local-first, zero-auth stance. The PNG lives in IndexedDB
// (same reasoning as receipts, a transparent PNG is 60–150KB, far past the
// localStorage ceiling); the lightweight metadata lives in localStorage so the
// book still lists and counts even when IndexedDB is unavailable.

const DB = "hyd-eats-stickers";
const STORE = "png";
const KEY = "hyd-eats-stickers-v1";

// The full model is the sharpest but ~20s on a CPU-only device; "small" is a
// few-MB model that trades a little edge precision for a much faster cutout.
const MODEL = "small";

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

async function putBlob(id, blob) {
  const db = await openDb();
  if (!db) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(blob, id);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch { resolve(false); }
  });
}

export async function getStickerBlob(id) {
  const db = await openDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, "readonly");
      const r = tx.objectStore(STORE).get(id);
      r.onsuccess = () => resolve(r.result ?? null);
      r.onerror = () => resolve(null);
    } catch { resolve(null); }
  });
}

async function deleteBlob(id) {
  const db = await openDb();
  if (!db) return;
  try { (await db).transaction(STORE, "readwrite").objectStore(STORE).delete(id); } catch {}
}

// ---- Metadata (localStorage) ----

export function getStickers() {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}");
  } catch { return {}; }
}

function writeStickers(all) {
  try { localStorage.setItem(KEY, JSON.stringify(all)); } catch {}
  return all;
}

export function stickerList() {
  return Object.values(getStickers()).sort((a, b) => new Date(b.at) - new Date(a.at));
}

export function stickersForSpot(spotId) {
  return stickerList().filter((s) => s.spotId === spotId);
}

export async function removeSticker(id) {
  const all = getStickers();
  delete all[id];
  writeStickers(all);
  await deleteBlob(id);
  return all;
}

// ---- The cutout itself ----

// Turn any photo Blob into a sticker: cut the background out, then add the
// classic white die-cut border by dilating the alpha mask and painting it
// behind the subject. Border makes it read as a *sticker*, not just a cutout.
export async function makeSticker({ spotId, spotName, dish, file, seedUrl, onProgress }) {
  let cutout;

  if (seedUrl) {
    // Seeded dish PNGs are already transparent, no model run needed.
    cutout = await (await fetch(seedUrl)).blob();
  } else {
    const { removeBackground } = await import("@imgly/background-removal");
    cutout = await removeBackground(file, {
      model: MODEL,
      output: { format: "image/png" },
      progress: (key, cur, total) => onProgress?.(key, cur, total),
    });
  }

  const bordered = await addStickerBorder(cutout);

  const id = `stk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  await putBlob(id, bordered);

  const all = getStickers();
  all[id] = {
    id,
    spotId: spotId ?? null,
    spotName: spotName ?? null,
    dish: (dish || "").trim() || null,
    at: new Date().toISOString(),
    seed: !!seedUrl,
  };
  writeStickers(all);
  return all[id];
}

// Dilate the alpha and fill white behind the subject → die-cut sticker edge.
async function addStickerBorder(pngBlob, pad = 14, ring = 6) {
  const img = await blobToImage(pngBlob);
  const w = img.width + pad * 2;
  const h = img.height + pad * 2;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");

  // Build the white halo by stamping the silhouette in a ring of offsets, then
  // recolouring every opaque pixel to white.
  const mask = document.createElement("canvas");
  mask.width = w; mask.height = h;
  const mctx = mask.getContext("2d");
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
    mctx.drawImage(img, pad + Math.cos(a) * ring, pad + Math.sin(a) * ring);
  }
  mctx.globalCompositeOperation = "source-in";
  mctx.fillStyle = "#ffffff";
  mctx.fillRect(0, 0, w, h);

  // Soft drop shadow under the whole sticker, then halo, then the subject.
  ctx.shadowColor = "rgba(20, 20, 20,0.28)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;
  ctx.drawImage(mask, 0, 0);
  ctx.shadowColor = "transparent";
  ctx.drawImage(img, pad, pad);

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
}

function blobToImage(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = reject;
    img.src = url;
  });
}
