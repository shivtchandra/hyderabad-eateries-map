import { getAdminDb } from "../../../lib/firebaseAdmin.js";
import { unstable_cache } from "next/cache";

// Full collection scan (~3.5K docs) run fresh on every request was blowing
// the Firestore free-tier daily read quota. Cache it per-category for a day
// instead — the eatery list barely changes day to day.
const getEateries = unstable_cache(
  async (category) => {
    const db = await getAdminDb();
    if (!db) {
      // Fallback: serve from local JSON when Firestore not configured
      try {
        const { readFileSync } = await import("fs");
        const { join } = await import("path");
        const raw = readFileSync(join(process.cwd(), "data", "eateries.json"), "utf-8");
        let eateries = JSON.parse(raw).filter((e) => e.status === "approved");
        if (category) eateries = eateries.filter((e) => e.category === category);
        return eateries;
      } catch {
        return [];
      }
    }

    let query = db.collection("eateries").where("status", "==", "approved");
    if (category) query = query.where("category", "==", category);

    const snap = await query.get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },
  ["eateries-list"],
  { revalidate: 86400 }
);

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") || "";
  const eateries = await getEateries(category);
  return Response.json(eateries);
}
