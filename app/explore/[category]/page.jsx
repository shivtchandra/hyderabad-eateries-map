import Link from "next/link";
import { notFound } from "next/navigation";
import SiteChrome from "../../components/SiteChrome.jsx";
import { getCategoryBySlug, allCategoryPages } from "../../../lib/siteData.js";
import { pageMeta, absoluteUrl } from "../../../lib/site.js";
import { ogImages } from "../../../lib/og.js";
import { slugFromTitle, SEO_THEME_PICKS } from "../../../lib/rankings.js";

export function generateStaticParams() {
  return allCategoryPages().map((c) => ({ category: c.slug }));
}

export function generateMetadata({ params }) {
  const data = getCategoryBySlug(params.category);
  if (!data) return { title: "Not found" };
  const title = `${data.seoTitle} (${new Date().getFullYear()})`;
  const description = `${data.description} ${data.spots.length} spots on Hyderabad Eats.`;
  return {
    ...pageMeta({ title, description, path: `/explore/${params.category}` }),
    openGraph: { ...pageMeta({ title, description, path: `/explore/${params.category}` }).openGraph, images: ogImages(title, description) },
  };
}

export default function ExploreCategoryPage({ params }) {
  const data = getCategoryBySlug(params.category);
  if (!data) notFound();

  const rankingPick = SEO_THEME_PICKS.find((p) => p.title.toLowerCase().includes(data.label.toLowerCase().split(" ")[0]));
  const top = data.spots.slice(0, 30);

  return (
    <SiteChrome
      active="/explore"
      breadcrumb={[{ href: "/", label: "Home" }, { href: "/explore", label: "Explore" }, { href: `/explore/${params.category}`, label: data.label }]}
      title={data.seoTitle}
      description={`${data.description} Showing top ${top.length} of ${data.spots.length} spots.`}
      related={[
        { href: "/rankings", label: "Weekly rankings" },
        { href: "/areas", label: "Browse by area" },
        ...(rankingPick ? [{ href: `/rankings/${slugFromTitle(rankingPick.title)}`, label: `Vote: ${rankingPick.title}` }] : []),
        ...allCategoryPages().filter((c) => c.slug !== params.category).slice(0, 3).map((c) => ({ href: `/explore/${c.slug}`, label: c.label })),
      ]}
    >
      <ul className="site-spot-list">
        {top.map((s, i) => (
          <li key={s.id}>
            <Link href={`/spot/${s.id}`}>
              <span>
                <div className="site-spot-name">{i + 1}. {s.name}</div>
                <div className="site-spot-meta">{s.discoveredIn || "Hyderabad"} · {s.rating ? `${s.rating}★` : ", "}</div>
              </span>
              <span className="site-spot-meta">View →</span>
            </Link>
          </li>
        ))}
      </ul>
      <Link href="/" className="site-cta">Explore all on the map</Link>
    </SiteChrome>
  );
}
