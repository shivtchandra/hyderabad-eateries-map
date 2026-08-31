import { getAdminDb } from "../../../../lib/firebaseAdmin.js";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const db = await getAdminDb();
  if (!db) return Response.json({ themes: [] });

  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit") || 10), 20);

    // Past themes: inactive, ordered newest first.
    const snap = await db
      .collection("themes")
      .where("active", "==", false)
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    const themes = await Promise.all(
      snap.docs.map(async (doc) => {
        const votesSnap = await doc.ref
          .collection("votes").orderBy("count", "desc").limit(20).get();
        const results = votesSnap.docs.map((d) => ({ spotId: d.id, ...d.data() }));
        return { id: doc.id, ...doc.data(), results };
      })
    );

    return Response.json({ themes });
  } catch {
    return Response.json({ themes: [] });
  }
}
