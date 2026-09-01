import { absoluteUrl } from "./site.js";

export function ogImageUrl(title, subtitle) {
  const q = new URLSearchParams({
    title: title || "Hyderabad Eats",
    subtitle: subtitle || "Vote for the best food in Hyderabad",
  });
  return absoluteUrl(`/api/og?${q.toString()}`);
}

export function ogImages(title, subtitle) {
  const url = ogImageUrl(title, subtitle);
  return [{ url, width: 1200, height: 630, alt: title }];
}
