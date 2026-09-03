import { getAdminDb } from "../../../../lib/firebaseAdmin.js";
import { unstable_cache } from "next/cache";

export const dynamic = "force-dynamic";

// Past themes are locked (inactive), so this basically never changes —
// cache it for an hour instead of an N+1 fetch (theme + per-theme votes)
// on every page load.
const getHistory = unstable_cache(
  async (limit) => {
    const db = await getAdminDb();
    if (!db) return [];

    // Past themes: inactive, ordered newest first.
    const snap = await db
      .collection("themes")
      .where("active", "==", false)
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    return Promise.all(
      snap.docs.map(async (doc) => {
        const votesSnap = await doc.ref
          .collection("votes").orderBy("count", "desc").limit(20).get();
        const results = votesSnap.docs.map((d) => ({ spotId: d.id, ...d.data() }));
        return { id: doc.id, ...doc.data(), results };
      })
    );
  },
  ["theme-history"],
  { revalidate: 3600, tags: ["themes"] }
);

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit") || 10), 20);
    const themes = await getHistory(limit);
    return Response.json({ themes });
  } catch {
    return Response.json({ themes: [] });
  }
}
