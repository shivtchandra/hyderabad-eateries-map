import { getInspectionDrives, ACTIONS, formatDate } from "../../../lib/inspectionsServer.js";

// Public, cached: which map spots have a food safety record (latest one per spot).
// Feeds the map's "Food safety" filter and the detail sheet note. Only linked, sourced entries.
export async function GET() {
  const drives = await getInspectionDrives(); // newest first, cached + tagged "inspections"
  const spots = {};
  // Records for places not on our map, pinned at their checked location.
  const places = [];
  const seen = new Set();
  for (const d of drives) {
    for (const e of d.entries || []) {
      if (!e.spotId && e.place && !seen.has(e.name)) {
        seen.add(e.name);
        places.push({ name: e.name, area: e.area || null, lat: e.place.lat, lng: e.place.lng, action: e.action, label: ACTIONS[e.action] || e.action, date: d.date, dateLabel: formatDate(d.date) });
      }
      if (!e.spotId || spots[e.spotId]) continue;
      spots[e.spotId] = { action: e.action, label: ACTIONS[e.action] || e.action, status: e.status, date: d.date, dateLabel: formatDate(d.date) };
    }
  }
  return Response.json({ spots, places }, { headers: { "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=600" } });
}
