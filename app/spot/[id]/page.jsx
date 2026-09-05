import Link from "next/link";
import { notFound } from "next/navigation";
import SiteChrome from "../../components/SiteChrome.jsx";
import BottomNav from "../../components/BottomNav.jsx";
import { getEateryById, getEateries, getEditorialSpotIds, getChainSiblings, areaSlug } from "../../../lib/siteData.js";
import { absoluteUrl, getSiteUrl, pageMeta } from "../../../lib/site.js";
import { restaurantJsonLd, faqJsonLd } from "../../../lib/schema.js";
import { ogImages } from "../../../lib/og.js";

const CAT_LABEL = {
  cafe: "Cafe", local: "Local Eats", "restro-bar": "Restro Bar", bakery: "Bakery", "ice-cream": "Ice Cream",
};

const AUTHOR = "Shiva";
const AUTHOR_ROLE = "Mapping HYD";

export function generateStaticParams() {
  const editorial = new Set(getEditorialSpotIds());
  return getEateries()
    .filter((e) => editorial.has(e.id) || (e.ratingCount || 0) >= 200)
    .map((e) => ({ id: e.id }));
}

export function generateMetadata({ params }) {
  const spot = getEateryById(params.id);
  if (!spot) return { title: "Spot not found, Hyderabad Eats" };
  const title = `${spot.name}, ${spot.discoveredIn || "Hyderabad"}`;
  const editorial = spot.originStory?.[0]
    || (spot.signatureDish ? `Famous for ${spot.signatureDish.name}. ${spot.signatureDish.why}` : "");
  const description = editorial
    ? `${editorial} ${spot.rating ? `${spot.rating}★` : ""}${spot.ratingCount ? ` (${spot.ratingCount.toLocaleString("en-IN")} reviews)` : ""}, on Hyderabad Eats.`.trim()
    : `${spot.name} in ${spot.discoveredIn || "Hyderabad"}. ${spot.rating ? `Rated ${spot.rating}★` : ""} ${spot.ratingCount ? `(${spot.ratingCount.toLocaleString("en-IN")} reviews)` : ""}. Find on Hyderabad Eats map.`;
  const photo = `/photos/${spot.id}.jpg`;
  return {
    ...pageMeta({ title, description, path: `/spot/${spot.id}`, image: photo }),
    openGraph: {
      ...pageMeta({ title, description, path: `/spot/${spot.id}`, image: photo }).openGraph,
      images: [{ url: absoluteUrl(photo), width: 800, height: 600, alt: spot.name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteUrl(photo)],
    },
  };
}

export default function SpotPage({ params }) {
  const siteUrl = getSiteUrl();
  const spot = getEateryById(params.id);
  if (!spot) notFound();

  const areaLink = spot.discoveredIn && !spot.discoveredIn.startsWith("text:")
    ? `/areas/${areaSlug(spot.discoveredIn)}`
    : null;

  const jsonLd = restaurantJsonLd(spot, siteUrl, AUTHOR);
  const heroImg = spot.gallery?.length ? `/photos/gallery/${spot.gallery[0]}` : `/photos/${spot.id}.jpg`;
  const galleryRest = spot.gallery?.length > 1 ? spot.gallery.slice(1) : [];
  const todaysHours = spot.hours?.length
    ? spot.hours[(new Date().getDay() + 6) % 7]?.split(": ").slice(1).join(": ")
    : null;
  const siblings = getChainSiblings(spot);
  const siblingsLabel = spot.name.toLowerCase().includes("niloufer")
    ? "Other Cafe Niloufer locations"
    : "Other locations";

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
        { href: `/spot/${spot.id}`, label: spot.name },
      ]}
      title={spot.name}
      description={`${CAT_LABEL[spot.category] || spot.category}${spot.discoveredIn ? ` · ${spot.discoveredIn}` : ""}${spot.rating ? ` · ${spot.rating}★` : ""}`}
      heroClass="site-hero--app"
      navLinksHidden
      heroDecor
      backFallback={spot.originStory?.length || spot.regularNote || spot.highlight ? "/stories" : "/"}
      related={[
        { href: "/", label: "Open on map" },
        { href: "/rankings", label: "Weekly rankings" },
        ...(areaLink ? [{ href: areaLink, label: `More in ${spot.discoveredIn}` }] : []),
        { href: `/explore/${spot.category === "local" ? "biryani-and-local" : spot.category === "restro-bar" ? "bars" : spot.category === "ice-cream" ? "ice-cream" : spot.category === "bakery" ? "bakeries" : "cafes"}`, label: `More ${CAT_LABEL[spot.category] || "spots"}` },
      ]}
    >
      <div className="site-spot-hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={heroImg} alt={spot.name} className={`site-spot-photo${spot.gallery?.length ? " site-spot-photo--full" : ""}`} />
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
          <span className="spot-highlight-label">★ {spot.highlight.label}</span>
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
                <Link href={`/spot/${s.id}`}>
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

      {spot.originStory?.length > 0 && (
        <section className="spot-section">
          <h2>The story</h2>
          {spot.originStory.map((p, i) => (<p key={i} className="spot-prose">{p}</p>))}
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
              <cite className="spot-regular-by">{AUTHOR} · {AUTHOR_ROLE}</cite>
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
              <img key={i} src={`/photos/gallery/${f}`} alt={`${spot.name}, photo ${i + 2}`} loading="lazy" />
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
    </SiteChrome>
    <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 1300 }}>
      <BottomNav routed activeKey={spot.originStory?.length || spot.regularNote || spot.highlight ? "stories" : "map"} />
    </div>
    </div>
    </>
  );
}
