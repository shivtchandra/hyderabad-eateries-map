import Link from "next/link";
import SiteChrome from "../components/SiteChrome.jsx";
import BottomNav from "../components/BottomNav.jsx";
import { allCategoryPages } from "../../lib/siteData.js";
import { pageMeta, getSiteUrl } from "../../lib/site.js";
import { ogImages } from "../../lib/og.js";
import { SEO_THEME_PICKS, slugFromTitle } from "../../lib/rankings.js";
import { breadcrumbJsonLd } from "../../lib/schema.js";

const title = "Explore Hyderabad Food by Category";
const description = "Browse the best biryani, cafes, restaurants, bars, bakeries and ice cream in Hyderabad. Open any hub, then vote on the map.";

export const metadata = {
  ...pageMeta({ title, description, path: "/explore", image: "/og/explore.svg" }),
  openGraph: { ...pageMeta({ title, description, path: "/explore" }).openGraph, images: ogImages(title, description, "/explore") },
};

const PRIORITY = [
  { slug: "biryani-and-local", blurb: "Best biryani, dum, chicken, mandi and local eats" },
  { slug: "cafes", blurb: "Best cafes, Irani chai, work tables and new openings" },
  { slug: "restaurants", blurb: "Restaurants in Hyderabad for dinner and family meals" },
];

export default function ExploreHubPage() {
  const cats = allCategoryPages();
  const bySlug = Object.fromEntries(cats.map((c) => [c.slug, c]));
  const priority = PRIORITY.map((p) => ({ ...p, ...bySlug[p.slug] })).filter((p) => p.label);
  const rest = cats.filter((c) => !PRIORITY.some((p) => p.slug === c.slug));
  const voteFirst = [
    "Best Biryani in Hyderabad",
    "Best Cafe in Hyderabad",
    "Best Mandi in Hyderabad",
    "Best Restaurants in Hyderabad",
    "Best Breakfast Places in Hyderabad",
    "Best Irani Cafe in Hyderabad",
  ]
    .map((t) => SEO_THEME_PICKS.find((p) => p.title === t))
    .filter(Boolean);

  const breadcrumbsLd = breadcrumbJsonLd([
    { name: "Home", url: getSiteUrl() },
    { name: "Explore", url: `${getSiteUrl()}/explore` },
  ]);

  return (
    <div style={{ paddingBottom: 84 }}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsLd) }} />
    <SiteChrome active="/explore" breadcrumb={[{ href: "/", label: "Home" }, { href: "/explore", label: "Explore" }]} title={title} description={description}
      related={[
        { href: "/rankings", label: "Weekly rankings" },
        { href: "/areas", label: "Browse by area" },
        { href: "/stories", label: "Food stories" },
        { href: "/rankings/best-biryani-in-hyderabad", label: "Best biryani vote" },
      ]}
    >
      <p className="spot-prose">
        Start with the hubs people search most: biryani, cafes and restaurants. Each page lists top spots, area links and the live vote.
      </p>
      <h2 className="site-section-title">Start here</h2>
      <div className="site-grid">
        {priority.map((c) => (
          <Link key={c.slug} href={`/explore/${c.slug}`} className="site-card">
            <h2>{c.label}</h2>
            <p>{c.blurb}</p>
          </Link>
        ))}
      </div>
      <h2 className="site-section-title">More categories</h2>
      <div className="site-grid">
        {rest.map((c) => (
          <Link key={c.slug} href={`/explore/${c.slug}`} className="site-card">
            <h2>{c.label}</h2>
            <p>Top spots on the map</p>
          </Link>
        ))}
      </div>
      <h2 className="site-section-title">Vote in weekly rankings</h2>
      <div className="site-related-links">
        {voteFirst.map((p) => (
          <Link key={p.title} href={`/rankings/${slugFromTitle(p.title)}`}>{p.title}</Link>
        ))}
      </div>
      <Link href="/" className="site-cta">Open the map</Link>
    </SiteChrome>
    <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 1300 }}>
      <BottomNav routed activeKey="explore" />
    </div>
    </div>
  );
}
