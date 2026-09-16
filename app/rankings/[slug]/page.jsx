import Link from "next/link";
import { notFound } from "next/navigation";
import SiteChrome from "../../components/SiteChrome.jsx";
import { getRankingBySlug } from "../../../lib/themesServer.js";
import { itemListJsonLd, rankingMeta, SEO_THEME_PICKS, slugFromTitle } from "../../../lib/rankings.js";
import { breadcrumbJsonLd } from "../../../lib/schema.js";
import { getSiteUrl } from "../../../lib/site.js";
import { ogImages } from "../../../lib/og.js";
import { allCategoryPages, editorialRanking, pathForSpotId } from "../../../lib/siteData.js";
import BottomNav from "../../components/BottomNav.jsx";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return SEO_THEME_PICKS.map((p) => ({ slug: slugFromTitle(p.title) }));
}

function placeholderForSlug(slug) {
  return SEO_THEME_PICKS.find((p) => slugFromTitle(p.title) === slug);
}

export async function generateMetadata({ params }) {
  let theme = null;
  try {
    theme = await getRankingBySlug(params.slug);
  } catch {
    theme = null;
  }
  const pick = placeholderForSlug(params.slug);
  if (!theme && !pick) return { title: "Ranking not found, Hyderabad Eats" };
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
  let theme = null;
  try {
    theme = await getRankingBySlug(params.slug);
  } catch {
    theme = null;
  }
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
  // Crowning after endDate does not close votes. "Live" = still the featured week card.
  const isLive = Boolean(data.active);
  const isCrowned = Boolean(data.winnerId);
  const isPlaceholder = !theme;

  // Real ranked list from venue data. Always shown, even once voting is live:
  // it is the "old Google baseline" the community vote is meant to improve on,
  // and it keeps the page full of indexable, named, described content.
  const voteRows = data.results || [];
  const editorial = editorialRanking(pick || { category: data.category }, params.slug, 15);
  const showEditorial = editorial.length > 0;

  // JSON-LD prefers real vote standings; falls back to the editorial list so
  // placeholder pages still emit a valid ItemList.
  const jsonLd = voteRows.length > 0
    ? itemListJsonLd(data, getSiteUrl(), pathForSpotId)
    : showEditorial
      ? itemListJsonLd({ ...data, results: editorial }, getSiteUrl(), pathForSpotId)
      : null;

  const related = [
    { href: "/rankings", label: "All rankings" },
    { href: `/race/this-week?dish=${params.slug}`, label: "Vote on race" },
    ...SEO_THEME_PICKS.filter((p) => slugFromTitle(p.title) !== params.slug).slice(0, 4).map((p) => ({
      href: `/rankings/${slugFromTitle(p.title)}`,
      label: p.title,
    })),
    ...allCategoryPages().slice(0, 2).map((c) => ({ href: `/explore/${c.slug}`, label: c.label })),
  ];

  const topNames = (voteRows.length ? voteRows : editorial).slice(0, 3).map((r) => r.name).filter(Boolean);
  const answerLead = topNames.length
    ? `Top picks for ${data.title.toLowerCase()} right now include ${topNames.join(", ")}.`
    : `${data.title} on Hyderabad Eats combines a live community vote with an all-time Google-review baseline.`;
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `What is the ${data.title.toLowerCase()} right now?`,
        acceptedAnswer: { "@type": "Answer", text: `${answerLead} See the full ranked list and vote on Hyderabad Eats.` },
      },
      {
        "@type": "Question",
        name: "How does Hyderabad Eats rank places?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Weekly community votes on the map sit next to an all-time Google-review baseline so both signals are visible.",
        },
      },
      {
        "@type": "Question",
        name: "Is this ranking free to use?",
        acceptedAnswer: { "@type": "Answer", text: "Yes. Rankings and the food map are free, with no signup required to browse." },
      },
    ],
  };

  const breadcrumbsLd = breadcrumbJsonLd([
    { name: "Home", url: getSiteUrl() },
    { name: "Rankings", url: `${getSiteUrl()}/rankings` },
    { name: data.title, url: `${getSiteUrl()}/rankings/${params.slug}` },
  ]);

  return (
  <div style={{ paddingBottom: 84 }}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsLd) }} />
    {jsonLd && (
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    )}
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
    <SiteChrome
      active="/rankings"
      breadcrumb={[{ href: "/", label: "Home" }, { href: "/rankings", label: "Rankings" }, { href: `/rankings/${params.slug}`, label: data.title }]}
      title={data.title}
      description={isPlaceholder ? `The all-time Google-review baseline for ${data.title.toLowerCase()}. Live community voting opens here soon.` : `This week's live community vote plus the all-time Google-review baseline. ${totalVotes} votes so far${data.endDate ? `, week ends ${data.endDate}` : ""}.`}
      related={related}
    >

      <Link
        href={isPlaceholder && !isLive ? "/rankings" : `/race/this-week?dish=${params.slug}`}
        className="site-cta rankings-vote-top"
        style={{ marginTop: 0, marginBottom: 18 }}
      >
        {isPlaceholder && !isLive
          ? "Browse all dish rankings →"
          : isCrowned
            ? "Vote anyway, crown follows #1 →"
            : "Vote for this dish in the race →"}
      </Link>

      <p style={{ color: "var(--ink-soft)", fontSize: 14.5, lineHeight: 1.55, margin: "0 0 12px" }}>
        <strong>{answerLead}</strong>
      </p>
      <p style={{ color: "var(--ink-soft)", fontSize: 14.5, lineHeight: 1.55, margin: "0 0 18px" }}>
        {isPlaceholder ? (
          <>Two ways to find the {data.title.toLowerCase().replace(/^best /, "best ")}. The weekly community vote opens here soon, where locals crown a winner. Until then, the all-time baseline below is ranked from years of Google ratings and reviews.</>
        ) : (
          <>Two rankings on this page. Up top, this week&apos;s live community vote, where locals pick {data.title.toLowerCase().replace(/^best /, "the best ")}. Below, the all-time baseline from years of Google ratings and reviews. Your vote reshapes the live list. Cast it in this week's race.</>
        )}
      </p>
      <section className="spot-prose" aria-label="FAQ" style={{ margin: "0 0 22px" }}>
        <h2 className="site-section-title">FAQ</h2>
        <p><strong>How do you rank places?</strong> Live community votes plus an all-time Google-review baseline on the same page.</p>
        <p><strong>Can I vote?</strong> Yes. Open This week&apos;s race to vote on this dish (and other open dishes). The list below is the Google-review baseline plus any community votes so far.</p>
        <p><strong>Is it free?</strong> Yes, browsing and voting do not require a paid account.</p>
      </section>

      {!isPlaceholder && (
        <p className="rankings-freshness">
          Updated {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          {totalVotes > 0 ? ` · ${totalVotes.toLocaleString("en-IN")} community votes` : ""}
          {data.endDate ? ` · Week ends ${data.endDate}` : ""}
        </p>
      )}

      {isPlaceholder && (
        <div style={{ background: "var(--violet-wash)", border: "1.5px solid var(--violet)", borderRadius: 16, padding: 16, marginBottom: 20, fontSize: 14, color: "var(--ink-soft)" }}>
          <strong style={{ color: "var(--violet-deep)" }}>Coming soon:</strong> This weekly vote hasn&apos;t started yet. Explore the map and check back, or browse similar spots below.
        </div>
      )}

      {!isPlaceholder && (
        <span className={`rankings-status ${isCrowned ? "winner" : isLive ? "live" : "ended"}`} style={{ display: "inline-block", marginBottom: 16 }}>
          {isCrowned ? "Crowned · votes still open" : isLive ? "Voting open" : "Standings"}
        </span>
      )}

      {data.winnerName && (
        <div style={{ background: "#fefce8", border: "1.5px solid #d97706", borderRadius: 16, padding: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#d97706", textTransform: "uppercase", letterSpacing: "0.08em" }}>Crowned</div>
          <h2 style={{ fontFamily: "Fraunces, serif", margin: "6px 0 0", fontSize: 22 }}>{data.winnerName}</h2>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: "#92400e" }}>Votes stay open. If someone else takes #1, the crown moves.</p>
        </div>
      )}

      {voteRows.length > 0 && (
        <div style={{ margin: "4px 0 10px" }}>
          <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 20, margin: "0 0 4px" }}>This week&apos;s community pick</h2>
          <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>
            Live votes from locals{isCrowned ? ", crown follows #1" : isLive ? ", counting now" : ""}{data.endDate ? ` · week ends ${data.endDate}` : ""}. This is the list your vote shapes, not the algorithm&apos;s.
          </p>
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
                <td style={{ fontWeight: 600 }}><Link href={pathForSpotId(r.spotId)} style={{ color: "inherit" }}>{r.name}</Link></td>
                <td className="rankings-votes">{r.count || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : !showEditorial ? (
        <p style={{ color: "var(--muted)", fontSize: 15 }}>No votes yet, be the first to cast yours on the map.</p>
      ) : null}

      {showEditorial && (
        <section className="rankings-editorial" style={{ marginTop: 26 }}>
          <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 20, margin: "0 0 4px" }}>
            By Google reviews (the old baseline)
          </h2>
          <p style={{ color: "var(--muted)", fontSize: 13, margin: "0 0 14px" }}>
            {isPlaceholder ? (
              <>This ranking comes from years of Google ratings and review counts across {editorial.length} spots, the old-guard verdict. Voting for this one opens here soon, and when it does your pick reshuffles the list.</>
            ) : (
              <>This ranking comes from years of Google ratings and review counts across {editorial.length} spots, the old-guard verdict. We&apos;re building a fresher one from what Hyderabad actually thinks right now, where your vote sets the new baseline. Vote on the map and make this list better&nbsp;&rarr;</>
            )}
          </p>
          <ol className="rankings-editorial-list" style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {editorial.map((r, i) => (
              <li key={r.spotId} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--line, #eee)" }}>
                <span style={{ fontFamily: "Fraunces, serif", fontWeight: 700, fontSize: 18, minWidth: 26, color: "var(--violet-deep)" }}>{i + 1}</span>
                <div>
                  <Link href={pathForSpotId(r.spotId)} style={{ fontWeight: 600, color: "inherit" }}>{r.name}</Link>
                  {r.blurb && <div style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 3 }}>{r.blurb}</div>}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      <Link href={`/race/this-week?dish=${params.slug}`} className="site-cta" style={{ marginTop: 24 }}>Vote on race →</Link>
    </SiteChrome>
    <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 1300 }}>
      <BottomNav routed activeKey="rankings" />
    </div>
  </div>
  );
}
