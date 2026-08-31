import { getAdminDb } from "../../../lib/firebaseAdmin.js";

// Reads live Firestore data — must not be frozen into the build output.
export const dynamic = "force-dynamic";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  const db = await getAdminDb();
  if (!db) {
    // Fallback: serve from local JSON when Firestore not configured
    try {
      const { readFileSync } = await import("fs");
      const { join } = await import("path");
      const raw = readFileSync(join(process.cwd(), "data", "eateries.json"), "utf-8");
      let eateries = JSON.parse(raw).filter((e) => e.status === "approved");
      if (category) eateries = eateries.filter((e) => e.category === category);
      return Response.json(eateries);
    } catch {
      return Response.json([], { status: 200 });
    }
  }

  let query = db.collection("eateries").where("status", "==", "approved");
  if (category) query = query.where("category", "==", category);

  const snap = await query.get();
  const eateries = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return Response.json(eateries);
}
