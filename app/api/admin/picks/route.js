import { getAdminDb } from "../../../../lib/firebaseAdmin.js";

export const dynamic = "force-dynamic";

function authOk(req) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("Authorization") || "";
  return auth === `Bearer ${secret}`;
}

// GET, list all curated picks, newest first.
export async function GET(req) {
  if (!authOk(req)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const db = await getAdminDb();
  if (!db) return Response.json({ picks: [] });

  const snap = await db.collection("picks").orderBy("createdAt", "desc").get();
  const picks = snap.docs.map((d) => ({ spotId: d.id, ...d.data() }));
  return Response.json({ picks });
}

// POST, create or update a pick for a spot. One pick per spot (doc id = spotId).
// Body: { spotId, spotName, dishes, curator?, note? }
export async function POST(req) {
  if (!authOk(req)) return Response.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { spotId, spotName, dishes, curator, note } = body;
  if (!spotId || !spotName || !dishes) {
    return Response.json({ error: "spotId, spotName and dishes required" }, { status: 400 });
  }

  const db = await getAdminDb();
  if (!db) return Response.json({ error: "unavailable" }, { status: 503 });

  const ref = db.collection("picks").doc(spotId);
  const existing = await ref.get();
  await ref.set(
    {
      spotId,
      spotName,
      dishes: String(dishes).slice(0, 200),
      curator: (curator || "").slice(0, 60),
      note: (note || "").slice(0, 300),
      createdAt: existing.exists ? existing.data().createdAt : Date.now(),
    },
    { merge: true }
  );

  return Response.json({ ok: true, spotId });
}

// DELETE, remove a pick. Body: { spotId }
export async function DELETE(req) {
  if (!authOk(req)) return Response.json({ error: "unauthorized" }, { status: 401 });

  const { spotId } = await req.json().catch(() => ({}));
  if (!spotId) return Response.json({ error: "spotId required" }, { status: 400 });

  const db = await getAdminDb();
  if (!db) return Response.json({ error: "unavailable" }, { status: 503 });

  await db.collection("picks").doc(spotId).delete();
  return Response.json({ ok: true });
}
