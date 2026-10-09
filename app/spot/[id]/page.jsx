import fs from "fs";
import path from "path";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import SiteChrome from "../../components/SiteChrome.jsx";
import BottomNav from "../../components/BottomNav.jsx";
import { getEateryBySlugOrId, getEateries, getEditorialSpotIds, getChainSiblings, areaPageHref, hasSpotPhoto, spotSlug, spotPath } from "../../../lib/siteData.js";
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
import { Icon } from "../../components/Icons.jsx";
import ShareSpotButton from "../../components/ShareSpotButton.jsx";

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
  // The layout template appends " | Mapping HYD Eats" (18 chars), so aim for <= 42 here.
  const place = area === "Hyderabad" || name.toLowerCase().includes(area.toLowerCase()) ? name : `${name}, ${area}`;
  const rated = spot.rating ? `${spot.rating}★ ` : "";
  // Searchers explicitly query: "{name} reviews", "{name} menu", "{name} must order"
  const candidates = [
    `${place}: Reviews, Menu & Must-Orders`,
    `${place}: Reviews, Menu & Prices`,
    `${place}: Reviews & Menu`,
    `${place}: ${rated}Reviews & Hours`,
    place,
    name,
  ];
  // Target max 44-52 chars for the title fragment so with "| Mapping HYD Eats" it stays under ~65 chars.
  const title = candidates.find((t) => t.length <= 44) || candidates.find((t) => t.length <= 54) || place;

  const cleanEditorial = (spot.originStory?.[0]
    || (spot.signatureDish ? `Famous for ${spot.signatureDish.name}. ${spot.signatureDish.why}` : "")).replace(/—/g, ",");
  const ratingDetails = spot.rating ? `${spot.rating}★ rating (${spot.ratingCount ? spot.ratingCount.toLocaleString("en-IN") : ""} reviews). ` : "";
  const costDetails = spot.costForTwo ? `₹${Number(spot.costForTwo).toLocaleString("en-IN")} for two. ` : "";
  const dishHook = spot.signatureDish?.name ? `Must-try: ${spot.signatureDish.name}. ` : "";
  const description = `${ratingDetails}${costDetails}${dishHook}${cleanEditorial || `${name} in ${area}.`} Explore menu prices, hours, reviews, and TG food safety status on Hyderabad Eats.`
    .replace(/—/g, ",")
    .trim();

  const photo = hasSpotPhoto(spot.id) ? spotPhotoUrl(spot.id) : null;
  // Static hosting has no /api/og renderer: share the venue photo, else the site card.
  const ogCardUrl = absoluteUrl(photo || "/og/home.png");
  const base = pageMeta({ title, description, path: spotPath(spot), image: ogCardUrl });
  return {
    ...base,
    // Outside the core list and not recommended: reachable, but kept out of Google's index.
    // Recommended adds to the core list; it never removes pages that are indexed today.
    ...((spot.core || (recommendationsEnabled() && recommendationFor(spot.id)?.recommended)) ? {} : { robots: { index: false, follow: true } }),
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
  };
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

  let dishSeeds = null;
  try {
    const seeds = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "dish-seeds.json"), "utf-8"));
    dishSeeds = (seeds[spot.id] || []).map((d) => ({ ...d, up: 0, down: 0 }));
  } catch {}

  let spotOffers = null;
  try {
    const curatedPath = path.join(process.cwd(), "data", "curated-offers.json");
    if (fs.existsSync(curatedPath)) {
      const parsed = JSON.parse(fs.readFileSync(curatedPath, "utf-8"));
      spotOffers = verifiedOffers(parsed.spots?.[spot.id]);
    }
  } catch {}

  const jsonLd = restaurantJsonLd(spot, siteUrl, AUTHOR);
  const faqs = getSpotFaqs(spot, { spotOffers, safety });
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
  const todaysHours = spot.hours?.length
    ? spot.hours[(new Date().getDay() + 6) % 7]?.split(": ").slice(1).join(": ")
    : null;
  const siblings = getChainSiblings(spot);
  const siblingsLabel = spot.name.toLowerCase().includes("niloufer")
    ? "Other Cafe Niloufer locations"
    : "Other locations";

  const nameLower = (spot.name || "").toLowerCase();
  const rankingLinks = [];
  if (nameLower.includes("niloufer")) {
    rankingLinks.push({ href: "/rankings/best-irani-cafe-in-hyderabad", label: "Best Irani cafe ranking" });
  }
  if (nameLower.includes("paradise") || nameLower.includes("shah ghouse")) {
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

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsLd) }} />
      {faqs.length > 0 && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(faqs)) }} />
      )}
    <div style={{ paddingBottom: 84 }}>
    <SiteChrome
      breadcrumb={[
        { href: "/", label: "Home" },
        ...(areaLink ? [{ href: areaLink, label: spot.discoveredIn }] : []),
        { href: spotPath(spot), label: spot.name },
      ]}
      title={isReview ? displayName(spot.name) : spot.name}
      description={`${CAT_LABEL[spot.category] || spot.category}${spot.discoveredIn ? ` · ${spot.discoveredIn}` : ""}${spot.rating ? ` · ${spot.rating}★` : ""}`}
      heroClass={isReview ? "site-hero--app site-hero--stories" : "site-hero--app"}
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
      {/* Race Claim Banner */}
      <div style={{
        background: "linear-gradient(135deg, var(--violet-wash) 0%, rgba(124,58,237,0.12) 100%)",
        border: "1.5px solid rgba(124,58,237,0.25)",
        borderRadius: 20,
        padding: "14px 18px",
        marginBottom: 20,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        boxShadow: "0 2px 10px rgba(124,58,237,0.08)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <span style={{
            width: 40, height: 40, borderRadius: "50%",
            background: "var(--violet)", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, boxShadow: "0 3px 8px rgba(124,58,237,0.3)"
          }}>
            <Icon name="trophy" size={20} width={2.1} color="#fff" />
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 14.5, color: "var(--ink)", lineHeight: 1.25 }}>
              Ate at {displayName(spot.name)}?
            </div>
            <div style={{ fontSize: 12.5, color: "var(--violet-deep)", fontWeight: 600, marginTop: 2 }}>
              Claim +{tier.points} pts in The Hyderabad Food Race
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <ShareSpotButton spotName={displayName(spot.name)} spotPath={spotPath(spot)} />
          <Link
            href={`/?spot=${encodeURIComponent(spot.id)}`}
            className="pressable-sm"
            style={{
              padding: "8px 16px",
              borderRadius: "var(--r-pill)",
              background: "var(--violet)",
              color: "#fff",
              fontSize: 12.5,
              fontWeight: 750,
              textDecoration: "none",
              whiteSpace: "nowrap",
              flexShrink: 0,
              boxShadow: "0 2px 6px rgba(124,58,237,0.25)"
            }}
          >
            Claim Spot →
          </Link>
        </div>
      </div>

      {/* Princeton GEO Consensus Summary Block */}
      <div
        className="spot-consensus-lead"
        style={{
          background: "var(--cream-hi, #fbf7f0)",
          border: "1.5px solid rgba(124, 58, 237, 0.16)",
          borderRadius: 16,
          padding: "16px 20px",
          marginBottom: 22,
          boxShadow: "0 2px 8px rgba(124, 58, 237, 0.04)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--violet-deep)" }}>
            Verified Community Consensus
          </span>
        </div>
        <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, color: "var(--ink)" }}>
          According to Hyderabad Eats community data and verified diner reviews, <strong>{displayName(spot.name)}</strong> is a top-rated {CAT_LABEL[spot.category] || "eatery"} in {spot.discoveredIn || "Hyderabad"}{spot.rating ? ` with a ${spot.rating}★ Google rating` : ""}{spot.ratingCount ? ` across ${spot.ratingCount.toLocaleString("en-IN")} reviews` : ""}. {spot.signatureDish?.name ? <>Renowned for its <strong>{spot.signatureDish.name}</strong>{spot.signatureDish.why ? ` (${spot.signatureDish.why.replace(/—/g, ",")})` : ""}. </> : ""}{spot.costForTwo ? `Approximate spend is ₹${spot.costForTwo} for two. ` : ""}{safety?.length > 0 ? `Verified TG Food Safety inspected. ` : ""}
        </p>
      </div>

      {isReview ? (
        <div className="review">
          {heroImg && (
            <figure className="review-hero">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={heroImg} alt={displayName(spot.name)} />
              <figcaption>
                {CAT_LABEL[spot.category] || "Spot"}
                {spot.discoveredIn ? ` · ${spot.discoveredIn}` : ""}
              </figcaption>
            </figure>
          )}

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

          <section className="review-facts" aria-label="Visit details">
            <div className="review-facts-grid">
              {todaysHours && (
                <div className="review-fact">
                  <span className="review-fact-label">Open today</span>
                  <span className="review-fact-value">{todaysHours}</span>
                </div>
              )}
              {(spot.visitSpend?.text || spot.costForTwo || spot.priceLevel) && (
                <div className="review-fact review-fact--accent">
                  <span className="review-fact-label">{spot.visitSpend?.label || "Spend"}</span>
                  <span className="review-fact-value">
                    {spot.visitSpend?.text
                      || (spot.costForTwo ? `About ₹${Number(spot.costForTwo).toLocaleString("en-IN")} for two` : "Premium")}
                  </span>
                </div>
              )}
              {(spot.vibeLabels?.length || spot.tags?.length) && (
                <div className="review-fact">
                  <span className="review-fact-label">Vibe</span>
                  <span className="review-fact-value">
                    {(spot.vibeLabels || spot.tags.map((tag) => tag.replace(/-/g, " "))).join(" · ")}
                  </span>
                </div>
              )}
              {spot.phone && (
                <div className="review-fact">
                  <span className="review-fact-label">Phone</span>
                  <a className="review-fact-value" href={`tel:${String(spot.phone).replace(/\s+/g, "")}`}>{spot.phone}</a>
                </div>
              )}
              {spot.website && (
                <div className="review-fact">
                  <span className="review-fact-label">Website</span>
                  <a className="review-fact-value" href={spot.website} target="_blank" rel="noopener noreferrer">
                    {(() => { try { return new URL(spot.website).hostname.replace(/^www\./, ""); } catch { return "Visit"; } })()}
                  </a>
                </div>
              )}
            </div>
          </section>

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

          <Link href={`/?spot=${encodeURIComponent(spot.id)}`} className="site-cta">Open on map &amp; claim +{tier.points} pts</Link>
        </div>
      ) : (
        <>
          <div className="site-spot-hero">
            {heroImg && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={heroImg} alt={spot.name} className={`site-spot-photo${spot.gallery?.length ? " site-spot-photo--full" : ""}`} />
              </>
            )}
            <div>
              <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--ink-soft)", margin: "0 0 12px" }}>
                {spot.address || spot.discoveredIn || "Hyderabad"}
              </p>
              {spot.rating && (
                <p style={{ fontWeight: 700, margin: "0 0 8px" }}>{spot.rating}★ · {spot.ratingCount?.toLocaleString("en-IN")} reviews</p>
              )}
              {spot.tags?.length > 0 && (
                <p style={{ fontSize: 13, color: "var(--muted)" }}>{spot.tags.join(" · ")}</p>
              )}
              <Link href={`/?spot=${encodeURIComponent(spot.id)}`} className="site-cta">Open on map &amp; claim +{tier.points} pts</Link>
            </div>
          </div>

          {spot.highlight?.text && (
            <div className="spot-highlight">
              <span className="spot-highlight-label">★ {spot.highlight.label || "Highlight"}</span>
              <p>{spot.highlight.text}</p>
            </div>
          )}

          <dl className="spot-facts">
            {todaysHours && (<div><dt>Open today</dt><dd>{todaysHours}</dd></div>)}
            {spot.costForTwo && (<div><dt>Cost for two</dt><dd>₹{spot.costForTwo}</dd></div>)}
            {spot.founded && (<div><dt>Since</dt><dd>{spot.founded}</dd></div>)}
            {spot.phone && (<div><dt>Phone</dt><dd>{spot.phone}</dd></div>)}
            {spot.website && (<div><dt>Website</dt><dd><a href={spot.website} target="_blank" rel="noopener noreferrer">Visit</a></dd></div>)}
            {spot.zomatoUrl && (<div><dt>Order</dt><dd><a href={spot.zomatoUrl} target="_blank" rel="noopener noreferrer">Zomato</a></dd></div>)}
          </dl>

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
            <section className="spot-section" style={{ background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: 20, padding: 20 }}>
              <h2 style={{ color: "#9f1239", fontSize: 16, margin: "0 0 12px", display: "flex", alignItems: "center", gap: 8 }}>
                Dining Offers &amp; Deals
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
                {spotOffers.district?.hasOffers && (
                  <div style={{ background: "#ffffff", borderRadius: 14, padding: "14px 16px", border: "1px solid #fed7aa" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <strong style={{ color: "#c2410c", fontSize: 13 }}>District by Zomato</strong>
                      {spotOffers.district.url && (
                        <a href={spotOffers.district.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 700, color: "#ea580c" }}>
                          Book Table →
                        </a>
                      )}
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: "#334155", lineHeight: 1.6 }}>
                      {spotOffers.district.offers.map((off, i) => (
                        <li key={i}>
                          <strong>{off.title}</strong>{off.desc ? ` — ${off.desc}` : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {spotOffers.swiggy?.hasOffers && (
                  <div style={{ background: "#ffffff", borderRadius: 14, padding: "14px 16px", border: "1px solid #fed7aa" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <strong style={{ color: "#ea580c", fontSize: 13 }}>Swiggy Dineout</strong>
                      {spotOffers.swiggy.url && (
                        <a href={spotOffers.swiggy.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 700, color: "#ea580c" }}>
                          Pay Bill &amp; Save →
                        </a>
                      )}
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: "#334155", lineHeight: 1.6 }}>
                      {spotOffers.swiggy.offers.map((off, i) => (
                        <li key={i}>
                          <strong>{off.title}</strong>{off.desc ? ` — ${off.desc}` : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>
          )}

          {safety.length > 0 && (
            <section className="fs-record" aria-label="Food safety record">
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
    </SiteChrome>
    <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 1300 }}>
      <BottomNav routed activeKey={spot.originStory?.length || spot.regularNote || spot.highlight ? "stories" : "map"} />
    </div>
    </div>
    </>
  );
}
