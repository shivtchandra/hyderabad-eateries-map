import { getAdminDb } from "../../../../lib/firebaseAdmin.js";
import { revalidateTag } from "next/cache";

export const dynamic = "force-dynamic";

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const { themeId, spotId, name, uid } = body;
  if (!themeId || !spotId) return Response.json({ error: "bad-request" }, { status: 400 });

  const db = await getAdminDb();
  if (!db) return Response.json({ error: "unavailable" }, { status: 503 });

  // Verify theme is still active before accepting votes.
  const themeDoc = await db.collection("themes").doc(themeId).get();
  if (!themeDoc.exists) return Response.json({ error: "theme-closed" }, { status: 409 });

  const td = themeDoc.data();
  // Auto-lock by endDate
  const today = new Date().toISOString().slice(0, 10);
  if (td.endDate && today > td.endDate) {
    if (td.active) await db.collection("themes").doc(themeId).update({ active: false });
    return Response.json({ error: "theme-closed" }, { status: 409 });
  }
  if (td.active !== true) return Response.json({ error: "theme-closed" }, { status: 409 });

  const votesCol = db.collection("themes").doc(themeId).collection("votes");
  const voteRef = votesCol.doc(spotId);
  const voterRef = uid
    ? db.collection("themes").doc(themeId).collection("voters").doc(uid)
    : null;

  // One live vote per uid per theme — but instead of just rejecting a second
  // vote, let it SWITCH: pull the count off whatever spot they voted for
  // before and move it onto the new one. Voting for the same spot again is a
  // no-op (returns the current count, changes nothing).
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
