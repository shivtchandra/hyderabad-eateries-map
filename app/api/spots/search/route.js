import { readFileSync } from "fs";
import { join } from "path";

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
  if (q.length < 2) return Response.json([]);

  const results = getEateries()
    .filter((e) => e.name.toLowerCase().includes(q))
    .slice(0, 10)
    .map((e) => ({ spotId: e.id, name: e.name, category: e.category, area: e.discoveredIn, tags: e.tags || [] }));

  return Response.json(results);
}
