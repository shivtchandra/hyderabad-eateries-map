import Link from "next/link";
import { notFound } from "next/navigation";
import SiteChrome from "../../components/SiteChrome.jsx";
import { getRankingBySlug, getTopDishSummaries, qualifiedAreaRankings } from "../../../lib/themesServer.js";
import { itemListJsonLd, rankingMeta, SEO_THEME_PICKS, slugFromTitle, dishOfTitle } from "../../../lib/rankings.js";
import { breadcrumbJsonLd } from "../../../lib/schema.js";
import { getSiteUrl } from "../../../lib/site.js";
import { ogImages } from "../../../lib/og.js";
import { allCategoryPages, editorialRanking, pathForSpotId, hasSpotPhoto, getEateryById } from "../../../lib/siteData.js";
import { spotPhotoUrl } from "../../../lib/photos.js";
import ShareRankingButton from "../../components/ShareRankingButton.jsx";
import BottomNav from "../../components/BottomNav.jsx";
import SpotsMapClient from "../../components/SpotsMapClient.jsx";
import LiveRankingStandings, { LiveDebate } from "../../components/LiveRankingStandings.jsx";
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
  const hasIndexableStanding = voteRows.length > 0 || editorial.length > 0;
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
    robots: { index: hasIndexableStanding, follow: true },
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

  // Crowning after endDate does not close votes. "Live" = still the featured week card.
  const isLive = Boolean(data.active);
  const isCrowned = Boolean(data.winnerId);
  const isPlaceholder = !theme;

  // Candidate suggestions for this dish. They stay unranked until locals vote.
  const voteRows = data.results || [];
  const votedRows = voteRows.filter((r) => (r.count || 0) > 0);
  const editorial = editorialRanking(pick || { category: data.category }, params.slug, 15);

  // An ordered ItemList means an actual standing, so emit it only for votes.
  const jsonLd = votedRows.length > 0
    ? itemListJsonLd({ ...data, results: votedRows }, getSiteUrl(), pathForSpotId)
    : null;
  const qualifyingAreas = theme ? qualifiedAreaRankings([theme]).slice(0, 8) : [];

  const related = [
    { href: "/rankings", label: "All rankings" },
    { href: `/?tab=race&dish=${params.slug}`, label: "Cast your vote" },
    ...qualifyingAreas.map((area) => ({
      href: `/rankings/${params.slug}/in/${area.areaSlug}`,
      label: `${dishOfTitle(data.title) || data.title} in ${area.area}`,
    })),
    ...SEO_THEME_PICKS.filter((p) => slugFromTitle(p.title) !== params.slug).slice(0, 4).map((p) => ({
      href: `/rankings/${slugFromTitle(p.title)}`,
      label: p.title,
    })),
    ...allCategoryPages().slice(0, 2).map((c) => ({ href: `/explore/${c.slug}`, label: c.label })),
  ];

  const topNames = (votedRows.length ? votedRows : editorial).slice(0, 3).map((r) => r.name).filter(Boolean);
  const answerLead = votedRows.length && topNames.length
    ? `Current community leaders for ${data.title.toLowerCase()} include ${topNames.join(", ")}.`
    : topNames.length
      ? `Suggested ballot candidates for ${data.title.toLowerCase()} include ${topNames.join(", ")}. They are unranked until locals vote.`
      : `${data.title} on Hyderabad Eats uses a continuing all-time preference and a new local vote each calendar month.`;
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `What is the ${data.title.toLowerCase()} right now?`,
        acceptedAnswer: { "@type": "Answer", text: `${answerLead} ${votedRows.length ? "See the live standings" : "Cast the first vote"} on Hyderabad Eats.` },
      },
      {
        "@type": "Question",
        name: "How does Hyderabad Eats rank places?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Locals keep one all-time preference and can vote again each Hyderabad calendar month. The page shows the continuing all-time board, the current month, and month-over-month movement.",
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
  const voted = votedRows;
  const leader = voted.find((r) => r.spotId === data.winnerId) || voted[0] || null;
  const onBoard = new Set(voted.map((r) => r.spotId));
  const contenders = [
    ...voteRows.filter((r) => !onBoard.has(r.spotId)),
    ...editorial.filter((r) => !voteRows.some((v) => v.spotId === r.spotId)),
  ].slice(0, 12);
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
        <LiveDebate slug={params.slug} initialCounts={voted.map((r) => r.count || 0)} isPlaceholder={isPlaceholder} />
      </p>
    </div>
  );
  const photoOf = (id) => (id && !id.startsWith("user-") && hasSpotPhoto(id) ? spotPhotoUrl(id) : null);
  const topDishes = await getTopDishSummaries(voted.slice(0, 12).map((row) => row.spotId));
  // Client-side redraws cannot read venue data, so pass stable links, photos and
  // the bounded must-order summary with the initial HTML.
  const spotMeta = Object.fromEntries([...voteRows, ...contenders].map((r) => [r.spotId, {
    href: pathForSpotId(r.spotId),
    photo: photoOf(r.spotId),
    topDish: topDishes[r.spotId] || null,
  }]));

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
      <LiveRankingStandings
        slug={params.slug}
        initialResults={voteRows.map(({ spotId, name, count }) => ({ spotId, name, count }))}
        initialCurrentResults={data.currentPeriodResults || []}
        initialPreviousResults={data.previousPeriodResults || []}
        initialCurrentPeriod={data.currentPeriod || ""}
        initialPreviousPeriod={data.previousPeriod || ""}
        initialInsights={data.insights || null}
        initialWinnerId={data.winnerId || null}
        initialContenders={contenders.map(({ spotId, name }) => ({ spotId, name }))}
        meta={spotMeta}
        voteHref={voteHref}
        isPlaceholder={isPlaceholder}
      />

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
          <p>Your latest preference counts on the all-time board. A separate Hyderabad calendar-month board shows current participation and movement from the previous month.</p>
        </details>
        <details>
          <summary>Can I vote?</summary>
          <p>Yes. Every published ranking remains open, and you can participate again when a new calendar month begins.</p>
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
