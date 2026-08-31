import { getAdminDb } from "../../../../lib/firebaseAdmin.js";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = await getAdminDb();
  if (!db) return Response.json({ theme: null, results: [] });

  try {
    const today = new Date().toISOString().slice(0, 10);

    // Auto-deactivate any active theme whose endDate has passed
    const activeSnap = await db.collection("themes").where("active", "==", true).limit(1).get();
    let doc = null;

    if (!activeSnap.empty) {
      const candidate = activeSnap.docs[0];
      const td = candidate.data();
      if (td.endDate && today > td.endDate) {
        await candidate.ref.update({ active: false });
        // fall through to check for a newly-live scheduled theme
      } else {
        doc = candidate;
      }
    }

    // If no active theme, check for a scheduled theme that should be live now
    if (!doc) {
      const scheduled = await db.collection("themes")
        .where("active", "==", false)
        .orderBy("createdAt", "desc")
        .limit(10)
        .get();
      for (const d of scheduled.docs) {
        const td = d.data();
        if (td.startDate && today >= td.startDate && (!td.endDate || today <= td.endDate) && !td.winnerId) {
          await d.ref.update({ active: true });
          doc = d;
          break;
        }
      }
    }

    if (!doc) return Response.json({ theme: null, results: [] });

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

    return Response.json({ theme, results });
  } catch {
    return Response.json({ theme: null, results: [] });
  }
}
