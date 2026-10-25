import { getAdminDb } from "./firebaseAdmin.js";
import { nextCrownUpdate } from "./themeCrown.js";
import {
  dedupeThemesBySlug,
  rankingAreaQualification,
  rankingInsights,
  rankingPeriod,
  previousRankingPeriod,
  rankingWeek,
  previousRankingWeek,
  slugFromTitle,
} from "./rankings.js";
import { rankByFreshness, themeCreatedAt } from "./voteDecay.js";
import { allAreaPages, editorialRanking, getAreaBySlug, getEateryById } from "./siteData.js";
import { dishSeedsFor } from "./dishSeeds.js";
import { dishSourceLabel } from "./dishVotes.js";

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

async function monthlyVoteResultsForTheme(docRef, period, displayLimit = 20) {
  const voteLimit = Math.max(5, Math.min(50, Number(displayLimit) || 20));
  try {
    const snap = await docRef
      .collection("months")
      .doc(period)
      .collection("votes")
      .orderBy("count", "desc")
      .limit(voteLimit)
      .get();
    return snap.docs
      .map((d) => ({ spotId: d.id, ...d.data() }))
      .filter((row) => (row.count || 0) > 0)
      .sort((a, b) => (b.count || 0) - (a.count || 0) || String(a.name || "").localeCompare(String(b.name || "")));
  } catch {
    return [];
  }
}

async function weeklyVoteResultsForTheme(docRef, period, displayLimit = 20) {
  const voteLimit = Math.max(5, Math.min(50, Number(displayLimit) || 20));
  try {
    const snap = await docRef
      .collection("weeks")
      .doc(period)
      .collection("votes")
      .orderBy("count", "desc")
      .limit(voteLimit)
      .get();
    return snap.docs
      .map((d) => ({ spotId: d.id, ...d.data() }))
      .filter((row) => (row.count || 0) > 0)
      .sort((a, b) => (b.count || 0) - (a.count || 0) || String(a.name || "").localeCompare(String(b.name || "")));
  } catch {
    return [];
  }
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

async function normalizeThemeWithPeriods(doc, results) {
  const theme = await normalizeThemeWithCrown(doc, results);
  const currentPeriod = rankingPeriod();
  const previousPeriod = previousRankingPeriod(currentPeriod);
  const currentWeek = rankingWeek();
  const previousWeek = previousRankingWeek(currentWeek);
  const [currentPeriodResults, previousPeriodResults, currentWeekResults, previousWeekResults] = await Promise.all([
    monthlyVoteResultsForTheme(doc.ref, currentPeriod, theme.displayLimit),
    monthlyVoteResultsForTheme(doc.ref, previousPeriod, theme.displayLimit),
    weeklyVoteResultsForTheme(doc.ref, currentWeek, theme.displayLimit),
    weeklyVoteResultsForTheme(doc.ref, previousWeek, theme.displayLimit),
  ]);
  return {
    ...theme,
    currentPeriod,
    previousPeriod,
    currentPeriodResults,
    previousPeriodResults,
    currentWeek,
    previousWeek,
    currentWeekResults,
    previousWeekResults,
    insights: {
      allTime: rankingInsights(results),
      current: rankingInsights(currentPeriodResults, previousPeriodResults),
      previous: rankingInsights(previousPeriodResults),
      week: rankingInsights(currentWeekResults, previousWeekResults),
    },
  };
}

async function loadAllRankingsThemes(limit = 50) {
  try {
    const db = await getAdminDb();
    if (!db) return [];

    const snap = await db.collection("themes").orderBy("createdAt", "desc").limit(limit).get();
    const themes = await Promise.all(
      snap.docs.map(async (doc) => {
        const results = await voteResultsForTheme(doc.ref, doc.data().displayLimit, themeCreatedAt(doc.data()));
        return normalizeThemeWithCrown(doc, results);
      })
    );
    // Hide stray drafts and expose one continuous canonical pool per topic.
    return dedupeThemesBySlug(
      themes.filter((t) => t.active || t.winnerId || t.results.some((r) => (r.count || 0) > 0))
    );
  } catch (err) {
    console.error("[themesServer] getAllRankingsThemes failed:", err?.message || err);
    if (process.env.REQUIRE_LIVE_RANKINGS === "1") throw err;
    return [];
  }
}

async function loadRankingBySlug(slug) {
  try {
    const db = await getAdminDb();
    if (!db || !slug) return null;

    // Legacy reruns may have created several docs for one slug. Prefer the
    // currently promoted doc, otherwise keep the strongest established pool.
    const bySlug = await db.collection("themes").where("slug", "==", slug).limit(10).get();
    if (!bySlug.empty) {
      const withResults = await Promise.all(
        bySlug.docs.map(async (doc) => ({
          doc,
          results: await voteResultsForTheme(doc.ref, doc.data().displayLimit, themeCreatedAt(doc.data())),
        }))
      );
      const votes = (x) => x.results.reduce((n, r) => n + (r.count || 0), 0);
      withResults.sort((a, b) =>
        (Number(Boolean(b.doc.data().active)) - Number(Boolean(a.doc.data().active)))
        || (votes(b) - votes(a))
        || ((themeCreatedAt(b.doc.data()) || 0) - (themeCreatedAt(a.doc.data()) || 0))
      );
      return normalizeThemeWithPeriods(withResults[0].doc, withResults[0].results);
    }

    const recent = await db.collection("themes").orderBy("createdAt", "desc").limit(50).get();
    const match = recent.docs.find((d) => slugFromTitle(d.data().title) === slug);
    if (!match) return null;

    const results = await voteResultsForTheme(match.ref, match.data().displayLimit, themeCreatedAt(match.data()));
    return normalizeThemeWithPeriods(match, results);
  } catch (err) {
    console.error("[themesServer] getRankingBySlug failed:", err?.message || err);
    if (process.env.REQUIRE_LIVE_RANKINGS === "1") throw err;
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

export async function getRankingPeriodResults(themeId, period, displayLimit = 20) {
  if (!themeId || !period) return [];
  const db = await getAdminDb();
  if (!db) return [];
  return monthlyVoteResultsForTheme(db.collection("themes").doc(themeId), period, displayLimit);
}

export async function getRankingWeekResults(themeId, period, displayLimit = 20) {
  if (!themeId || !period) return [];
  const db = await getAdminDb();
  if (!db) return [];
  return weeklyVoteResultsForTheme(db.collection("themes").doc(themeId), period, displayLimit);
}

export async function getAreaRanking(slug, areaSlug) {
  const area = getAreaBySlug(areaSlug);
  if (!area) return null;
  const theme = await getRankingBySlug(slug);
  if (!theme) return null;
  const spotIds = new Set(area.spots.map((spot) => spot.id));
  const filter = (rows = []) => rows.filter((row) => spotIds.has(row.spotId));
  const known = new Set(theme.results.map((row) => row.spotId));
  const candidates = editorialRanking(theme, slug, 30)
    .filter((row) => !known.has(row.spotId))
    .map((row) => ({ ...row, count: 0 }));
  const results = filter([...theme.results, ...candidates]);
  const currentPeriodResults = filter(theme.currentPeriodResults);
  const previousPeriodResults = filter(theme.previousPeriodResults);
  const currentWeekResults = filter(theme.currentWeekResults);
  const previousWeekResults = filter(theme.previousWeekResults);
  return {
    area: { name: area.area, slug: area.slug, spotCount: area.spots.length },
    qualification: rankingAreaQualification(results),
    theme: {
      ...theme,
      results,
      currentPeriodResults,
      previousPeriodResults,
      currentWeekResults,
      previousWeekResults,
      insights: {
        allTime: rankingInsights(results),
        current: rankingInsights(currentPeriodResults, previousPeriodResults),
        previous: rankingInsights(previousPeriodResults),
        week: rankingInsights(currentWeekResults, previousWeekResults),
      },
    },
  };
}

export function qualifiedAreaRankings(themes = []) {
  const out = [];
  const seen = new Set();
  for (const theme of themes) {
    if (!theme?.slug || !theme.results?.length) continue;
    const known = new Set(theme.results.map((row) => row.spotId));
    const candidates = editorialRanking(theme, theme.slug, 30)
      .filter((row) => !known.has(row.spotId))
      .map((row) => ({ ...row, count: 0 }));
    const fullBallot = [...theme.results, ...candidates];
    for (const area of allAreaPages()) {
      const ids = new Set(getAreaBySlug(area.slug)?.spots.map((spot) => spot.id) || []);
      const results = fullBallot.filter((row) => ids.has(row.spotId));
      const qualification = rankingAreaQualification(results);
      const key = `${theme.slug}:${area.slug}`;
      if (qualification.indexable && !seen.has(key)) {
        seen.add(key);
        out.push({ slug: theme.slug, title: theme.title, area: area.area, areaSlug: area.slug, qualification });
      }
    }
  }
  return out;
}

const dishKey = (value) => String(value || "").toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, " ").trim().slice(0, 60);

function topDishSummary(spotId, votes = {}) {
  const spot = getEateryById(spotId) || { id: spotId, name: "" };
  const merged = new Map();
  for (const seed of dishSeedsFor(spot)) {
    merged.set(dishKey(seed.name), { name: seed.name, up: 0, down: 0, source: seed.source, ...(seed.people ? { people: seed.people } : {}) });
  }
  for (const [key, value] of Object.entries(votes || {})) {
    const previous = merged.get(key) || { name: value.name, up: 0, down: 0, source: "locals" };
    merged.set(key, { ...previous, up: value.up || 0, down: value.down || 0 });
  }
  const top = [...merged.values()]
    .filter((dish) => dish.up + dish.down === 0 || dish.up >= dish.down)
    .sort((a, b) => (b.up - b.down) - (a.up - a.down) || (b.up + b.down) - (a.up + a.down))[0];
  return top ? { name: top.name, label: dishSourceLabel(top), local: top.up > 0, up: top.up || 0 } : null;
}

export async function getTopDishSummaries(spotIds = []) {
  const ids = [...new Set(spotIds.filter(Boolean))].slice(0, 12);
  const key = `dishes:${ids.sort().join(",")}`;
  return remember(key, async () => {
    const db = await getAdminDb();
    const docs = db
      ? await Promise.all(ids.map((id) => db.collection("dishes").doc(id).get().catch(() => null)))
      : ids.map(() => null);
    return Object.fromEntries(ids.map((id, index) => {
      const doc = docs[index];
      return [id, topDishSummary(id, doc?.exists ? doc.data().votes : {})];
    }).filter(([, dish]) => dish));
  });
}
