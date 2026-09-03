import { getAdminDb } from "../../../lib/firebaseAdmin.js";
import { unstable_cache } from "next/cache";

export const dynamic = "force-dynamic";

function thisMonday() {
  const d = new Date();
  const day = d.getUTCDay();
  d.setUTCDate(d.getUTCDate() - (day === 0 ? 6 : day - 1));
  return d.toISOString().slice(0, 10);
}

// Both branches are polled repeatedly (map markers, leaderboards) — a short
// cache keeps counts feeling live while cutting most of the repeat-read cost
// that blew the Firestore quota once already.
const getTopVotes = unstable_cache(
  async (top, limit) => {
    const db = await getAdminDb();
    if (!db) return [];
    const monday = thisMonday();
    // Fetch top 30 by the relevant counter, then filter week client-side —
    // avoids needing a composite index on (week_start, week_total).
    const field = top === "week" ? "week_total" : "total";
    const snap = await db.collection("votes").orderBy(field, "desc").limit(30).get();
    let results = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    if (top === "week") results = results.filter((r) => r.week_start === monday);
    return results.slice(0, limit);
  },
  ["votes-top"],
  { revalidate: 20, tags: ["votes"] }
);

const getVotesByIds = unstable_cache(
  async (idsKey) => {
    const db = await getAdminDb();
    if (!db) return {};
    const ids = idsKey.split(",").filter(Boolean);
    if (!ids.length) return {};
    const docs = await db.getAll(...ids.map((id) => db.collection("votes").doc(id)));
    const votes = {};
    for (const d of docs) {
      if (d.exists) votes[d.id] = d.data();
    }
    return votes;
  },
  ["votes-by-ids"],
  { revalidate: 20, tags: ["votes"] }
);

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const top = searchParams.get("top");

  if (top) {
    const limit = Math.min(Number(searchParams.get("limit") || 5), 20);
    const results = await getTopVotes(top, limit);
    return Response.json({ results });
  }

  const ids = (searchParams.get("ids") || "").split(",").filter(Boolean).slice(0, 50);
  if (!ids.length) return Response.json({ votes: {} });

  const votes = await getVotesByIds(ids.join(","));
  return Response.json({ votes });
}
