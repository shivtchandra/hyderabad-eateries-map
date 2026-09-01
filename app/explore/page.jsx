import Link from "next/link";
import SiteChrome from "../components/SiteChrome.jsx";
import { allCategoryPages } from "../../lib/siteData.js";
import { pageMeta } from "../../lib/site.js";
import { ogImages } from "../../lib/og.js";
import { SEO_THEME_PICKS, slugFromTitle } from "../../lib/rankings.js";

const title = "Explore Hyderabad Food by Category";
const description = "Browse 3,400+ cafes, biryani spots, bars, bakeries and ice cream parlours across Hyderabad.";

export const metadata = {
  ...pageMeta({ title, description, path: "/explore", image: "/og/explore.svg" }),
  openGraph: { ...pageMeta({ title, description, path: "/explore" }).openGraph, images: ogImages(title, description) },
};

export default function ExploreHubPage() {
  const cats = allCategoryPages();
  return (
    <SiteChrome active="/explore" breadcrumb={[{ href: "/", label: "Home" }, { href: "/explore", label: "Explore" }]} title={title} description={description}
      related={[
        { href: "/rankings", label: "Weekly rankings" },
        { href: "/areas", label: "Browse by area" },
        { href: "/rankings/best-biryani-in-hyderabad", label: "Best biryani vote" },
      ]}
    >
      <div className="site-grid">
        {cats.map((c) => (
          <Link key={c.slug} href={`/explore/${c.slug}`} className="site-card">
            <h2>{c.label}</h2>
            <p>Top spots on the map</p>
          </Link>
        ))}
      </div>
      <h2 className="site-section-title">Vote in weekly rankings</h2>
      <div className="site-related-links">
        {SEO_THEME_PICKS.slice(0, 6).map((p) => (
          <Link key={p.title} href={`/rankings/${slugFromTitle(p.title)}`}>{p.title}</Link>
        ))}
      </div>
      <Link href="/" className="site-cta">Open the map</Link>
    </SiteChrome>
  );
}
