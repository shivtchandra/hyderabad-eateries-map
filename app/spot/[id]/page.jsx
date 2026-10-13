import fs from "fs";
import path from "path";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import SiteChrome from "../../components/SiteChrome.jsx";
import SpotActionBar from "../../components/SpotActionBar.jsx";
import SpotsMapClient from "../../components/SpotsMapClient.jsx";
import { TOP_AREAS, editorialRanking, getEateryBySlugOrId, getEateries, getEditorialSpotIds, getChainSiblings, areaPageHref, hasSpotPhoto, spotSlug, spotPath } from "../../../lib/siteData.js";
import { absoluteUrl, getSiteUrl, pageMeta } from "../../../lib/site.js";
import { galleryPhotoUrl, spotPhotoUrl } from "../../../lib/photos.js";
import { restaurantJsonLd, faqJsonLd, breadcrumbJsonLd, getSpotFaqs } from "../../../lib/schema.js";
import { ogImages } from "../../../lib/og.js";
import { getInspectionsForSpot, ACTIONS, STATUSES, formatDate } from "../../../lib/inspectionsServer.js";
import { verifiedOffers } from "../../../lib/offers.js";
import MustOrder from "../../components/MustOrder.jsx";
import RecommendationPanel from "../../components/RecommendationPanel.jsx";
import { getRecommendations, recommendationFor } from "../../../lib/recommendations.js";
import { recommendationsEnabled } from "../../../lib/recommendationShared.js";
import { TIERS, tierFor } from "../../../lib/eateryUtils.js";
import { getRedditSpotData } from "../../../lib/redditThreads.js";
import { getAllRankingsThemes } from "../../../lib/themesServer.js";
import { slugFromTitle, SEO_THEME_PICKS } from "../../../lib/rankings.js";
import { getIndexableSpotIds } from "../../../lib/spotContent.js";
import { dishSeedsFor } from "../../../lib/dishSeeds.js";

const CAT_LABEL = {
  cafe: "Cafe", local: "Local Eats", "restro-bar": "Restro Bar", bakery: "Bakery", "ice-cream": "Ice Cream",
};

const AUTHOR = "Shiva";
const AUTHOR_ROLE = "Mapping HYD";

function parseDishScore(note = "") {
  const m = String(note).match(/(\d+(?:\.\d+)?)\s*\/\s*10/);
  return m ? Number(m[1]) : null;
}

function scoreTone(score) {
  if (score == null) return "mid";
  if (score >= 8.5) return "high";
  if (score >= 7) return "mid";
  return "low";
}

function displayName(name = "") {
  return name.replace(/\s*\[.*?\]\s*$/, "");
}

// Refresh prerendered pages daily so "Open today" hours and offers do not go
// stale, and so on-demand pages get cached rather than rendered per request.
export const revalidate = 86400;

// Only the editorial spots plus the busiest venues are prerendered. Every
// prerendered path costs ~63KB of HTML + RSC payload in the deployment, so the
// old "everything with 200+ reviews" filter shipped 1,807 pages / ~109MB with
// every deploy and was the second half of the 10GB Hobby storage blowout.
// The long tail still works: dynamicParams defaults to true, so an unlisted
// slug is rendered on first request and then cached by ISR.
// The static export (Cloudflare Pages) has no server to render the rest on demand.
const PRERENDERED_SPOT_LIMIT = process.env.HYD_STATIC_EXPORT === "1" ? Infinity : 200;

export function generateStaticParams() {
  const editorial = new Set(getEditorialSpotIds());
  const all = getEateries();
  const popular = all
    .filter((e) => !editorial.has(e.id))
    .sort((a, b) => (b.ratingCount || 0) - (a.ratingCount || 0))
    .slice(0, PRERENDERED_SPOT_LIMIT);
  return [...all.filter((e) => editorial.has(e.id)), ...popular].map((e) => ({ id: spotSlug(e) }));
}

export function generateMetadata({ params }) {
  const spot = getEateryBySlugOrId(params.id);
  if (!spot) return { title: "Spot not found, Hyderabad Eats" };
  const area = spot.discoveredIn && !spot.discoveredIn.startsWith("text:") ? spot.discoveredIn : "Hyderabad";
  const name = displayName(spot.name);
  const cleanName = displayName(spot.name)
    .replace(/\s*\(previously.*?\)\s*/i, "")
    .trim();
  const cleanArea = area && area !== "Hyderabad" && !cleanName.toLowerCase().includes(area.toLowerCase())
    ? area.split("/")[0].trim()
    : "";
  const place = cleanArea ? `${cleanName} (${cleanArea})` : cleanName;

  const candidates = [
    `${place}: Reviews, Menu & Prices`,
    `${place}: Reviews, Menu & Timings`,
    `${cleanName}: Reviews, Menu & Must-Orders`,
    `${cleanName}: Reviews, Menu & Prices`,
    `${cleanName}: Reviews & Menu`,
    `${place}: Reviews & Ratings`,
    cleanName,
  ];
  // Target max 48-52 chars so with " | Mapping HYD Eats" it stays under 70 chars.
  const title = candidates.find((t) => t.length <= 48) || candidates.find((t) => t.length <= 54) || `${cleanName}: Reviews & Menu`;

  const cleanEditorial = (spot.originStory?.[0]
    || (spot.signatureDish ? `Famous for ${spot.signatureDish.name}. ${spot.signatureDish.why}` : "")).replace(/—/g, ",");
  const ratingDetails = spot.rating ? `${spot.rating}★ rating (${spot.ratingCount ? spot.ratingCount.toLocaleString("en-IN") : ""} reviews). ` : "";
  const costDetails = spot.costForTwo ? `₹${Number(spot.costForTwo).toLocaleString("en-IN")} for two. ` : "";
  const dishHook = spot.signatureDish?.name
    ? `Must-try: ${spot.signatureDish.name}. `
    : spot.mustOrder?.[0]?.name
      ? `Must-try: ${spot.mustOrder[0].name}. `
      : `Explore top dishes, timings & map pin. `;
  const description = `Verified reviews, menu prices & must-orders for ${cleanName} in ${area}, Hyderabad. ${ratingDetails}${costDetails}${dishHook}TG Food Safety inspected.`
    .replace(/—/g, ",")
    .trim();

  const photo = hasSpotPhoto(spot.id) ? spotPhotoUrl(spot.id) : null;
  // Static hosting has no /api/og renderer: share the venue photo, else the site card.
  const ogCardUrl = absoluteUrl(photo || "/og/home.png");
  const base = pageMeta({ title, description, path: spotPath(spot), image: ogCardUrl });
  // Indexed only when the page has real content (lib/spotContent.js); basics-only
  // pages stay reachable for app links and shares but are kept out of Google.
  return getIndexableSpotIds().then((indexable) => ({
    ...base,
    ...(indexable.has(spot.id) ? {} : { robots: { index: false, follow: true } }),
    openGraph: {
      ...base.openGraph,
      images: photo
        ? [{ url: ogCardUrl, width: 800, height: 600, alt: spot.name, type: "image/jpeg" }]
        : [{ url: ogCardUrl, width: 1200, height: 630, alt: `${name} on Hyderabad Eats`, type: "image/png" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogCardUrl],
    },
  }));
}

export default async function SpotPage({ params }) {
  const siteUrl = getSiteUrl();
  const spot = getEateryBySlugOrId(params.id);
  if (!spot) notFound();
  const slug = spotSlug(spot);
  // Old Google Place ID URLs keep working; canonicalize to the name slug.
  if (params.id !== slug) permanentRedirect(spotPath(spot));

  const recommendation = recommendationsEnabled() ? recommendationFor(spot.id) : null;
  const recommendationModel = recommendation ? getRecommendations() : null;
  const areaLink = areaPageHref(spot.discoveredIn);
  const safety = await getInspectionsForSpot(spot.id);

  // Seed dishes render on the server (indexable); MustOrder then adds live local votes.
  // Locals' pick from r/hyderabad (scripts/reddit-picks.mjs): real comments, linked.
  let localsPick = null;
  try {
    const rp = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "reddit-picks.json"), "utf-8"));
    localsPick = rp.spots?.[spot.id] || null;
  } catch {}

  // Spot's own picks + brand-wide picks (lib/dishSeeds.js).
  const dishSeeds = dishSeedsFor(spot);

  let spotOffers = null;
  try {
    const curatedPath = path.join(process.cwd(), "data", "curated-offers.json");
    if (fs.existsSync(curatedPath)) {
      const parsed = JSON.parse(fs.readFileSync(curatedPath, "utf-8"));
      spotOffers = verifiedOffers(parsed.spots?.[spot.id]);
    }
  } catch {}

  const redditData = getRedditSpotData(spot.id, spot.name, spotSlug(spot));

  const jsonLd = restaurantJsonLd(spot, siteUrl, AUTHOR);
  const faqs = getSpotFaqs(spot, { spotOffers, safety });

  // Where locals rank it: every ranking this spot is on, from real votes
  // (memoised per process in themesServer, so no extra reads per page).
  const rankedIn = (await getAllRankingsThemes(50).catch(() => []))
    .map((th) => {
      // Only real votes count as a rank; 0-vote entries are "on the ballot".
      const voted = (th.results || []).filter((r) => (r.count || 0) > 0);
      const i = voted.findIndex((r) => r.spotId === spot.id);
      if (i < 0) return null;
      return {
        slug: th.slug || slugFromTitle(th.title),
        label: shortRanking(th.title),
        rank: i + 1,
        votes: voted[i].count,
        total: voted.reduce((a, r) => a + (r.count || 0), 0),
        // Who it is holding off (#1) or chasing, for the ticket's one line.
        rival: i === 0 ? voted[1] || null : voted[i - 1],
        crowned: !!th.winnerId && th.winnerId === spot.id,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 4);
  // If it's packed: the same kind of place within 2 km, best first.
  const nearby = nearbyAlternatives(spot, getEateries());
  // Real context from our own data: how this spot sits in its area and city.
  const context = spotContext(spot, getEateries());
  // Rankings this spot is on the ballot for but hasn't been voted in yet.
  const ballots = ballotsFor(spot.id).filter((b) => !rankedIn.some((r) => r.slug === b.slug)).slice(0, 3);
  const latestSafety = safety?.[0] || null;
  // Only show the consensus card when there is something real to say.
  const hasConsensus = !!(spot.signatureDish?.name || redditData?.thread || redditData?.brandData?.quotes?.praise?.length);
  const tierKey = spot.tier || tierFor(spot.ratingCount || 0);
  const tier = TIERS[tierKey] || TIERS["hidden-gem"];
  const breadcrumbItems = [
    { name: "Home", url: siteUrl },
    ...(areaLink ? [{ name: spot.discoveredIn, url: `${siteUrl}${areaLink}` }] : []),
    { name: spot.name, url: `${siteUrl}${spotPath(spot)}` },
  ];
  const breadcrumbsLd = breadcrumbJsonLd(breadcrumbItems);

  const heroImg = spot.gallery?.length
    ? galleryPhotoUrl(spot.gallery[0])
    : hasSpotPhoto(spot.id)
      ? spotPhotoUrl(spot.id)
      : null;
  const galleryRest = spot.gallery?.length > 1 ? spot.gallery.slice(1) : [];
  const directionsUrl = spot.lat != null && spot.lng != null
    ? `https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${spot.name} ${spot.discoveredIn || "Hyderabad"}`)}`;
  const todaysHours = spot.hours?.length
    ? spot.hours[(new Date().getDay() + 6) % 7]?.split(": ").slice(1).join(": ")
    : null;
  const siblings = getChainSiblings(spot);
  const siblingsLabel = spot.name.toLowerCase().includes("niloufer")
    ? "Other Cafe Niloufer locations"
    : "Other locations";

  const nameLower = (spot.name || "").toLowerCase();
  const addressLower = (spot.address || "").toLowerCase();
  const areaLower = (spot.discoveredIn || "").toLowerCase();
  const rankingLinks = [];

  if (addressLower.includes("knowledge city") || areaLower.includes("knowledge city") || nameLower.includes("windmills") || nameLower.includes("beer cartel") || nameLower.includes("burma burma") || nameLower.includes("nexity") || nameLower.includes("the loft")) {
    rankingLinks.push({ href: "/guides/restaurants-in-sattva-knowledge-city-hyderabad", label: "Knowledge City 60+ Food Guide" });
  }
  if (spot.category === "restro-bar" || nameLower.includes("brewery") || nameLower.includes("brewing") || nameLower.includes("prost") || nameLower.includes("zero40") || nameLower.includes("broadway") || nameLower.includes("windmills") || nameLower.includes("forge")) {
    rankingLinks.push({ href: "/guides/best-breweries-in-hyderabad", label: "Best Breweries in Hyderabad (Guide)" });
    rankingLinks.push({ href: "/rankings/best-brewery-in-hyderabad", label: "Best Brewery Weekly Ranking" });
  }
  if (nameLower.includes("niloufer")) {
    rankingLinks.push({ href: "/rankings/best-irani-cafe-in-hyderabad", label: "Best Irani cafe ranking" });
  }
  if (nameLower.includes("paradise") || nameLower.includes("shah ghouse") || nameLower.includes("shadab") || nameLower.includes("meridian") || nameLower.includes("bawarchi")) {
    rankingLinks.push({ href: "/rankings/best-biryani-in-hyderabad", label: "Best biryani in Hyderabad" });
  }

  const isReview = Boolean(spot.originStory?.length);
  const scoredDishes = (spot.mustOrder || []).map((d) => {
    const score = parseDishScore(d.note);
    const noteClean = String(d.note || "")
      .replace(/^\s*\d+(?:\.\d+)?\s*\/\s*10\.?\s*/i, "")
      .trim();
    return {
      ...d,
      score,
      noteClean,
      isSignature: spot.signatureDish?.name && d.name === spot.signatureDish.name,
    };
  });

  // The spot template (DESIGN.md, Spot page): photo, area kicker, name, one
  // line of numbers; then the vote ticket, facts, map, what locals say.
  // Spots found by text search have no area; read it off the address instead.
  const areaName = spot.discoveredIn && !spot.discoveredIn.startsWith("text:")
    ? spot.discoveredIn
    : TOP_AREAS.flatMap((a) => a.split("/")).find((a) => (spot.address || "").includes(a)) || null;
  const kickerLink = areaLink || (areaName ? areaPageHref(areaName) : null);
  const catName = CAT_LABEL[spot.category] || spot.category;
  const subLine = [
    spot.rating ? `★ ${spot.rating}${spot.ratingCount ? ` (${Number(spot.ratingCount).toLocaleString("en-IN")})` : ""}` : null,
    spot.costForTwo ? `₹${Number(spot.costForTwo).toLocaleString("en-IN")} for two` : null,
  ].filter(Boolean);
  const spotHero = (
    <div className="sp-hero">
      {heroImg && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={heroImg} alt={displayName(spot.name)} className="sp-photo" />
      )}
      <p className="sp-kicker">
        {areaName && (kickerLink ? <Link href={kickerLink}>{areaName}</Link> : areaName)}
        {areaName && catName ? " · " : ""}{catName}
      </p>
      <h1 className="sp-name">{isReview ? displayName(spot.name) : spot.name}</h1>
      {subLine.length > 0 && <p className="sp-sub">{subLine.join(" · ")}</p>}
    </div>
  );
  const topRank = rankedIn[0] || null;
  const moreRanks = rankedIn.slice(1);
  const vibe = spot.vibeLabels?.length ? spot.vibeLabels : (spot.tags || []).map((t) => t.replace(/-/g, " "));
  const siteHost = (() => { try { return new URL(spot.website).hostname.replace(/^www\./, ""); } catch { return "Visit"; } })();

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsLd) }} />
      {faqs.length > 0 && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(faqs)) }} />
      )}
    <div style={{ paddingBottom: 96 }}>
    <SiteChrome
      breadcrumb={[
        { href: "/", label: "Home" },
        ...(areaLink ? [{ href: areaLink, label: spot.discoveredIn }] : []),
        { href: spotPath(spot), label: spot.name },
      ]}
      title={isReview ? displayName(spot.name) : spot.name}
      description={`${CAT_LABEL[spot.category] || spot.category}${spot.discoveredIn ? ` · ${spot.discoveredIn}` : ""}${spot.rating ? ` · ${spot.rating}★` : ""}`}
      hero={spotHero}
      navLinksHidden
      heroDecor
      backFallback={spot.originStory?.length || spot.regularNote || spot.highlight ? "/stories" : "/"}
      related={[
        { href: "/", label: "Open on map" },
        { href: "/rankings", label: "Weekly rankings" },
        ...rankingLinks,
        ...(areaLink ? [{ href: areaLink, label: `More in ${spot.discoveredIn}` }] : []),
        { href: `/explore/${spot.category === "local" ? "biryani-and-local" : spot.category === "restro-bar" ? "bars" : spot.category === "ice-cream" ? "ice-cream" : spot.category === "bakery" ? "bakeries" : "cafes"}`, label: `More ${CAT_LABEL[spot.category] || "spots"}` },
      ]}
    >
      {topRank && (
        <Link href={`/rankings/${topRank.slug}`} className={`sp-ticket${topRank.rank === 1 ? " is-first" : ""}`}>
          <span className="sp-ticket-top">
            <span className="sp-ticket-kicker">#{topRank.rank} {topRank.label} · Locals&apos; vote</span>
            <span className="sp-ticket-arrow" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M9 7h8v8" /></svg>
            </span>
          </span>
          <span className="sp-ticket-count"><b>{topRank.votes}</b> of {topRank.total} {topRank.total === 1 ? "vote" : "votes"}</span>
          <span className="sp-ticket-line">{ticketLine(topRank)}</span>
        </Link>
      )}

      {(moreRanks.length > 0 || ballots.length > 0) && (
        <section className="spot-ranks" aria-label="More rankings">
          <h2>{topRank ? "Also in the running" : "On the ballot"}</h2>
          <ul>
            {moreRanks.map((r) => (
              <li key={r.slug}>
                <Link href={`/rankings/${r.slug}`} className="spot-rank-row">
                  <span className="spot-rank-num">#{r.rank}</span>
                  <span className="spot-rank-text">
                    <b>{r.label}</b>
                    <span>{r.crowned ? "Crowned. " : ""}{r.votes} {r.votes === 1 ? "vote" : "votes"} at last count</span>
                  </span>
                  <span className="spot-rank-cta">Vote</span>
                </Link>
              </li>
            ))}
            {ballots.map((b) => (
              <li key={b.slug}>
                <Link href={`/rankings/${b.slug}`} className="spot-rank-row">
                  <span className="spot-rank-num spot-rank-num--open" aria-hidden="true">?</span>
                  <span className="spot-rank-text">
                    <b>{b.label}</b>
                    <span>On the ballot, no votes yet</span>
                  </span>
                  <span className="spot-rank-cta">Be first</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {latestSafety && (
        <a href="#food-safety" className={`spot-safety${/suspen|seiz|clos|cancel/i.test(latestSafety.entry.action || "") ? " is-serious" : ""}`}>
          <b>Food safety: {ACTIONS[latestSafety.entry.action] || latestSafety.entry.action || "inspection on record"}</b>
          <span>{formatDate(latestSafety.drive.date)}{latestSafety.drive.authority ? ` · ${latestSafety.drive.authority}` : ""}. See the record.</span>
        </a>
      )}

      {context && (context.area || context.cityTopPct <= 25) && (
        <div className="sp-stats">
          {context.area && (
            <div className="sp-stat">
              <b>{context.areaRank <= 10 ? `#${context.areaRank}` : context.areaCount}</b>
              <span>{context.areaRank <= 10 ? `most reviewed of ${context.areaCount} ${context.plural} in ${context.area}` : `${context.plural} in ${context.area}`}</span>
            </div>
          )}
          {context.cityTopPct <= 25 && (
            <div className="sp-stat">
              <b>Top {context.cityTopPct}%</b>
              <span>of Hyderabad {context.plural} by reviews</span>
            </div>
          )}
        </div>
      )}

      <dl className="sp-facts">
        {todaysHours && (<div><dt>Open today</dt><dd>{todaysHours}</dd></div>)}
        {(spot.visitSpend?.text || spot.costForTwo) && (
          <div><dt>{spot.visitSpend?.label || "Cost for two"}</dt><dd>{spot.visitSpend?.text || `₹${Number(spot.costForTwo).toLocaleString("en-IN")}`}</dd></div>
        )}
        {spot.founded && (<div><dt>Since</dt><dd>{spot.founded}</dd></div>)}
        {vibe.length > 0 && (<div><dt>Good for</dt><dd>{vibe.join(", ")}</dd></div>)}
        {spot.phone && (<div><dt>Phone</dt><dd><a href={`tel:${String(spot.phone).replace(/\s+/g, "")}`}>{spot.phone}</a></dd></div>)}
        {spot.website && (<div><dt>Website</dt><dd><a href={spot.website} target="_blank" rel="noopener noreferrer">{siteHost}</a></dd></div>)}
        {spot.zomatoUrl && (<div><dt>Order</dt><dd><a href={spot.zomatoUrl} target="_blank" rel="noopener noreferrer">Zomato</a></dd></div>)}
        {!latestSafety && (<div><dt>Food safety</dt><dd>No notices on record. <Link href="/food-safety">How we track</Link></dd></div>)}
      </dl>

      {spot.lat != null && spot.lng != null && (
        <section className="sp-where" aria-label="Where it is">
          <SpotsMapClient points={[{ lat: spot.lat, lng: spot.lng, kind: "spot", title: displayName(spot.name), sub: areaName || "Hyderabad" }]} height={180} />
          <div className="sp-where-row">
            <p>{spot.address || areaName || "Hyderabad"}</p>
            <Link href={`/?spot=${encodeURIComponent(spot.id)}`}>Open on our map</Link>
          </div>
        </section>
      )}

      {hasConsensus && (
        <section className="sp-says" aria-label="What locals say">
          <h2>What locals say</h2>
          {spot.signatureDish?.name && (
            <div className="sp-must">
              <span className="sp-label">Must order</span>
              <b>{spot.signatureDish.name}</b>
              {spot.signatureDish.why && <p>{spot.signatureDish.why.replace(/\s*—\s*/g, ", ")}</p>}
            </div>
          )}
          {redditData?.brandData?.quotes?.praise?.length > 0 && (
            <blockquote className="sp-quote">
              <p>&ldquo;{redditData.brandData.quotes.praise[0].text.replace(/\s*—\s*/g, ", ")}&rdquo;</p>
              <cite>A local on r/hyderabad</cite>
            </blockquote>
          )}
          {redditData?.thread && (
            <a className="sp-thread" href={redditData.thread.url} target="_blank" rel="noopener noreferrer">
              <span>Talked about in <b>{redditData.thread.shortTitle}</b> on r/hyderabad</span>
              <span aria-hidden="true">↗</span>
            </a>
          )}
        </section>
      )}

      {isReview ? (
        <div className="review">

          <div className="review-byline">
            <div>
              <p className="review-byline-kicker">Food story</p>
              <p className="review-byline-name">
                {spot.author?.url ? (
                  <>
                    <a href={spot.author.url} target="_blank" rel="noopener noreferrer" className="review-author-link">
                      {spot.author.name}
                    </a>
                    {spot.author.role ? <> · {spot.author.role}</> : null}
                  </>
                ) : (
                  <>{spot.author?.name || AUTHOR} · {spot.author?.role || AUTHOR_ROLE}</>
                )}
              </p>
            </div>
            <Link href={`/?spot=${encodeURIComponent(spot.id)}`} className="review-map-link">
              Open on map
            </Link>
          </div>

          {(spot.verdict || spot.highlight?.text) && (
            <div className="review-verdict">
              {spot.verdict?.score != null && (
                <div className={`review-score review-score--${scoreTone(spot.verdict.score)}`} aria-label={`Score ${spot.verdict.score} out of ${spot.verdict.outOf || 10}`}>
                  <strong>{spot.verdict.score}</strong>
                  <span>of {spot.verdict.outOf || 10}</span>
                </div>
              )}
              <div className="review-verdict-copy">
                <p className="review-verdict-label">{spot.verdict?.label || spot.highlight?.label || "The take"}</p>
                <p>{spot.verdict?.blurb || spot.highlight?.text}</p>
              </div>
            </div>
          )}

          {scoredDishes.length > 0 && (
            <section className="spot-section review-plates">
              <div className="review-section-head">
                <h2>The plate</h2>
                <p>What we tried, scored out of 10</p>
              </div>
              <div className="review-dish-grid">
                {scoredDishes.map((d, i) => (
                  <article key={i} className={`review-dish review-dish--${scoreTone(d.score)}`}>
                    <div className="review-dish-top">
                      <h3>{d.name}</h3>
                      {d.score != null && (
                        <span className="review-dish-score">
                          {Number.isInteger(d.score) ? d.score : d.score.toFixed(1)}
                          <small>/10</small>
                        </span>
                      )}
                    </div>
                    {d.noteClean && <p>{d.noteClean}</p>}
                    {d.isSignature && <em>Signature</em>}
                  </article>
                ))}
              </div>
            </section>
          )}

          {spot.originStory?.length > 0 && (
            <section className="spot-section review-story">
              <div className="review-section-head">
                <h2>The visit</h2>
              </div>
              {spot.originStory.map((para, i) => (
                <p key={i} className="review-prose">{para}</p>
              ))}
              {spot.regularNote && (
                <blockquote className="review-pull">
                  {spot.regularNote}
                  <cite>
                    {spot.author?.url ? (
                      <a href={spot.author.url} target="_blank" rel="noopener noreferrer" className="review-author-link">
                        {spot.author.name}
                      </a>
                    ) : (
                      spot.author?.name || AUTHOR
                    )}
                  </cite>
                </blockquote>
              )}
            </section>
          )}

          {galleryRest.length > 0 && (
            <section className="spot-section">
              <h2>More photos</h2>
              <div className="spot-gallery">
                {galleryRest.map((f, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={galleryPhotoUrl(f)} alt={`${displayName(spot.name)}, photo ${i + 2}`} loading="lazy" />
                ))}
              </div>
            </section>
          )}

          {faqs?.length > 0 && (
            <section className="spot-section">
              <h2>Good to know</h2>
              <div className="spot-faq">
                {faqs.map((f, i) => (
                  <details key={i}>
                    <summary>{f.q}</summary>
                    <p>{f.a}</p>
                  </details>
                ))}
              </div>
            </section>
          )}

        </div>
      ) : (
        <>

          {spot.highlight?.text && (
            <div className="spot-highlight">
              <span className="spot-highlight-label">★ {spot.highlight.label || "Highlight"}</span>
              <p>{spot.highlight.text}</p>
            </div>
          )}


          {recommendation && <section className="spot-section" id="recommendations">
            <h2>What to order and why</h2>
            <RecommendationPanel place={recommendation} brand={recommendationModel.brands[recommendation.redditBrandId]} publishedDishes={recommendationModel.dishes.map((d) => d.id)} />
            <Link href={`/?spot=${encodeURIComponent(spot.id)}`}>Explore this branch and nearby picks on the map</Link>
          </section>}
          {!recommendation && localsPick && (
            <section id="locals" className="spot-section locals-pick">
              <h2>Locals' pick</h2>
              <p>
                Recommended by <b>{localsPick.locals} people</b> on r/hyderabad
                {localsPick.lastMentioned ? `, most recently ${new Date(localsPick.lastMentioned + "-01").toLocaleDateString("en-IN", { month: "short", year: "numeric" })}` : ""}.
                Counted from real comments, one vote per person.
              </p>
              <ul>
                {localsPick.evidence.map((ev) => (
                  <li key={ev.url}>
                    <a href={ev.url} target="_blank" rel="noopener noreferrer nofollow">Read the comment on Reddit →</a>
                    <span>{new Date(ev.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · {ev.score} upvotes</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {!recommendation && <MustOrder spotId={spot.id} initial={dishSeeds} />}

          {spotOffers && (spotOffers.district?.hasOffers || spotOffers.swiggy?.hasOffers) && (
            <section className="spot-section sp-offers" aria-label="Offers">
              <h2>Offers right now</h2>
              {[["district", "District by Zomato", "Book a table"], ["swiggy", "Swiggy Dineout", "Pay the bill"]].map(([k, label, cta]) => spotOffers[k]?.hasOffers && (
                <div key={k} className="sp-offer">
                  <div className="sp-offer-head">
                    <b>{label}</b>
                    {spotOffers[k].url && <a href={spotOffers[k].url} target="_blank" rel="noopener noreferrer">{cta} ↗</a>}
                  </div>
                  <ul>
                    {spotOffers[k].offers.map((off, i) => (
                      <li key={i}><b>{off.title}</b>{off.desc ? <span>{off.desc}</span> : null}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          )}

          {safety.length > 0 && (
            <section id="food-safety" className="fs-record" aria-label="Food safety record">
              <h2>Food safety record</h2>
              {safety.map(({ drive, entry }) => (
                <div key={drive.id} className="fs-record-row">
                  <span className={`fs-pill fs-pill--${entry.action}`}>{ACTIONS[entry.action] || entry.action}</span>
                  <span>{formatDate(drive.date)} · {drive.authority}</span>
                  <span>{STATUSES[entry.status] || entry.status}{entry.statusDate ? `, ${formatDate(entry.statusDate)}` : ""}</span>
                  {drive.sources?.[0]?.url && <a href={drive.sources[0].url} target="_blank" rel="noopener noreferrer nofollow">Source</a>}
                  <Link href="/food-safety">All inspections</Link>
                </div>
              ))}
            </section>
          )}

          {siblings.length > 0 && (
            <section className="spot-section">
              <h2>{siblingsLabel}</h2>
              <p className="spot-prose">Same brand, different branches across Hyderabad. Open one for the area that suits you, or find them all on the map.</p>
              <ul className="site-spot-list">
                {siblings.map((s) => (
                  <li key={s.id}>
                    <Link href={spotPath(s)}>
                      <span>
                        <div className="site-spot-name">{s.name}</div>
                        <div className="site-spot-meta">{s.discoveredIn || "Hyderabad"}{s.rating ? ` · ${s.rating}★` : ""}</div>
                      </span>
                      <span className="site-spot-meta">View →</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {spot.signatureDish?.name && (
            <section className="spot-section">
              <h2>What to order</h2>
              <div className="spot-dish">
                <span className="spot-dish-badge">Signature</span>
                <strong>{spot.signatureDish.name}</strong>
                <p>{spot.signatureDish.why}</p>
              </div>
              {spot.mustOrder?.length > 0 && (
                <ul className="spot-order-list">
                  {spot.mustOrder.map((d, i) => (
                    <li key={i}><strong>{d.name}</strong>{d.note ? `, ${d.note}` : ""}</li>
                  ))}
                </ul>
              )}
              {spot.regularNote && (
                <blockquote className="spot-regular">
                  {spot.regularNote}
                  <cite className="spot-regular-by">
                    {spot.author?.url ? (
                      <a href={spot.author.url} target="_blank" rel="noopener noreferrer">{spot.author.name}</a>
                    ) : (
                      spot.author?.name || AUTHOR
                    )}
                    {" · "}
                    {spot.author?.role || AUTHOR_ROLE}
                  </cite>
                </blockquote>
              )}
            </section>
          )}

          {galleryRest.length > 0 && (
            <section className="spot-section">
              <h2>Photos</h2>
              <div className="spot-gallery">
                {galleryRest.map((f, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={galleryPhotoUrl(f)} alt={`${spot.name}, photo ${i + 2}`} loading="lazy" />
                ))}
              </div>
            </section>
          )}

          {faqs?.length > 0 && (
            <section className="spot-section">
              <h2>Good to know</h2>
              <div className="spot-faq">
                {faqs.map((f, i) => (
                  <details key={i}>
                    <summary>{f.q}</summary>
                    <p>{f.a}</p>
                  </details>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {nearby.length > 0 && (
        <section className="spot-nearby" aria-label="Nearby instead">
          <h2>If it&apos;s packed, try nearby</h2>
          <div className="spot-nearby-rail">
            {nearby.map((n) => (
              <Link key={n.e.id} href={spotPath(n.e)} className="spot-nearby-card">
                <span className="spot-nearby-photo">
                  {hasSpotPhoto(n.e.id) && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={spotPhotoUrl(n.e.id)} alt="" loading="lazy" />
                  )}
                </span>
                <b>{displayName(n.e.name)}</b>
                <span>{n.km < 1 ? `${Math.round(n.km * 1000)} m` : `${n.km.toFixed(1)} km`} away{n.e.discoveredIn && !n.e.discoveredIn.startsWith("text:") ? ` · ${n.e.discoveredIn}` : ""}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* The ask comes after the page has given something. */}
      <section className="spot-claim">
        <div className="spot-claim-text">
          <h2>Ate at {displayName(spot.name)}?</h2>
          <p>Claim +{tier.points} pts in the Hyderabad Food Race.</p>
        </div>
        <Link href={`/?spot=${encodeURIComponent(spot.id)}`} className="spot-claim-cta">Claim spot</Link>
      </section>
    </SiteChrome>
    <SpotActionBar spotId={spot.id} name={displayName(spot.name)} path={spotPath(spot)} directionsUrl={directionsUrl} />
    </div>
    </>
  );
}

// "Best Dosa in Hyderabad" -> "Best dosa".
// One line under the ticket's count, from real votes only.
function ticketLine(t) {
  const crowned = t.crowned ? "Crowned. " : "";
  if (!t.rival) return `${crowned}The only spot with votes so far.`;
  const name = displayName(t.rival.name || "the next spot");
  if (t.rank === 1) {
    const by = t.votes - (t.rival.count || 0);
    return by > 0 ? `${crowned}${by} ahead of ${name}` : `${crowned}Tied with ${name}`;
  }
  const need = (t.rival.count || 0) - t.votes + 1;
  return `${need} ${need === 1 ? "vote" : "votes"} to pass ${name}`;
}

function shortRanking(title = "") {
  const t = title.replace(/\s+in\s+hyderabad$/i, "");
  return t.charAt(0) + t.slice(1).toLowerCase();
}

function kmBetween(a, b) {
  const R = 6371, toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Same kind of place within 2 km, skipping other branches of the same brand
// (those have their own "Other locations" list). Photos first, then quality.
function nearbyAlternatives(spot, all) {
  if (spot.lat == null || spot.lng == null) return [];
  const brand = (spot.name || "").toLowerCase().split(/[\s|,-]+/).slice(0, 2).join(" ");
  return all
    .filter((e) => e.id !== spot.id && e.core && e.category === spot.category && e.lat != null && e.lng != null)
    .filter((e) => !(e.name || "").toLowerCase().startsWith(brand))
    .map((e) => ({ e, km: kmBetween(spot, e) }))
    .filter((x) => x.km <= 2)
    .sort((x, y) => (hasSpotPhoto(y.e.id) - hasSpotPhoto(x.e.id)) || ((y.e.rating || 0) * Math.log10((y.e.ratingCount || 0) + 10) - (x.e.rating || 0) * Math.log10((x.e.ratingCount || 0) + 10)))
    .slice(0, 4);
}

const CAT_PLURAL = { cafe: "cafes", restaurant: "restaurants", local: "local eats", "restro-bar": "bars", bakery: "bakeries", "ice-cream": "ice cream spots" };

// Where the spot sits: its rank by review count within its area and category,
// and how high it sits citywide. Only real counts; nothing shown if missing.
function spotContext(spot, all) {
  const plural = CAT_PLURAL[spot.category];
  if (!plural) return null;
  const same = all.filter((e) => e.core && e.category === spot.category);
  const byReviews = (a, b) => (b.ratingCount || 0) - (a.ratingCount || 0);
  const area = spot.discoveredIn && !spot.discoveredIn.startsWith("text:") ? spot.discoveredIn : null;
  let areaCount = 0, areaRank = 99;
  if (area) {
    const inArea = same.filter((e) => e.discoveredIn === area).sort(byReviews);
    areaCount = inArea.length;
    areaRank = inArea.findIndex((e) => e.id === spot.id) + 1 || 99;
    if (areaCount < 3) return null;
  }
  const cityIdx = [...same].sort(byReviews).findIndex((e) => e.id === spot.id);
  const cityTopPct = cityIdx >= 0 ? Math.max(1, Math.ceil(((cityIdx + 1) / same.length) * 100)) : 100;
  if (!area && cityTopPct > 25) return null;
  return { plural, area, areaCount, areaRank, cityTopPct };
}

// Which ranking ballots each spot is on (the editorial shortlist each
// ranking page starts from), built once per process.
let ballotIndex = null;
function ballotsFor(spotId) {
  if (!ballotIndex) {
    ballotIndex = new Map();
    for (const pick of SEO_THEME_PICKS) {
      const slug = slugFromTitle(pick.title);
      let list = [];
      try { list = editorialRanking(pick, slug, 15); } catch {}
      for (const e of list) {
        if (!ballotIndex.has(e.id)) ballotIndex.set(e.id, []);
        ballotIndex.get(e.id).push({ slug, label: shortRanking(pick.title) });
      }
    }
  }
  return ballotIndex.get(spotId) || [];
}
