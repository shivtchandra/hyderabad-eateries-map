import Link from "next/link";
import EateriesApp from "../../page.jsx";
import { getAllRankingsThemes } from "../../../lib/themesServer.js";
import { dedupeThemesBySlug, itemListJsonLd, SEO_THEME_PICKS, slugFromTitle } from "../../../lib/rankings.js";
import { editorialRanking, pathForSpotId, hasSpotPhoto } from "../../../lib/siteData.js";
import { spotPhotoUrl } from "../../../lib/photos.js";
import { getSiteUrl } from "../../../lib/site.js";
import { ogImages } from "../../../lib/og.js";

const siteUrl = getSiteUrl();

export const dynamic = "force-dynamic";

function pickFor(slug, title) {
  return (
    SEO_THEME_PICKS.find((p) => slugFromTitle(p.title) === slug) ||
    SEO_THEME_PICKS.find((p) => p.title === title) ||
    null
  );
}

export async function generateMetadata() {
  let live = null;
  try {
    const themes = await getAllRankingsThemes(10);
    live = themes.find((t) => t.active) || null;
  } catch {
    live = null;
  }
  const title = live
    ? `Vote: ${live.title}`
    : "This Week's Food Challenge";
  const description = live
    ? `Vote for ${live.title.toLowerCase()} on Hyderabad Eats. Previous weeks stay open too.`
    : "Vote in this week's Hyderabad food challenge.";

  let photoUrl = null;
  let photoSpotName = null;
  if (live) {
    const liveSlug = live.slug || slugFromTitle(live.title);
    const pick = pickFor(liveSlug, live.title);
    const voteRows = (live.results || []).filter((r) => (r.count || 0) > 0);
    const leader = live.winnerId
      ? (live.results || []).find((r) => r.spotId === live.winnerId)
      : voteRows[0] || null;
    const editorial = editorialRanking(pick || { category: live.category }, liveSlug, 5);

    const candidateIds = [
      leader?.spotId,
      ...voteRows.map((r) => r.spotId),
      ...editorial.map((r) => r.spotId),
      ...(live.results || []).map((r) => r.spotId),
    ].filter(Boolean);

    for (const cid of candidateIds) {
      if (hasSpotPhoto(cid)) {
        photoUrl = spotPhotoUrl(cid);
        photoSpotName = leader?.name || null;
        break;
      }
    }
  }

  const ogImagesList = photoUrl
    ? [{ url: photoUrl, width: 800, height: 600, alt: `${photoSpotName || title} | Hyderabad Eats`, type: "image/jpeg" }]
    : ogImages(title, description, "/race/this-week");

  return {
    title,
    description,
    alternates: { canonical: "/race/this-week" },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/race/this-week`,
      images: ogImagesList,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: photoUrl ? [photoUrl] : ogImages(title, description, "/race/this-week").map((image) => image.url),
    },
  };
}

export default async function ThisWeekRacePage() {

  let themes = [];
  try {
    themes = await getAllRankingsThemes(12);
  } catch {
    themes = [];
  }

  const live = themes.find((t) => t.active) || null;
  const past = dedupeThemesBySlug(themes.filter((t) => !t.active)).slice(0, 6);
  const liveSlug = live?.slug || (live?.title ? slugFromTitle(live.title) : null);
  const pick = liveSlug ? pickFor(liveSlug, live?.title) : null;

  // Prefer real votes with count > 0 for ItemList; else Google baseline so the
  // URL still indexes named restaurants even before the first community vote.
  const voteRows = (live?.results || []).filter((r) => (r.count || 0) > 0);
  const editorial = live
    ? editorialRanking(pick || { title: live.title }, liveSlug, 15)
    : [];
  const listForLd = (voteRows.length ? voteRows : editorial).slice(0, 15);
  const jsonLd = live && listForLd.length
    ? itemListJsonLd({ ...live, results: listForLd }, siteUrl, pathForSpotId)
    : null;

  const topNames = listForLd.slice(0, 5).map((r) => r.name).filter(Boolean);
  const answerLead = topNames.length
    ? `Top ${live.title.toLowerCase()} picks right now include ${topNames.join(", ")}.`
    : live
      ? `Vote for ${live.title.toLowerCase()} on Hyderabad Eats.`
      : "Vote in this week's Hyderabad food challenge.";

  return (
    <>
      <EateriesApp initialTab="race" initialRaceView="theme" />

      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      {/* Visually hidden via .seo-crawl-nav. Same UI for humans; crawlers get
          the ranked names + spot links + previous weeks on this URL. */}
      <nav className="seo-crawl-nav" aria-label="This week's food race listings">
        <h1>{live ? live.title : "This week's food race"}</h1>
        <p>{answerLead}</p>
        <p>
          Community vote for this week&apos;s dish on Hyderabad Eats. Previous weeks stay open.
          Full ranking pages keep the Google-review baseline alongside live votes.
        </p>

        {live && voteRows.length > 0 && (
          <>
            <h2>This week&apos;s community standings</h2>
            <ol>
              {voteRows.slice(0, 20).map((r) => (
                <li key={r.spotId}>
                  <Link href={pathForSpotId(r.spotId)}>{r.name}</Link>
                  {r.count != null ? ` · ${r.count} vote${r.count === 1 ? "" : "s"}` : ""}
                </li>
              ))}
            </ol>
          </>
        )}

        {editorial.length > 0 && (
          <>
            <h2>Best listing by Google reviews</h2>
            <ol>
              {editorial.map((r) => (
                <li key={r.spotId}>
                  <Link href={pathForSpotId(r.spotId)}>{r.name}</Link>
                  {r.area ? ` · ${r.area}` : ""}
                  {r.rating != null ? ` · ${r.rating}★` : ""}
                  {r.blurb ? ` · ${r.blurb}` : ""}
                </li>
              ))}
            </ol>
          </>
        )}

        {past.length > 0 && (
          <>
            <h2>Previous weeks</h2>
            {past.map((th) => {
              const slug = th.slug || slugFromTitle(th.title);
              const rows = (th.results || []).filter((r) => (r.count || 0) > 0).slice(0, 10);
              return (
                <section key={th.id}>
                  <h3>
                    <Link href={`/rankings/${slug}`}>{th.title}</Link>
                  </h3>
                  {rows.length > 0 ? (
                    <ol>
                      {rows.map((r) => (
                        <li key={r.spotId}>
                          <Link href={pathForSpotId(r.spotId)}>{r.name}</Link>
                          {` · ${r.count} votes`}
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p>
                      <Link href={`/race/this-week?dish=${slug}`}>Vote on {th.title}</Link>
                    </p>
                  )}
                </section>
              );
            })}
          </>
        )}

        <h2>Active Reddit Community Food Races (r/hyderabad)</h2>
        <ul>
          <li>
            <a href="https://www.reddit.com/r/hyderabad/comments/1whsnai/this_week_were_ranking_the_best_breweries_in/" target="_blank" rel="noopener noreferrer">
              Best Breweries in Hyderabad (Live Reddit Vote by u/EveningTarget3419)
            </a>
          </li>
          <li>
            <a href="https://www.reddit.com/r/hyderabad/comments/1wouygj/this_week_were_ranking_the_best_chicken_pizza_in/" target="_blank" rel="noopener noreferrer">
              Best Chicken Pizza in Hyderabad (Live Reddit Vote by u/EveningTarget3419)
            </a>
          </li>
          <li>
            <a href="https://www.reddit.com/r/hyderabad/comments/1wd7xmi/best_mandi_in_hyderabad/" target="_blank" rel="noopener noreferrer">
              Best Mandi in Hyderabad (Live Reddit Vote by u/EveningTarget3419)
            </a>
          </li>
        </ul>

        <h2>Related ranking pages</h2>
        <ul>
          {liveSlug && (
            <li>
              <Link href={`/rankings/${liveSlug}`}>{live.title} ranking</Link>
            </li>
          )}
          <li><Link href="/guides/best-breweries-in-hyderabad">Best Breweries in Hyderabad (Guide)</Link></li>
          <li><Link href="/rankings">All rankings</Link></li>
          <li><Link href="/rankings/best-biryani-in-hyderabad">Best biryani in Hyderabad</Link></li>
          <li><Link href="/rankings/best-mandi-in-hyderabad">Best mandi in Hyderabad</Link></li>
          <li><Link href="/rankings/best-cafe-in-hyderabad">Best cafe in Hyderabad</Link></li>
          <li><Link href="/rankings/best-buffet-in-hyderabad">Best buffet in Hyderabad</Link></li>
        </ul>
      </nav>
    </>
  );
}
