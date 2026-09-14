import { getAdminDb } from "../../../../lib/firebaseAdmin.js";
import { unstable_cache } from "next/cache";

export const dynamic = "force-dynamic";

// Earlier themes stay votable after a newer one is featured.
const getHistory = unstable_cache(
  async (limit) => {
    const db = await getAdminDb();
    if (!db) return [];

    // Avoid composite index (active + createdAt): fetch recent, filter inactive.
    const snap = await db
      .collection("themes")
      .orderBy("createdAt", "desc")
      .limit(Math.max(limit * 4, 40))
      .get();

    const today = new Date().toISOString().slice(0, 10);
    const out = [];
    for (const doc of snap.docs) {
      const data = doc.data() || {};
      if (data.active) continue;
      if (data.endDate && data.endDate > today) continue; // skip future-scheduled themes
      const votesSnap = await doc.ref
        .collection("votes")
        .orderBy("count", "desc")
        .limit(20)
        .get();
      const results = votesSnap.docs.map((d) => ({ spotId: d.id, ...d.data() }));
      out.push({ id: doc.id, ...data, results });
      if (out.length >= limit) break;
    }
    return out;
  },
  ["theme-history"],
  { revalidate: 30, tags: ["themes"] }
);

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
