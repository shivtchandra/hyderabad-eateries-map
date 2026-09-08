import Link from "next/link";
import EateriesApp from "../../page.jsx";
import { getLiveRanking, getAllRankingsThemes } from "../../../lib/themesServer.js";
import { SEO_THEME_PICKS, slugFromTitle } from "../../../lib/rankings.js";
import { getSiteUrl } from "../../../lib/site.js";
import { ogImages } from "../../../lib/og.js";

const siteUrl = getSiteUrl();

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  let live = null;
  try {
    live = await getLiveRanking();
  } catch {
    live = null;
  }
  const title = live
    ? `${live.title}, Vote This Week | Hyderabad Eats`
    : "This Week's Food Challenge | Hyderabad Eats";
  const description = live
    ? `Vote for ${live.title.toLowerCase()} and other open dishes on Hyderabad Eats. Each dish also has a ranking page for search traffic.`
    : "Vote across open dish challenges on Hyderabad Eats, then open each dish ranking page.";
  return {
    title,
    description,
    alternates: { canonical: "/race/this-week" },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/race/this-week`,
      images: ogImages(title, description),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImages(title, description).map((image) => image.url),
    },
  };
}

const DISH_PRIORITY = [
  "Best Biryani in Hyderabad",
  "Best Chicken Biryani in Hyderabad",
  "Best Mandi in Hyderabad",
  "Best Cafe in Hyderabad",
  "Best Irani Cafe in Hyderabad",
  "Best Shawarma in Hyderabad",
  "Best Dosa in Hyderabad",
  "Best Restaurants in Hyderabad",
  "Best Breakfast Places in Hyderabad",
  "Best Street Food in Hyderabad",
];

export default async function ThisWeekRacePage({ searchParams }) {
  const dishSlug = typeof searchParams?.dish === "string" ? searchParams.dish : null;
  let live = null;
  let themes = [];
  try {
    live = await getLiveRanking();
    themes = await getAllRankingsThemes(20);
  } catch {
    live = null;
    themes = [];
  }
  const openSlugs = new Set(
    themes
      .filter((t) => !t.winnerId)
      .map((t) => t.slug || slugFromTitle(t.title))
  );
  const picks = [
    ...DISH_PRIORITY.map((title) => SEO_THEME_PICKS.find((p) => p.title === title)).filter(Boolean),
    ...SEO_THEME_PICKS.filter((p) => !DISH_PRIORITY.includes(p.title)),
  ];

  return (
    <>
      <EateriesApp initialTab="race" initialRaceView="theme" initialDishSlug={dishSlug} />
      <nav className="seo-crawl-nav" aria-label="Hyderabad dish rankings">
        <h2>Vote by dish, then open the ranking page</h2>
        <p>
          The race above collects votes for every open dish. Each ranking page below catches search traffic for that dish and sends people back here to vote.
        </p>
        <ul>
          {picks.map((p) => {
            const slug = slugFromTitle(p.title);
            const canVote = openSlugs.has(slug) || (live && (live.slug || slugFromTitle(live.title)) === slug);
            return (
              <li key={slug}>
                {canVote ? (
                  <>
                    <Link href={`/race/this-week?dish=${slug}`}>Vote: {p.title}</Link>
                    {" · "}
                    <Link href={`/rankings/${slug}`}>Ranking page</Link>
                  </>
                ) : (
                  <Link href={`/rankings/${slug}`}>{p.title}</Link>
                )}
              </li>
            );
          })}
        </ul>
        <p>
          <Link href="/rankings">All rankings</Link>
        </p>
      </nav>
    </>
  );
}
