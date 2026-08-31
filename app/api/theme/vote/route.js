import { getAdminDb } from "../../../../lib/firebaseAdmin.js";

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

  const voteRef = db.collection("themes").doc(themeId).collection("votes").doc(spotId);
  const voterRef = uid
    ? db.collection("themes").doc(themeId).collection("voters").doc(uid)
    : null;

  const result = await db.runTransaction(async (tx) => {
    // Enforce one-vote-per-uid if uid provided
    if (voterRef) {
      const voterDoc = await tx.get(voterRef);
      if (voterDoc.exists) return { duplicate: true };
    }
    const doc = await tx.get(voteRef);
    const count = (doc.exists ? doc.data().count || 0 : 0) + 1;
    tx.set(voteRef, { count, name: (name || "").slice(0, 100) }, { merge: true });
    if (voterRef) tx.set(voterRef, { spotId, votedAt: Date.now() });
    return { count };
  });

  if (result.duplicate) return Response.json({ error: "already-voted" }, { status: 429 });
  return Response.json(result);
}
