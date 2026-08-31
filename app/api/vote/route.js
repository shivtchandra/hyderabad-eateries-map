import { getAdminDb } from "../../../lib/firebaseAdmin.js";

export const dynamic = "force-dynamic";

function thisMonday() {
  const d = new Date();
  const day = d.getUTCDay();
  d.setUTCDate(d.getUTCDate() - (day === 0 ? 6 : day - 1));
  return d.toISOString().slice(0, 10);
}

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const { spotId, name } = body;
  if (!spotId || typeof spotId !== "string" || spotId.length > 120) {
    return Response.json({ error: "bad-request" }, { status: 400 });
  }

  const db = await getAdminDb();
  if (!db) return Response.json({ error: "unavailable" }, { status: 503 });

  const monday = thisMonday();
  const ref = db.collection("votes").doc(spotId);

  const result = await db.runTransaction(async (tx) => {
    const doc = await tx.get(ref);
    const data = doc.exists ? doc.data() : { total: 0, week_total: 0, week_start: monday };
    const week_total = data.week_start === monday ? (data.week_total || 0) + 1 : 1;
    const updated = { total: (data.total || 0) + 1, week_total, week_start: monday };
    if (name && typeof name === "string") updated.name = name.slice(0, 100);
    tx.set(ref, updated);
    return updated;
  });

  return Response.json(result);
}

// DELETE — remove a vote (decrement counts). Body: { spotId }
export async function DELETE(req) {
  const body = await req.json().catch(() => ({}));
  const { spotId } = body;
  if (!spotId || typeof spotId !== "string" || spotId.length > 120) {
    return Response.json({ error: "bad-request" }, { status: 400 });
  }

  const db = await getAdminDb();
  if (!db) return Response.json({ error: "unavailable" }, { status: 503 });

  const monday = thisMonday();
  const ref = db.collection("votes").doc(spotId);

  const result = await db.runTransaction(async (tx) => {
    const doc = await tx.get(ref);
    if (!doc.exists) return { total: 0, week_total: 0, week_start: monday };
    const data = doc.data();
    const total = Math.max(0, (data.total || 0) - 1);
    // Only decrement week_total if the vote being removed was cast this week.
    const week_total = data.week_start === monday ? Math.max(0, (data.week_total || 0) - 1) : (data.week_total || 0);
    const updated = { ...data, total, week_total };
    tx.set(ref, updated);
    return updated;
  });

  return Response.json(result);
}
