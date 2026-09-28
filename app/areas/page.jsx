import Link from "next/link";
import SiteChrome from "../components/SiteChrome.jsx";
import BottomNav from "../components/BottomNav.jsx";
import { allAreaPages } from "../../lib/siteData.js";
import { pageMeta, getSiteUrl } from "../../lib/site.js";
import { ogImages } from "../../lib/og.js";
import { breadcrumbJsonLd } from "../../lib/schema.js";

const title = "Hyderabad Food by Area";
const description = "Best restaurants and cafes by area in Hyderabad. Start with Gachibowli, Jubilee Hills, Banjara Hills and Madhapur / HITEC, then open the map.";

export const metadata = {
  ...pageMeta({ title, description, path: "/areas" }),
  openGraph: { ...pageMeta({ title, description, path: "/areas" }).openGraph, images: ogImages(title, description) },
};

const PRIORITY_AREAS = ["gachibowli", "jubilee-hills", "banjara-hills", "madhapur-hitec"];

export default function AreasHubPage() {
  const areas = allAreaPages();
  const priority = PRIORITY_AREAS.map((slug) => areas.find((a) => a.slug === slug)).filter(Boolean);
  const rest = areas.filter((a) => !PRIORITY_AREAS.includes(a.slug));
  const ordered = [...priority, ...rest];

  const breadcrumbsLd = breadcrumbJsonLd([
    { name: "Home", url: getSiteUrl() },
    { name: "Areas", url: `${getSiteUrl()}/areas` },
  ]);

  return (
    <div style={{ paddingBottom: 84 }}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsLd) }} />
    <SiteChrome active="/areas" breadcrumb={[{ href: "/", label: "Home" }, { href: "/areas", label: "Areas" }]} title={title} description={description}
      related={[{ href: "/explore", label: "Explore by category" }, { href: "/rankings", label: "Weekly rankings" }]}
    >
      <div className="site-grid">
        {ordered.map((a) => (
          <Link key={a.slug} href={`/areas/${a.slug}`} className="site-card">
            <h2>{a.area}</h2>
            <p>Best restaurants and cafes in {a.area}</p>
          </Link>
        ))}
      </div>
      <Link href="/" className="site-cta">Open the map</Link>
    </SiteChrome>
    <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 1300 }}>
      <BottomNav routed activeKey="areas" />
    </div>
    </div>
  );
}
