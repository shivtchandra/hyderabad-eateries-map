import data from "../data/inspection-links.json";

// Hand-checked links from food safety records to spots on our map
// (data/inspection-links.json). A record only gets a spotId here when the name
// AND the location match: Hyderabad brands run many branches, and a wrong link
// would pin a violation on the wrong restaurant, so there is no fuzzy matching
// at runtime. Applies to Firestore drives and the local fallback alike;
// a spotId set in /admin always wins.
const norm = (s = "") => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const LINKS = new Map((data.links || []).map((l) => [`${l.date}|${norm(l.name)}`, l.spotId]));

export function withLinks(drives = []) {
  return drives.map((d) => ({
    ...d,
    entries: (d.entries || []).map((e) => {
      if (e.spotId) return e;
      const spotId = LINKS.get(`${d.date}|${norm(e.name)}`);
      return spotId ? { ...e, spotId } : e;
    }),
  }));
}
