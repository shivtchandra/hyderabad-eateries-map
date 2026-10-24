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
import { getSpotSearchProfile } from "../../../lib/searchOpportunities.js";

const CAT_LABEL = {
  cafe: "Cafe", local: "Local Eats", "restro-bar": "Restro Bar", bakery: "Bakery", "ice-cream": "Ice Cream",
};

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

function liveRankingsForSpot(spot, themes) {
  return (themes || [])
    .map((th) => {
      const voted = (th.results || []).filter((r) => (r.count || 0) > 0);
      const i = voted.findIndex((r) => r.spotId === spot.id);
      if (i < 0) return null;
      return {
        slug: th.slug || slugFromTitle(th.title),
        name: voted[i].name || spot.name,
        label: shortRanking(th.title),
        rank: i + 1,
        votes: voted[i].count,
        total: voted.reduce((a, r) => a + (r.count || 0), 0),
        rival: i === 0 ? voted[1] || null : voted[i - 1],
        crowned: !!th.winnerId && th.winnerId === spot.id,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 4);
}

function liveBallotsForSpot(spot, themes, ranked = []) {
  const rankedSlugs = new Set(ranked.map((entry) => entry.slug));
  return (themes || [])
    .map((th) => {
      if (!th.active || th.winnerId) return null;
      const candidate = (th.results || []).find((r) => r.spotId === spot.id);
      if (!candidate || (candidate.count || 0) > 0) return null;
      const slug = th.slug || slugFromTitle(th.title);
      if (rankedSlugs.has(slug)) return null;
      return {
        slug,
        name: candidate.name || spot.name,
        label: shortRanking(th.title),
      };
    })
    .filter(Boolean)
    .slice(0, 4);
}

function threadStandingForSpot(spot, redditData) {
  const clean = (value = "") => String(value).toLowerCase().replace(/[^a-z0-9]/g, "");
  const identities = [spot.id, spotSlug(spot), spot.name].map(clean).filter(Boolean);
  const standing = redditData?.thread?.standings?.find((entry) => {
    const keys = [entry.spotId, entry.name].map(clean).filter(Boolean);
    return keys.some((key) => identities.includes(key));
  });
  if (!standing) return null;
  return {
    name: standing.name || spot.name,
    label: shortRanking(redditData.thread.title),
    rank: standing.rank,
    votes: standing.votes || 0,
    total: redditData.thread.standings.reduce((sum, entry) => sum + (entry.votes || 0), 0),
  };
}

export async function generateMetadata({ params }) {
  const spot = getEateryBySlugOrId(params.id);
  if (!spot) return { title: "Spot not found, Hyderabad Eats" };
  const searchProfile = getSpotSearchProfile(spot.id);
  const area = spot.discoveredIn && !spot.discoveredIn.startsWith("text:") ? spot.discoveredIn : "Hyderabad";
  const name = displayName(spot.name);
  const cleanName = displayName(spot.name)
    .replace(/\s*\(previously.*?\)\s*/i, "")
    .trim();
  const cleanArea = area && area !== "Hyderabad" && !cleanName.toLowerCase().includes(area.toLowerCase())
    ? area.split("/")[0].trim()
    : "";
  const place = cleanArea ? `${cleanName} (${cleanArea})` : cleanName;

  const rec = recommendationsEnabled() ? recommendationFor(spot.id) : null;
  const hasDishes = (spot.mustOrder && spot.mustOrder.length > 0) ||
    !!spot.signatureDish?.name ||
    (rec && (rec.dishes?.length > 0 || rec.signature?.name || rec.localDishes?.length > 0));

  const [safety, themes] = await Promise.all([
    getInspectionsForSpot(spot.id),
    getAllRankingsThemes(50).catch(() => []),
  ]);
  const hasSafety = safety && safety.length > 0;
  const latestSafety = hasSafety ? safety[0] : null;
  const safetyAction = latestSafety?.entry?.action
    ? (ACTIONS[latestSafety.entry.action] || latestSafety.entry.action)
    : "Inspection";

  const liveRankings = liveRankingsForSpot(spot, themes);
  const liveRank = liveRankings[0] || null;
  const liveBallot = liveBallotsForSpot(spot, themes, liveRankings)[0] || null;
  const redditData = getRedditSpotData(spot.id, spot.name, spotSlug(spot));
  const communityRank = liveRank || threadStandingForSpot(spot, redditData);
  // A ballot with zero votes is not a standing and must not replace the
  // brand/review query in the title. It remains visible in copy and on-page.
  const rankingSignal = communityRank;
  const rankingContext = communityRank || liveBallot;
  const reviewText = spot.verdict?.blurb || spot.highlight?.text || spot.regularNote || "";
  const hasEditorialReview = !!reviewText && !!spot.author?.name && (
    !!spot.reviewedAt || /review/i.test(spot.author?.role || "")
  );
  const hasVisitNote = !!reviewText && spot.contentMode === "visit-note";
  const hasOwnedReview = hasEditorialReview || hasVisitNote;
  const reviewerLabel = spot.author?.name
    ? `${spot.author.name.split(/\s+/)[0]}'s Review`
    : "Mapping HYD Review";
  const rankLabel = rankingContext
    ? `${rankingContext.label.replace(/\b\w/g, (char) => char.toUpperCase())} in Hyderabad`
    : "";
  const rankTitle = communityRank ? `#${communityRank.rank} ${rankLabel}` : "";
  const rankTopic = communityRank?.label?.replace(/^best\s+/i, "") || "";
  const rankName = rankingContext?.name ? displayName(rankingContext.name) : cleanName;

  const rankingCandidates = [
    ...(communityRank && hasEditorialReview ? [`${cleanName}: #${communityRank.rank} ${rankTopic} + ${reviewerLabel}`] : []),
    ...(communityRank ? [`${rankName}: ${rankTitle}`, `${cleanName}: ${rankTitle}`] : []),
    ...(liveBallot ? [`${rankName}: ${rankLabel}`, `${cleanName}: ${rankLabel}`] : []),
  ];
  const reviewCandidates = [
    ...(hasEditorialReview ? [`${cleanName}: ${reviewerLabel}`, `${place}: ${reviewerLabel}`] : []),
    ...(hasVisitNote ? [`${cleanName}: Mapping HYD Visit Notes`, `${place}: Visit Notes`] : []),
  ];
  const fallbackCandidates = [
    ...(hasSafety ? [`${place}: Food Safety & Venue Guide`, `${cleanName}: Food Safety & Details`] : []),
    ...(hasDishes ? [`${cleanName}: What to Order & Venue Guide`] : []),
    `${place}: Timings, Map & Venue Guide`,
    `${cleanName}: Timings, Map & Details`,
    `${place}: Venue Guide`,
    cleanName,
  ];
  // Venue pages own branded intent. Rankings remain prominent in the answer
  // and description, but a #N phrase should not displace the restaurant name,
  // area, menu or first-hand review query in the document title.
  const candidates = searchProfile?.title
    ? [searchProfile.title, ...reviewCandidates, ...rankingCandidates, ...fallbackCandidates]
    : hasOwnedReview
      ? [...reviewCandidates, ...rankingCandidates, ...fallbackCandidates]
      : rankingSignal
        ? [...rankingCandidates, ...fallbackCandidates]
        : fallbackCandidates;
  // Target max 48-52 chars so with " | Mapping HYD Eats" it stays under 70 chars.
  const title = candidates.find((t) => t.length <= 48) || candidates.find((t) => t.length <= 54) || candidates[0] || `${cleanName}: Reviews & Menu`;

  const ratingDetails = !rankingSignal && !hasOwnedReview && !searchProfile && spot.rating
    ? `${spot.rating}★ Google rating (${spot.ratingCount ? spot.ratingCount.toLocaleString("en-IN") : ""} reviews). `
    : "";
  const costDetails = spot.costForTwo ? `₹${Number(spot.costForTwo).toLocaleString("en-IN")} for two. ` : "";
  const dishHook = spot.signatureDish?.name
    ? `Must-try: ${spot.signatureDish.name}. `
    : spot.mustOrder?.[0]?.name
      ? `Must-try: ${spot.mustOrder[0].name}. `
      : rec?.signature?.name
        ? `Must-try: ${rec.signature.name}. `
        : "";

  const safetyHook = hasSafety ? `TG SAFE food safety record: ${safetyAction}. ` : "";
  const rankingHook = communityRank
    ? `${rankTitle}${communityRank.votes ? ` with ${communityRank.votes} local votes` : ""}. `
    : liveBallot
      ? `On the community ballot for ${rankLabel}. `
      : "";
  const editorialHook = hasEditorialReview
    ? `${spot.author?.name ? `${spot.author.name}'s review` : "Mapping HYD review"}: ${reviewText} `
    : hasVisitNote
      ? `Mapping HYD visit note: ${reviewText} `
    : "";
  const descTail = dishHook || safetyHook ? `${dishHook}${safetyHook}Map pin and timings.` : "Timings and map pin.";
  const rawDescription = !rankingSignal && !hasOwnedReview && searchProfile?.answer
    ? `${searchProfile.answer} ${rankingHook}${costDetails}${dishHook}`
    : `${rankingHook}${editorialHook}${ratingDetails}${costDetails}${descTail}`;
  const cleanDescription = rawDescription
    .replace(/—/g, ",")
    .trim();
  const description = cleanDescription.length <= 175
    ? cleanDescription
    : `${cleanDescription.slice(0, 172).replace(/\s+\S*$/, "")}...`;

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
  const searchProfile = getSpotSearchProfile(spot.id);
  const slug = spotSlug(spot);
  // Old Google Place ID URLs keep working; canonicalize to the name slug.
  if (params.id !== slug) permanentRedirect(spotPath(spot));

  const recommendation = recommendationsEnabled() ? recommendationFor(spot.id) : null;
  const hasValidRecommendation = !!(
    recommendation && (
      (recommendation.dishes && recommendation.dishes.length > 0) ||
      recommendation.signature?.name ||
      (recommendation.localDishes && recommendation.localDishes.length > 0) ||
      recommendation.editorial
    )
  );
  const recommendationModel = hasValidRecommendation ? getRecommendations() : null;
  const areaLink = areaPageHref(spot.discoveredIn);
  const safety = await getInspectionsForSpot(spot.id);

  // Spot's own picks + brand-wide picks (lib/dishSeeds.js).
  const dishSeeds = dishSeedsFor(spot);

  let spotOffers = null;
  /* Offers commented out for now
  try {
    const curatedPath = path.join(process.cwd(), "data", "curated-offers.json");
    if (fs.existsSync(curatedPath)) {
      const parsed = JSON.parse(fs.readFileSync(curatedPath, "utf-8"));
      spotOffers = verifiedOffers(parsed.spots?.[spot.id]);
    }
  } catch {}
  */

  const redditData = getRedditSpotData(spot.id, spot.name, spotSlug(spot));
  // Entity-reviewed r/hyderabad evidence from the shared resolver.
  const localsPick = redditData.pick;

  const jsonLd = restaurantJsonLd(spot, siteUrl, spot.author?.name || null);
  const faqs = getSpotFaqs(spot, { spotOffers, safety });

  // Where locals rank it: every ranking this spot is on, from real votes
  // (memoised per process in themesServer, so no extra reads per page).
  const rankingThemes = await getAllRankingsThemes(50).catch(() => []);
  const rankedIn = liveRankingsForSpot(spot, rankingThemes);
  // If it's packed: the same kind of place within 2 km, best first.
  const nearby = nearbyAlternatives(spot, getEateries());
  // Real context from our own data: how this spot sits in its area and city.
  const context = spotContext(spot, getEateries());
  // Rankings this spot is on the ballot for but hasn't been voted in yet.
  const ballots = [
    ...liveBallotsForSpot(spot, rankingThemes, rankedIn),
  ]
    .filter((b, index, all) => !rankedIn.some((r) => r.slug === b.slug) && all.findIndex((x) => x.slug === b.slug) === index)
    .slice(0, 3);
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
  const hydWeekday = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Kolkata", weekday: "long" }).format(new Date());
  const todaysHours = spot.hours?.find((line) => line.startsWith(`${hydWeekday}:`))?.split(": ").slice(1).join(": ") || null;
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
    rankingLinks.push({ href: "/rankings/best-biryani-in-hyderabad", label: "Live Hyderabad biryani vote" });
  }

  const isReview = Boolean(spot.originStory?.length || spot.contentMode === "visit-note" || spot.verdict?.score != null);
  const reviewAuthorName = spot.author?.name || "Mapping HYD";
  const reviewAuthorRole = spot.author?.role || (spot.contentMode === "visit-note" ? "Visit notes" : "Editorial note");
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
  const hasOwnedSignal = !!searchProfile
    || rankedIn.length > 0
    || ballots.length > 0
    || hasValidRecommendation
    || (safety?.length || 0) > 0
    || !!(localsPick?.evidence?.length || redditData?.thread || redditData?.brandData?.quotes?.praise?.length)
    || !!(spot.originStory?.length || spot.verdict || spot.highlight?.text || spot.regularNote || spot.signatureDish?.name || spot.mustOrder?.length);
  const subLine = [
    !hasOwnedSignal && spot.rating ? `★ ${spot.rating}${spot.ratingCount ? ` (${Number(spot.ratingCount).toLocaleString("en-IN")})` : ""}` : null,
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
  const contentSources = (spot.sources || []).map((source) => {
    const item = typeof source === "string" ? { url: source } : source;
    if (!item?.url) return null;
    const label = item.label || (() => { try { return new URL(item.url).hostname.replace(/^www\./, ""); } catch { return "Source"; } })();
    return { ...item, label };
  }).filter(Boolean);
  const personalTake = spot.verdict?.blurb || spot.highlight?.text || spot.regularNote || "";
  const threadRank = !topRank ? threadStandingForSpot(spot, redditData) : null;
  const quickAnswerParts = [
    searchProfile?.answer || null,
    topRank ? `${displayName(spot.name)} currently ranks #${topRank.rank} for ${topRank.label.toLowerCase()} with ${topRank.votes} of ${topRank.total} local votes.` : null,
    threadRank ? `${displayName(spot.name)} is #${threadRank.rank} for ${threadRank.label.toLowerCase()} in the recorded community result, with ${threadRank.votes} of ${threadRank.total} votes.` : null,
    !topRank && ballots[0] ? `${displayName(spot.name)} is on the Mapping HYD ballot for ${ballots[0].label.toLowerCase()}.` : null,
    personalTake ? `${spot.author?.name ? `${spot.author.name}'s take` : "Mapping HYD take"}: ${personalTake}` : null,
    spot.reviewedAt ? `Visited ${new Date(`${spot.reviewedAt}T00:00:00+05:30`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" })}.` : null,
  ].filter(Boolean);
  const quickAnswer = quickAnswerParts.join(" ");

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

      {quickAnswer && (
        <section className="spot-section" aria-label={`Quick answer about ${displayName(spot.name)}`}>
          <h2>Quick answer</h2>
          <p className="spot-prose">{quickAnswer}</p>
          {searchProfile?.facts?.length > 0 && (
            <ul className="spot-order-list">
              {searchProfile.facts.map((fact) => <li key={fact}>{fact}</li>)}
            </ul>
          )}
          {searchProfile?.source && (
            <p className="ask-muted">Source for the factual venue profile only, not Mapping HYD ranks or opinions: <a href={searchProfile.source.url} target="_blank" rel="noopener noreferrer">{searchProfile.source.label} ↗</a></p>
          )}
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
              <span>{context.areaRank <= 10 ? `most reviewed on Google of ${context.areaCount} ${context.plural} in ${context.area}` : `${context.plural} in ${context.area}`}</span>
            </div>
          )}
          {context.cityTopPct <= 25 && (
            <div className="sp-stat">
              <b>Top {context.cityTopPct}%</b>
              <span>of Hyderabad {context.plural} by Google review count</span>
            </div>
          )}
        </div>
      )}

      <dl className="sp-facts">
        {todaysHours && (<div><dt>Open today</dt><dd>{todaysHours}</dd></div>)}
        {(spot.visitSpend?.text || spot.costForTwo) && (
          <div><dt>{spot.visitSpend?.label || "Cost for two"}</dt><dd>{spot.visitSpend?.text || `₹${Number(spot.costForTwo).toLocaleString("en-IN")}`}</dd></div>
        )}
        {hasOwnedSignal && spot.rating && (
          <div><dt>Google rating</dt><dd>{spot.rating}★{spot.ratingCount ? ` (${Number(spot.ratingCount).toLocaleString("en-IN")})` : ""}</dd></div>
        )}
        {spot.founded && (<div><dt>Since</dt><dd>{spot.founded}</dd></div>)}
        {vibe.length > 0 && (<div><dt>Good for</dt><dd>{vibe.join(", ")}</dd></div>)}
        {spot.phone && (<div><dt>Phone</dt><dd><a href={`tel:${String(spot.phone).replace(/\s+/g, "")}`}>{spot.phone}</a></dd></div>)}
        {spot.website && (<div><dt>Website</dt><dd><a href={spot.website} target="_blank" rel="noopener noreferrer">{siteHost}</a></dd></div>)}
        {spot.zomatoUrl && (<div><dt>Order</dt><dd><a href={spot.zomatoUrl} target="_blank" rel="noopener noreferrer">Zomato</a></dd></div>)}
        {!latestSafety && (<div><dt>Food safety</dt><dd>No matched TG SAFE record in our current tracker; coverage is incomplete. <Link href="/food-safety">How we track</Link></dd></div>)}
      </dl>

      {spot.lat != null && spot.lng != null && (
        <section className="sp-where" aria-label="Where it is">
          <SpotsMapClient points={[{ lat: spot.lat, lng: spot.lng, kind: "spot", title: displayName(spot.name), sub: areaName || "Hyderabad" }]} height={180} />
          <div className="sp-where-row">
            <p>{spot.address || areaName || "Hyderabad"}</p>
            <Link href={`/#spot=${encodeURIComponent(spot.id)}`}>Open on our map</Link>
          </div>
        </section>
      )}

      {hasConsensus && (
        <section className="sp-says" aria-label="What locals say">
          <h2>{redditData?.thread || redditData?.brandData?.quotes?.praise?.length ? "What locals say" : "Mapping HYD's take"}</h2>
          {spot.signatureDish?.name && (
            <div className="sp-must">
              <span className="sp-label">Mapping HYD pick</span>
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
                  <>{reviewAuthorName} · {reviewAuthorRole}</>
                )}
              </p>
            </div>
            <Link href={`/#spot=${encodeURIComponent(spot.id)}`} className="review-map-link">
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

          {spot.visitItems?.length > 0 && (
            <section className="spot-section review-plates">
              <div className="review-section-head">
                <h2>What we tried</h2>
                <p>Items from this visit, not general menu recommendations</p>
              </div>
              <div className="review-dish-grid">
                {spot.visitItems.map((item, i) => (
                  <article key={i} className="review-dish review-dish--low">
                    <div className="review-dish-top">
                      <h3>{item.name}</h3>
                    </div>
                    {item.note && <p>{item.note}</p>}
                    <em>Visit note</em>
                  </article>
                ))}
              </div>
            </section>
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

          {(spot.originStory?.length > 0 || spot.regularNote) && (
            <section className="spot-section review-story">
              <div className="review-section-head">
                <h2>The visit</h2>
              </div>
              {(spot.originStory || []).map((para, i) => (
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
                      reviewAuthorName
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

          {(spot.contentScope || contentSources.length > 0) && (
            <section className="spot-section" aria-label="Editorial sources and scope">
              <h2>Sources and scope</h2>
              {spot.contentScope === "brand" && <p className="spot-prose">Brand-level information: dishes and experience can vary by branch.</p>}
              {spot.contentScope === "branch-comparison" && <p className="spot-prose">This editorial note compares multiple branches. Branch-specific details are identified in the text.</p>}
              {contentSources.length > 0 && (
                <div className="site-related-links">
                  {contentSources.map((source) => (
                    <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer nofollow">{source.label} ↗</a>
                  ))}
                </div>
              )}
              <p className="ask-muted">External sources support venue or menu facts; they do not prove Mapping HYD scores or first-hand opinions.</p>
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


          {hasValidRecommendation && <section className="spot-section" id="recommendations">
            <h2>What to order and why</h2>
            <RecommendationPanel place={recommendation} brand={recommendationModel.brands[recommendation.redditBrandId]} publishedDishes={recommendationModel.dishes.map((d) => d.id)} />
            <Link href={`/#spot=${encodeURIComponent(spot.id)}`} className="link-chip">Explore this branch on the map</Link>
          </section>}
          {localsPick && (
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
                    <a href={ev.url} target="_blank" rel="noopener noreferrer nofollow" className="link-chip">Read the comment on Reddit</a>
                    <span>{new Date(ev.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · {ev.score} upvotes</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <MustOrder spotId={spot.id} initial={dishSeeds} />

          {/* Offers right now - commented out for now */}
          {/*
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
          */}

          {(spot.contentScope || contentSources.length > 0) && (
            <section className="spot-section" aria-label="Editorial sources and scope">
              <h2>Sources and scope</h2>
              {spot.contentScope === "brand" && <p className="spot-prose">Brand-level information: dishes and experience can vary by branch.</p>}
              {spot.contentScope === "branch-comparison" && <p className="spot-prose">This editorial note compares multiple branches. Branch-specific details are identified in the text.</p>}
              {contentSources.length > 0 && (
                <div className="site-related-links">
                  {contentSources.map((source) => (
                    <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer nofollow">{source.label} ↗</a>
                  ))}
                </div>
              )}
              <p className="ask-muted">External sources support venue or menu facts; they do not prove Mapping HYD scores or first-hand opinions.</p>
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
                      spot.author?.name || "Mapping HYD"
                    )}
                    {" · "}
                    {spot.author?.role || "Editorial note"}
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
        <Link href={`/#spot=${encodeURIComponent(spot.id)}`} className="spot-claim-cta">Claim spot</Link>
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
  const t = title.replace(/[?!.,]+$/, "").replace(/\s+in\s+hyderabad$/i, "");
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
