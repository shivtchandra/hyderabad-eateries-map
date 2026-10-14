import { ensureUser } from "./identity.js";

const PREFIX = "tvoted_";

const TRAIL_KEY = "hyd-theme-picks-v1";

/** Local trail of this device's weekly theme picks (no login). */
export function getThemePicks() {
  try {
    const raw = JSON.parse(localStorage.getItem(TRAIL_KEY) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

export function recordThemePick({ themeId, title, spotId, name }) {
  if (!themeId || !spotId) return;
  try {
    const next = getThemePicks().filter((p) => p.themeId !== themeId);
    next.unshift({
      themeId,
      title: title || "",
      spotId,
      name: name || "",
      at: Date.now(),
    });
    localStorage.setItem(TRAIL_KEY, JSON.stringify(next.slice(0, 24)));
  } catch {
    /* private mode */
  }
}


export function hasThemeVoted(themeId) {
  try { return !!localStorage.getItem(PREFIX + themeId); } catch { return false; }
}

// The spotId this device last voted for in a given theme, or null.
export function getThemeVoteSpot(themeId) {
  try { return localStorage.getItem(PREFIX + themeId) || null; } catch { return null; }
}

function markThemeVoted(themeId, spotId) {
  try { localStorage.setItem(PREFIX + themeId, spotId); } catch {}
}

// Casts a vote, or SWITCHES an existing vote to a different spot, the server
// enforces one live vote per uid per theme (see /api/theme/vote), moving the
// count off the old spot and onto the new one instead of just rejecting.
export async function castThemeVote(themeId, spotId, name, meta = {}) {
  const user = await ensureUser();
  const uid = user?.uid || null;
  // Without a uid there's no server-side dedup to rely on, so fall back to
  // the old client-only single-vote guard rather than allow unlimited votes.
  if (!uid && hasThemeVoted(themeId)) return { ok: false, reason: "already-voted" };
  try {
    const res = await fetch("/api/theme/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ themeId, spotId, name, uid }),
    });
    if (res.status === 409 || res.status === 404) return { ok: false, reason: "theme-closed" };
    if (!res.ok) return { ok: false, reason: "backend" };
    const data = await res.json();
    markThemeVoted(themeId, spotId);
    recordThemePick({ themeId, spotId, name, title: meta.title });
    return { ok: true, count: data.count, switched: !!data.switched, unchanged: !!data.unchanged };
  } catch {
    return { ok: false, reason: "network" };
  }
}

// Several components mount at once and each asks for the same data; share one
// in-flight request per URL instead of firing duplicates.
const inflight = new Map();
function shared(url, fallback) {
  if (inflight.has(url)) return inflight.get(url);
  const p = fetch(url, { cache: "no-store" })
    .then((res) => (res.ok ? res.json() : fallback))
    .catch(() => fallback)
    .finally(() => inflight.delete(url));
  inflight.set(url, p);
  return p;
}

export function fetchCurrentTheme() {
  return shared("/api/theme/current", { theme: null, results: [] });
}

export function fetchThemeHistory(limit = 10) {
  return shared(`/api/theme/history?limit=${limit}`, { themes: [] });
}

// --- Request a future weekly theme ---------------------------------------
// Visitors submit an idea; it goes to the admin (not listed publicly).

export async function suggestTheme(text) {
  const clean = (text || "").trim();
  if (clean.length < 3) return { ok: false, reason: "too-short" };
  try {
    const user = await ensureUser();
    const res = await fetch("/api/theme/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: clean, uid: user?.uid || null }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 429) return { ok: false, reason: "rate-limited" };
    if (!res.ok) return { ok: false, reason: data.error || "backend" };
    return { ok: true };
  } catch {
    return { ok: false, reason: "network" };
  }
}
