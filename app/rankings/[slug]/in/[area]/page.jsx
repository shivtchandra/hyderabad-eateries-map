import Link from "next/link";
import { notFound } from "next/navigation";
import SiteChrome from "../../../../components/SiteChrome.jsx";
import BottomNav from "../../../../components/BottomNav.jsx";
import LiveRankingStandings from "../../../../components/LiveRankingStandings.jsx";
import ShareRankingButton from "../../../../components/ShareRankingButton.jsx";
import {
  getAllRankingsThemes,
  getAreaRanking,
  getTopDishSummaries,
  qualifiedAreaRankings,
} from "../../../../../lib/themesServer.js";
import { itemListJsonLd, dishOfTitle } from "../../../../../lib/rankings.js";
import { allAreaPages, getEateryById, hasSpotPhoto, pathForSpotId } from "../../../../../lib/siteData.js";
import { breadcrumbJsonLd } from "../../../../../lib/schema.js";
import { getSiteUrl, pageMeta } from "../../../../../lib/site.js";
import { ogImages } from "../../../../../lib/og.js";
import { spotPhotoUrl } from "../../../../../lib/photos.js";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  if (process.env.HYD_STATIC_EXPORT !== "1") return [];
  const themes = await getAllRankingsThemes(100).catch(() => []);
  const slugs = new Set(themes.map((theme) => theme.slug).filter(Boolean));
  return [...slugs].flatMap((slug) => allAreaPages().map((area) => ({ slug, area: area.slug })));
}

export async function generateMetadata({ params }) {
  const ranking = await getAreaRanking(params.slug, params.area).catch(() => null);
  if (!ranking) return { title: "Ranking not found, Hyderabad Eats" };
  const { theme, area, qualification } = ranking;
  const subject = dishOfTitle(theme.title) || theme.title.replace(/\s+in\s+hyderabad$/i, "");
  const title = `Best ${subject.replace(/^best\s+/i, "")} in ${area.name}: Local Votes`;
  const description = qualification.totalVotes
    ? `${theme.results[0]?.name || "Local places"} leads ${subject.toLowerCase()} in ${area.name}, based on ${qualification.totalVotes} Mapping HYD community votes. See standings, what to order, and vote.`
    : `Community ballot for ${subject.toLowerCase()} in ${area.name}. Standings appear only after locals vote.`;
  const path = `/rankings/${params.slug}/in/${params.area}`;
  return {
    ...pageMeta({ title, description, path }),
    openGraph: { ...pageMeta({ title, description, path }).openGraph, images: ogImages(title, description, path) },
    alternates: { canonical: `${getSiteUrl()}${path}` },
    robots: { index: qualification.indexable, follow: true },
  };
}

export default async function AreaRankingPage({ params }) {
  const ranking = await getAreaRanking(params.slug, params.area).catch(() => null);
  if (!ranking) notFound();

  const { theme, area, qualification } = ranking;
  const voted = theme.results.filter((row) => (row.count || 0) > 0);
  const leader = voted[0] || null;
  const subject = dishOfTitle(theme.title) || theme.title.replace(/\s+in\s+hyderabad$/i, "");
  const pageTitle = `Best ${subject.replace(/^best\s+/i, "")} in ${area.name}`;
  const path = `/rankings/${params.slug}/in/${params.area}`;
  const voteHref = `/?tab=race&dish=${params.slug}`;
  const jsonLd = voted.length
    ? itemListJsonLd({ ...theme, title: pageTitle, results: voted }, getSiteUrl(), pathForSpotId)
    : null;
  const breadcrumbsLd = breadcrumbJsonLd([
    { name: "Home", url: getSiteUrl() },
    { name: "Rankings", url: `${getSiteUrl()}/rankings` },
    { name: theme.title, url: `${getSiteUrl()}/rankings/${params.slug}` },
    { name: area.name, url: `${getSiteUrl()}${path}` },
  ]);

  const topDishes = await getTopDishSummaries(voted.slice(0, 12).map((row) => row.spotId));
  const meta = Object.fromEntries(theme.results.map((row) => {
    const spot = getEateryById(row.spotId);
    return [row.spotId, {
      href: pathForSpotId(row.spotId),
      photo: spot && hasSpotPhoto(row.spotId) ? spotPhotoUrl(row.spotId) : null,
      topDish: topDishes[row.spotId] || null,
    }];
  }));
  const contenders = theme.results.filter((row) => (row.count || 0) === 0).slice(0, 12);
  const answer = leader
    ? `${leader.name} currently leads ${subject.toLowerCase()} in ${area.name} with ${leader.count} of ${qualification.totalVotes} area votes. The order comes only from Mapping HYD community votes.`
    : `No venue has a vote for ${subject.toLowerCase()} in ${area.name} yet. Eligible local candidates are shown without a ranking.`;

  return (
    <div style={{ paddingBottom: 84 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsLd) }} />
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}
      <SiteChrome
        active="/rankings"
        backFallback={`/rankings/${params.slug}`}
        breadcrumb={[
          { href: "/", label: "Home" },
          { href: "/rankings", label: "Rankings" },
          { href: `/rankings/${params.slug}`, label: theme.title },
          { href: path, label: area.name },
        ]}
        title={pageTitle}
        description={answer}
        related={[
          { href: `/rankings/${params.slug}`, label: `All Hyderabad ${subject}` },
          { href: `/areas/${area.slug}`, label: `Food in ${area.name}` },
          ...qualifiedAreaRankings([theme]).filter((item) => item.areaSlug !== area.slug).slice(0, 5).map((item) => ({
            href: `/rankings/${params.slug}/in/${item.areaSlug}`,
            label: item.area,
          })),
        ]}
      >
        <LiveRankingStandings
          slug={params.slug}
          areaSlug={area.slug}
          initialResults={theme.results}
          initialCurrentResults={theme.currentPeriodResults || []}
          initialPreviousResults={theme.previousPeriodResults || []}
          initialCurrentPeriod={theme.currentPeriod || ""}
          initialPreviousPeriod={theme.previousPeriod || ""}
          initialInsights={theme.insights || null}
          initialWinnerId={theme.winnerId || null}
          initialContenders={contenders}
          meta={meta}
          voteHref={voteHref}
        />

        <div className="rk-share-row">
          <Link href={voteHref} className="site-cta" style={{ margin: 0 }}>Cast your vote</Link>
          <ShareRankingButton title={pageTitle} slug={params.slug} leaderName={leader?.name || null} />
        </div>

        <section className="rk-section">
          <h2 className="rk-title">How this area ranking works</h2>
          <p className="rk-summary">This view filters the Hyderabad-wide ballot to exact branches mapped in {area.name}. It becomes indexable only after five eligible candidates, three voted venues, ten area votes, and three votes for the leader. Monthly views never erase the continuing all-time result.</p>
        </section>
      </SiteChrome>
      <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 1300 }}>
        <BottomNav routed activeKey="rankings" />
      </div>
    </div>
  );
}
