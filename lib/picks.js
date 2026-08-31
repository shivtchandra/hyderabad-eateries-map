// Curated "what to order" picks — a small hand-picked subset of spots, each
// tagged with recommended dishes and (optionally) who's recommending them.
// Public GET is cheap (one small Firestore read), so fetch once on load.

export async function fetchPicks() {
  try {
    const res = await fetch("/api/picks", { cache: "no-store" });
    if (!res.ok) return {};
    const data = await res.json();
    const map = {};
    for (const p of data.picks || []) map[p.spotId] = p;
    return map; // { [spotId]: { spotId, spotName, dishes, curator, note, createdAt } }
  } catch {
    return {};
  }
}
