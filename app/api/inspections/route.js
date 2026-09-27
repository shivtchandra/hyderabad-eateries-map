import { getInspectionDrives, ACTIONS, formatDate } from "../../../lib/inspectionsServer.js";

// Public, cached: which map spots have a food safety record (latest one per spot).
// Feeds the map's "Food safety" filter and the detail sheet note. Only linked, sourced entries.
export async function GET() {
  const drives = await getInspectionDrives(); // newest first, cached + tagged "inspections"
  const spots = {};
  for (const d of drives) {
    for (const e of d.entries || []) {
      if (!e.spotId || spots[e.spotId]) continue;
      spots[e.spotId] = { action: e.action, label: ACTIONS[e.action] || e.action, status: e.status, date: d.date, dateLabel: formatDate(d.date) };
    }
  }
  return Response.json({ spots }, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } });
}
