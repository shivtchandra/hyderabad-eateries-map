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
