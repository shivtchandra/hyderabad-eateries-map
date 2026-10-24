import { getApprovedAddedPlaces } from "../../../lib/addedPlaces.js";
import { recentApprovedPlaces } from "../../../lib/newPlaces.js";

export const dynamic = "force-dynamic";

export async function GET() {
  const places = recentApprovedPlaces(await getApprovedAddedPlaces()).slice(0, 8);
  const rows = places.map((place) => ({
    id: place.id,
    name: place.name,
    area: place.area || place.discoveredIn || "Hyderabad",
    category: place.category || "restaurant",
    approvedAt: place.approvedAt || place.createdAt || null,
    lat: place.lat,
    lng: place.lng,
  }));
  return Response.json({ places: rows }, { headers: { "Cache-Control": "public, max-age=300" } });
}
