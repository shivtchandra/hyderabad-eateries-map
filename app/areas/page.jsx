import Link from "next/link";
import SiteChrome from "../components/SiteChrome.jsx";
import BottomNav from "../components/BottomNav.jsx";
import { allAreaPages, getAreaBySlug } from "../../lib/siteData.js";
import HubAnswer, { HubFaq } from "../components/HubAnswer.jsx";
import { hubJsonLd, todayIso } from "../../lib/hubSeo.js";
import { pageMeta, getSiteUrl } from "../../lib/site.js";
import { ogImages } from "../../lib/og.js";
import { breadcrumbJsonLd } from "../../lib/schema.js";

const title = "Hyderabad Food by Area";
const description = "Best restaurants and cafes by area in Hyderabad. Start with Gachibowli, Jubilee Hills, Banjara Hills and Madhapur / HITEC, then open the map.";

export const metadata = {
  ...pageMeta({ title, description, path: "/areas" }),
  openGraph: { ...pageMeta({ title, description, path: "/areas" }).openGraph, images: ogImages(title, description, "/areas") },
};

const PRIORITY_AREAS = ["gachibowli", "jubilee-hills", "banjara-hills", "madhapur-hitec"];

export default function AreasHubPage() {
  const areas = allAreaPages();
  const priority = PRIORITY_AREAS.map((slug) => areas.find((a) => a.slug === slug)).filter(Boolean);
  const rest = areas.filter((a) => !PRIORITY_AREAS.includes(a.slug));
  const ordered = [...priority, ...rest].map((a) => {
    const spots = getAreaBySlug(a.slug)?.spots || [];
    const top = [...spots].sort((x, y) => (y.ratingCount || 0) - (x.ratingCount || 0)).slice(0, 3).map((x) => x.name);
    return { ...a, count: spots.length, top };
  }).filter((a) => a.count > 0);
  const totalSpots = ordered.reduce((n, a) => n + a.count, 0);
  const updated = todayIso();
  const faqs = [
    { q: "Which area in Hyderabad has the best restaurants?", a: `By number of mapped spots: ${[...ordered].sort((x, y) => y.count - x.count).slice(0, 3).map((a) => `${a.area} (${a.count})`).join(", ")}. Each area guide lets you filter by kind of place and sort by reviews, rating or local votes.` },
    { q: "Where are the best cafes in Hyderabad?", a: "Jubilee Hills, Banjara Hills, Gachibowli and Madhapur / HITEC have the most cafes on the map. Open an area and tap Cafes to see them on a map." },
    { q: "Is there a map of restaurants by area?", a: "Yes. Every area guide has a live map of its spots, and the main Hyderabad Eats map covers the whole city." },
  ];
  const ld = hubJsonLd({ name: title, description, path: "/areas", updated, faqs, items: ordered.map((a) => ({ name: `Food in ${a.area}`, url: `/areas/${a.slug}` })) });

  const breadcrumbsLd = breadcrumbJsonLd([
    { name: "Home", url: getSiteUrl() },
    { name: "Areas", url: `${getSiteUrl()}/areas` },
  ]);

  return (
    <div style={{ paddingBottom: 84 }}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsLd) }} />
    {ld.map((x, i) => <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(x) }} />)}
    <SiteChrome active="/areas" backFallback="/guides" breadcrumb={[{ href: "/", label: "Home" }, { href: "/areas", label: "Areas" }]} title={title} description={`Hyderabad Eats maps ${totalSpots.toLocaleString("en-IN")} restaurants, cafes and local spots across ${ordered.length} Hyderabad neighbourhoods. Each area guide can be filtered by kind of place and shows its spots on a map.`}
      related={[{ href: "/explore", label: "Explore by category" }, { href: "/rankings", label: "Weekly rankings" }]}
    >
      <HubAnswer
        stats={[{ value: ordered.length, label: "areas" }, { value: totalSpots.toLocaleString("en-IN"), label: "spots mapped" }, { value: ordered[0]?.area.split("/")[0] || "", label: "most popular" }]}
        updated={updated}
      />
      <ul className="hub-list">
        {ordered.map((a, i) => (
          <li key={a.slug}>
            <Link href={`/areas/${a.slug}`} className={`hub-card${i === 0 ? " hub-card--sun" : ""}`}>
              <b>{a.area}</b>
              <span>{a.count} spots{a.top.length ? ` · ${a.top.join(", ")}` : ""}</span>
            </Link>
          </li>
        ))}
      </ul>
      <Link href="/" className="site-cta">Open the map</Link>
      <HubFaq faqs={faqs} />
    </SiteChrome>
    <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 1300 }}>
      <BottomNav routed activeKey="areas" />
    </div>
    </div>
  );
}
