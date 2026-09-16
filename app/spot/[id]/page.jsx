import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import SiteChrome from "../../components/SiteChrome.jsx";
import BottomNav from "../../components/BottomNav.jsx";
import { getEateryBySlugOrId, getEateries, getEditorialSpotIds, getChainSiblings, areaPageHref, hasSpotPhoto, spotSlug, spotPath } from "../../../lib/siteData.js";
import { absoluteUrl, getSiteUrl, pageMeta } from "../../../lib/site.js";
import { galleryPhotoUrl, spotPhotoUrl } from "../../../lib/photos.js";
import { restaurantJsonLd, faqJsonLd } from "../../../lib/schema.js";
import { ogImages } from "../../../lib/og.js";

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
const PRERENDERED_SPOT_LIMIT = 200;

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
  const title = spot.discoveredIn && !spot.discoveredIn.startsWith("text:")
    ? `${spot.name}, ${spot.discoveredIn}, Hyderabad`
    : `${spot.name}, Hyderabad`;
  const editorial = spot.originStory?.[0]
    || (spot.signatureDish ? `Famous for ${spot.signatureDish.name}. ${spot.signatureDish.why}` : "");
  const description = editorial
    ? `${editorial} ${spot.rating ? `${spot.rating}★` : ""}${spot.ratingCount ? ` (${spot.ratingCount.toLocaleString("en-IN")} reviews)` : ""}, on Hyderabad Eats.`.trim()
    : `${spot.name} in ${spot.discoveredIn || "Hyderabad"}. ${spot.rating ? `Rated ${spot.rating}★` : ""} ${spot.ratingCount ? `(${spot.ratingCount.toLocaleString("en-IN")} reviews)` : ""}. Find on Hyderabad Eats map.`;
  const photo = hasSpotPhoto(spot.id) ? spotPhotoUrl(spot.id) : null;
  const base = pageMeta({ title, description, path: spotPath(spot), image: photo || undefined });
  return {
    ...base,
    openGraph: {
      ...base.openGraph,
      ...(photo
        ? { images: [{ url: absoluteUrl(photo), width: 800, height: 600, alt: spot.name }] }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(photo ? { images: [absoluteUrl(photo)] } : {}),
    },
  };
}

export default function SpotPage({ params }) {
  const siteUrl = getSiteUrl();
  const spot = getEateryBySlugOrId(params.id);
  if (!spot) notFound();
  const slug = spotSlug(spot);
  // Old Google Place ID URLs keep working; canonicalize to the name slug.
  if (params.id !== slug) permanentRedirect(spotPath(spot));

  const areaLink = areaPageHref(spot.discoveredIn);

  const jsonLd = restaurantJsonLd(spot, siteUrl, AUTHOR);
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
      {spot.faq?.length > 0 && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(spot.faq)) }} />
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

          {spot.faq?.length > 0 && (
            <section className="spot-section">
              <h2>Good to know</h2>
              <div className="spot-faq">
                {spot.faq.map((f, i) => (
                  <details key={i}>
                    <summary>{f.q}</summary>
                    <p>{f.a}</p>
                  </details>
                ))}
              </div>
            </section>
          )}

          <Link href={`/?spot=${encodeURIComponent(spot.id)}`} className="site-cta">Open on map &amp; stamp</Link>
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
              <Link href={`/?spot=${encodeURIComponent(spot.id)}`} className="site-cta">Open on map &amp; stamp</Link>
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

          {spot.faq?.length > 0 && (
            <section className="spot-section">
              <h2>Good to know</h2>
              <div className="spot-faq">
                {spot.faq.map((f, i) => (
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
