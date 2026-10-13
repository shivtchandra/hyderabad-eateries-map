import fs from "fs";
import path from "path";

// Must order seeds for a spot, in this order:
//   1. its own picks (data/dish-seeds.json, editorial / guides)
//   2. brand picks that apply to every branch (data/brand-picks.json, e.g. Cream Stone)
//   3. dishes 2+ r/hyderabad locals name next to it (data/locals-dishes.json)
// Used by the spot page (first paint) and /api/dishes (after locals' votes),
// so both show the same list. Read once per process.
let _seeds = null;
let _brands = null;
let _locals = null;
const read = (f, fallback) => { try { return JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", f), "utf-8")); } catch { return fallback; } };
function load() {
  if (_seeds) return;
  _seeds = read("dish-seeds.json", {});
  _brands = (read("brand-picks.json", { brands: [] }).brands || []).map((b) => ({ ...b, re: new RegExp(b.match, "i") }));
  _locals = read("locals-dishes.json", { spots: {} }).spots || {};
}

export function localsDishesFor(id) {
  load();
  return _locals[id] || [];
}

export function dishSeedsFor(spot) {
  load();
  const out = [];
  const seen = new Set();
  const add = (d) => { const k = d.name.toLowerCase(); if (!seen.has(k)) { seen.add(k); out.push({ up: 0, down: 0, ...d }); } };
  (_seeds[spot.id] || []).forEach(add);
  _brands.filter((b) => b.re.test(spot.name || "")).forEach((b) => b.dishes.forEach((name) => add({ name, source: "editor" })));
  // A locals' dish already covered by a named pick ("Biryani" vs "Mutton Dum Biryani") adds nothing.
  (_locals[spot.id] || [])
    .filter((d) => { const w = d.dish.toLowerCase().split(" / ")[0]; return !out.some((x) => x.name.toLowerCase().includes(w)); })
    .forEach((d) => add({ name: d.dish, source: "reddit", people: d.people }));
  return out;
}
