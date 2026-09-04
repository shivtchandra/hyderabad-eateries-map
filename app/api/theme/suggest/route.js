import { getAdminDb } from "../../../../lib/firebaseAdmin.js";

export const dynamic = "force-dynamic";

// A visitor requests a future weekly theme. Write-only from the client, the
// list is private to the admin (see /api/admin/suggestions).
//
//   POST { text, uid } -> store a suggestion

const COL = "themeSuggestions";

export async function POST(req) {
  const db = await getAdminDb();
  if (!db) return Response.json({ error: "unavailable" }, { status: 503 });

  const body = await req.json().catch(() => ({}));
  const uid = body.uid || null;
  const text = (body.text || "").toString().trim().replace(/\s+/g, " ").slice(0, 80);
  if (text.length < 3) return Response.json({ error: "too-short" }, { status: 400 });

  try {
    // light rate-limit: max 5 pending suggestions per uid
    if (uid) {
      const mine = await db
        .collection(COL)
        .where("uid", "==", uid)
        .where("status", "==", "new")
        .count()
        .get()
        .catch(() => null);
      if (mine && (mine.data().count || 0) >= 5) {
        return Response.json({ error: "rate-limited" }, { status: 429 });
      }
    }
    await db.collection(COL).add({ text, uid, status: "new", createdAt: Date.now() });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "backend" }, { status: 500 });
  }
}
