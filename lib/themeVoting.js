import { ensureUser } from "./identity.js";

const PREFIX = "tvoted_";

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

// Casts a vote, or SWITCHES an existing vote to a different spot — the server
// enforces one live vote per uid per theme (see /api/theme/vote), moving the
// count off the old spot and onto the new one instead of just rejecting.
export async function castThemeVote(themeId, spotId, name) {
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
    if (res.status === 409) return { ok: false, reason: "theme-closed" };
    if (!res.ok) return { ok: false, reason: "backend" };
    const data = await res.json();
    markThemeVoted(themeId, spotId);
    return { ok: true, count: data.count, switched: !!data.switched, unchanged: !!data.unchanged };
  } catch {
    return { ok: false, reason: "network" };
  }
}

export async function fetchCurrentTheme() {
  try {
    const res = await fetch("/api/theme/current", { cache: "no-store" });
    if (!res.ok) return { theme: null, results: [] };
    return await res.json();
  } catch { return { theme: null, results: [] }; }
}

export async function fetchThemeHistory(limit = 10) {
  try {
    const res = await fetch(`/api/theme/history?limit=${limit}`, { cache: "no-store" });
    if (!res.ok) return { themes: [] };
    return await res.json();
  } catch { return { themes: [] }; }
}

// --- Suggestions for a future weekly theme -------------------------------

const SUG_PREFIX = "tsuggested_up_";

export function hasUpvotedSuggestion(id) {
  try { return !!localStorage.getItem(SUG_PREFIX + id); } catch { return false; }
}
function markUpvoted(id) {
  try { localStorage.setItem(SUG_PREFIX + id, "1"); } catch {}
}

export async function fetchSuggestions() {
  try {
    const res = await fetch("/api/theme/suggest", { cache: "no-store" });
    if (!res.ok) return [];
    return (await res.json()).suggestions || [];
  } catch { return []; }
}

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
    if (data.id) markUpvoted(data.id); // creator auto-upvotes
    return { ok: true, suggestion: { id: data.id, text: data.text, upvotes: data.upvotes } };
  } catch {
    return { ok: false, reason: "network" };
  }
}

export async function upvoteSuggestion(id) {
  if (hasUpvotedSuggestion(id)) return { ok: false, reason: "already" };
  try {
    const user = await ensureUser();
    const res = await fetch("/api/theme/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "upvote", id, uid: user?.uid || null }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, reason: data.error || "backend" };
    markUpvoted(id);
    return { ok: true, upvotes: data.upvotes };
  } catch {
    return { ok: false, reason: "network" };
  }
}
