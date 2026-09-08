import Link from "next/link";
import EateriesApp from "../../page.jsx";
import { getLiveRanking } from "../../../lib/themesServer.js";
import { slugFromTitle } from "../../../lib/rankings.js";
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
    ? `Vote for ${live.title.toLowerCase()} on Hyderabad Eats. Previous weeks stay open too.`
    : "Vote in this week's Hyderabad food challenge.";
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

export default async function ThisWeekRacePage({ searchParams }) {
  const dishSlug = typeof searchParams?.dish === "string" ? searchParams.dish : null;
  let live = null;
  try {
    live = await getLiveRanking();
  } catch {
    live = null;
  }
  const liveSlug = live?.slug || (live?.title ? slugFromTitle(live.title) : null);

  return (
    <>
      <EateriesApp initialTab="race" initialRaceView="theme" initialDishSlug={dishSlug} />
      <nav className="seo-crawl-nav" aria-label="This week's food race">
        <h2>{live ? live.title : "This week's food race"}</h2>
        <p>Vote above for this week&apos;s dish. Earlier weeks stay open under Previous weeks.</p>
        <ul>
          {liveSlug && (
            <li>
              <Link href={`/rankings/${liveSlug}`}>{live.title} ranking</Link>
            </li>
          )}
          <li><Link href="/rankings">All rankings</Link></li>
          <li><Link href="/rankings/best-biryani-in-hyderabad">Best biryani in Hyderabad</Link></li>
          <li><Link href="/rankings/best-mandi-in-hyderabad">Best mandi in Hyderabad</Link></li>
          <li><Link href="/rankings/best-cafe-in-hyderabad">Best cafe in Hyderabad</Link></li>
        </ul>
      </nav>
    </>
  );
}
