import { getAdminDb } from "../../../../lib/firebaseAdmin.js";
import { revalidateTag } from "next/cache";

export const dynamic = "force-dynamic";

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const { themeId, spotId, name, uid } = body;
  if (!themeId || !spotId) return Response.json({ error: "bad-request" }, { status: 400 });

  const db = await getAdminDb();
  if (!db) return Response.json({ error: "unavailable" }, { status: 503 });

  // Themes stay votable after endDate and after a newer trend goes live.
  // `active` only marks the featured "This Week" card — it does not lock votes.
  const themeDoc = await db.collection("themes").doc(themeId).get();
  if (!themeDoc.exists) return Response.json({ error: "theme-missing" }, { status: 404 });

  const votesCol = db.collection("themes").doc(themeId).collection("votes");
  const voteRef = votesCol.doc(spotId);
  const voterRef = uid
    ? db.collection("themes").doc(themeId).collection("voters").doc(uid)
    : null;

  // One live vote per uid per theme; a later vote SWITCHES the count.
  const result = await db.runTransaction(async (tx) => {
    let voterDoc = null;
    if (voterRef) voterDoc = await tx.get(voterRef);

    const priorSpotId = voterDoc?.exists ? voterDoc.data().spotId : null;
    if (priorSpotId === spotId) {
      const doc = await tx.get(voteRef);
      return { count: doc.exists ? doc.data().count || 0 : 0, unchanged: true };
    }

    let oldVoteDoc = null;
    let oldVoteRef = null;
    if (priorSpotId) {
      oldVoteRef = votesCol.doc(priorSpotId);
      oldVoteDoc = await tx.get(oldVoteRef);
    }

    const newVoteDoc = await tx.get(voteRef);

    if (oldVoteRef && oldVoteDoc?.exists) {
      const oldCount = Math.max(0, (oldVoteDoc.data().count || 0) - 1);
      tx.set(oldVoteRef, { ...oldVoteDoc.data(), count: oldCount }, { merge: true });
    }

    const count = (newVoteDoc.exists ? newVoteDoc.data().count || 0 : 0) + 1;
    tx.set(voteRef, { count, name: (name || "").slice(0, 100) }, { merge: true });
    if (voterRef) tx.set(voterRef, { spotId, votedAt: Date.now() });

    return { count, switched: !!priorSpotId };
  });

  if (!result.unchanged) revalidateTag("themes");

  return Response.json(result);
}
