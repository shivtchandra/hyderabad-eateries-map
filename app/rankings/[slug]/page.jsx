import Link from "next/link";
import { notFound } from "next/navigation";
import SiteChrome from "../../components/SiteChrome.jsx";
import { getRankingBySlug, getTopDishSummaries, qualifiedAreaRankings } from "../../../lib/themesServer.js";
import { itemListJsonLd, rankingAnswer, rankingMeta, SEO_THEME_PICKS, slugFromTitle, dishOfTitle } from "../../../lib/rankings.js";
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
import { todayIso } from "../../../lib/hubSeo.js";
import { getInspectionDrives, getInspectionsForSpot, ACTIONS } from "../../../lib/inspectionsServer.js";

const dayLabel = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

// The checkable numbers behind a ranking: vote totals and the TG SAFE
// inspection records linked to the top voted places.
async function rankingStats(votedRows, topN = 10) {
  const sorted = [...votedRows].sort((a, b) => (b.count || 0) - (a.count || 0));
  const total = sorted.reduce((sum, r) => sum + (r.count || 0), 0);
  const top = sorted.slice(0, topN);
  const drives = await getInspectionDrives().catch(() => []);
  const dates = drives.map((d) => d.date).filter(Boolean).sort();
  const records = [];
  for (const r of top) {
    const hits = await getInspectionsForSpot(r.spotId).catch(() => []);
    if (hits.length) {
      const { drive, entry } = hits[0];
      records.push({ name: r.name, action: ACTIONS[entry.action] || entry.action || "Inspected", date: drive.date });
    }
  }
  return {
    total,
    places: sorted.length,
    leader: sorted[0] || null,
    leaderShare: total && sorted[0] ? Math.round((sorted[0].count / total) * 100) : 0,
    checked: top.length,
    drives: drives.length,
    driveRange: dates.length ? `${dayLabel(dates[0])} to ${dayLabel(dates[dates.length - 1])}` : "",
    records,
  };
}

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
  const updated = todayIso();
  const answerLead = rankingAnswer(data, editorial);
  const stats = votedRows.length ? await rankingStats(votedRows) : null;
  const safetyAnswer = stats && stats.drives
    ? stats.records.length
      ? `${stats.records.length} of the top ${stats.checked} voted places ${stats.records.length === 1 ? "has" : "have"} a linked TG SAFE inspection record: ${stats.records.map((r) => `${r.name} (${r.action.toLowerCase()}, ${dayLabel(r.date)})`).join("; ")}. Checked against ${stats.drives} TG SAFE drives from ${stats.driveRange}.`
      : `None of the top ${stats.checked} voted places has a linked record in the ${stats.drives} TG SAFE inspection drives we track (${stats.driveRange}).`
    : "";

  // Prefer real standings, while keeping pre-vote pages useful to search engines.
  const jsonLd = votedRows.length > 0
    ? itemListJsonLd({ ...data, results: votedRows }, getSiteUrl(), pathForSpotId, updated)
    : editorial.length
      ? itemListJsonLd({ ...data, results: editorial }, getSiteUrl(), pathForSpotId, updated)
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

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `Who is #1 for ${data.title.replace(/^Best\s+/i, "").replace(/\s+in\s+Hyderabad$/i, "").toLowerCase()} in Hyderabad right now?`,
        acceptedAnswer: { "@type": "Answer", text: `${answerLead} See the full ranked list and vote on Hyderabad Eats.` },
      },
      ...(stats ? [{
        "@type": "Question",
        name: "How many locals have voted in this ranking?",
        acceptedAnswer: { "@type": "Answer", text: `${stats.total} local votes across ${stats.places} places as of ${updated}. ${stats.leader.name} leads with ${stats.leader.count} votes (${stats.leaderShare}% of all votes).` },
      }] : []),
      ...(safetyAnswer ? [{
        "@type": "Question",
        name: "Have any of the top places had a food safety inspection?",
        acceptedAnswer: { "@type": "Answer", text: safetyAnswer },
      }] : []),
      {
        "@type": "Question",
        name: "How does Hyderabad Eats rank places?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Locals keep one all-time preference and can vote again each Hyderabad calendar week and month. The page shows freshness-weighted all-time, current-week, and current-month boards with their exact date periods.",
        },
      },
      {
        "@type": "Question",
        name: "Is this ranking free to use?",
        acceptedAnswer: { "@type": "Answer", text: "Yes. Rankings and the food map are free, with no signup required to browse." },
      },
      {
        "@type": "Question",
        name: "How current is this Hyderabad ranking?",
        acceptedAnswer: { "@type": "Answer", text: `This page was refreshed on ${updated}. Votes remain open, and the weekly and monthly tabs show recent choices.` },
      },
    ],
  };

  const breadcrumbsLd = breadcrumbJsonLd([
    { name: "Home", url: getSiteUrl() },
    { name: "Rankings", url: `${getSiteUrl()}/rankings` },
    { name: data.title, url: `${getSiteUrl()}/rankings/${params.slug}` },
  ]);

  const voteHref = `/?tab=race&dish=${params.slug}`; // in-app Vote tab, This week
  const contestDate = (value) => value ? new Date(`${value}T12:00:00`).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata",
  }) : "";
  const contestRange = data.startDate && data.endDate
    ? `${contestDate(data.startDate)}–${contestDate(data.endDate)}`
    : data.startDate ? `From ${contestDate(data.startDate)}` : "";
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
      {contestRange && (
        <p className="rk-contest-range"><b>Featured vote</b>{contestRange}</p>
      )}
      <LiveRankingStandings
        slug={params.slug}
        initialResults={voteRows.map(({ spotId, name, count }) => ({ spotId, name, count }))}
        initialCurrentResults={data.currentPeriodResults || []}
        initialPreviousResults={data.previousPeriodResults || []}
        initialCurrentWeekResults={data.currentWeekResults || []}
        initialPreviousWeekResults={data.previousWeekResults || []}
        initialCurrentPeriod={data.currentPeriod || ""}
        initialPreviousPeriod={data.previousPeriod || ""}
        initialCurrentWeek={data.currentWeek || ""}
        initialPreviousWeek={data.previousWeek || ""}
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

      {stats && (
        <section className="rk-section" aria-label="By the numbers">
          <h2 className="rk-title">By the numbers</h2>
          <dl className="rk-stats">
            <div><dt>Local votes</dt><dd>{stats.total}</dd></div>
            <div><dt>Places with votes</dt><dd>{stats.places}</dd></div>
            <div><dt>#1 share</dt><dd>{stats.leaderShare}%</dd></div>
          </dl>
          {safetyAnswer && <p className="rk-method"><b>Food safety.</b> {safetyAnswer}</p>}
          <p className="rk-method">
            Counts are votes cast by Hyderabad locals on this page, as of {dayLabel(updated)}. Inspection records come from
            TG SAFE (Commissioner of Food Safety, Telangana) drive reports and are linked to a spot only when name and branch both match.
          </p>
        </section>
      )}

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
          <p>Your latest preference counts on the all-time board, where older votes gradually carry less weight. Separate Hyderabad week and calendar-month boards show what locals are choosing recently.</p>
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
