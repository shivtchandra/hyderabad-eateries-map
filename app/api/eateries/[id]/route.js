import { readFileSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";

let detailCache = null;

function getDetails() {
  if (detailCache) return detailCache;
  detailCache = JSON.parse(
    readFileSync(join(process.cwd(), "public", "eateries-detail.json"), "utf-8")
  );
  return detailCache;
}

export async function GET(_req, { params }) {
  try {
    const details = getDetails();
    if (!Object.prototype.hasOwnProperty.call(details, params.id)) {
      return Response.json({ error: "Restaurant not found" }, { status: 404 });
    }

    return Response.json(details[params.id], {
      headers: {
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000",
      },
    });
  } catch {
    return Response.json({ error: "Restaurant details unavailable" }, { status: 503 });
  }
}
