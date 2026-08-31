const PREFIX = "voted_";

export function hasVoted(spotId) {
  try { return !!localStorage.getItem(PREFIX + spotId); } catch { return false; }
}

function markVoted(spotId) {
  try { localStorage.setItem(PREFIX + spotId, "1"); } catch {}
}

function unmarkVoted(spotId) {
  try { localStorage.removeItem(PREFIX + spotId); } catch {}
}

export async function castVote(spotId, name) {
  if (hasVoted(spotId)) return { ok: false, reason: "already-voted" };
  try {
    const res = await fetch("/api/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spotId, name }),
    });
    if (!res.ok) return { ok: false, reason: "backend" };
    const data = await res.json();
    markVoted(spotId);
    return { ok: true, total: data.total, week_total: data.week_total };
  } catch {
    return { ok: false, reason: "network" };
  }
}

export async function removeVote(spotId) {
  if (!hasVoted(spotId)) return { ok: false, reason: "not-voted" };
  try {
    const res = await fetch("/api/vote", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spotId }),
    });
    if (!res.ok) return { ok: false, reason: "backend" };
    const data = await res.json();
    unmarkVoted(spotId);
    return { ok: true, total: data.total, week_total: data.week_total };
  } catch {
    return { ok: false, reason: "network" };
  }
}

export async function fetchVoteCounts(ids) {
  if (!ids?.length) return {};
  try {
    const res = await fetch(`/api/votes?ids=${ids.slice(0, 50).join(",")}`);
    if (!res.ok) return {};
    return (await res.json()).votes || {};
  } catch { return {}; }
}

export async function fetchStarOfWeek() {
  try {
    const res = await fetch("/api/votes?top=week&limit=1");
    if (!res.ok) return null;
    const { results } = await res.json();
    return results?.[0] || null;
  } catch { return null; }
}
