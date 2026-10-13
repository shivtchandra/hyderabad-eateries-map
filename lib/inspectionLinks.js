import data from "../data/inspection-links.json";
import placesData from "../data/inspection-places.json";

// Hand-checked links from food safety records to spots on our map
// (data/inspection-links.json). A record only gets a spotId here when the name
// AND the location match: Hyderabad brands run many branches, and a wrong link
// would pin a violation on the wrong restaurant, so there is no fuzzy matching
// at runtime. Applies to Firestore drives and the local fallback alike;
// a spotId set in /admin always wins.
const norm = (s = "") => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const LINKS = new Map((data.links || []).map((l) => [`${l.date}|${norm(l.name)}`, l.spotId]));
// Records not on our map but located on Google Places and checked by hand
// (data/inspection-places.json, scripts/geocode-inspections.mjs).
const PLACES = new Map((placesData.places || []).filter((p) => p.verified && p.lat != null)
  .map((p) => [`${p.date}|${norm(p.name)}`, { lat: p.lat, lng: p.lng, address: p.address || null }]));

export function withLinks(drives = []) {
  return drives.map((d) => ({
    ...d,
    entries: (d.entries || []).map((e) => {
      if (e.spotId) return e;
      const k = `${d.date}|${norm(e.name)}`;
      const spotId = LINKS.get(k);
      if (spotId) return { ...e, spotId };
      const place = PLACES.get(k);
      return place ? { ...e, place } : e;
    }),
  }));
}
