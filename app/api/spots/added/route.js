import { getApprovedAddedPlaces } from "../../../../lib/addedPlaces.js";

// Approved visitor suggestions and weekly discoveries, in the same short-key shape
// as /eateries-index.json, so the map can merge them in without a redeploy.
export const dynamic = "force-dynamic";

export async function GET() {
  const places = await getApprovedAddedPlaces();
  const rows = places.map((p) => ({
    id: p.id, n: p.name, c: p.category, lat: p.lat, lng: p.lng,
    r: p.rating ?? null, rc: p.ratingCount ?? 0, t: "hidden-gem", g: [], p: p.priceLevel ?? null, a: p.area || p.discoveredIn || null,
    ca: p.approvedAt || p.createdAt || null, k: 1,
  }));
  return Response.json(rows, { headers: { "Cache-Control": "no-store" } });
}
