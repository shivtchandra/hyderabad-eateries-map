import Link from "next/link";
import SiteChrome from "../components/SiteChrome.jsx";
import { getEateries } from "../../lib/siteData.js";
import { pageMeta } from "../../lib/site.js";
import { ogImages } from "../../lib/og.js";

const title = "Hyderabad Food Stories";
const description = "The stories behind Hyderabad's most-loved cafes and eateries: how they started, and exactly what to order.";

export const metadata = {
  ...pageMeta({ title, description, path: "/stories" }),
  openGraph: { ...pageMeta({ title, description, path: "/stories" }).openGraph, images: ogImages(title, description) },
};

const CAT = {
  cafe: { emoji: "☕", label: "Cafe" },
  local: { emoji: "🍛", label: "Local Eats" },
  "restro-bar": { emoji: "🍸", label: "Restro Bar" },
  bakery: { emoji: "🥐", label: "Bakery" },
  "ice-cream": { emoji: "🍦", label: "Ice Cream" },
};

// Venues with a hand-written origin story. This is the dedicated home for the
// editorial spot pages, replacing the home-map rail so the set can grow without
// crowding the map. New venues appear here automatically once they get content.
function storySpots() {
  return getEateries()
    .filter((e) => e.originStory?.length)
    .sort((a, b) => (b.ratingCount || 0) - (a.ratingCount || 0));
}

function StoryCard({ s, i, feat }) {
  const img = s.gallery?.length ? `/photos/gallery/${s.gallery[0]}` : `/photos/${s.id}.jpg`;
  const cat = CAT[s.category] || { emoji: "🍽️", label: "Spot" };
  return (
    <Link href={`/spot/${s.id}`} className={`zine-card${feat ? " zine-card--feat" : ""}`} data-cat={s.category}>
      <div className="zine-img">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img} alt={s.name} loading="lazy" />
        <span className="zine-stamp">★ Story</span>
        <span className="zine-num">{String(i + 1).padStart(2, "0")}</span>
      </div>
      <div className="zine-body">
        <span className="zine-cat">{cat.emoji} {cat.label}</span>
        <h2>{s.name}</h2>
        {s.discoveredIn && <p className="zine-area">📍 {s.discoveredIn}</p>}
        {feat && s.originStory?.[0] && <p className="zine-blurb">{s.originStory[0]}</p>}
        {s.signatureDish?.name && <span className="zine-dish">Order the {s.signatureDish.name}</span>}
      </div>
    </Link>
  );
}

export default function StoriesPage() {
  const spots = storySpots();
  const [lead, ...rest] = spots;
  return (
    <SiteChrome
      active="/stories"
      breadcrumb={[{ href: "/", label: "Home" }, { href: "/stories", label: "Stories" }]}
      title={title}
      description={description}
      related={[
        { href: "/explore", label: "Explore by category" },
        { href: "/areas", label: "Food by area" },
        { href: "/rankings", label: "Weekly rankings" },
      ]}
    >
      <p className="zine-kicker groovy">Read before you eat</p>
      <div className="stories-zine">
        {lead && <StoryCard s={lead} i={0} feat />}
        {rest.map((s, i) => (
          <StoryCard key={s.id} s={s} i={i + 1} />
        ))}
      </div>
      <Link href="/" className="site-cta">Open the map</Link>
    </SiteChrome>
  );
}
