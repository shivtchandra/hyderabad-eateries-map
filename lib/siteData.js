import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { slugFromTitle } from "./rankings.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(__dirname, "..", "data", "eateries.json");
const CONTENT = path.join(__dirname, "..", "data", "venue-content.json");

let _cache = null;
let _content = null;

function venueContent() {
  if (!_content) {
    try {
      _content = JSON.parse(fs.readFileSync(CONTENT, "utf-8"));
    } catch {
      _content = {};
    }
  }
  return _content;
}

export function getEateries() {
  if (!_cache) _cache = JSON.parse(fs.readFileSync(DATA, "utf-8"));
  const content = venueContent();
  return _cache
    .filter((e) => e.status === "approved" && e.lat && e.lng)
    .map((e) => (content[e.id] ? { ...e, ...content[e.id] } : e));
}

export function getEateryById(id) {
  return getEateries().find((e) => e.id === id) ?? null;
}

export const CATEGORIES = [
  { key: "cafe", slug: "cafes", label: "Cafes", seoTitle: "Best Cafes in Hyderabad", description: "Best cafes in Hyderabad for work, dates, Irani chai, breakfast and new openings." },
  { key: "restaurant", slug: "restaurants", label: "Restaurants", seoTitle: "Best Restaurants in Hyderabad", description: "Restaurants in Hyderabad for dinner, family meals, Telugu and Andhra food, and weeknight sit-downs." },
  { key: "local", slug: "biryani-and-local", label: "Biryani & Local Eats", seoTitle: "Best Biryani in Hyderabad", description: "Best biryani in Hyderabad, dum and chicken, plus mandi, Irani chai and local eats on the map." },
  { key: "restro-bar", slug: "bars", label: "Restro Bars", seoTitle: "Best Bars & Restro Bars in Hyderabad", description: "Breweries, pubs and restro-bars worth a night out in Hyderabad." },
  { key: "bakery", slug: "bakeries", label: "Bakeries", seoTitle: "Best Bakeries in Hyderabad", description: "Patisseries, bakeries and dessert spots across Hyderabad." },
  { key: "ice-cream", slug: "ice-cream", label: "Ice Cream", seoTitle: "Best Ice Cream in Hyderabad", description: "Ice cream parlours, gelato and falooda spots in Hyderabad." },
  { key: "veg", slug: "veg-friendly", label: "Veg-Friendly", seoTitle: "Best Veg Restaurants in Hyderabad", description: "Vegetarian-friendly restaurants and cafes in Hyderabad.", filterFn: (e) => e.tags?.includes("veg-friendly") },
];

export const TOP_AREAS = [
  "Jubilee Hills", "Banjara Hills", "Kukatpally", "Gachibowli", "Begumpet",
  "Kompally", "Himayatnagar", "Madhapur/HITEC", "Secunderabad", "ECIL",
  "Film Nagar", "Nallagandla", "Financial District", "Dilsukhnagar", "Tarnaka",
];

export function areaSlug(area) {
  return slugFromTitle(area);
}

export function getAreaBySlug(slug) {
  const area = TOP_AREAS.find((a) => areaSlug(a) === slug);
  if (!area) return null;
  const spots = getEateries().filter((e) => e.discoveredIn === area);
  return { area, slug, spots };
}

export function getCategoryBySlug(slug) {
  const cat = CATEGORIES.find((c) => c.slug === slug);
  if (!cat) return null;
  const spots = getEateries()
    .filter((e) => (cat.filterFn ? cat.filterFn(e) : e.category === cat.key))
    .sort((a, b) => (b.ratingCount || 0) - (a.ratingCount || 0));
  return { ...cat, spots };
}

export function topSpots(limit = 20, filter = () => true) {
  return getEateries()
    .filter(filter)
    .sort((a, b) => (b.ratingCount || 0) - (a.ratingCount || 0))
    .slice(0, limit);
}

export function allAreaPages() {
  return TOP_AREAS.map((area) => ({ area, slug: areaSlug(area) }));
}

export function allCategoryPages() {
  return CATEGORIES.map((c) => ({ slug: c.slug, label: c.label }));
}
