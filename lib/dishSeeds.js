import fs from "fs";
import path from "path";

// Must order seeds for a spot: its own (data/dish-seeds.json), then brand
// picks that apply to every branch (data/brand-picks.json, e.g. Cream Stone).
// Read once per process.
let _seeds = null;
let _brands = null;
function load() {
  if (_seeds) return;
  try { _seeds = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "dish-seeds.json"), "utf-8")); } catch { _seeds = {}; }
  try {
    _brands = (JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "brand-picks.json"), "utf-8")).brands || [])
      .map((b) => ({ ...b, re: new RegExp(b.match, "i") }));
  } catch { _brands = []; }
}

export function dishSeedsFor(spot) {
  load();
  const own = _seeds[spot.id] || [];
  const seen = new Set(own.map((d) => d.name.toLowerCase()));
  const brand = _brands
    .filter((b) => b.re.test(spot.name || ""))
    .flatMap((b) => b.dishes.map((name) => ({ name, source: "editor" })))
    .filter((d) => !seen.has(d.name.toLowerCase()));
  return [...own, ...brand].map((d) => ({ ...d, up: 0, down: 0 }));
}
