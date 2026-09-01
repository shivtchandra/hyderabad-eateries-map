import Link from "next/link";
import { notFound } from "next/navigation";
import SiteChrome from "../../components/SiteChrome.jsx";
import { getEateryById, getEateries, areaSlug } from "../../../lib/siteData.js";
import { absoluteUrl, pageMeta } from "../../../lib/site.js";
import { ogImages } from "../../../lib/og.js";

const CAT_LABEL = {
  cafe: "Cafe", local: "Local Eats", "restro-bar": "Restro Bar", bakery: "Bakery", "ice-cream": "Ice Cream",
};

export function generateStaticParams() {
  return getEateries()
    .filter((e) => (e.ratingCount || 0) >= 200)
    .map((e) => ({ id: e.id }));
}

export function generateMetadata({ params }) {
  const spot = getEateryById(params.id);
  if (!spot) return { title: "Spot not found — Hyderabad Eats" };
  const title = `${spot.name} — ${spot.discoveredIn || "Hyderabad"}`;
  const description = `${spot.name} in ${spot.discoveredIn || "Hyderabad"}. ${spot.rating ? `Rated ${spot.rating}★` : ""} ${spot.ratingCount ? `(${spot.ratingCount.toLocaleString("en-IN")} reviews)` : ""}. Find on Hyderabad Eats map.`;
  const photo = `/photos/${spot.id}.jpg`;
  return {
    ...pageMeta({ title, description, path: `/spot/${spot.id}`, image: photo }),
    openGraph: {
      ...pageMeta({ title, description, path: `/spot/${spot.id}`, image: photo }).openGraph,
      images: [{ url: absoluteUrl(photo), width: 800, height: 600, alt: spot.name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteUrl(photo)],
    },
  };
}

export default function SpotPage({ params }) {
  const spot = getEateryById(params.id);
  if (!spot) notFound();

  const areaLink = spot.discoveredIn && !spot.discoveredIn.startsWith("text:")
    ? `/areas/${areaSlug(spot.discoveredIn)}`
    : null;

  return (
    <SiteChrome
      breadcrumb={[
        { href: "/", label: "Home" },
        ...(areaLink ? [{ href: areaLink, label: spot.discoveredIn }] : []),
        { href: `/spot/${spot.id}`, label: spot.name },
      ]}
      title={spot.name}
      description={`${CAT_LABEL[spot.category] || spot.category}${spot.discoveredIn ? ` · ${spot.discoveredIn}` : ""}${spot.rating ? ` · ${spot.rating}★` : ""}`}
      related={[
        { href: "/", label: "Open on map" },
        { href: "/rankings", label: "Weekly rankings" },
        ...(areaLink ? [{ href: areaLink, label: `More in ${spot.discoveredIn}` }] : []),
        { href: `/explore/${spot.category === "local" ? "biryani-and-local" : spot.category === "restro-bar" ? "bars" : spot.category === "ice-cream" ? "ice-cream" : spot.category === "bakery" ? "bakeries" : "cafes"}`, label: `More ${CAT_LABEL[spot.category] || "spots"}` },
      ]}
    >
      <div className="site-spot-hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/photos/${spot.id}.jpg`} alt={spot.name} className="site-spot-photo" />
        <div>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--ink-soft)", margin: "0 0 12px" }}>
            {spot.address || spot.discoveredIn || "Hyderabad"}
          </p>
          {spot.rating && (
            <p style={{ fontWeight: 700, margin: "0 0 8px" }}>{spot.rating}★ · {spot.ratingCount?.toLocaleString("en-IN")} reviews</p>
          )}
          {spot.tags?.length > 0 && (
            <p style={{ fontSize: 13, color: "var(--muted)" }}>{spot.tags.join(" · ")}</p>
          )}
          <Link href={`/?spot=${encodeURIComponent(spot.id)}`} className="site-cta">Open on map &amp; stamp</Link>
        </div>
      </div>
    </SiteChrome>
  );
}
