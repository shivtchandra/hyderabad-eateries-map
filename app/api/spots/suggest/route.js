import { getAdminDb } from "../../../../lib/firebaseAdmin.js";

// A voter's place that isn't on our map yet. Saved as a pending eatery (hidden from
// the map, which only shows "approved"), and returned with an id the vote can use
// right away. It shows in standings tagged "New" until an admin approves or removes it.
//   POST /api/spots/suggest { name, area } -> { spotId, name, area, isNew }

export const dynamic = "force-dynamic";

const tidy = (s, max) => String(s || "").replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, max);
const key = (s) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, " ").trim();
const slug = (s) => key(s).replace(/\s+/g, "-").slice(0, 40);

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const name = tidy(body.name, 60);
  const area = tidy(body.area, 40);
  if (name.length < 2 || area.length < 2 || /https?:|www\./i.test(name + area)) {
    return Response.json({ error: "bad-request", detail: "Give the place name and its area." }, { status: 400 });
  }

  const db = await getAdminDb();
  if (!db) return Response.json({ error: "unavailable" }, { status: 503 });

  const col = db.collection("eateries");
  const nameKey = key(name);

  // Same place suggested before (same name + area): reuse it so votes don't split.
  const same = await col.where("nameKey", "==", nameKey).limit(10).get();
  const hit = same.docs.find((d) => key(d.data().area || "") === key(area));
  if (hit) return Response.json({ spotId: hit.id, name: hit.data().name, area: hit.data().area, isNew: false });

  const id = `user-${slug(name)}-${Math.random().toString(36).slice(2, 6)}`;
  await col.doc(id).set({
    id,
    name,
    area,
    nameKey,
    status: "pending",
    source: "user-suggested",
    createdAt: new Date().toISOString(),
  });
  return Response.json({ spotId: id, name, area, isNew: true });
}
