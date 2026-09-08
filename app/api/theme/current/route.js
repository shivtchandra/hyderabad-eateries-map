import { getAdminDb } from "../../../../lib/firebaseAdmin.js";
import { unstable_cache } from "next/cache";
import { nextCrownUpdate } from "../../../../lib/themeCrown.js";

export const dynamic = "force-dynamic";

// Polled by every visitor for live vote counts, a 15s cache keeps it
// feeling live while cutting most of the repeat-read cost that blew the
// Firestore quota once already. The auto-activate/deactivate writes below
// only run once per cache window instead of every request, which is fine, // a theme going live up to 15s "late" is a non-issue.
const getCurrentTheme = unstable_cache(
  async () => {
    const db = await getAdminDb();
    if (!db) return { theme: null, results: [] };

    try {
      const today = new Date().toISOString().slice(0, 10);

      // Featured theme stays up until an admin starts a newer one.
      // endDate starts the crown phase; votes stay open (see /api/theme/vote).
      const activeSnap = await db.collection("themes").where("active", "==", true).limit(1).get();
      let doc = activeSnap.empty ? null : activeSnap.docs[0];

      // If nothing is featured, promote a scheduled theme whose startDate has arrived.
      if (!doc) {
        const scheduled = await db.collection("themes")
          .orderBy("createdAt", "desc")
          .limit(20)
          .get();
        for (const d of scheduled.docs) {
          const td = d.data();
          if (td.active) continue;
          if (td.startDate && today >= td.startDate && !td.winnerId) {
            await d.ref.update({ active: true });
            doc = d;
            break;
          }
        }
      }

      if (!doc) return { theme: null, results: [] };

      const theme = { id: doc.id, ...doc.data() };
      const voteLimit = theme.displayLimit ? Math.max(5, Math.min(50, Number(theme.displayLimit))) : 20;

      const [votesSnap, candidatesSnap] = await Promise.all([
        db.collection("themes").doc(doc.id).collection("votes").orderBy("count", "desc").limit(voteLimit).get(),
        db.collection("themes").doc(doc.id).collection("candidates").get(),
      ]);

      const voteMap = {};
      votesSnap.docs.forEach((d) => { voteMap[d.id] = { spotId: d.id, ...d.data() }; });

      const candidates = candidatesSnap.docs.map((d) => d.data());

      // Merge: start from candidates (preserves admin order), fill in vote counts
      const seen = new Set();
      const results = [];
      for (const c of candidates) {
        seen.add(c.spotId);
        results.push(voteMap[c.spotId] ?? { spotId: c.spotId, name: c.name, count: 0 });
      }
      // Append any voted spots not in candidates list (shouldn't happen, but safe)
      for (const v of Object.values(voteMap)) {
        if (!seen.has(v.spotId)) results.push(v);
      }
      results.sort((a, b) => (b.count || 0) - (a.count || 0));

      // After endDate: crown follows live #1. Votes stay open (see /api/theme/vote).
      const crown = nextCrownUpdate(theme, results, today);
      if (crown) {
        await doc.ref.update(crown);
        Object.assign(theme, crown);
      }

      return { theme, results };
    } catch {
      return { theme: null, results: [] };
    }
  },
  ["theme-current"],
  { revalidate: 15, tags: ["themes", "votes"] }
);

export async function GET() {
  return Response.json(await getCurrentTheme());
}
