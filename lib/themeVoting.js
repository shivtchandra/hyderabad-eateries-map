import { ensureUser } from "./identity.js";

const PREFIX = "tvoted_";

export function hasThemeVoted(themeId) {
  try { return !!localStorage.getItem(PREFIX + themeId); } catch { return false; }
}

function markThemeVoted(themeId) {
  try { localStorage.setItem(PREFIX + themeId, "1"); } catch {}
}

export async function castThemeVote(themeId, spotId, name) {
  if (hasThemeVoted(themeId)) return { ok: false, reason: "already-voted" };
  try {
    const user = await ensureUser();
    const uid = user?.uid || null;
    const res = await fetch("/api/theme/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ themeId, spotId, name, uid }),
    });
    if (res.status === 409) return { ok: false, reason: "theme-closed" };
    if (res.status === 429) return { ok: false, reason: "already-voted" };
    if (!res.ok) return { ok: false, reason: "backend" };
    const data = await res.json();
    markThemeVoted(themeId);
    return { ok: true, count: data.count };
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
