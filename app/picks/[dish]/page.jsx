import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import DishGuide from "../../components/DishGuide.jsx";
import SiteChrome from "../../components/SiteChrome.jsx";
import { getRecommendations } from "../../../lib/recommendations.js";
import { recommendationsEnabled } from "../../../lib/recommendationShared.js";
import { dishView } from "../../../lib/dishPageView.js";
import { getRankingBySlug } from "../../../lib/themesServer.js";
import { editorialRanking, pathForSpotId } from "../../../lib/siteData.js";
import { breadcrumbJsonLd } from "../../../lib/schema.js";
import { itemListJsonLd } from "../../../lib/rankings.js";
import { getSiteUrl, pageMeta } from "../../../lib/site.js";
import { dishDestination } from "../../../lib/dishDestinations.js";

const BIRYANI_SLUG = "best-biryani-in-hyderabad";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  const enabled = recommendationsEnabled() ? getRecommendations().dishes.map((d) => ({ dish: d.id })) : [];
  return [{ dish: "biryani" }, ...enabled.filter((entry) => entry.dish !== "biryani")];
}

export async function generateMetadata({ params }) {
  if (params.dish === "biryani") {
    return pageMeta({
      title: "Best Biryani in Hyderabad (2026): Local Votes",
      description: "Hyderabad biryani places ordered only by Mapping HYD community votes. See live standings, unranked ballot candidates and vote for your favourite.",
      path: "/picks/biryani",
    });
  }
  const v = recommendationsEnabled() && dishView(params.dish);
  return v ? pageMeta({ title: v.title, description: v.answer, path: `/picks/${v.dish.id}` }) : { title: "Dish guide not found", robots: { index: false } };
}

async function BiryaniOpportunityPage() {
  const theme = await getRankingBySlug(BIRYANI_SLUG).catch(() => null);
  const voted = [...(theme?.results || [])]
    .filter((row) => (row.count || 0) > 0)
    .sort((a, b) => (b.count || 0) - (a.count || 0));
  const votedIds = new Set(voted.map((row) => row.spotId));
  const candidates = editorialRanking({ title: "Best Biryani in Hyderabad", category: "local" }, BIRYANI_SLUG, 12)
    .filter((row) => !votedIds.has(row.spotId));
  const top = voted.slice(0, 3);
  const answer = top.length
    ? `${top.map((row, index) => `${index + 1}. ${row.name} (${row.count} ${row.count === 1 ? "vote" : "votes"})`).join(", ")} lead Mapping HYD's live Hyderabad biryani vote. Google stars and review volume do not determine this order.`
    : "There is no verified biryani standing yet. The places below are unranked ballot candidates; the first Mapping HYD community votes will create the order.";
  const site = getSiteUrl();
  const schema = [
    { "@context": "https://schema.org", "@type": "Article", headline: "Best Biryani in Hyderabad, ranked by local votes", description: answer, author: { "@type": "Organization", name: "Mapping HYD" }, publisher: { "@type": "Organization", name: "Mapping HYD" }, mainEntityOfPage: `${site}/picks/biryani` },
    breadcrumbJsonLd([{ name: "Map", url: site }, { name: "Biryani", url: `${site}/picks/biryani` }]),
    ...(voted.length ? [itemListJsonLd({ title: "Best Biryani in Hyderabad", results: voted }, site, pathForSpotId)] : []),
  ];

  return <SiteChrome title="Best biryani in Hyderabad, ranked by local votes" description="A transparent live standing from Mapping HYD votes. Google ratings are shown only on venue pages and never decide this order." breadcrumb={[{ href: "/", label: "Map" }, { href: "/picks/biryani", label: "Biryani" }]}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
    <div className="ask-page">
      <section className="ask-answer" aria-label="Short answer"><span className="ask-label">Current answer</span><p>{answer}</p></section>
      <section className="ask-block">
        <h2>{voted.length ? "Live community standings" : "No ranking yet"}</h2>
        {voted.length ? <ol className="ask-ranked">{voted.map((row, index) => <li key={row.spotId}>
          <div><b>#{index + 1} {row.name}</b><span>{row.count} Mapping HYD {row.count === 1 ? "vote" : "votes"}</span></div>
          <Link href={pathForSpotId(row.spotId)}>Open place →</Link>
        </li>)}</ol> : <p>A numbered list will appear only after real votes exist.</p>}
        <p><Link href="/rankings/best-biryani-in-hyderabad" className="site-cta">View ballot and vote</Link></p>
      </section>
      {candidates.length > 0 && <section className="ask-block">
        <h2>On the ballot, not ranked</h2>
        <p>These are suggestions, shown without numbers. Their order is editorial discovery, not a community result.</p>
        <ul className="ask-related">{candidates.map((row) => <li key={row.spotId}><Link href={pathForSpotId(row.spotId)}>{row.name}{row.area ? ` · ${row.area}` : ""}</Link></li>)}</ul>
      </section>}
      <section className="ask-block"><h2>How this page works</h2><p>Only Mapping HYD community votes create the numbered standing. Google ratings, Google review counts, editorial stories and Reddit mentions do not add votes. Candidates remain unranked until somebody votes.</p></section>
      <section className="ask-block"><h2>Explore other biryani views</h2><ul className="ask-related">
        <li><Link href="/rankings/best-biryani-in-hyderabad">Live ballot and complete voting interface</Link></li>
        <li><Link href="/guides/best-biryani-hyderabad-reddit">Editorial guide to Hyderabad biryani discussions</Link></li>
        <li><Link href="/explore/biryani-and-local">Biryani and local-food map</Link></li>
      </ul></section>
    </div>
  </SiteChrome>;
}

export default async function DishPage({ params }) {
  permanentRedirect(dishDestination(params.dish));
  if (!recommendationsEnabled()) notFound();
  const v = dishView(params.dish);
  if (!v) notFound();
  return <DishGuide v={v} path={`/picks/${v.dish.id}`} />;
}
