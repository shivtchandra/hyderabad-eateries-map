// Client helpers for "Must order" dishes. One verdict per device per spot, tracked in
// localStorage (same zero-auth model as the Race votes).
const KEY = "hyd-eats-dish-votes";

function voted() {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; }
}

export function hasVotedDishes(spotId) {
  return Boolean(voted()[spotId]);
}

export async function fetchDishes(spotId) {
  try {
    const res = await fetch(`/api/dishes?spot=${encodeURIComponent(spotId)}`, { cache: "no-store" });
    if (!res.ok) return [];
    return (await res.json()).dishes || [];
  } catch {
    return [];
  }
}

export async function voteDishes(spotId, dishes, again) {
  if (!dishes.length || hasVotedDishes(spotId)) return null;
  try {
    const res = await fetch("/api/dishes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spotId, dishes, again }),
    });
    if (!res.ok) return null;
    const v = voted();
    v[spotId] = { at: Date.now(), again };
    try { localStorage.setItem(KEY, JSON.stringify(v)); } catch {}
    return (await res.json()).dishes || null;
  } catch {
    return null;
  }
}

export function dishSourceLabel(d) {
  if (d.up > 0) return `${d.up} local${d.up === 1 ? "" : "s"} would reorder`;
  if (d.source === "reddit") return d.people ? `Named by ${d.people} locals on r/hyderabad` : "r/hyderabad pick";
  if (d.source === "editor") return "Our pick";
  return "Suggested by a local";
}
