export function getSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  if (process.env.VERCEL_ENV === "production") return "https://eats.mapmyhyd.com";
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export function absoluteUrl(path) {
  const base = getSiteUrl();
  return path.startsWith("http") ? path : `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function pageMeta({ title, description, path, image }) {
  const url = absoluteUrl(path);
  const images = image
    ? [{ url: absoluteUrl(image), width: 1200, height: 630, alt: title }]
    : [{ url: absoluteUrl("/og/home.png"), width: 1200, height: 630, alt: title }];
  return {
    title,
    description,
    openGraph: { title, description, url, type: "website", images },
    twitter: { card: "summary_large_image", title, description, images: images.map((i) => i.url) },
    alternates: { canonical: url },
  };
}
