import { getAdminDb } from "../../../../lib/firebaseAdmin.js";
import { snapToSeoTheme } from "../../../../lib/rankings.js";
import { revalidateTag } from "next/cache";

export const dynamic = "force-dynamic";

function authOk(req) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("Authorization") || "";
  return auth === `Bearer ${secret}`;
}

// GET, list all themes with full vote results, newest first.
export async function GET(req) {
  if (!authOk(req)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const db = await getAdminDb();
  if (!db) return Response.json({ themes: [] });

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") || 20), 50);

  const snap = await db.collection("themes").orderBy("createdAt", "desc").limit(limit).get();
  const themes = await Promise.all(
    snap.docs.map(async (doc) => {
      const [votesSnap, candidatesSnap] = await Promise.all([
        doc.ref.collection("votes").orderBy("count", "desc").limit(50).get(),
        doc.ref.collection("candidates").get(),
      ]);
      const results = votesSnap.docs.map((d) => ({ spotId: d.id, ...d.data() }));
      const candidates = candidatesSnap.docs.map((d) => d.data());
      return { id: doc.id, ...doc.data(), results, candidates };
    })
  );
  return Response.json({ themes });
}

// POST, create or update the active theme.
// Body: { title, description, startDate, endDate, themeId? }
// If themeId is omitted a new theme is created; pass it to update an existing one.
export async function POST(req) {
  if (!authOk(req)) return Response.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { title, description, startDate, endDate, themeId } = body;
  if (!title) return Response.json({ error: "title required" }, { status: 400 });

  const db = await getAdminDb();
  if (!db) return Response.json({ error: "unavailable" }, { status: 503 });

  const { displayLimit } = body;
  const id = themeId || String(Date.now());
  const today = new Date().toISOString().slice(0, 10);
  // Auto-determine active: live if startDate <= today <= endDate (or no dates set)
  const shouldBeActive = (!startDate || today >= startDate) && (!endDate || today <= endDate);

  // Deactivate any currently active theme when creating a fresh one.
  if (!themeId) {
    const active = await db.collection("themes").where("active", "==", true).get();
    const batch = db.batch();
    active.docs.forEach((d) => batch.update(d.ref, { active: false }));
    await batch.commit();
  }

  // Snap to the closest canonical SEO pick so the vote lands on the exact
  // slug we're trying to rank; unmatched titles pass through unchanged.
  const snapped = snapToSeoTheme(title);

  await db.collection("themes").doc(id).set(
    {
      title: snapped.title, slug: snapped.slug, description: description || "",
      startDate: startDate || "", endDate: endDate || "",
      displayLimit: displayLimit ? Number(displayLimit) : 20,
      active: shouldBeActive,
      createdAt: Date.now(),
    },
    { merge: true }
  );

  // Optionally seed/replace candidates
  const { candidates } = body; // [{spotId, name}]
  if (Array.isArray(candidates) && candidates.length) {
    const batch2 = db.batch();
    // Clear old candidates first
    const oldCands = await db.collection("themes").doc(id).collection("candidates").get();
    oldCands.docs.forEach((d) => batch2.delete(d.ref));
    candidates.forEach((c) => {
      const ref = db.collection("themes").doc(id).collection("candidates").doc(c.spotId);
      batch2.set(ref, { spotId: c.spotId, name: c.name });
    });
    await batch2.commit();
  }

  revalidateTag("themes");
  revalidateTag("votes");
  return Response.json({ id, active: shouldBeActive });
}

// PATCH, set winner for a theme.
// Body: { themeId, winnerId, winnerName }
export async function PATCH(req) {
  if (!authOk(req)) return Response.json({ error: "unauthorized" }, { status: 401 });

  const { themeId, winnerId, winnerName } = await req.json().catch(() => ({}));
  if (!themeId || !winnerId) return Response.json({ error: "themeId and winnerId required" }, { status: 400 });

  const db = await getAdminDb();
  if (!db) return Response.json({ error: "unavailable" }, { status: 503 });

  await db.collection("themes").doc(themeId).update({ winnerId, winnerName: winnerName || "", active: false });
  return Response.json({ ok: true });
}
