import Link from "next/link";
import { notFound } from "next/navigation";
import SiteChrome from "../../components/SiteChrome.jsx";
import { getRankingBySlug } from "../../../lib/themesServer.js";
import { itemListJsonLd, rankingMeta, SEO_THEME_PICKS, slugFromTitle } from "../../../lib/rankings.js";
import { breadcrumbJsonLd } from "../../../lib/schema.js";
import { getSiteUrl } from "../../../lib/site.js";
import { ogImages } from "../../../lib/og.js";
import { allCategoryPages, editorialRanking, pathForSpotId, hasSpotPhoto } from "../../../lib/siteData.js";
import { spotPhotoUrl } from "../../../lib/photos.js";
import ShareRankingButton from "../../components/ShareRankingButton.jsx";
import BottomNav from "../../components/BottomNav.jsx";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  const slugs = SEO_THEME_PICKS.map((p) => slugFromTitle(p.title));
  // The static export can't render unknown slugs on demand: add every theme
  // people have voted on, not just the SEO set.
  if (process.env.HYD_STATIC_EXPORT === "1") {
    const { getAllRankingsThemes } = await import("../../../lib/themesServer.js");
    for (const t of await getAllRankingsThemes(100)) if (t.slug) slugs.push(t.slug);
  }
  return [...new Set(slugs)].map((slug) => ({ slug }));
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
  const editorial = editorialRanking(pick || { category: fake?.category }, params.slug, 8);
  const meta = rankingMeta(fake, editorial);
  const path = `/rankings/${params.slug}`;

  // Find the winning/leader spot or top contender with a photo
  const voteRows = (fake.results || []).filter((r) => (r.count || 0) > 0);
  const leader = fake.winnerId
    ? (fake.results || []).find((r) => r.spotId === fake.winnerId)
    : voteRows[0] || null;

  const candidateIds = [
    leader?.spotId,
    ...voteRows.map((r) => r.spotId),
    ...editorial.map((r) => r.spotId),
    ...(fake.results || []).map((r) => r.spotId),
  ].filter(Boolean);

  let photoUrl = null;
  let photoSpotName = leader?.name || null;
  for (const cid of candidateIds) {
    if (hasSpotPhoto(cid)) {
      photoUrl = spotPhotoUrl(cid);
      if (!photoSpotName) {
        const found = (fake.results || []).find((r) => r.spotId === cid) || editorial.find((r) => r.spotId === cid);
        photoSpotName = found?.name || null;
      }
      break;
    }
  }

  const ogImagesList = photoUrl
    ? [{ url: photoUrl, width: 800, height: 600, alt: `${photoSpotName || meta.title} — Hyderabad Eats`, type: "image/jpeg" }]
    : ogImages(meta.title, meta.description, `/rankings/${params.slug}`);

  return {
    title: meta.title,
    description: meta.description,
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: `${getSiteUrl()}${path}`,
      type: "article",
      images: ogImagesList,
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
      images: photoUrl ? [photoUrl] : ogImages(meta.title, meta.description, `/rankings/${params.slug}`).map((i) => i.url),
    },
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

  // Well-rated spots for this dish from venue data. Keeps the page full of named,
  // described content even before anyone votes.
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
    : `${data.title} on Hyderabad Eats is decided by a weekly community vote from locals.`;
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
          text: "Locals vote each week in the race. The spot with the most votes holds #1, and the crown moves whenever someone overtakes it.",
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

  const voteHref = `/race/this-week?dish=${params.slug}`;
  const leader = voteRows.find((r) => r.spotId === data.winnerId) || voteRows[0] || null;
  const topCount = Math.max(0, ...voteRows.map((r) => r.count || 0));
  const onBoard = new Set(voteRows.map((r) => r.spotId));
  const contenders = editorial.filter((r) => !onBoard.has(r.spotId)).slice(0, 12);

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
      description={isPlaceholder
        ? "Voting for this dish opens soon. Until then, here are the spots locals already rate."
        : `Voted by Hyderabad locals, every week. ${totalVotes.toLocaleString("en-IN")} votes so far${data.endDate ? `, week ends ${data.endDate}` : ""}.`}
      related={related}
    >

      {isPlaceholder ? (
        <section className="rk-leader">
          <div className="rk-leader-top">
            <span className="rk-chip">Opening soon</span>
          </div>
          <p className="rk-leader-sub">This weekly vote hasn&apos;t started yet. Explore the spots below and check back, locals will decide the order.</p>
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", marginTop: "16px" }}>
            <Link href="/rankings" className="site-cta" style={{ margin: 0 }}>Browse all dish rankings →</Link>
            <ShareRankingButton title={data.title} slug={params.slug} leaderName={null} />
          </div>
        </section>
      ) : (
        <section className="rk-leader">
          <div className="rk-leader-top">
            <span className={`rk-chip ${isCrowned ? "crowned" : isLive ? "live" : ""}`}>
              {isCrowned ? "Crowned, votes still open" : isLive ? "Voting open" : "Final standings"}
            </span>
            {data.endDate && <span className="rk-meta">Week ends {data.endDate}</span>}
          </div>
          {leader ? (
            <div className="rk-leader-body">
              {hasSpotPhoto(leader.spotId) ? (
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <img
                    src={spotPhotoUrl(leader.spotId)}
                    alt={leader.name}
                    width={64}
                    height={64}
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 14,
                      objectFit: "cover",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                      border: "2px solid #fff",
                    }}
                  />
                  <span
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      bottom: -4,
                      right: -4,
                      fontSize: 14,
                      background: "#fff",
                      borderRadius: "50%",
                      width: 22,
                      height: 22,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
                    }}
                  >
                    🏆
                  </span>
                </div>
              ) : (
                <span className="rk-crown" aria-hidden="true">🏆</span>
              )}
              <div>
                <div className="rk-eyebrow">{isCrowned ? "This week's crown" : "Leading right now"}</div>
                <h2 className="rk-leader-name">{leader.spotId.startsWith("user-") ? leader.name : <Link href={pathForSpotId(leader.spotId)}>{leader.name}</Link>}</h2>
                <p className="rk-leader-sub">
                  {leader.count || 0} of {totalVotes} votes{totalVotes ? `, ${Math.round(((leader.count || 0) / totalVotes) * 100)}%` : ""}. If someone else takes #1, the crown moves.
                </p>
              </div>
            </div>
          ) : (
            <p className="rk-leader-sub">No votes yet. Be the first to put a spot on the board.</p>
          )}
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", marginTop: "16px" }}>
            <Link href={voteHref} className="site-cta" style={{ margin: 0 }}>{leader ? "Cast your vote →" : "Vote for this dish →"}</Link>
            <ShareRankingButton title={data.title} slug={params.slug} leaderName={leader?.name} />
          </div>
        </section>
      )}

      <p className="rk-summary">{answerLead}</p>

      {voteRows.length > 0 && (
        <section className="rk-section" aria-label="Standings">
          <div className="rk-head">
            <h2 className="rk-title">Standings</h2>
            <span className="rk-meta">
              Updated {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>
          <ol className="rk-board">
            {voteRows.map((r, i) => {
              const n = r.count || 0;
              const share = totalVotes ? Math.round((n / totalVotes) * 100) : 0;
              return (
                <li key={r.spotId} className={`rk-row ${r.spotId === leader?.spotId ? "lead" : ""}`}>
                  <span className="rk-rank">{i + 1}</span>
                  <div>
                    {r.spotId.startsWith("user-")
                      ? <span className="rk-name">{r.name} <span className="new-place-chip">New</span></span>
                      : <Link href={pathForSpotId(r.spotId)} className="rk-name">{r.name}</Link>}
                    <div className="rk-bar"><span style={{ width: `${topCount ? (n / topCount) * 100 : 0}%` }} /></div>
                  </div>
                  <span className="rk-count"><b>{n}</b><small>{share}%</small></span>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {contenders.length > 0 && (
        <section className="rk-section" aria-label="More spots">
          <div className="rk-head">
            <h2 className="rk-title">{voteRows.length ? "Not on the board yet" : "Spots to watch"}</h2>
          </div>
          <p className="rk-lede">
            {voteRows.length
              ? "Well-loved spots with no votes this week. Think one deserves the crown? Put it on the board."
              : "Well-loved spots for this dish. Once voting opens, locals decide the order."}
          </p>
          <ul className="rk-grid">
            {contenders.map((r) => (
              <li key={r.spotId}>
                <Link href={pathForSpotId(r.spotId)} className="rk-card">
                  <span className="rk-card-name">{r.name}</span>
                  {r.blurb && <span className="rk-card-blurb">{r.blurb}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rk-section rk-faq" aria-label="FAQ">
        <h2 className="rk-title" style={{ marginBottom: 10 }}>FAQ</h2>
        <details>
          <summary>How do you rank places?</summary>
          <p>Locals vote each week in the race. The spot with the most votes holds #1, and the crown moves whenever someone overtakes it.</p>
        </details>
        <details>
          <summary>Can I vote?</summary>
          <p>Yes. Open this week&apos;s race to vote on this dish and any other open dish.</p>
        </details>
        <details>
          <summary>Is it free?</summary>
          <p>Yes. Browsing and voting are free, no paid account needed.</p>
        </details>
      </section>

      {!isPlaceholder && (
        <Link href={voteHref} className="site-cta">Vote in this week&apos;s race →</Link>
      )}
    </SiteChrome>
    <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 1300 }}>
      <BottomNav routed activeKey="rankings" />
    </div>
  </div>
  );
}
