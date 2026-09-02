/**
 * Curated re-bucket into the "restaurant" category.
 *
 * The seed data has no cuisine field, so sit-down Indian-cuisine restaurants
 * ended up scattered across local / cafe / restro-bar. This is a hand-verified
 * allowlist — sit-down restaurants (regional Telugu/Andhra meals, North Indian,
 * Hyderabadi, multicuisine, barbecue-buffet, pure-veg dining). Tiffin centres,
 * biryani stalls, pure cafes, bakeries, ice-cream and bars stay where they are.
 *
 * `veg: true`  -> also gets the pure-veg + veg-friendly tags.
 * Match is a case-insensitive substring on the name. Every match is printed;
 * every entry that matched nothing is printed too, so the list stays auditable.
 *
 * Idempotent. Run: node scripts/reclassify-restaurants.mjs
 *                  then node scripts/build-static.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(__dirname, "..", "data", "eateries.json");

// { q: unique lowercased name fragment, veg: pure-veg? }
const RESTAURANTS = [
  // ---- pure veg ----
  { q: "ishtaa", veg: true },
  { q: "chutneys", veg: true },
  { q: "gaurang's kitchen", veg: true },
  { q: "shanbhag's veg-park", veg: true },
  { q: "makobrew", veg: true },
  { q: "street darbar veg restaurant", veg: true },
  { q: "minerva coffee shop", veg: true },
  { q: "taj mahal hotel", veg: true },

  // ---- veg + non-veg ----
  { q: "rayalaseema ruchulu", veg: false },
  { q: "kritunga restaurant", veg: false },
  { q: "antera courtyard", veg: false },
  { q: "antera kitchen and bar", veg: false },
  { q: "amaravathi family restaurant", veg: false },
  { q: "inka ( the stories of telugu kitchen", veg: false },
  { q: "iguru banquets", veg: false },
  { q: "kadali kitchen", veg: false },
  { q: "the spicy venue", veg: false },
  { q: "meridian restaurant", veg: false },
  { q: "fusion 9", veg: false },
  { q: "ohri's jiva imperia", veg: false },
  { q: "telugu medium kitchen", veg: false },
  { q: "dakshin, itc", veg: false },
  { q: "dum pukht", veg: false },
  { q: "kebabs & kurries", veg: false },
  { q: "firdaus", veg: false },
  { q: "celeste", veg: false },
  { q: "jewel of nizam", veg: false },
  { q: "tansen", veg: false },
  { q: "ab's - absolute barbecues", veg: false },
  { q: "barbeque nation", veg: false },
  { q: "barbeque spice", veg: false },
  { q: "sahib's barbeque by ohris", veg: false },
  { q: "exotica hitech city", veg: false },
  { q: "hotel shadab", veg: false },
  { q: "grand hotel", veg: false },
  { q: "alpha hotel & restaurant", veg: false },
  { q: "cafe bahar", veg: false },
  { q: "sitara grand multicuisine", veg: false },
  { q: "hotel rumaan", veg: false },

  // ---- cover-search pass 2: sit-down multicuisine / regional / North-Indian /
  // Chinese / Afghani restaurants that were in local / cafe / restro-bar.
  // Biryani- and mandi-primary "hotels" deliberately stay in Biryani & Local Eats.
  { q: "lucky restaurant", veg: false },
  { q: "blue sea restaurant", veg: false },
  { q: "mehfil restaurant", veg: false },
  { q: "cafe 555 - aqeeq", veg: false },
  { q: "spice 9 restaurant", veg: false },
  { q: "theth masala restaurant", veg: false },
  { q: "tannur house restaurant", veg: false },
  { q: "nanking chinese restaurant", veg: false },
  { q: "4 seasons multi cuisine restaurant", veg: false },
  { q: "mandar restaurant", veg: false },
  { q: "itlu - veg diner", veg: true },
  { q: "barkaas indo arabic", veg: false },
  { q: "captain cook restaurant", veg: false },
  { q: "hotel nandini veg", veg: true },
  { q: "golden pavilion fine dine", veg: false },
  { q: "the spice kitchen by tsk", veg: false },
  { q: "sri lakshmi restaurant", veg: false },
  { q: "bengaluru bhavan", veg: true },
  { q: "flavours of andhra", veg: false },
  { q: "all seasons restaurant", veg: false },
  { q: "shahi dastarkhwan", veg: false },
  { q: "grill-9 restaurant", veg: false },
  { q: "7 oceans restaurant", veg: false },
  { q: "kabul darbar restaurant", veg: false },
  { q: "terrace grill", veg: false },
  { q: "telangana spice kitchen", veg: false },
  { q: "shade restaurant", veg: false },
  { q: "haveli restaurant", veg: false },
  { q: "mubarak restaurant", veg: false },
  { q: "touch restaurant", veg: false },
  { q: "viyyalavari kitchen & banquets", veg: false },
  { q: "once upon a time - hotel greenpark", veg: false },
  { q: "broadway cafe & garden restaurant", veg: false },
  { q: "galaxy cafe and restaurant", veg: false },
  { q: "new nisar cafe & restaurant", veg: false },
  { q: "midori - vegetarian cafe", veg: true },
  { q: "zyqa restaurant", veg: false },
  { q: "flavours of andhra", veg: false },
];

const all = JSON.parse(fs.readFileSync(DATA, "utf-8"));
let moved = 0;
let tagged = 0;
const misses = [];

for (const { q, veg } of RESTAURANTS) {
  const rows = all.filter((e) => e.name.toLowerCase().includes(q));
  if (!rows.length) {
    misses.push(q);
    continue;
  }
  for (const e of rows) {
    if (e.category !== "restaurant") {
      console.log(`  ${e.category.padEnd(11)} -> restaurant   ${e.name}`);
      e.category = "restaurant";
      moved++;
    }
    if (veg) {
      e.tags = Array.isArray(e.tags) ? e.tags : [];
      for (const t of ["pure-veg", "veg-friendly"]) {
        if (!e.tags.includes(t)) {
          e.tags.push(t);
          tagged++;
        }
      }
    }
  }
}

fs.writeFileSync(DATA, JSON.stringify(all, null, 2));
console.log(`\n${moved} spot(s) moved to "restaurant", ${tagged} veg tag(s) added.`);
if (misses.length) console.log(`No match for: ${misses.join(", ")}`);
