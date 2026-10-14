import { getAdminDb } from "../../../lib/firebaseAdmin.js";
import { unstable_cache } from "next/cache";

export const dynamic = "force-dynamic";

// The top-players slice is the part every visitor polls repeatedly, cache
// it. "me" (own rank) is 1 doc get + 1 count() aggregate regardless of
// collection size, so it's cheap enough to always compute live.
const getTopPlayers = unstable_cache(
  async (limit) => {
    const db = await getAdminDb();
    if (!db) return [];
    const snap = await db.collection("players").orderBy("score", "desc").limit(limit).get();
    return snap.docs.map((d, i) => ({ uid: d.id, rank: i + 1, ...pick(d.data()) }));
  },
  ["leaderboard-top"],
  // Each refresh is an ISR write; the caller's own rank is computed live below.
  { revalidate: 300, tags: ["leaderboard"] }
);

// Top players by score, plus (when a uid is given) that player's own row and
// rank even if they're below the cut. Small collection, cheap query, nothing
// like the 1600-doc index reads that had to be moved to static JSON.
export async function GET(req) {
  const db = await getAdminDb();
  if (!db) return Response.json({ players: [], me: null, unavailable: true }, { status: 200 });

  const { searchParams } = new URL(req.url);
  const uid = searchParams.get("uid");
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);

  try {
    // ?uid=…&me=1: just the caller's own row. The client reads the shared top list
    // from the edge-cached URL (no uid) alongside, so only this small part is live.
    if (uid && searchParams.get("me") === "1") {
      const mine = await db.collection("players").doc(uid).get();
      if (!mine.exists) return Response.json({ me: null }, { status: 200 });
      const data = mine.data();
      const ahead = await db.collection("players").where("score", ">", data.score ?? 0).count().get();
      return Response.json({ me: { uid, rank: (ahead.data().count ?? 0) + 1, ...pick(data) } }, { status: 200 });
    }

    const players = await getTopPlayers(limit);

    let me = uid ? players.find((p) => p.uid === uid) ?? null : null;

    // If the caller isn't in the top slice, fetch their doc and compute rank.
    if (uid && !me) {
      const mine = await db.collection("players").doc(uid).get();
      if (mine.exists) {
        const data = mine.data();
        const ahead = await db
          .collection("players")
          .where("score", ">", data.score ?? 0)
          .count()
          .get();
        me = { uid, rank: (ahead.data().count ?? 0) + 1, ...pick(data) };
      }
    }

    return Response.json({ players, me }, { status: 200 });
  } catch {
    return Response.json({ players: [], me: null }, { status: 200 });
  }
}

function pick(d = {}) {
  return {
    name: d.name || "Explorer",
    score: d.score || 0,
    covered: d.covered || 0,
    areas: d.areas || {},
  };
}
