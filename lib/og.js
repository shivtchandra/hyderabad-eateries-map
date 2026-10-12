import { absoluteUrl } from "./site.js";
import CARDS from "../public/og/manifest.json";

// The site is static (Cloudflare Pages): share cards are drawn at build time by
// scripts/build-og.mjs, one per page, listed in public/og/manifest.json by path.
export function ogImageUrl(path) {
  return absoluteUrl((path && CARDS[path]) || CARDS["/"] || "/og/home.png");
}

export function ogImages(title, subtitle, path) {
  return [{ url: ogImageUrl(path), width: 1200, height: 630, alt: title }];
}
