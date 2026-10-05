import { readFileSync } from "fs";
import { join } from "path";
import { getEateries } from "../../../../lib/siteData.js";

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
    // Visitor-added places live in Firestore, not the built detail file.
    if (params.id.startsWith("user-")) {
      const { getAddedPlace } = await import("../../../../lib/addedPlaces.js");
      const p = await getAddedPlace(params.id);
      if (!p) return Response.json({ error: "Restaurant not found" }, { status: 404 });
      return Response.json(
        { id: p.id, name: p.name, category: p.category, lat: p.lat, lng: p.lng, discoveredIn: p.area, status: "approved", tags: [] },
        { headers: { "Cache-Control": "no-store" } }
      );
    }
    if (!Object.prototype.hasOwnProperty.call(details, params.id)) {
      const extra = getEateries().find((p) => p.id === params.id);
      if (extra) return Response.json(extra);
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
