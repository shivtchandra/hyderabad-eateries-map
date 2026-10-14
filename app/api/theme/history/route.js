import { getAdminDb } from "../../../../lib/firebaseAdmin.js";
import { dedupeThemesBySlug } from "../../../../lib/rankings.js";
import { rankByFreshness, themeCreatedAt } from "../../../../lib/voteDecay.js";

export const dynamic = "force-dynamic";

// Earlier themes stay votable after a newer one is featured.
// In-memory memo (30 s), not Vercel's data cache: the data cache kept serving last
// week's list after a theme closed (plan limits rule out ISR/data cache anyway).
const MEMO_MS = 30_000;
const memo = new Map();
async function getHistory(limit) {
  const hit = memo.get(limit);
  if (hit && Date.now() - hit.at < MEMO_MS) return hit.value;
  const value = await loadHistory(limit);
  memo.set(limit, { at: Date.now(), value });
  return value;
}
async function loadHistory(limit) {
    const db = await getAdminDb();
    if (!db) return [];

    // Avoid composite index (active + createdAt): fetch recent, filter inactive.
    const snap = await db
      .collection("themes")
      .orderBy("createdAt", "desc")
      .limit(Math.max(limit * 4, 40))
      .get();

    const today = new Date().toISOString().slice(0, 10);
    // Skip active / future-scheduled themes, then read every candidate's votes in
    // parallel (one-by-one was up to 40 serial round trips, the Vote tab's slow load).
    const candidates = snap.docs.filter((doc) => {
      const data = doc.data() || {};
      return !data.active && !(data.endDate && data.endDate > today);
    });
    const votesSnaps = await Promise.all(candidates.map((doc) =>
      doc.ref.collection("votes").orderBy("count", "desc").limit(20).get()));
    const out = [];
    for (const [i, doc] of candidates.entries()) {
      const data = doc.data() || {};
      const votesSnap = votesSnaps[i];
      const results = rankByFreshness(votesSnap.docs.map((d) => ({ spotId: d.id, ...d.data() })), themeCreatedAt(data));
      // A theme that never ran (no winner, no votes) is a stray draft, not a past week.
      if (!data.winnerId && !results.some((r) => (r.count || 0) > 0)) continue;
      out.push({ id: doc.id, ...data, results });
      if (dedupeThemesBySlug(out).length >= limit) break;
    }
    return dedupeThemesBySlug(out).slice(0, limit);
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit") || 10), 20);
    const themes = await getHistory(limit);
    return Response.json({ themes });
  } catch (err) {
    console.error("[theme/history]", err?.message || err);
    return Response.json({ themes: [] });
  }
}
