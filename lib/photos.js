/**
 * Venue photos are not part of this deployment. They live in the public
 * shivtchandra/hyd-eats-photos repo and are served by GitHub Pages.
 *
 * Why: public/photos is ~151MB across 3.6k files. Shipping it as Vercel static
 * assets cost ~151MB of Deployment Storage on every deploy, which was over half
 * of the 19.77GB that blew the 10GB Hobby cap. Photo requests now never reach
 * Vercel, so they cost no bandwidth here either.
 *
 * Pages and not jsDelivr: jsDelivr refuses repos over 50MB with
 * "Package size exceeded the configured limit of 50 MB", and this one is 158MB,
 * so it served some files and 403'd others. Pages allows 1GB per site and
 * purges its CDN on every publish, so newly added photos go live immediately
 * instead of waiting out a 12h edge cache.
 *
 * These return absolute URLs and are safe in client components, since
 * NEXT_PUBLIC_PHOTO_CDN is inlined at build time.
 */

const DEFAULT_CDN = "https://shivtchandra.github.io/hyd-eats-photos";

export const PHOTO_CDN = (process.env.NEXT_PUBLIC_PHOTO_CDN || DEFAULT_CDN).replace(/\/+$/, "");

/** Origin only, for <link rel="preconnect"> so the first image skips a cold handshake. */
export const PHOTO_CDN_ORIGIN = (() => {
  try {
    return new URL(PHOTO_CDN).origin;
  } catch {
    return "";
  }
})();

/** Google Places thumbnail for a venue, keyed by place id. */
export function spotPhotoUrl(id) {
  return `${PHOTO_CDN}/${id}.jpg`;
}

/** Hand-shot gallery photo, e.g. "ChIJ...-1.jpg". */
export function galleryPhotoUrl(file) {
  return `${PHOTO_CDN}/gallery/${file}`;
}

/**
 * Map a legacy "/photos/..." path onto the CDN, so hardcoded paths in older
 * content and in generated JSON keep working without a Vercel round trip.
 */
export function photoPathToCdn(pathOrUrl) {
  const p = String(pathOrUrl || "");
  if (!p) return p;
  if (/^https?:\/\//.test(p)) return p;
  return `${PHOTO_CDN}/${p.replace(/^\/+/, "").replace(/^photos\//, "")}`;
}
