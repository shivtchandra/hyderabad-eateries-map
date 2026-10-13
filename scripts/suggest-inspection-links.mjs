// Suggests links from food safety records to spots on our map, for a human to
// check before adding them to data/inspection-links.json. Prints every spot
// whose name overlaps an unlinked record, and whether the location agrees
// (the record's area appears in the spot's address or area). A name match with
// no location match is almost always a different branch: do not link it.
//
//   node scripts/suggest-inspection-links.mjs [drives.json]
import fs from "fs";

const drivesFile = process.argv[2] || "data/inspection-drives.json";
const drives = JSON.parse(fs.readFileSync(drivesFile, "utf8"));
const raw = JSON.parse(fs.readFileSync("data/eateries.json", "utf8"));
const eateries = Array.isArray(raw) ? raw : raw.eateries || raw.places || Object.values(raw)[0];
const links = JSON.parse(fs.readFileSync("data/inspection-links.json", "utf8")).links || [];

const STOP = new Set("the restaurant restaurants hotel family and pvt ltd private limited cafe kitchen foods food bar n co sri shree new hyderabad dhaba bakery bakers sweets house point center centre a of unit branch".split(" "));
const norm = (s = "") => s.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").trim();
const core = (s) => new Set(norm(s).split(" ").filter((t) => t && !STOP.has(t)));
const linked = new Set(links.map((l) => `${l.date}|${norm(l.name)}`));

for (const d of drives) {
  for (const en of d.entries || []) {
    if (en.spotId || linked.has(`${d.date}|${norm(en.name)}`)) continue;
    const nt = core(en.name);
    const area = norm(en.area || "");
    const cands = [];
    for (const e of eateries) {
      const et = core(e.name);
      const inter = [...nt].filter((t) => et.has(t)).length;
      if (!inter) continue;
      const score = inter / new Set([...nt, ...et]).size;
      const where = `${norm(e.address)} ${norm(e.discoveredIn)}`;
      const placeOk = !!area && area.split(" ").slice(0, 2).every((w) => where.includes(w));
      if (score >= 0.5 || (placeOk && score >= 0.34)) cands.push({ score: +score.toFixed(2), placeOk, id: e.id, name: e.name, address: (e.address || "").slice(0, 80), at: `${e.lat},${e.lng}` });
    }
    if (!cands.length) continue;
    cands.sort((a, b) => b.placeOk - a.placeOk || b.score - a.score);
    console.log(`\n${d.date} | ${en.name} | ${en.area || "?"} | ${en.action}`);
    for (const c of cands.slice(0, 4)) console.log(`  ${c.placeOk ? "PLACE OK " : "other branch?"} ${c.score} ${c.id} ${c.name} | ${c.address} | ${c.at}`);
  }
}
