import Link from "next/link";
import SiteChrome from "../components/SiteChrome.jsx";
import BottomNav from "../components/BottomNav.jsx";
import { getEateries, getEateryById, getChainSiblings } from "../../lib/siteData.js";
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

// Editorial spots: full origin stories, or branch write-ups with a regular note /
// highlight (e.g. Niloufer Hitec). New venues appear here once they get content.
function hasEditorial(e) {
  return Boolean(e.originStory?.length || e.regularNote || e.highlight?.text);
}

function storySpots() {
  return getEateries()
    .filter(hasEditorial)
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
        {feat && (s.originStory?.[0] || s.highlight?.text || s.regularNote) && (
          <p className="zine-blurb">{s.originStory?.[0] || s.highlight?.text || s.regularNote}</p>
        )}
        {s.signatureDish?.name && <span className="zine-dish">Order the {s.signatureDish.name}</span>}
      </div>
    </Link>
  );
}

export default function StoriesPage() {
  const spots = storySpots();
  const [lead, ...rest] = spots;
  const nilouferMain = getEateryById("ChIJVy0-aGiXyzsRWMiIWZ1fC30");
  const nilouferLocations = nilouferMain
    ? [nilouferMain, ...getChainSiblings(nilouferMain)]
    : [];
  return (
    <div style={{ paddingBottom: 84 }}>
    <SiteChrome
      active="/stories"
      breadcrumb={[{ href: "/", label: "Home" }, { href: "/stories", label: "Stories" }]}
      title={title}
      description={description}
      heroClass="site-hero--app"
      navLinksHidden
      heroDecor
      related={[
        { href: "/explore", label: "Explore by category" },
        { href: "/areas", label: "Food by area" },
        { href: "/rankings", label: "Weekly rankings" },
      ]}
    >
      <p className="zine-kicker groovy">Read before you eat</p>
      <section className="spot-section" style={{ marginTop: 0, marginBottom: 22 }}>
        <h2 className="site-section-title" style={{ marginTop: 0 }}>Irani chai trail</h2>
        <p className="spot-prose">
          For Irani chai and Osmania biscuit, start with Cafe Niloufer and Nimrah near Charminar.
          Branch notes live on each spot page. Same small flex at Niloufer and Rameshwaram: free water on the table.
        </p>
        <h3 className="site-section-title" style={{ fontSize: 16 }}>Cafe Niloufer locations</h3>
        <ul className="site-spot-list">
          {nilouferLocations.map((s) => (
            <li key={s.id}>
              <Link href={`/spot/${s.id}`}>
                <span>
                  <div className="site-spot-name">{s.name}</div>
                  <div className="site-spot-meta">{s.discoveredIn || "Hyderabad"}{s.rating ? ` · ${s.rating}★` : ""}{s.originStory?.length || s.regularNote ? " · Story" : ""}</div>
                </span>
                <span className="site-spot-meta">View →</span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="site-related-links" style={{ marginTop: 12 }}>
          <Link href="/spot/ChIJ1Z7b5_mXyzsR_6g6Az9fWjk">Nimrah Cafe & Bakery</Link>
          <Link href="/explore/cafes">Best cafes hub</Link>
        </div>
      </section>
      <div className="stories-zine">
        {lead && <StoryCard s={lead} i={0} feat />}
        {rest.map((s, i) => (
          <StoryCard key={s.id} s={s} i={i + 1} />
        ))}
      </div>
      <Link href="/" className="site-cta">Open the map</Link>
    </SiteChrome>
    <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 1300 }}>
      <BottomNav routed activeKey="stories" />
    </div>
    </div>
  );
}
