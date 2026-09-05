import Link from "next/link";
import { notFound } from "next/navigation";
import SiteChrome from "../../components/SiteChrome.jsx";
import { getAreaBySlug, allAreaPages } from "../../../lib/siteData.js";
import { getAreaPillar } from "../../../lib/explorePillars.js";
import { pageMeta } from "../../../lib/site.js";
import { ogImages } from "../../../lib/og.js";

export function generateStaticParams() {
  return allAreaPages().map((a) => ({ slug: a.slug }));
}

export function generateMetadata({ params }) {
  const data = getAreaBySlug(params.slug);
  if (!data) return { title: "Not found" };
  const year = new Date().getFullYear();
  const title = `Best Restaurants & Cafes in ${data.area} (${year})`;
  const pillar = getAreaPillar(data.area);
  const description = pillar?.blurb
    || `Top food spots in ${data.area}, Hyderabad. ${data.spots.length} cafes, restaurants and local gems on the map.`;
  return {
    ...pageMeta({ title, description, path: `/areas/${params.slug}` }),
    openGraph: { ...pageMeta({ title, description, path: `/areas/${params.slug}` }).openGraph, images: ogImages(title, description) },
  };
}

export default function AreaPage({ params }) {
  const data = getAreaBySlug(params.slug);
  if (!data) notFound();

  const pillar = getAreaPillar(data.area);
  const year = new Date().getFullYear();
  const top = [...data.spots].sort((a, b) => (b.ratingCount || 0) - (a.ratingCount || 0)).slice(0, 30);
  const pageTitle = `Best Restaurants & Cafes in ${data.area}`;

  return (
    <SiteChrome
      active="/areas"
      breadcrumb={[{ href: "/", label: "Home" }, { href: "/areas", label: "Areas" }, { href: `/areas/${params.slug}`, label: data.area }]}
      title={pageTitle}
      description={pillar?.blurb || `${data.spots.length} spots in ${data.area}. Top picks by reviews.`}
      related={[
        { href: "/explore/cafes", label: "Best cafes" },
        { href: "/explore/biryani-and-local", label: "Best biryani" },
        { href: "/explore/restaurants", label: "Restaurants" },
        { href: "/rankings/best-cafe-in-hyderabad", label: "Vote: best cafe" },
        ...allAreaPages().filter((a) => a.slug !== params.slug).slice(0, 3).map((a) => ({ href: `/areas/${a.slug}`, label: a.area })),
      ]}
    >
      {pillar?.blurb && <p className="spot-prose">{pillar.blurb}</p>}
      <p className="spot-prose">
        Showing top {top.length} of {data.spots.length} spots in {data.area} for {year}. Open any place for details, or jump to the map to stamp and vote.
      </p>
      <h2 className="site-section-title">Top food in {data.area}</h2>
      <ul className="site-spot-list">
        {top.map((s, i) => (
          <li key={s.id}>
            <Link href={`/spot/${s.id}`}>
              <span>
                <div className="site-spot-name">{i + 1}. {s.name}</div>
                <div className="site-spot-meta">{s.category} · {s.rating ? `${s.rating}★` : ","}</div>
              </span>
              <span className="site-spot-meta">View →</span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="site-related-links" style={{ marginTop: 20 }}>
        <Link href="/explore/biryani-and-local">Biryani & local</Link>
        <Link href="/explore/cafes">Cafes</Link>
        <Link href="/stories">Stories</Link>
      </div>
      <Link href="/" className="site-cta">See {data.area} on the map</Link>
    </SiteChrome>
  );
}
