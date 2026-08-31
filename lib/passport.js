"use client";

// Zero-auth collection state. Lives in localStorage so there's no sign-up wall
// between "I went there" and it being recorded — friction kills the loop.
// Every access is guarded: a blocked or cleared store must render as "nothing
// collected yet", never throw.

const KEY = "hyd-eats-passport-v1";
const EMPTY = { visited: {}, saved: {} };

export function getState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw);
    return { visited: parsed.visited ?? {}, saved: parsed.saved ?? {} };
  } catch {
    return { ...EMPTY };
  }
}

function write(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* private mode / quota — state stays in memory for this session only */
  }
  return state;
}

export function toggleVisited(id) {
  const s = getState();
  if (s.visited[id]) delete s.visited[id];
  else {
    s.visited[id] = new Date().toISOString();
    delete s.saved[id]; // visiting supersedes a want-to-go
  }
  return write(s);
}

export function toggleSaved(id) {
  const s = getState();
  if (s.saved[id]) delete s.saved[id];
  else s.saved[id] = new Date().toISOString();
  return write(s);
}

export function clearAll() {
  return write({ ...EMPTY, visited: {}, saved: {} });
}

// "unvisited" | "saved" | "visited" — drives pin appearance.
export function stateOf(passport, id) {
  if (passport.visited[id]) return "visited";
  if (passport.saved[id]) return "saved";
  return "unvisited";
}

// Rows discovered via the text-search stage carry "text:<query>" in
// discoveredIn, which is a provenance marker rather than a place — those all
// collapse into a single "Other" bucket. Shared so area counts and area
// progress can never disagree.
export function areaOf(eatery) {
  const raw = eatery.discoveredIn;
  if (!raw || raw.startsWith("text:")) return "Other";
  return raw;
}

// Neighbourhood completion, grouped on the `discoveredIn` field the seed script
// already writes.
export function progressByArea(eateries, passport) {
  const areas = {};
  for (const e of eateries) {
    const area = areaOf(e);
    if (!areas[area]) areas[area] = { area, total: 0, visited: 0 };
    areas[area].total++;
    if (passport.visited[e.id]) areas[area].visited++;
  }
  return Object.values(areas)
    .filter((a) => a.total >= 5)
    .sort((a, b) => b.visited - a.visited || b.total - a.total);
}

export function stats(eateries, passport) {
  const visitedIds = new Set(Object.keys(passport.visited));
  const visited = eateries.filter((e) => visitedIds.has(e.id));

  const byCategory = visited.reduce((m, e) => ((m[e.category] = (m[e.category] || 0) + 1), m), {});
  const areas = new Set(visited.map(areaOf));

  return {
    visitedCount: visited.length,
    savedCount: Object.keys(passport.saved).length,
    totalCount: eateries.length,
    byCategory,
    areasExplored: areas.size,
    visited,
  };
}
