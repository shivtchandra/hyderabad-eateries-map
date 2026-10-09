export function getSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  if (process.env.VERCEL_ENV === "production") return "https://eats.mapmyhyd.com";
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "https://eats.mapmyhyd.com";
}

export function absoluteUrl(path) {
  const base = getSiteUrl();
  return path.startsWith("http") ? path : `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

// Search snippets cut off around 160 chars; clip at a word boundary so the sentence ends cleanly.
export function clipText(text, max = 160) {
  const s = String(text || "").replace(/\s+/g, " ").trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  return cut.slice(0, cut.lastIndexOf(" ") > 80 ? cut.lastIndexOf(" ") : cut.length).replace(/[,;:.\s]+$/, "") + "…";
}

export function pageMeta({ title: rawTitle, description: rawDescription, path, image }) {
  // House rule: no em-dashes in user-facing text (titles and snippets included).
  const title = String(rawTitle || "").replace(/\s*—\s*/g, ": ");
  const description = clipText(String(rawDescription || "").replace(/\s*—\s*/g, ", "));
  const url = absoluteUrl(path);
  const images = image
    ? [{ url: absoluteUrl(image), width: 1200, height: 630, alt: title, type: "image/png" }]
    : [{ url: absoluteUrl("/og/home.png"), width: 1200, height: 630, alt: title, type: "image/png" }];
  return {
    title,
    description,
    openGraph: { title, description, url, type: "website", images },
    twitter: { card: "summary_large_image", title, description, images: [images[0].url] },
    alternates: { canonical: url },
  };
}
