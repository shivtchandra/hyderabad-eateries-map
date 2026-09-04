import Link from "next/link";
import SiteChrome from "../components/SiteChrome.jsx";
import { allAreaPages } from "../../lib/siteData.js";
import { pageMeta } from "../../lib/site.js";
import { ogImages } from "../../lib/og.js";

const title = "Hyderabad Food by Area";
const description = "Explore cafes, biryani, bars and bakeries neighbourhood by neighbourhood, Jubilee Hills, Gachibowli, Banjara Hills and more.";

export const metadata = {
  ...pageMeta({ title, description, path: "/areas" }),
  openGraph: { ...pageMeta({ title, description, path: "/areas" }).openGraph, images: ogImages(title, description) },
};

export default function AreasHubPage() {
  const areas = allAreaPages();
  return (
    <SiteChrome active="/areas" breadcrumb={[{ href: "/", label: "Home" }, { href: "/areas", label: "Areas" }]} title={title} description={description}
      related={[{ href: "/explore", label: "Explore by category" }, { href: "/rankings", label: "Weekly rankings" }]}
    >
      <div className="site-grid">
        {areas.map((a) => (
          <Link key={a.slug} href={`/areas/${a.slug}`} className="site-card">
            <h2>{a.area}</h2>
            <p>Food spots in {a.area}</p>
          </Link>
        ))}
      </div>
      <Link href="/" className="site-cta">Open the map</Link>
    </SiteChrome>
  );
}
