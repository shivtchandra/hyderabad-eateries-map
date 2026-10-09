import { absoluteUrl } from "./site.js";

// The site is static (Cloudflare Pages): no per-page /api/og renderer, one
// shared share card instead.
export function ogImageUrl() {
  return absoluteUrl("/og/home.png");
}

export function ogImages(title, subtitle) {
  const url = ogImageUrl(title, subtitle);
  return [{ url, width: 1200, height: 630, alt: title }];
}
