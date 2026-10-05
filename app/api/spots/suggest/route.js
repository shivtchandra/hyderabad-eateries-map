import { getAdminDb } from "../../../../lib/firebaseAdmin.js";
import { cleanDishName, dishKey } from "../../../../lib/recommendationDishes.js";
import { cookieSecret, verifyVoter } from "../../../../lib/recommendationCookie.js";
import { voterHash } from "../../../../lib/recommendationVotes.js";

// A voter's place that isn't on our map yet. Saved as a pending eatery (hidden from
// the map, which only shows "approved"), and returned with an id the vote can use
// right away. It shows in standings tagged "New" until an admin approves or removes it.
//   POST /api/spots/suggest { name, area, forPicks?, dish? } -> { spotId, name, area, isNew }
// forPicks also records a Recommended nomination (people + dishes) for the admin queue.

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

  // Nomination for Recommended: one count per browser, plus what to try there.
  const dish = body.forPicks ? cleanDishName(body.dish) : null;
  const voter = verifyVoter(req.cookies?.get?.("hyd-recommendation-voter")?.value, cookieSecret());
  const who = voter ? voterHash(voter).slice(0, 24) : null;
  const nominate = async (ref, data) => {
    if (!body.forPicks) return;
    const cur = data?.pickNomination || { count: 0, voters: [], dishes: {} };
    if (who && cur.voters.includes(who) && (!dish || cur.dishes[dishKey(dish)])) return;
    const first = !who || !cur.voters.includes(who);
    await ref.set({ pickNomination: {
      count: cur.count + (first ? 1 : 0),
      voters: first && who ? [...cur.voters, who].slice(-50) : cur.voters,
      dishes: dish ? { ...cur.dishes, [dishKey(dish)]: dish } : cur.dishes,
      lastAt: new Date().toISOString(),
    } }, { merge: true });
  };

  const col = db.collection("eateries");
  const nameKey = key(name);

  // Same place suggested before (same name + area): reuse it so votes don't split.
  const same = await col.where("nameKey", "==", nameKey).limit(10).get();
  const hit = same.docs.find((d) => key(d.data().area || "") === key(area));
  if (hit) {
    await nominate(hit.ref, hit.data());
    return Response.json({ spotId: hit.id, name: hit.data().name, area: hit.data().area, isNew: false });
  }

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
  await nominate(col.doc(id), null);
  return Response.json({ spotId: id, name, area, isNew: true });
}
