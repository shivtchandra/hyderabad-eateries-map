/**
 * One-off: add Ishtaa (HITEC City) — pure-veg Andhra restaurant that the
 * grid seed missed. Data pulled from Google Places (Find Place + Details)
 * on 2026-09-02. Idempotent: re-running is a no-op if the id already exists.
 *
 * Run: node scripts/add-ishtaa.mjs   then   node scripts/build-static.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(__dirname, "..", "data", "eateries.json");

const now = new Date().toISOString();
const ISHTAA = {
  id: "ChIJIfN2naWRyzsRQ884HoebNm8",
  placeId: "ChIJIfN2naWRyzsRQ884HoebNm8",
  name: "Ishtaa",
  category: "local", // TODO: move to "restaurant" once that category lands
  lat: 17.4344891,
  lng: 78.3742785,
  address:
    "Hitech City Main Rd, NCC URBAN GARDENIA, Lumbini Ave, Diamond Hills, Lumbini Avenue, HITEC City, Hyderabad, Telangana 500032",
  rating: 4.3,
  ratingCount: 13232,
  priceLevel: 2,
  photoRef:
    "AVoNoXTVKsx0iHf621kMAGkK6b3m_gshyU2TVf3e4mgmed6MV0i6dPUOHUJLpSzb-lT8re-iraZGCqi0sNc_2tD0Op5BxEb0T1QWvBlJlAZxqfDt1bFUH9tiYx4Hb89XitOBzLECbNQ1nUHQjYC6cnoe-qN_PGTDZ07_EpG7KaCkHImvSJb1LaOf-sQyWh959-69lSv27EygZJpV4D1ifDEmx0WIhvzt7IMmxgUi-A0wpT7vdFqx6-RIztqt6TJDT4XOBhYqclGhc2bjDvMNfhnFTW27CD9gdRvgbwQWz8L3VjNKtkmM7d-f2IZ7TwqUg7Gom-0Pm2R8RkxGfiSPxy7nNdj2qhs4e_3mEDAwoLnnS4-czRtMgWiXpc9Go-ZeqtO52nOvcC7zy8s-cyDA2wjjZV0BEivO8qxPfL2cbeJksB9CV5AN",
  zomatoUrl: "https://www.zomato.com/hyderabad/search?q=Ishtaa",
  offers: [],
  offersUpdatedAt: now,
  status: "approved",
  discoveredIn: "HITEC City",
  createdAt: now,
  hours: [
    "Monday: 7:00 AM – 3:30 PM, 6:00 – 10:30 PM",
    "Tuesday: 7:00 AM – 3:30 PM, 6:00 – 10:30 PM",
    "Wednesday: 7:00 AM – 3:30 PM, 6:00 – 10:30 PM",
    "Thursday: 7:00 AM – 3:30 PM, 6:00 – 10:30 PM",
    "Friday: 7:00 AM – 3:30 PM, 6:00 – 10:30 PM",
    "Saturday: 7:00 AM – 3:30 PM, 6:00 – 10:30 PM",
    "Sunday: 7:00 AM – 3:30 PM, 6:00 – 10:30 PM",
  ],
  website: "https://ishtaa.in/",
  hasWebsite: true,
  phone: "095059 52345",
  blurb: null,
  tags: ["pure-veg", "veg-friendly"],
  tier: "landmark", // 13232 reviews
  detailsUpdatedAt: now,
  amenities: [],
  costForTwo: 800,
};

const all = JSON.parse(fs.readFileSync(DATA, "utf-8"));
if (all.some((e) => e.id === ISHTAA.id)) {
  console.log("Ishtaa already present — no change.");
  process.exit(0);
}
all.push(ISHTAA);
fs.writeFileSync(DATA, JSON.stringify(all, null, 2));
console.log(`Added Ishtaa. eateries.json now ${all.length} rows.`);
