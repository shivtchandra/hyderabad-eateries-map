import Link from "next/link";
import { notFound } from "next/navigation";
import SiteChrome from "../../components/SiteChrome.jsx";
import { getRankingBySlug } from "../../../lib/themesServer.js";
import { itemListJsonLd, rankingMeta, SEO_THEME_PICKS, slugFromTitle } from "../../../lib/rankings.js";
import { getSiteUrl } from "../../../lib/site.js";
import { ogImages } from "../../../lib/og.js";
import { allCategoryPages } from "../../../lib/siteData.js";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return SEO_THEME_PICKS.map((p) => ({ slug: slugFromTitle(p.title) }));
}

function placeholderForSlug(slug) {
  return SEO_THEME_PICKS.find((p) => slugFromTitle(p.title) === slug);
}

export async function generateMetadata({ params }) {
  const theme = await getRankingBySlug(params.slug);
  const pick = placeholderForSlug(params.slug);
  if (!theme && !pick) return { title: "Ranking not found — Hyderabad Eats" };
  const fake = theme || { title: pick.title, description: pick.description, slug: params.slug, results: [] };
  const meta = rankingMeta(fake);
  const path = `/rankings/${params.slug}`;
  return {
    title: meta.title,
    description: meta.description,
    openGraph: { title: meta.title, description: meta.description, url: `${getSiteUrl()}${path}`, type: "article", images: ogImages(meta.title, meta.description) },
    twitter: { card: "summary_large_image", title: meta.title, description: meta.description, images: ogImages(meta.title, meta.description).map((i) => i.url) },
    alternates: { canonical: `${getSiteUrl()}${path}` },
  };
}

export default async function RankingPage({ params }) {
  const theme = await getRankingBySlug(params.slug);
  const pick = placeholderForSlug(params.slug);
  if (!theme && !pick) notFound();

  const data = theme || {
    id: null,
    title: pick.title,
    description: pick.description,
    slug: params.slug,
    active: false,
    winnerId: null,
    winnerName: null,
    results: [],
    startDate: null,
    endDate: null,
  };

  const totalVotes = (data.results || []).reduce((s, r) => s + (r.count || 0), 0);
  const isLive = data.active && !data.winnerId;
  const isPlaceholder = !theme;
  const jsonLd = !isPlaceholder ? itemListJsonLd(data, getSiteUrl()) : null;

  const related = [
    { href: "/rankings", label: "All rankings" },
    { href: "/", label: "Vote on map" },
    ...SEO_THEME_PICKS.filter((p) => slugFromTitle(p.title) !== params.slug).slice(0, 4).map((p) => ({
      href: `/rankings/${slugFromTitle(p.title)}`,
      label: p.title,
    })),
    ...allCategoryPages().slice(0, 2).map((c) => ({ href: `/explore/${c.slug}`, label: c.label })),
  ];

  return (
  <>
    {jsonLd && (
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    )}
    <SiteChrome
      active="/rankings"
      breadcrumb={[{ href: "/", label: "Home" }, { href: "/rankings", label: "Rankings" }, { href: `/rankings/${params.slug}`, label: data.title }]}
      title={data.title}
      description={isPlaceholder ? `${data.description} Vote launches soon — explore related spots meanwhile.` : `${totalVotes} community votes${data.startDate && data.endDate ? ` · ${data.startDate} to ${data.endDate}` : ""}`}
      related={related}
    >

      {!isPlaceholder && (
        <p className="rankings-freshness">
          Updated {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          {totalVotes > 0 ? ` · ${totalVotes.toLocaleString("en-IN")} community votes` : ""}
          {data.endDate ? ` · Week ends ${data.endDate}` : ""}
        </p>
      )}

      {isPlaceholder && (
        <div style={{ background: "var(--violet-wash)", border: "1.5px solid var(--violet)", borderRadius: 16, padding: 16, marginBottom: 20, fontSize: 14, color: "var(--ink-soft)" }}>
          <strong style={{ color: "var(--violet-deep)" }}>Coming soon:</strong> This weekly vote hasn&apos;t started yet. Explore the map and check back — or browse similar spots below.
        </div>
      )}

      {!isPlaceholder && (
        <span className={`rankings-status ${isLive ? "live" : data.winnerId ? "winner" : "ended"}`} style={{ display: "inline-block", marginBottom: 16 }}>
          {isLive ? "Voting open" : data.winnerId ? "Winner crowned" : "Final standings"}
        </span>
      )}

      {data.winnerName && (
        <div style={{ background: "#fefce8", border: "1.5px solid #d97706", borderRadius: 16, padding: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#d97706", textTransform: "uppercase", letterSpacing: "0.08em" }}>Winner</div>
          <h2 style={{ fontFamily: "Fraunces, serif", margin: "6px 0 0", fontSize: 22 }}>{data.winnerName}</h2>
        </div>
      )}

      {(data.results || []).length > 0 ? (
        <table className="rankings-table">
          <thead>
            <tr><th>#</th><th>Spot</th><th style={{ textAlign: "right" }}>Votes</th></tr>
          </thead>
          <tbody>
            {data.results.map((r, i) => (
              <tr key={r.spotId} style={r.spotId === data.winnerId ? { background: "#fefce8" } : undefined}>
                <td className="rankings-rank">{r.spotId === data.winnerId ? "🏆" : i + 1}</td>
                <td style={{ fontWeight: 600 }}><Link href={`/spot/${r.spotId}`} style={{ color: "inherit" }}>{r.name}</Link></td>
                <td className="rankings-votes">{r.count || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p style={{ color: "var(--muted)", fontSize: 15 }}>No votes yet — be the first to cast yours on the map.</p>
      )}

      <Link href="/" className="site-cta">{isLive ? "Vote now on the map →" : "Explore on the map →"}</Link>
    </SiteChrome>
  </>
  );
}
