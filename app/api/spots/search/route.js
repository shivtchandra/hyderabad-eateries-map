import { readFileSync } from "fs";
import { join } from "path";
import { displayArea } from "../../../../lib/eateryUtils.js";

export const dynamic = "force-dynamic";

let _cache = null;
function getEateries() {
  if (_cache) return _cache;
  try {
    _cache = JSON.parse(readFileSync(join(process.cwd(), "data", "eateries.json"), "utf-8"));
    return _cache;
  } catch { return []; }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim().toLowerCase();
  const limit = Math.min(Number(searchParams.get("limit") || 10), 20);
  if (q.length < 2) return Response.json([]);

  const results = getEateries()
    .filter((e) => e.status === "approved" && (e.name || "").toLowerCase().includes(q))
    .sort((a, b) => (b.ratingCount || 0) - (a.ratingCount || 0) || (b.rating || 0) - (a.rating || 0))
    .slice(0, limit)
    .map((e) => ({
      spotId: e.id,
      name: e.name,
      category: e.category,
      area: displayArea(e),
      tags: e.tags || [],
      rating: e.rating ?? null,
      ratingCount: e.ratingCount || 0,
    }));

  return Response.json(results);
}
