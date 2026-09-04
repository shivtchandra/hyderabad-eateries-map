import { getAdminDb } from "../../../lib/firebaseAdmin.js";
import { unstable_cache } from "next/cache";

// Public read, polled on every page load, cache it and cap the scan so a
// growing/misbehaving "picks" collection can't blow the Firestore quota
// the way the uncached eateries scan did.
const getPicks = unstable_cache(
  async () => {
    const db = await getAdminDb();
    if (!db) return [];
    const snap = await db.collection("picks").orderBy("createdAt", "desc").limit(200).get();
    return snap.docs.map((d) => ({ spotId: d.id, ...d.data() }));
  },
  ["picks-list"],
  { revalidate: 60, tags: ["picks"] }
);

export async function GET() {
  const picks = await getPicks();
  return Response.json({ picks });
}
