import Link from "next/link";
import SiteChrome from "../components/SiteChrome.jsx";
import BottomNav from "../components/BottomNav.jsx";
import { getEateries, getEateryById, getChainSiblings, hasSpotPhoto, spotPath } from "../../lib/siteData.js";
import { pageMeta, getSiteUrl } from "../../lib/site.js";
import { ogImages } from "../../lib/og.js";
import { galleryPhotoUrl, spotPhotoUrl } from "../../lib/photos.js";
import { breadcrumbJsonLd } from "../../lib/schema.js";

const title = "Hyderabad Food Stories";
const description =
  "First-person notes on Hyderabad cafes and eateries: what the room feels like, what to order, and what to skip.";

export const metadata = {
  ...pageMeta({ title, description, path: "/stories" }),
  openGraph: {
    ...pageMeta({ title, description, path: "/stories" }).openGraph,
    images: ogImages(title, description),
  },
};

const CAT = {
  cafe: "Cafe",
  local: "Local eats",
  "restro-bar": "Restro bar",
  bakery: "Bakery",
  "ice-cream": "Ice cream",
  restaurant: "Restaurant",
};

function hasEditorial(e) {
  return Boolean(e.originStory?.length || e.regularNote || e.highlight?.text);
}

function storyRank(e) {
  // Explicitly featured write-ups first, then newest published, then richness.
  if (e.featured) return 2e12;
  const published = e.publishedAt ? Date.parse(e.publishedAt) || 0 : 0;
  const chapters = e.originStory?.length || 0;
  return published * 1e6 + chapters * 100000 + (e.ratingCount || 0);
}

function storySpots() {
  return getEateries()
    .filter(hasEditorial)
    .sort((a, b) => storyRank(b) - storyRank(a));
}

function storyImage(s) {
  if (s.gallery?.length) return galleryPhotoUrl(s.gallery[0]);
  if (hasSpotPhoto(s.id)) return spotPhotoUrl(s.id);
  return null;
}

function teaser(s) {
  return (
    s.highlight?.text ||
    s.originStory?.[0] ||
    s.regularNote ||
    (s.signatureDish?.name ? `Famous for ${s.signatureDish.name}.` : "")
  );
}

function branchLabel(s) {
  const area = s.discoveredIn || "Hyderabad";
  let extra = (s.name || "")
    .replace(/cafe\s+niloufer/i, "")
    .replace(/^[\-\s]+/, "")
    .trim();
  if (!extra) return area;
  if (/^hyderabad$/i.test(extra)) return area;
  if (/hitech|hitec/i.test(extra)) return "Hitec City";
  const first = extra.toLowerCase().split(/\s+/)[0];
  if (area.toLowerCase().includes(first)) return area;
  return `${area} · ${extra}`;
}

function FeaturedStory({ s }) {
  const img = storyImage(s);
  const blurb = teaser(s);
  return (
    <article className="stories-feature">
      <Link href={spotPath(s)} className="stories-feature-link">
        <div className="stories-feature-media">
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={img}
              alt={s.name}
              width={1200}
              height={750}
              decoding="async"
              loading="eager"
              fetchPriority="high"
            />
          ) : (
            <div className="stories-feature-fallback" aria-hidden />
          )}
        </div>
        <div className="stories-feature-copy">
          <p className="stories-eyebrow">Featured</p>
          <h2>{s.name.replace(/\s*\[.*?\]\s*$/, "")}</h2>
          <p className="stories-meta">
            {[CAT[s.category] || "Spot", s.discoveredIn].filter(Boolean).join(" · ")}
            {s.author?.name ? ` · By ${s.author.name}` : ""}
          </p>
          {blurb && <p className="stories-teaser">{blurb}</p>}
          {s.signatureDish?.name && (
            <p className="stories-order">Order the {s.signatureDish.name}</p>
          )}
          <span className="stories-cta">Read the story</span>
        </div>
      </Link>
    </article>
  );
}

function StoryRow({ s }) {
  const img = storyImage(s);
  const blurb = teaser(s);
  const short =
    blurb.length > 140 ? `${blurb.slice(0, 137).replace(/\s+\S*$/, "")}…` : blurb;
  return (
    <Link href={spotPath(s)} className="stories-row">
      <div className="stories-row-media">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt="" width={320} height={320} loading="lazy" decoding="async" />
        ) : (
          <div className="stories-row-fallback" aria-hidden />
        )}
      </div>
      <div className="stories-row-copy">
        <p className="stories-meta">
          {[CAT[s.category] || "Spot", s.discoveredIn].filter(Boolean).join(" · ")}
          {s.author?.name ? ` · By ${s.author.name}` : ""}
        </p>
        <h3>{s.name.replace(/\s*\[.*?\]\s*$/, "")}</h3>
        {short && <p className="stories-teaser">{short}</p>}
        {s.signatureDish?.name && (
          <p className="stories-order">Order the {s.signatureDish.name}</p>
        )}
      </div>
    </Link>
  );
}

function GuideCard() {
  return (
    <article className="stories-feature">
      <Link href="/guides/restaurants-in-sattva-knowledge-city-hyderabad" className="stories-feature-link">
        <div className="stories-feature-media">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://rmz-static.s3.dualstack.ap-south-1.amazonaws.com/01_998d11420c.webp"
            alt="Sattva Knowledge City, Knowledge Park, THE LOFT and RMZ Nexity restaurant guide"
            width={1200}
            height={750}
            decoding="async"
            loading="lazy"
          />
        </div>
        <div className="stories-feature-copy">
          <p className="stories-eyebrow">Area Guide</p>
          <h2>Sattva Knowledge City, Knowledge Park, THE LOFT &amp; RMZ Nexity</h2>
          <p className="stories-meta">
            60+ restaurants, cafes, bars and breweries · Raidurg &amp; Hi-Tech City belt · By Yogi
          </p>
          <p className="stories-teaser">
            Complete F&amp;B guide across four commercial developments in Hyderabad's tech belt, from Thai and Burmese to Telugu, Italian, Mediterranean and breweries.
          </p>
          <span className="stories-cta">Read the guide</span>
        </div>
      </Link>
      <p style={{ fontSize: 11, color: "var(--muted)", margin: "8px 4px 0", fontWeight: 600 }}>
        Source:{" "}
        <a href="https://x.com/YogiTweetz" target="_blank" rel="noopener noreferrer" style={{ color: "var(--violet)", textDecoration: "none" }}>
          @YogiTweetz on X
        </a>
      </p>
    </article>
  );
}

export default function StoriesPage() {
  const spots = storySpots();
  const [lead, ...rest] = spots;
  const nilouferMain = getEateryById("ChIJVy0-aGiXyzsRWMiIWZ1fC30");
  const nilouferLocations = nilouferMain
    ? [nilouferMain, ...getChainSiblings(nilouferMain)]
    : [];
  const leadImg = lead ? storyImage(lead) : null;

  const breadcrumbsLd = breadcrumbJsonLd([
    { name: "Home", url: getSiteUrl() },
    { name: "Stories", url: `${getSiteUrl()}/stories` },
  ]);

  return (
    <div style={{ paddingBottom: 84 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsLd) }} />
      {leadImg && (
        // eslint-disable-next-line @next/next/no-head-element
        <link rel="preload" as="image" href={leadImg} fetchPriority="high" />
      )}
      <SiteChrome
        active="/stories"
        breadcrumb={[{ href: "/", label: "Home" }, { href: "/stories", label: "Stories" }]}
        title={title}
        description={description}
        heroClass="site-hero--app site-hero--stories"
        navLinksHidden
        heroDecor
        related={[
          { href: "/explore", label: "Explore by category" },
          { href: "/areas", label: "Food by area" },
          { href: "/rankings", label: "Weekly rankings" },
        ]}
      >
        {lead && <FeaturedStory s={lead} />}
        <GuideCard />

        {rest.length > 0 && (
          <section className="stories-archive" aria-labelledby="stories-archive-title">
            <div className="stories-section-head">
              <h2 id="stories-archive-title">More stories</h2>
              <p>{rest.length + 1} spots with notes on what to order</p>
            </div>
            <div className="stories-list">
              {rest.map((s) => (
                <StoryRow key={s.id} s={s} />
              ))}
            </div>
          </section>
        )}

        <section className="stories-trail" aria-labelledby="stories-trail-title">
          <div className="stories-section-head">
            <h2 id="stories-trail-title">Irani chai trail</h2>
            <p>
              Start with Cafe Niloufer and Nimrah near Charminar. Branch notes live on each
              spot page.
            </p>
          </div>
          <ul className="stories-trail-list">
            {nilouferLocations.map((s) => {
              const hasStory = Boolean(s.originStory?.length || s.regularNote);
              return (
                <li key={s.id}>
                  <Link href={spotPath(s)}>
                    <span>{branchLabel(s)}</span>
                    {hasStory ? <em>Story</em> : <em className="is-quiet">Map</em>}
                  </Link>
                </li>
              );
            })}
            <li>
              <Link href="/spot/nimrah-cafe-and-bakery-charminar-old-city">
                <span>Nimrah Cafe & Bakery</span>
                <em>Story</em>
              </Link>
            </li>
            <li>
              <Link href="/explore/cafes">
                <span>All cafes on the map</span>
                <em className="is-quiet">Explore</em>
              </Link>
            </li>
          </ul>
        </section>

        <Link href="/" className="site-cta">
          Open the map
        </Link>
      </SiteChrome>
      <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 1300 }}>
        <BottomNav routed activeKey="stories" />
      </div>
    </div>
  );
}
