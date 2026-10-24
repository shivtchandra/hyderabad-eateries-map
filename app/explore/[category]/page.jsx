import Link from "next/link";
import { notFound } from "next/navigation";
import SiteChrome from "../../components/SiteChrome.jsx";
import BottomNav from "../../components/BottomNav.jsx";
import { getCategoryBySlug, allCategoryPages, getEateryById, spotPath } from "../../../lib/siteData.js";
import { getExplorePillar } from "../../../lib/explorePillars.js";
import { pageMeta, getSiteUrl } from "../../../lib/site.js";
import { ogImages } from "../../../lib/og.js";
import { slugFromTitle, SEO_THEME_PICKS } from "../../../lib/rankings.js";
import { breadcrumbJsonLd } from "../../../lib/schema.js";

export function generateStaticParams() {
  return allCategoryPages().map((c) => ({ category: c.slug }));
}

export function generateMetadata({ params }) {
  const data = getCategoryBySlug(params.category);
  if (!data) return { title: "Not found" };
  const pillar = getExplorePillar(params.category);
  const year = new Date().getFullYear();
  const title = `${data.seoTitle} (${year})`;
  const description = pillar?.heroDescription
    || `${data.description} ${data.spots.length} spots on Hyderabad Eats.`;
  return {
    ...pageMeta({ title, description, path: `/explore/${params.category}` }),
    openGraph: { ...pageMeta({ title, description, path: `/explore/${params.category}` }).openGraph, images: ogImages(title, description) },
  };
}

function rankingLinks(pillar) {
  const titles = pillar?.rankingTitles || [];
  return titles
    .map((t) => SEO_THEME_PICKS.find((p) => p.title === t))
    .filter(Boolean);
}

export default function ExploreCategoryPage({ params }) {
  const data = getCategoryBySlug(params.category);
  if (!data) notFound();

  const pillar = getExplorePillar(params.category);
  const rankings = rankingLinks(pillar);
  const fallbackRanking = !rankings.length
    ? SEO_THEME_PICKS.find((p) =>
        p.title.toLowerCase().includes(data.label.toLowerCase().split(" ")[0].replace(/s$/, ""))
      )
    : null;
  const voteLinks = rankings.length ? rankings : (fallbackRanking ? [fallbackRanking] : []);
  const top = data.spots.slice(0, 30);
  const stories = (pillar?.storyIds || [])
    .map((id) => getEateryById(id))
    .filter(Boolean);
  const year = new Date().getFullYear();

  const breadcrumbsLd = breadcrumbJsonLd([
    { name: "Home", url: getSiteUrl() },
    { name: "Explore", url: `${getSiteUrl()}/explore` },
    { name: data.label, url: `${getSiteUrl()}/explore/${params.category}` },
  ]);

  return (
    <div style={{ paddingBottom: 84 }}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsLd) }} />
    <SiteChrome backFallback="/explore"
      active="/explore"
      breadcrumb={[{ href: "/", label: "Home" }, { href: "/explore", label: "Explore" }, { href: `/explore/${params.category}`, label: data.label }]}
      title={data.seoTitle}
      description={pillar?.heroDescription || `${data.description} Showing top ${top.length} of ${data.spots.length} spots.`}
      related={[
        ...(params.category === "biryani-and-local" ? [{ href: "/rankings/best-biryani-in-hyderabad", label: "Live local-vote biryani standings" }] : []),
        { href: "/rankings", label: "Weekly rankings" },
        { href: "/areas", label: "Browse by area" },
        { href: "/stories", label: "Food stories" },
        ...voteLinks.slice(0, 2).map((p) => ({ href: `/rankings/${slugFromTitle(p.title)}`, label: `Vote: ${p.title}` })),
        ...allCategoryPages().filter((c) => c.slug !== params.category).slice(0, 2).map((c) => ({ href: `/explore/${c.slug}`, label: c.label })),
      ]}
    >
      {pillar?.intro?.length > 0 && (
        <div className="site-prose" style={{ marginBottom: 8 }}>
          {pillar.intro.map((p, i) => (
            <p key={i} className="spot-prose">{p}</p>
          ))}
        </div>
      )}

      {stories.length > 0 && (
        <section className="spot-section">
          <h2 className="site-section-title">Read before you go</h2>
          <div className="site-related-links">
            {stories.map((s) => (
              <Link key={s.id} href={spotPath(s)}>
                {s.name}{s.discoveredIn ? `, ${s.discoveredIn}` : ""}
              </Link>
            ))}
            <Link href="/stories">All stories</Link>
          </div>
        </section>
      )}

      {pillar?.sections?.map((sec) => (
        <section key={sec.heading} className="spot-section">
          <h2>{sec.heading}</h2>
          <p className="spot-prose">{sec.body}</p>
        </section>
      ))}

      {pillar?.areaLinks?.length > 0 && (
        <section className="spot-section">
          <h2 className="site-section-title">Browse by area</h2>
          <div className="site-related-links">
            {pillar.areaLinks.map((a) => (
              <Link key={a.href} href={a.href}>{a.label}</Link>
            ))}
            <Link href="/areas">All areas</Link>
          </div>
        </section>
      )}

      {voteLinks.length > 0 && (
        <section className="spot-section">
          <h2 className="site-section-title">Vote this week</h2>
          <div className="site-related-links">
            {voteLinks.map((p) => (
              <Link key={p.title} href={`/rankings/${slugFromTitle(p.title)}`}>{p.title}</Link>
            ))}
          </div>
        </section>
      )}

      <h2 className="site-section-title">Most reviewed {data.label.toLowerCase()} on Google in Hyderabad ({year})</h2>
      <ul className="site-spot-list">
        {top.map((s, i) => (
          <li key={s.id}>
            <Link href={spotPath(s)}>
              <span>
                <div className="site-spot-name">{s.name}</div>
                <div className="site-spot-meta">{s.discoveredIn || "Hyderabad"} · {s.rating ? `Google ${s.rating}★` : "Google listing"}</div>
              </span>
              <span className="site-spot-meta">View →</span>
            </Link>
          </li>
        ))}
      </ul>

      {pillar?.faqs?.length > 0 && (
        <section className="spot-section">
          <h2>FAQ</h2>
          <div className="spot-faq">
            {pillar.faqs.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      <Link href="/" className="site-cta">Explore all on the map</Link>
    </SiteChrome>
    <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 1300 }}>
      <BottomNav routed activeKey="explore" />
    </div>
    </div>
  );
}
