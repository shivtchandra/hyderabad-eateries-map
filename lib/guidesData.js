import fs from "fs";
import path from "path";
import { recommendationsEnabled } from "./recommendationShared.js";
import { SEO_THEME_PICKS, slugFromTitle } from "./rankings.js";
import { GEO_GUIDES } from "./geoGuides.js";

// Shared by the Guides hub (app/guides/page.jsx) and the Dish guides page
// (app/guides/dishes/page.jsx). Server only (reads the sticker folder).
const short = (t = "") => {
  const s = t.replace(/\s+in\s+hyderabad$/i, "");
  return s.charAt(0) + s.slice(1).toLowerCase();
};

// Stickers (isometric die-cut art) live in public/stickers/<key>.webp (or .png). A card
// shows its sticker when the file exists, else a bold typographic card, so
// art can be dropped in later without touching code. See DESIGN.md.
const STICKER_DIR = path.join(process.cwd(), "public", "stickers");
export function sticker(key) {
  if (!key) return null;
  try {
    for (const ext of ["webp", "png"]) {
      if (fs.existsSync(path.join(STICKER_DIR, `${key}.${ext}`))) return `/stickers/${key}.${ext}`;
    }
  } catch {}
  return null;
}

// The headline rankings for the row (the rest are one tap away in /rankings).
export const HEADLINE = [
  { slug: "best-biryani-in-hyderabad", word: "Biryani", key: "biryani" },
  { slug: "best-haleem-in-hyderabad", word: "Haleem", key: "haleem" },
  { slug: "best-irani-cafe-in-hyderabad", word: "Irani chai", key: "irani-chai" },
  { slug: "best-dosa-in-hyderabad", word: "Dosa", key: "dosa" },
  { slug: "best-mandi-in-hyderabad", word: "Mandi", key: "mandi" },
  { slug: "best-shawarma-in-hyderabad", word: "Shawarma", key: "shawarma" },
  { slug: "best-cafe-in-hyderabad", word: "Cafes", key: "coffee" },
  { slug: "best-bakery-in-hyderabad", word: "Bakery", key: "bakery" },
  { slug: "best-ice-cream-in-hyderabad", word: "Ice cream", key: "ice-cream" },
  { slug: "best-brewery-in-hyderabad", word: "Breweries", key: "beer" },
  { slug: "best-street-food-in-hyderabad", word: "Street food", key: "street-food" },
  { slug: "best-fine-dining-in-hyderabad", word: "Fine dining", key: "fine-dining" },
];
const TONES = ["violet", "yellow", "ink"];

export function rankingCards() {
  const known = new Set(SEO_THEME_PICKS.map((p) => slugFromTitle(p.title)));
  return HEADLINE.filter((h) => known.has(h.slug)).map((h, i) => ({
    ...h,
    label: short(SEO_THEME_PICKS.find((p) => slugFromTitle(p.title) === h.slug).title),
    art: sticker(h.key),
    tone: TONES[i % TONES.length],
  }));
}

export const GUIDES = [
  ...(recommendationsEnabled() ? [{ href: "/picks", label: "Best food, dish by dish", note: "What r/hyderabad actually recommends", key: "thali" }] : []),
  { href: "/guides/best-tiffins-hyderabad-reddit", label: "Tiffins and ghee dosas", note: "Breakfast spots locals swear by", key: "breakfast" },
  { href: "/guides/late-night-food-hyderabad-reddit", label: "Late night food", note: "Open after midnight", key: "late-night" },
  { href: "/guides/best-ice-cream-desserts-hyderabad", label: "Ice cream and desserts", note: "Scoops, kulfi, falooda", key: "ice-cream" },
  { href: "/guides/best-breweries-in-hyderabad", label: "Breweries", note: "Craft beer, ranked", key: "beer" },
  { href: "/guides/best-biryani-hyderabad-reddit", label: "Biryani, as Reddit picks it", note: "The threads, counted", key: "biryani" },
  { href: "/guides/best-cafes-hyderabad-reddit", label: "Cafes, as Reddit picks it", note: "Work, coffee, dates", key: "coffee" },
  { href: "/guides/restaurants-in-sattva-knowledge-city-hyderabad", label: "Around Sattva Knowledge City", note: "Office lunch, sorted", key: "lunchbox" },
  ...GEO_GUIDES.map((guide) => ({
    href: `/guides/${guide.slug}`,
    label: guide.title.replace(/^(Best |Vegetarian )/i, "").replace(/ in Hyderabad.*$/i, ""),
    note: guide.answer,
    key: guide.slug.includes("sushi") ? "sushi"
      : guide.slug.includes("ramen") ? "ramen"
        : guide.slug.includes("hot-chocolate") ? "hot-chocolate"
          : guide.slug.includes("dessert") || guide.slug.includes("cake") || guide.slug.includes("brownie") ? "dessert"
            : guide.slug.includes("french-toast") ? "breakfast"
              : guide.slug.includes("biryani") ? "biryani"
                : "thali",
  })),
];

