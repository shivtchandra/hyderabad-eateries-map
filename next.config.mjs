import fs from "fs";
import path from "path";

// data/photo-ids.json is a committed manifest of which venues have a photo on
// the CDN, so serverless traces this tiny JSON instead of public/photos.
// It is only regenerated when the photos dir exists locally. It does not on
// Vercel, and rewriting it there would produce an empty list, which silently
// drops every thumbnail and OG image. scripts/sync-photos.mjs owns updates.
const photosDir = path.join(process.cwd(), "public", "photos");
const manifestPath = path.join(process.cwd(), "data", "photo-ids.json");
if (fs.existsSync(photosDir)) {
  const photoIds = fs
    .readdirSync(photosDir)
    .filter((f) => f.endsWith(".jpg"))
    .map((f) => f.replace(/\.jpg$/, ""));
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  fs.writeFileSync(manifestPath, JSON.stringify(photoIds));
} else if (!fs.existsSync(manifestPath)) {
  throw new Error(
    "data/photo-ids.json is missing and public/photos is not present. " +
      "Run scripts/sync-photos.mjs locally and commit the manifest."
  );
}

const PHOTO_CDN =
  process.env.NEXT_PUBLIC_PHOTO_CDN || "https://shivtchandra.github.io/hyd-eats-photos";

/** @type {import('next').NextConfig} */
// Data files the curated layer reads at runtime (api, spot pages, sitemap, picks, ask).
const CURATED_DATA = [
  "./data/reddit-picks.json",
  "./data/reddit-questions.json",
  "./data/recommendation-reviews.json",
  "./data/recommendation-shortlist.json",
  "./data/recommendation-extra-places.json",
  "./data/dish-seeds.json",
];

// HYD_STATIC_EXPORT=1 (CI only, scripts/build-static.sh) builds the whole site
// as static files for Cloudflare Pages.
const staticExport = process.env.HYD_STATIC_EXPORT === "1";

const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  ...(staticExport ? { output: "export", images: { unoptimized: true } } : {}),
  // Keep venue JSON in every serverless/page bundle that reads it at runtime
  // (rankings are force-dynamic; without this the Google baseline list is empty).
  // Next 14.2: file tracing options must live under `experimental` (top level is ignored).
  experimental: {
    // Curated recommendations + question pages read these with fs at runtime.
    outputFileTracingIncludes: {
      "/rankings/**/*": ["./data/eateries.json", "./data/recommendation-extra-places.json", "./data/venue-content.json", "./data/photo-ids.json"],
      "/areas/**/*": ["./data/eateries.json", "./data/recommendation-extra-places.json", "./data/venue-content.json", "./data/photo-ids.json"],
      "/explore/**/*": ["./data/eateries.json", "./data/recommendation-extra-places.json", "./data/venue-content.json", "./data/photo-ids.json"],
      "/spot/**/*": ["./data/eateries.json", "./data/recommendation-extra-places.json", "./data/venue-content.json", "./data/photo-ids.json", ...CURATED_DATA],
      "/stories/**/*": ["./data/eateries.json", "./data/recommendation-extra-places.json", "./data/venue-content.json", "./data/photo-ids.json"],
      "/api/**/*": ["./data/eateries.json", "./data/recommendation-extra-places.json", "./data/venue-content.json", "./data/photo-ids.json", ...CURATED_DATA],
      "/sitemap.xml": ["./data/eateries.json", "./data/recommendation-extra-places.json", "./data/venue-content.json", "./data/photo-ids.json", ...CURATED_DATA],
      "/food-safety": ["./data/eateries.json", "./data/recommendation-extra-places.json", "./data/venue-content.json", "./data/photo-ids.json"],
      "/picks/**/*": ["./data/eateries.json", "./data/recommendation-extra-places.json", "./data/venue-content.json", "./data/photo-ids.json", ...CURATED_DATA],
      "/ask/**/*": ["./data/eateries.json", "./data/recommendation-extra-places.json", "./data/venue-content.json", "./data/photo-ids.json", ...CURATED_DATA],
    },
    outputFileTracingExcludes: {
      "*": [
        "./public/photos/**/*",
        "./scripts/**/*",
        "./node_modules/@imgly/**/*",
      ],
    },
  },
  async redirects() {
    return [
      // Photos live in the public shivtchandra/hyd-eats-photos repo, served by
      // GitHub Pages. The app emits absolute CDN URLs (lib/photos.js), so this
      // only catches already-indexed /photos/* URLs and old OG image links.
      // A redirect, not a rewrite: a rewrite would proxy every image through
      // Vercel and bill the bandwidth back to us.
      { source: "/photos/:path*", destination: `${PHOTO_CDN}/:path*`, permanent: true },
      // Common search URL patterns → ranking pages
      { source: "/best-biryani-in-hyderabad", destination: "/picks/biryani", permanent: true },
      { source: "/best-biryani-hyderabad", destination: "/picks/biryani", permanent: true },
      { source: "/best-chicken-biryani-in-hyderabad", destination: "/rankings/best-chicken-biryani-in-hyderabad", permanent: true },
      { source: "/best-restaurants-in-hyderabad", destination: "/rankings/best-restaurants-in-hyderabad", permanent: true },
      { source: "/best-restaurants-hyderabad", destination: "/rankings/best-restaurants-in-hyderabad", permanent: true },
      { source: "/best-cafes-in-hyderabad", destination: "/rankings/best-cafe-in-hyderabad", permanent: true },
      { source: "/best-cafe-in-hyderabad", destination: "/rankings/best-cafe-in-hyderabad", permanent: true },
      { source: "/best-cafes-hyderabad", destination: "/rankings/best-cafe-in-hyderabad", permanent: true },
      { source: "/new-cafes-in-hyderabad", destination: "/rankings/best-new-cafe-in-hyderabad", permanent: true },
      { source: "/best-haleem-in-hyderabad", destination: "/rankings/best-haleem-in-hyderabad", permanent: true },
      { source: "/best-bakery-hyderabad", destination: "/rankings/best-bakery-in-hyderabad", permanent: true },
      { source: "/rankings/best-breweries-in-hyderabad", destination: "/rankings/best-brewery-in-hyderabad", permanent: true },
      { source: "/best-ice-cream-hyderabad", destination: "/rankings/best-ice-cream-in-hyderabad", permanent: true },
      { source: "/late-night-cafes-hyderabad", destination: "/rankings/best-late-night-cafe-in-hyderabad", permanent: true },
      // Category shortcuts
      { source: "/cafes-in-hyderabad", destination: "/explore/cafes", permanent: true },
      { source: "/cafes-hyderabad", destination: "/explore/cafes", permanent: true },
      { source: "/biryani-in-hyderabad", destination: "/picks/biryani", permanent: true },
      { source: "/restaurants-in-hyderabad", destination: "/rankings/best-restaurants-in-hyderabad", permanent: true },
      // Area shortcuts
      { source: "/cafes-in-jubilee-hills", destination: "/areas/jubilee-hills", permanent: true },
      { source: "/cafes-in-gachibowli", destination: "/areas/gachibowli", permanent: true },
      // Alias / typo area & explore slugs (Ahrefs 4XX)
      { source: "/areas/madhapur", destination: "/areas/madhapur-hitec", permanent: true },
      { source: "/areas/hitec-city", destination: "/areas/madhapur-hitec", permanent: true },
      { source: "/areas/hitech-city", destination: "/areas/madhapur-hitec", permanent: true },
      { source: "/areas/dilshuknagar", destination: "/areas/dilsukhnagar", permanent: true },
      { source: "/areas/road-no-36-jh", destination: "/areas/jubilee-hills", permanent: true },
      { source: "/explore/restro-bars", destination: "/explore/bars", permanent: true },
      { source: "/explore/street-food", destination: "/rankings/best-street-food-in-hyderabad", permanent: true },
      { source: "/explore/fine-dining", destination: "/rankings/best-fine-dining-in-hyderabad", permanent: true },
      { source: "/food-in-hyderabad", destination: "/explore", permanent: false },
      { source: "/ranking", destination: "/rankings", permanent: true },
      { source: "/ranking/:slug", destination: "/rankings/:slug", permanent: true },
    ];
  },
};

export default nextConfig;
