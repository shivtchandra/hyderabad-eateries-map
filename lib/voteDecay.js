// Recency weighting for theme votes, so a 2026 favourite does not hold #1 in
// 2028 on old votes alone. Each vote doc keeps a decayed `score` plus the time
// it was last decayed (`scoreAt`). Decay is applied lazily on write and read,
// so no scans or scheduled jobs are needed.

export const HALF_LIFE_DAYS = 180;
// A theme's voting season. After this it is archived and the dish can be run
// again as a fresh contest the next year.
export const SEASON_DAYS = 365;

const DAY_MS = 24 * 60 * 60 * 1000;

export function decayFactor(ageMs) {
  if (!ageMs || ageMs <= 0) return 1;
  return 0.5 ** (ageMs / (HALF_LIFE_DAYS * DAY_MS));
}

// Legacy vote docs have only `count`; treat those votes as cast at `fallbackAt`
// (the theme's createdAt).
export function freshScore(vote, fallbackAt, now = Date.now()) {
  if (!vote) return 0;
  if (typeof vote.score === "number") {
    return Math.max(0, vote.score * decayFactor(now - (vote.scoreAt || fallbackAt || now)));
  }
  return (vote.count || 0) * decayFactor(now - (fallbackAt || now));
}

// New score fields after adding `weight` (1 for a vote, a negative decayed
// weight when a voter switches away).
export function bumpScore(vote, fallbackAt, weight, now = Date.now()) {
  const score = Math.max(0, freshScore(vote, fallbackAt, now) + weight);
  return { score, scoreAt: now };
}

// Weight left on a vote cast at `votedAt`.
export function voteWeight(votedAt, now = Date.now()) {
  return votedAt ? decayFactor(now - votedAt) : 1;
}

// Attach `fresh` (rounded) and sort: fresh score first, raw count second.
export function rankByFreshness(results, fallbackAt, now = Date.now()) {
  return results
    .map((r) => ({ ...r, fresh: Math.round(freshScore(r, fallbackAt, now) * 100) / 100 }))
    .sort((a, b) => (b.fresh - a.fresh) || ((b.count || 0) - (a.count || 0)));
}

export function themeCreatedAt(theme) {
  if (theme?.createdAt) return Number(theme.createdAt);
  if (theme?.startDate) return Date.parse(theme.startDate) || null;
  return null;
}

export function seasonYear(theme) {
  const at = themeCreatedAt(theme);
  return at ? new Date(at).getFullYear() : null;
}

export function seasonClosed(theme, now = Date.now()) {
  const at = themeCreatedAt(theme);
  return !!at && now - at > SEASON_DAYS * DAY_MS;
}
