import { getAdminDb } from "../../../lib/firebaseAdmin.js";

export const dynamic = "force-dynamic";

// Public read — small curated list, safe to fetch on every page load.
export async function GET() {
  const db = await getAdminDb();
  if (!db) return Response.json({ picks: [] });

  const snap = await db.collection("picks").orderBy("createdAt", "desc").get();
  const picks = snap.docs.map((d) => ({ spotId: d.id, ...d.data() }));
  return Response.json({ picks });
}
