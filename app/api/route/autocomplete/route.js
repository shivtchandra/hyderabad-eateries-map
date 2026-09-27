export const dynamic = "force-dynamic";

const HYD_VIEWBOX = "78.0,17.75,78.85,17.0"; // left,top,right,bottom (Hyderabad bounding box)

async function fallbackNominatim(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&viewbox=${HYD_VIEWBOX}&bounded=1&q=${encodeURIComponent(query)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
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
      source: "osm",
    }));
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

async function resolveOlaDetails(placeId, apiKey) {
  try {
    const url = `https://api.olamaps.io/places/v1/details?place_id=${encodeURIComponent(placeId)}&api_key=${apiKey}`;
    const res = await fetch(url, { headers: { "X-Request-Id": "details-" + Date.now() } });
    if (!res.ok) return null;
    const data = await res.json();
    const loc = data.result?.geometry?.location;
    if (loc?.lat && loc?.lng) {
      return { lat: Number(loc.lat), lng: Number(loc.lng) };
    }
  } catch {}
  return null;
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const input = (searchParams.get("input") || searchParams.get("q") || "").trim();
  if (input.length < 2) return Response.json([]);

  const apiKey = process.env.OLA_MAPS_API_KEY || "FErYfEgE6znd5dD49UI9_na1f";

  try {
    // 1. Try Ola Maps Places Autocomplete
    // Biased around Hyderabad center (17.3850, 78.4867) within 50km
    const olaUrl = `https://api.olamaps.io/places/v1/autocomplete?input=${encodeURIComponent(input)}&location=17.3850,78.4867&radius=50000&api_key=${apiKey}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(olaUrl, {
      signal: controller.signal,
      headers: {
        "X-Request-Id": "ola-ac-" + Date.now(),
        Accept: "application/json",
      },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const predictions = data.predictions || [];

      if (predictions.length > 0) {
        // Resolve coordinates for the top predictions
        const items = await Promise.all(
          predictions.slice(0, 5).map(async (p) => {
            let lat = p.geometry?.location?.lat;
            let lng = p.geometry?.location?.lng;

            if ((!lat || !lng) && p.place_id) {
              const coords = await resolveOlaDetails(p.place_id, apiKey);
              if (coords) {
                lat = coords.lat;
                lng = coords.lng;
              }
            }

            const label = p.structured_formatting?.main_text || p.description?.split(",")[0] || p.description;
            const sub = p.structured_formatting?.secondary_text || "Ola Maps";

            return {
              kind: "address",
              label: label.trim(),
              sub: sub.trim(),
              placeId: p.place_id,
              lat: Number(lat) || null,
              lng: Number(lng) || null,
              source: "olamaps",
            };
          })
        );

        const validItems = items.filter((item) => item.lat != null && item.lng != null);
        if (validItems.length > 0) {
          return Response.json(validItems);
        }
      }
    }
  } catch (err) {
    console.warn("[autocomplete] Ola Maps request error, falling back to OSM:", err?.message || err);
  }

  // 2. Fallback to OpenStreetMap Nominatim (works without API key)
  const fallback = await fallbackNominatim(input);
  return Response.json(fallback);
}
