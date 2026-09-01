import { getAdminDb } from "../../../../lib/firebaseAdmin.js";

export const dynamic = "force-dynamic";

// Community requests for a future weekly theme. Anyone can suggest one and
// upvote others'; the admin reads these to pick what's next.
//
//   GET                         -> { suggestions: [{id, text, upvotes}] }
//   POST { text, uid }          -> create a suggestion
//   POST { action:"upvote", id, uid } -> +1, one per uid per suggestion

const COL = "themeSuggestions";

export async function GET() {
  const db = await getAdminDb();
  if (!db) return Response.json({ suggestions: [] });
  try {
    const snap = await db.collection(COL).orderBy("upvotes", "desc").limit(30).get();
    const suggestions = snap.docs.map((d) => {
      const x = d.data();
      return { id: d.id, text: x.text, upvotes: x.upvotes || 0 };
    });
    return Response.json({ suggestions });
  } catch {
    return Response.json({ suggestions: [] });
  }
}

export async function POST(req) {
  const db = await getAdminDb();
  if (!db) return Response.json({ error: "unavailable" }, { status: 503 });

  const body = await req.json().catch(() => ({}));
  const { action, id, uid } = body;

  // ---- upvote an existing suggestion ----
  if (action === "upvote") {
    if (!id) return Response.json({ error: "bad-request" }, { status: 400 });
    const ref = db.collection(COL).doc(id);
    const voterRef = uid ? ref.collection("voters").doc(uid) : null;
    try {
      const result = await db.runTransaction(async (tx) => {
        const doc = await tx.get(ref);
        if (!doc.exists) return { error: "not-found" };
        if (voterRef) {
          const v = await tx.get(voterRef);
          if (v.exists) return { count: doc.data().upvotes || 0, already: true };
        }
        const count = (doc.data().upvotes || 0) + 1;
        tx.set(ref, { upvotes: count }, { merge: true });
        if (voterRef) tx.set(voterRef, { at: Date.now() });
        return { count };
      });
      if (result.error) return Response.json(result, { status: 404 });
      return Response.json({ ok: true, upvotes: result.count, already: !!result.already });
    } catch {
      return Response.json({ error: "backend" }, { status: 500 });
    }
  }

  // ---- create a new suggestion ----
  const text = (body.text || "").toString().trim().replace(/\s+/g, " ").slice(0, 80);
  if (text.length < 3) return Response.json({ error: "too-short" }, { status: 400 });

  try {
    // light rate-limit: max 5 suggestions per uid
    if (uid) {
      const mine = await db.collection(COL).where("uid", "==", uid).count().get().catch(() => null);
      if (mine && (mine.data().count || 0) >= 5) {
        return Response.json({ error: "rate-limited" }, { status: 429 });
      }
    }
    const ref = await db.collection(COL).add({
      text,
      upvotes: 1,
      uid: uid || null,
      createdAt: Date.now(),
    });
    // creator implicitly upvotes their own
    if (uid) await ref.collection("voters").doc(uid).set({ at: Date.now() });
    return Response.json({ ok: true, id: ref.id, text, upvotes: 1 });
  } catch {
    return Response.json({ error: "backend" }, { status: 500 });
  }
}
