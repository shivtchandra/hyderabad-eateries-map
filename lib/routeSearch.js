import { distanceToPolylineMeters, nearestPolylineIndex, haversineKm } from "./eateryUtils.js";

// OSRM's free routing sometimes picks a road that's technically fastest by
// its own graph weights but isn't how people actually drive a route locally
// (e.g. it sends Ameerpet -> Gachibowli via Borabanda/Old Bombay Road,
// skipping the Jubilee Hills route everyone actually takes). No general fix
// for this without a paid routing engine, so known-bad pairs get a manual
// via-point nudge instead. Add more entries here as they're spotted.
const ROUTE_BIASES = [
  {
    a: { lat: 17.4374, lng: 78.4482 }, // Ameerpet
    b: { lat: 17.4400, lng: 78.3489 }, // Gachibowli
    via: { lat: 17.4239, lng: 78.4092 }, // Jubilee Hills Check Post
    radiusKm: 2.5,
  },
];

function findRouteBiasVia(from, to) {
  for (const bias of ROUTE_BIASES) {
    const near = (p, q) => haversineKm(p, q) <= bias.radiusKm;
    if ((near(from, bias.a) && near(to, bias.b)) || (near(from, bias.b) && near(to, bias.a))) {
      return bias.via;
    }
  }
  return null;
}

// True if q matches at a word boundary in text (start of the string or right
// after a space/punctuation) rather than buried mid-word. Plain substring
// matching let junk like "Katta MaiSAMMa Wines" outrank real places for a
// query like "amm", which reads as broken when someone's mid-typing an area
// name. Word-boundary matching keeps results relevant to what's actually
// being typed.
function matchesAtWordStart(text, q) {
  const t = text.toLowerCase();
  if (t.startsWith(q)) return true;
  let i = t.indexOf(q, 1);
  while (i !== -1) {
    if (/[^a-z0-9]/.test(t[i - 1])) return true;
    i = t.indexOf(q, i + 1);
  }
  return false;
}

// Matches typed text against known area centroids and exact spot names, for
// the Route tab's From/To autocomplete. Areas first (a bare neighbourhood
// name is the common case), spots after.
export function searchAreasAndSpots(query, eateries, areaCentroids) {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const areaHits = (areaCentroids || [])
    .filter((a) => matchesAtWordStart(a.area, q))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((a) => ({ kind: "area", label: a.area, sub: `${a.count} spots`, lat: a.lat, lng: a.lng }));

  const spotHits = (eateries || [])
    .filter((e) => matchesAtWordStart(e.name, q))
    .sort((a, b) => (b.ratingCount || 0) - (a.ratingCount || 0))
    .slice(0, 5)
    .map((e) => ({ kind: "spot", label: e.name, sub: e.category, lat: e.lat, lng: e.lng }));

  return [...areaHits, ...spotHits].slice(0, 8);
}

// Free-text address/landmark lookup via OSM Nominatim's public API, bounded
// to Hyderabad, for anything the local area/spot list misses (a street
// address, a landmark not in our eatery data, etc). Same free/no-key/no-SLA
// tier as the OSRM calls above. Returns [] on any failure, never throws.
const HYD_VIEWBOX = "78.0,17.75,78.85,17.0"; // left,top,right,bottom
export async function geocodeAddress(query) {
  const q = query.trim();
  if (q.length < 3) return [];

  // 1. Try our internal route autocomplete endpoint (Ola Maps with Hyderabad bias)
  try {
    const res = await fetch(`/api/route/autocomplete?input=${encodeURIComponent(q)}`, {
      headers: { Accept: "application/json" },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch {}

  // 2. Direct client fallback to OSM Nominatim bounded to Hyderabad
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&viewbox=${HYD_VIEWBOX}&bounded=1&q=${encodeURIComponent(q)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "HyderabadEateriesMap/1.0",
        Accept: "application/json",
      },
    });
    if (!res.ok) return [];
    const rows = await res.json();
    return rows.map((r) => ({
      kind: "address",
      label: r.display_name.split(",").slice(0, 2).join(",").trim(),
      sub: "Address",
      lat: Number(r.lat),
      lng: Number(r.lon),
    }));
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

// Driving route geometry via OSRM's public demo API, same host this codebase
// already trusts for fetchRoadDistances. No key, free, no SLA. Returns null
// on any failure rather than throwing, caller decides how to surface it.
export async function fetchRoutePolyline(from, to, explicitVia) {
  if (!from || !to) return null;
  // A user-dropped via pin always wins over the known-pair auto-bias below.
  const via = explicitVia || findRouteBiasVia(from, to);
  // Server route first: Ola Maps (Krutrim) when a key is set, OSRM otherwise.
  try {
    const q = new URLSearchParams({ from: `${from.lat},${from.lng}`, to: `${to.lat},${to.lng}` });
    if (via) q.set("via", `${via.lat},${via.lng}`);
    const res = await fetch(`/api/route/directions?${q}`, { cache: "no-store", signal: AbortSignal.timeout(12000) });
    if (res.ok) {
      const r = await res.json();
      if (r?.coords?.length) return r;
    }
  } catch {}
  const coords = via
    ? `${from.lng},${from.lat};${via.lng},${via.lat};${to.lng},${to.lat}`
    : `${from.lng},${from.lat};${to.lng},${to.lat}`;
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);
  try {
    const res = await fetch(url, { cache: "no-store", signal: controller.signal });
    if (!res.ok) return null;
    const data = await res.json();
    const route = data.routes?.[0];
    if (!route) return null;
    const coords = route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng }));
    return { coords, distanceKm: route.distance / 1000, durationMin: route.duration / 60 };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// Bounding-box prefilter then precise point-to-polyline check, sorted by
// position along the route (start to end).
export function findEateriesAlongRoute(eateries, routeCoords, { bufferMeters = 700 } = {}) {
  if (!routeCoords?.length) return [];

  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
  for (const c of routeCoords) {
    if (c.lat < minLat) minLat = c.lat;
    if (c.lat > maxLat) maxLat = c.lat;
    if (c.lng < minLng) minLng = c.lng;
    if (c.lng > maxLng) maxLng = c.lng;
  }
  const padLat = bufferMeters / 111000;
  const midLat = (minLat + maxLat) / 2;
  const padLng = bufferMeters / (111000 * Math.cos((midLat * Math.PI) / 180));

  // Source data has a small number of duplicate ids (pre-existing data issue,
  // not this filter's job to fix), dedupe so React keys downstream stay unique.
  const seen = new Set();
  const deduped = (eateries || []).filter((e) => (seen.has(e.id) ? false : (seen.add(e.id), true)));

  const candidates = deduped.filter(
    (e) =>
      e.lat >= minLat - padLat && e.lat <= maxLat + padLat &&
      e.lng >= minLng - padLng && e.lng <= maxLng + padLng
  );

  const matches = candidates
    .map((e) => ({ e, dist: distanceToPolylineMeters(e, routeCoords) }))
    .filter((m) => m.dist <= bufferMeters)
    .map((m) => ({ ...m, idx: nearestPolylineIndex(m.e, routeCoords) }))
    .sort((a, b) => a.idx - b.idx);

  return matches.map((m) => m.e);
}
