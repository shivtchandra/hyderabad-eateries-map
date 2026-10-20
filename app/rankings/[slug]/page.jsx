import Link from "next/link";
import { notFound } from "next/navigation";
import SiteChrome from "../../components/SiteChrome.jsx";
import { getRankingBySlug } from "../../../lib/themesServer.js";
import { itemListJsonLd, rankingMeta, SEO_THEME_PICKS, slugFromTitle, dishOfTitle, debateLineFromCounts } from "../../../lib/rankings.js";
import { breadcrumbJsonLd } from "../../../lib/schema.js";
import { getSiteUrl } from "../../../lib/site.js";
import { ogImages } from "../../../lib/og.js";
import { allCategoryPages, editorialRanking, pathForSpotId, hasSpotPhoto, getEateryById } from "../../../lib/siteData.js";
import { spotPhotoUrl } from "../../../lib/photos.js";
import ShareRankingButton from "../../components/ShareRankingButton.jsx";
import BottomNav from "../../components/BottomNav.jsx";
import SpotsMapClient from "../../components/SpotsMapClient.jsx";
import { stickerForTitle } from "../../../lib/stickerArt.js";

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

  const voteRows = (fake.results || []).filter((r) => (r.count || 0) > 0);
  // Ranking shares use the branded ranking card, not a photo from one venue.
  const shareImages = ogImages(meta.title, meta.description, path);

  return {
    title: meta.title,
    description: meta.description,
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: `${getSiteUrl()}${path}`,
      type: "article",
      images: shareImages,
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
      images: shareImages.map((image) => image.url),
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
    { href: `/?tab=race&dish=${params.slug}`, label: "Vote this week" },
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

  const voteHref = `/?tab=race&dish=${params.slug}`; // in-app Vote tab, This week
  // Standings: only real votes count. #1 is the crowned spot, else the leader.
  const voted = voteRows.filter((r) => (r.count || 0) > 0);
  const leader = voted.find((r) => r.spotId === data.winnerId) || voted[0] || null;
  const rest = voted.filter((r) => r !== leader);
  const onBoard = new Set(voted.map((r) => r.spotId));
  const contenders = [
    ...voteRows.filter((r) => !onBoard.has(r.spotId)),
    ...editorial.filter((r) => !voteRows.some((v) => v.spotId === r.spotId)),
  ].slice(0, 12);
  const runnerUp = rest[0] || null;
  const leadLine = !leader ? "" : !runnerUp
    ? "The only spot with votes so far"
    : leader.count > runnerUp.count ? `${leader.count - runnerUp.count} ahead of ${runnerUp.name}` : `Tied with ${runnerUp.name}`;
  // The ranking as a map: voted spots numbered, shortlisted ones as grey dots.
  const mapPoints = [
    ...contenders.map((r) => {
      const e = getEateryById(r.spotId);
      return e?.lat != null ? { kind: "spot", lat: e.lat, lng: e.lng, tone: "#a8a29e", title: r.name || e.name, sub: "On the ballot, no votes yet", href: pathForSpotId(r.spotId) } : null;
    }),
    ...voted.map((r, i) => {
      const e = getEateryById(r.spotId);
      return e?.lat != null ? { kind: "rank", lat: e.lat, lng: e.lng, label: `#${i + 1}`, title: `#${i + 1} ${r.name}`, sub: `${r.count} ${r.count === 1 ? "vote" : "votes"}`, href: pathForSpotId(r.spotId) } : null;
    }),
  ].filter(Boolean);

  // The mockup (canvas VoteAfter): the question as the headline, the debate
  // line, a yellow #1 ticket, then photo rows with a Vote button each.
  const dish = dishOfTitle(data.title);
  const endLabel = data.endDate ? new Date(`${data.endDate}T12:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }) : null;
  const sticker = stickerForTitle(data.title);
  const hero = (
    <div className="rk-hero">
      {sticker && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="rk-sticker" src={sticker} alt="" width={120} height={120} />
      )}
      <p className="rk-kicker">
        {isPlaceholder ? <span className="ink-chip">Opening soon</span>
          : isCrowned ? <><span className="ink-chip">Crowned</span>{isLive ? " Votes still open" : ""}</>
          : isLive ? <><span className="live-dot" aria-hidden="true" />Live vote{endLabel ? ` · ends ${endLabel}` : ""}</>
          : "Final standings"}
      </p>
      <h1 className="rk-q">
        {dish ? <>Hyderabad&rsquo;s best <mark className="hl">{dish}</mark>?</> : highlightDish(data.title)}
      </h1>
      <p className="rk-debate">
        {isPlaceholder ? "Voting opens soon. Until then, here are the spots locals already rate." : debateLineFromCounts(voted.map((r) => r.count || 0))}
      </p>
    </div>
  );
  const photoOf = (id) => (id && !id.startsWith("user-") && hasSpotPhoto(id) ? spotPhotoUrl(id) : null);
  const nameOf = (r) => (r.spotId.startsWith("user-")
    ? <span className="rk-nm">{r.name} <span className="new-place-chip">New</span></span>
    : <Link href={pathForSpotId(r.spotId)} className="rk-nm">{r.name}</Link>);
  const Row = ({ r, n, line, cta }) => (
    <li className="rk-row2">
      <span className={`rk-n${n ? "" : " rk-n--open"}`} aria-hidden={!n}>{n || "?"}</span>
      {photoOf(r.spotId)
        // eslint-disable-next-line @next/next/no-img-element
        ? <img className="rk-ph" src={photoOf(r.spotId)} alt="" loading="lazy" width={60} height={60} />
        : <span className="rk-ph rk-ph--empty" aria-hidden="true">{(r.name || "?").charAt(0)}</span>}
      <span className="rk-txt">{nameOf(r)}<span className="rk-v">{line}</span></span>
      {!isPlaceholder && <Link href={voteHref} className="rk-vote">{cta}</Link>}
    </li>
  );

  return (
  <div style={{ paddingBottom: 84 }}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsLd) }} />
    {jsonLd && (
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    )}
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
    <SiteChrome
      active="/rankings"
      backFallback="/rankings"
      breadcrumb={[{ href: "/", label: "Home" }, { href: "/rankings", label: "Rankings" }, { href: `/rankings/${params.slug}`, label: data.title }]}
      title={data.title}
      hero={hero}
      related={related}
    >
      {leader && (
        <Link href={leader.spotId.startsWith("user-") ? voteHref : pathForSpotId(leader.spotId)} className="ticket rk-ticket">
          {photoOf(leader.spotId) && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="ticket-photo" src={photoOf(leader.spotId)} alt="" width={72} height={72} />
          )}
          <span className="ticket-body">
            <span className="ticket-kicker"><span className="ring">#1</span> · {isCrowned ? "Winner" : "Leading"}</span>
            <span className="ticket-name">{leader.name}</span>
            <span className="ticket-line">{leader.count} of {totalVotes} votes · {leadLine}</span>
          </span>
          <span className="ticket-arrow" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M9 7h8v8" /></svg>
          </span>
        </Link>
      )}

      {rest.length > 0 && (
        <section className="rk-section" aria-label="Standings">
          <ol className="rk-rows">
            {rest.map((r, i) => {
              const above = i === 0 ? leader : rest[i - 1];
              const need = (above?.count || 0) - (r.count || 0) + 1;
              return <Row key={r.spotId} r={r} n={i + 2} cta="Vote"
                line={`${r.count} ${r.count === 1 ? "vote" : "votes"} · ${need} to pass #${i + 1}`} />;
            })}
          </ol>
        </section>
      )}
      {!isPlaceholder && (
        <Link href={voteHref} className="rk-action rk-action--add">
          <span className="rk-action-tile" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          </span>
          <span className="rk-action-text"><b>Can&rsquo;t see your pick?</b><span>Add it to the ballot</span></span>
        </Link>
      )}

      {/* Unvoted spots are not standings: their own compact list, apart from the ranked one. */}
      {contenders.length > 0 && (
        <section className="rk-section rk-ballot" aria-label={isPlaceholder ? "Spots locals rate" : "On the ballot, no votes yet"}>
          <h2 className="rk-title">{isPlaceholder ? "Spots locals rate" : "On the ballot, no votes yet"}</h2>
          {!isPlaceholder && <p className="rk-lede">One vote puts any of these on the board.</p>}
          <ul className="rk-ballot-grid">
            {contenders.map((r) => (
              <li key={r.spotId}>
                <Link href={pathForSpotId(r.spotId)} className="rk-ballot-card">
                  {photoOf(r.spotId)
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={photoOf(r.spotId)} alt="" loading="lazy" width={44} height={44} />
                    : <span className="rk-ballot-empty" aria-hidden="true">{(r.name || "?").charAt(0)}</span>}
                  <span>{r.name}</span>
                </Link>
              </li>
            ))}
          </ul>
          {!isPlaceholder && (
            <Link href={voteHref} className="rk-action">
              <span className="rk-action-text"><b>Vote for one of these</b><span>Put it on the board</span></span>
              <span className="rk-action-tile rk-action-tile--go" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </span>
            </Link>
          )}
        </section>
      )}

      <div className="rk-share-row">
        {!isPlaceholder && <Link href={voteHref} className="site-cta" style={{ margin: 0 }}>{leader ? "Cast your vote" : "Vote for this dish"}</Link>}
        <ShareRankingButton title={data.title} slug={params.slug} leaderName={leader?.name || null} />
      </div>

      {mapPoints.length > 1 && (
        <section id="map" className="rk-section" aria-label="On the map">
          <h2 className="rk-title">On the map</h2>
          <SpotsMapClient points={mapPoints} height={320} />
        </section>
      )}

      <section className="rk-section rk-faq" aria-label="About this ranking">
        <h2 className="rk-title" style={{ marginBottom: 10 }}>About this ranking</h2>
        <p className="rk-summary">{answerLead}</p>
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
    </SiteChrome>
    <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 1300 }}>
      <BottomNav routed activeKey="rankings" />
    </div>
  </div>
  );
}

// "Best Biryani in Hyderabad": the dish gets the yellow highlighter, the mark
// for what locals vote on (same as the Vote tab's question).
function highlightDish(title = "") {
  const m = title.match(/^(best )(.+?)( in hyderabad)$/i);
  return m ? <>{m[1]}<mark className="hl">{m[2]}</mark>{m[3]}</> : title;
}
