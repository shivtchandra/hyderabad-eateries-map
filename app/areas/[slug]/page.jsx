import Link from "next/link";
import { notFound } from "next/navigation";
import SiteChrome from "../../components/SiteChrome.jsx";
import { getAreaBySlug, allAreaPages } from "../../../lib/siteData.js";
import { pageMeta } from "../../../lib/site.js";
import { ogImages } from "../../../lib/og.js";

export function generateStaticParams() {
  return allAreaPages().map((a) => ({ slug: a.slug }));
}

export function generateMetadata({ params }) {
  const data = getAreaBySlug(params.slug);
  if (!data) return { title: "Not found" };
  const title = `Best Restaurants & Cafes in ${data.area} (${new Date().getFullYear()})`;
  const description = `Top food spots in ${data.area}, Hyderabad. ${data.spots.length} cafes, restaurants and local gems on the map.`;
  return {
    ...pageMeta({ title, description, path: `/areas/${params.slug}` }),
    openGraph: { ...pageMeta({ title, description, path: `/areas/${params.slug}` }).openGraph, images: ogImages(title, description) },
  };
}

export default function AreaPage({ params }) {
  const data = getAreaBySlug(params.slug);
  if (!data) notFound();

  const top = [...data.spots].sort((a, b) => (b.ratingCount || 0) - (a.ratingCount || 0)).slice(0, 30);

  return (
    <SiteChrome
      active="/areas"
      breadcrumb={[{ href: "/", label: "Home" }, { href: "/areas", label: "Areas" }, { href: `/areas/${params.slug}`, label: data.area }]}
      title={`Food in ${data.area}`}
      description={`${data.spots.length} spots in ${data.area}. Top picks by reviews.`}
      related={[
        { href: "/explore/cafes", label: "All cafes" },
        { href: "/rankings/best-cafe-in-hyderabad", label: "Vote: best cafe" },
        ...allAreaPages().filter((a) => a.slug !== params.slug).slice(0, 3).map((a) => ({ href: `/areas/${a.slug}`, label: a.area })),
      ]}
    >
      <ul className="site-spot-list">
        {top.map((s, i) => (
          <li key={s.id}>
            <Link href={`/spot/${s.id}`}>
              <span>
                <div className="site-spot-name">{i + 1}. {s.name}</div>
                <div className="site-spot-meta">{s.category} · {s.rating ? `${s.rating}★` : ", "}</div>
              </span>
              <span className="site-spot-meta">View →</span>
            </Link>
          </li>
        ))}
      </ul>
      <Link href="/" className="site-cta">See {data.area} on the map</Link>
    </SiteChrome>
  );
}
