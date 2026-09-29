import { getAdminDb } from "./firebaseAdmin.js";
import { nextCrownUpdate } from "./themeCrown.js";
import { slugFromTitle } from "./rankings.js";
import { rankByFreshness, seasonYear, themeCreatedAt } from "./voteDecay.js";

async function voteResultsForTheme(docRef, displayLimit = 20, createdAt = null) {
  const voteLimit = Math.max(5, Math.min(50, Number(displayLimit) || 20));
  const [votesSnap, candidatesSnap] = await Promise.all([
    docRef.collection("votes").orderBy("count", "desc").limit(voteLimit).get(),
    docRef.collection("candidates").get(),
  ]);

  const voteMap = {};
  votesSnap.docs.forEach((d) => {
    voteMap[d.id] = { spotId: d.id, ...d.data() };
  });

  const candidates = candidatesSnap.docs.map((d) => d.data());
  const seen = new Set();
  const results = [];

  for (const c of candidates) {
    seen.add(c.spotId);
    results.push(voteMap[c.spotId] ?? { spotId: c.spotId, name: c.name, count: 0 });
  }
  for (const v of Object.values(voteMap)) {
    if (!seen.has(v.spotId)) results.push(v);
  }
  return rankByFreshness(results, createdAt);
}

function normalizeTheme(doc, results) {
  const data = doc.data();
  const slug = data.slug || slugFromTitle(data.title);
  return { id: doc.id, ...data, slug, results: results ?? [] };
}

async function normalizeThemeWithCrown(doc, results) {
  const theme = normalizeTheme(doc, results);
  const crown = nextCrownUpdate(theme, results);
  if (crown) {
    await doc.ref.update(crown);
    Object.assign(theme, crown);
  }
  return theme;
}

async function loadAllRankingsThemes(limit = 50) {
  try {
    const db = await getAdminDb();
    if (!db) return [];

    const snap = await db.collection("themes").orderBy("createdAt", "desc").limit(limit).get();
    return Promise.all(
      snap.docs.map(async (doc) => {
        const results = await voteResultsForTheme(doc.ref, doc.data().displayLimit, themeCreatedAt(doc.data()));
        return normalizeThemeWithCrown(doc, results);
      })
    );
  } catch (err) {
    console.error("[themesServer] getAllRankingsThemes failed:", err?.message || err);
    return [];
  }
}

async function loadRankingBySlug(slug) {
  try {
    const db = await getAdminDb();
    if (!db || !slug) return null;

    // A dish can run once per season (year). Show the latest season, and
    // within a season the doc that actually collected votes.
    const bySlug = await db.collection("themes").where("slug", "==", slug).limit(10).get();
    if (!bySlug.empty) {
      const withResults = await Promise.all(
        bySlug.docs.map(async (doc) => ({
          doc,
          results: await voteResultsForTheme(doc.ref, doc.data().displayLimit, themeCreatedAt(doc.data())),
        }))
      );
      const votes = (x) => x.results.reduce((n, r) => n + (r.count || 0), 0);
      withResults.sort(
        (a, b) => ((seasonYear(b.doc.data()) || 0) - (seasonYear(a.doc.data()) || 0)) || (votes(b) - votes(a))
      );
      return normalizeThemeWithCrown(withResults[0].doc, withResults[0].results);
    }

    const recent = await db.collection("themes").orderBy("createdAt", "desc").limit(50).get();
    const match = recent.docs.find((d) => slugFromTitle(d.data().title) === slug);
    if (!match) return null;

    const results = await voteResultsForTheme(match.ref, match.data().displayLimit, themeCreatedAt(match.data()));
    return normalizeThemeWithCrown(match, results);
  } catch (err) {
    console.error("[themesServer] getRankingBySlug failed:", err?.message || err);
    return null;
  }
}

export async function getLiveRanking() {
  try {
    const themes = await getAllRankingsThemes(10);
    return themes.find((t) => t.active && !t.winnerId) ?? null;
  } catch (err) {
    console.error("[themesServer] getLiveRanking failed:", err?.message || err);
    return null;
  }
}

// Each call fans out to ~2 Firestore queries per theme from a US region, so pages that
// ran it live took ~1-3 s. Kept in this server instance's memory for 60 s instead of
// Vercel's Data Cache / ISR (those count against plan limits). Votes clear it on the
// instance that handled them; other instances catch up within a minute.
const MEMO_MS = 60_000;
const memo = new Map();
function remember(key, load) {
  const hit = memo.get(key);
  if (hit && Date.now() - hit.at < MEMO_MS) return hit.value;
  const value = load().catch((err) => { memo.delete(key); throw err; });
  memo.set(key, { at: Date.now(), value });
  return value;
}
export function clearThemesMemo() {
  memo.clear();
}

export const getAllRankingsThemes = (limit = 50) => remember(`all:${limit}`, () => loadAllRankingsThemes(limit));
export const getRankingBySlug = (slug) => remember(`slug:${slug}`, () => loadRankingBySlug(slug));
