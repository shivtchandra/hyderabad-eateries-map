import { getAdminDb } from "./firebaseAdmin.js";
import { nextCrownUpdate } from "./themeCrown.js";
import { slugFromTitle } from "./rankings.js";

async function voteResultsForTheme(docRef, displayLimit = 20) {
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
  results.sort((a, b) => (b.count || 0) - (a.count || 0));
  return results;
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

export async function getAllRankingsThemes(limit = 50) {
  try {
    const db = await getAdminDb();
    if (!db) return [];

    const snap = await db.collection("themes").orderBy("createdAt", "desc").limit(limit).get();
    return Promise.all(
      snap.docs.map(async (doc) => {
        const results = await voteResultsForTheme(doc.ref, doc.data().displayLimit);
        return normalizeThemeWithCrown(doc, results);
      })
    );
  } catch (err) {
    console.error("[themesServer] getAllRankingsThemes failed:", err?.message || err);
    return [];
  }
}

export async function getRankingBySlug(slug) {
  try {
    const db = await getAdminDb();
    if (!db || !slug) return null;

    const bySlug = await db.collection("themes").where("slug", "==", slug).limit(1).get();
    if (!bySlug.empty) {
      const doc = bySlug.docs[0];
      const results = await voteResultsForTheme(doc.ref, doc.data().displayLimit);
      return normalizeThemeWithCrown(doc, results);
    }

    const recent = await db.collection("themes").orderBy("createdAt", "desc").limit(50).get();
    const match = recent.docs.find((d) => slugFromTitle(d.data().title) === slug);
    if (!match) return null;

    const results = await voteResultsForTheme(match.ref, match.data().displayLimit);
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
