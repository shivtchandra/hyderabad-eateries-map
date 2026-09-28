// Road route between two (or three, with a via stop) points.
// Ola Maps (Krutrim) first: Indian road data and traffic-aware durations. Falls back
// to the public OSRM server when there's no key or Ola fails, so routing never breaks.
//   GET /api/route/directions?from=lat,lng&to=lat,lng[&via=lat,lng]
// -> { coords: [{lat,lng}], distanceKm, durationMin, source }

export const dynamic = "force-dynamic";

const OLA_KEY = process.env.OLA_MAPS_API_KEY || process.env.NEXT_PUBLIC_OLA_MAPS_API_KEY;

function parsePoint(s) {
  const [lat, lng] = String(s || "").split(",").map(Number);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

// Google encoded polyline (precision 5), which Ola's overview_polyline uses.
function decodePolyline(str) {
  const out = [];
  let i = 0, lat = 0, lng = 0;
  while (i < str.length) {
    for (const axis of [0, 1]) {
      let shift = 0, result = 0, b;
      do { b = str.charCodeAt(i++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
      const d = result & 1 ? ~(result >> 1) : result >> 1;
      if (axis === 0) lat += d; else lng += d;
    }
    out.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return out;
}

async function viaOla(from, to, via) {
  if (!OLA_KEY) return null;
  const params = new URLSearchParams({
    origin: `${from.lat},${from.lng}`,
    destination: `${to.lat},${to.lng}`,
    mode: "driving",
    alternatives: "false",
    steps: "false",
    overview: "full",
    api_key: OLA_KEY,
  });
  if (via) params.set("waypoints", `${via.lat},${via.lng}`);
  const res = await fetch(`https://api.olamaps.io/routing/v1/directions?${params}`, {
    method: "POST",
    headers: { "X-Request-Id": crypto.randomUUID() },
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = await res.json();
  const route = data.routes?.[0];
  if (!route?.overview_polyline) return null;
  const legs = route.legs || [];
  const meters = legs.reduce((s, l) => s + (Number(l.distance) || 0), 0);
  const secs = legs.reduce((s, l) => s + (Number(l.duration) || 0), 0);
  return { coords: decodePolyline(route.overview_polyline), distanceKm: meters / 1000, durationMin: secs / 60, source: "ola" };
}

async function viaOsrm(from, to, via) {
  const pts = [from, via, to].filter(Boolean).map((p) => `${p.lng},${p.lat}`).join(";");
  const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${pts}?overview=full&geometries=geojson`, {
    signal: AbortSignal.timeout(9000),
    cache: "no-store",
  });
  if (!res.ok) return null;
  const route = (await res.json()).routes?.[0];
  if (!route) return null;
  return {
    coords: route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng })),
    distanceKm: route.distance / 1000,
    durationMin: route.duration / 60,
    source: "osrm",
  };
}

export async function GET(req) {
  const u = new URL(req.url);
  const from = parsePoint(u.searchParams.get("from"));
  const to = parsePoint(u.searchParams.get("to"));
  const via = parsePoint(u.searchParams.get("via"));
  if (!from || !to) return Response.json({ error: "from and to are required as lat,lng" }, { status: 400 });

  let route = null;
  try { route = await viaOla(from, to, via); } catch {}
  if (!route) {
    try { route = await viaOsrm(from, to, via); } catch {}
  }
  if (!route) return Response.json({ error: "no route" }, { status: 502 });
  return Response.json(route, { headers: { "Cache-Control": "no-store" } });
}
