import Link from "next/link";
import SiteChrome from "../components/SiteChrome.jsx";
import BottomNav from "../components/BottomNav.jsx";
import StoriesTabs from "./StoriesTabs.jsx";
import { getEateries, getEateryById, getChainSiblings, hasSpotPhoto, spotPath } from "../../lib/siteData.js";
import { pageMeta, getSiteUrl } from "../../lib/site.js";
import { ogImages } from "../../lib/og.js";
import { galleryPhotoUrl, spotPhotoUrl } from "../../lib/photos.js";
import { breadcrumbJsonLd } from "../../lib/schema.js";
import RedditCommunityPost from "../components/RedditCommunityPost.jsx";
import { REDDIT_COMMUNITY_THREADS } from "../../lib/redditThreads.js";

const title = "Hyderabad Food Stories";
const description =
  "First-person notes and Reddit community threads on Hyderabad cafes, breweries, and eateries: what the room feels like, what to order, and what to skip.";

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
    <Link href={spotPath(s)} className="stories-row" data-cat={s.category || "other"}>
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

function GuideCard({ href, img, eyebrow, title, meta, teaser, source }) {
  return (
    <article className="stories-feature" style={{ marginBottom: 28 }}>
      <Link href={href} className="stories-feature-link">
        <div className="stories-feature-media">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img}
            alt={title}
            width={1200}
            height={750}
            decoding="async"
            loading="lazy"
          />
        </div>
        <div className="stories-feature-copy">
          <p className="stories-eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
          <p className="stories-meta">{meta}</p>
          <p className="stories-teaser">{teaser}</p>
          <span className="stories-cta">Read the guide</span>
        </div>
      </Link>
      {source && (
        <p style={{ fontSize: 11, color: "var(--muted)", margin: "8px 4px 0", fontWeight: 600 }}>
          Source:{" "}
          <span style={{ color: "var(--violet)" }}>{source}</span>
        </p>
      )}
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

  const guideCards = [
    <GuideCard
      key="/guides/best-breweries-in-hyderabad"
      href="/guides/best-breweries-in-hyderabad"
      img={spotPhotoUrl("ChIJPU_G2E6RyzsRs95LdTHxZek")}
      eyebrow="Microbreweries &amp; Craft Beers 2026"
      title="Best Breweries in Hyderabad: Top Microbreweries &amp; Craft Beers"
      meta="Prost · Zero40 · Broadway · Windmills · Forge · Red Rhino · Zythum"
      teaser="The definitive field guide to Hyderabad’s microbreweries: fresh Belgian Wits, crisp ciders, beer flights, and what to order from Jubilee Hills to Financial District."
      source="Local Beer Trails &amp; Verified Reviews"
    />,
    <GuideCard
      key="/guides/best-biryani-hyderabad-reddit"
      href="/guides/best-biryani-hyderabad-reddit"
      img={spotPhotoUrl("ChIJKyxGIoiXyzsRPY8PASGdTW0")}
      eyebrow="Reddit Local Consensus 2026"
      title="Best Biryani in Hyderabad According to r/hyderabad"
      meta="Shadab · The Nawaabs · Chicha's · Peshawar · Meridian · Shah Ghouse"
      teaser="Beyond generic commercial lists: authentic local consensus on spice levels, cuts of meat, and peak fresh batch timings across Old City, Gachibowli, and Lakdikapul."
      source="r/hyderabad Community & Local Foodies"
    />,
    <GuideCard
      key="/guides/best-tiffins-hyderabad-reddit"
      href="/guides/best-tiffins-hyderabad-reddit"
      img={spotPhotoUrl("ChIJIfN2naWRyzsRQ884HoebNm8")}
      eyebrow="Authentic Breakfast Guide 2026"
      title="Best Tiffins &amp; South Indian Breakfast in Hyderabad"
      meta="Ishtaa · Penam · Panchakattu Dosa · Kanchi Cafe · Taaza Kitchen"
      teaser="Where to get the crispest ghee karam dosas, piping hot pungaralu, 4-chutney spreads, and filter coffee, with real notes on weekend queues and consistency."
      source="r/hyderabad & Local Reviews"
    />,
    <GuideCard
      key="/guides/best-cafes-hyderabad-reddit"
      href="/guides/best-cafes-hyderabad-reddit"
      img={spotPhotoUrl("ChIJWUl-wiqXyzsRud1hDiZM0aM")}
      eyebrow="Specialty Coffee &amp; Work Cafes"
      title="Best Cafes in Hyderabad: Specialty Coffee, Work Corners &amp; Desserts"
      meta="Roastery Coffee House · Conçu · Roast CCX · True Black · Autumn Leaf"
      teaser="Hyderabad's top third-wave roasters, quiet laptop work corners with fast WiFi, world-class French patisserie, and heritage Irani chai spots."
      source="r/hyderabad & Local Coffee Trails"
    />,
    <GuideCard
      key="/guides/best-ice-cream-desserts-hyderabad"
      href="/guides/best-ice-cream-desserts-hyderabad"
      img={spotPhotoUrl("ChIJ____P32XyzsRr9xZqE9F7RU")}
      eyebrow="Heritage &amp; Artisanal Gelato"
      title="Best Ice Cream, Gelato &amp; Desserts in Hyderabad"
      meta="Famous Ice Cream (MJ Market) · Milano Gelato · Cream Stone · Huber &amp; Holly"
      teaser="From 1951 hand-churned seasonal pot ice creams (Sitaphal/Mango) at Mozamjahi Market to authentic Italian gelato and late-night cold-stone sundaes."
      source="r/hyderabad & Local Dessert Trails"
    />,
    <GuideCard
      key="/guides/late-night-food-hyderabad-reddit"
      href="/guides/late-night-food-hyderabad-reddit"
      img={spotPhotoUrl("ChIJj_WXSD2YyzsRF4pbftpAOxg")}
      eyebrow="Midnight to 5 AM Guide"
      title="Best Late Night Food &amp; 24/7 Eateries in Hyderabad"
      meta="DLF Street Food · Roast 24 Seven · Niloufer Banjara Hills · Shah Ghouse"
      teaser="Safe, verified food spots open past midnight: Maggi and momos at DLF, midnight Irani chai, 3 AM mutton biryani, and round-the-clock specialty cafes."
      source="r/hyderabad & Night Owl Food Trails"
    />,
    <GuideCard
      key="/guides/restaurants-in-sattva-knowledge-city-hyderabad"
      href="/guides/restaurants-in-sattva-knowledge-city-hyderabad"
      img="https://rmz-static.s3.dualstack.ap-south-1.amazonaws.com/01_998d11420c.webp"
      eyebrow="Commercial Hub Directory"
      title="Sattva Knowledge City, Knowledge Park, THE LOFT &amp; RMZ Nexity"
      meta="60+ restaurants, cafes, bars and breweries · Raidurg &amp; Hi-Tech City belt"
      teaser="Complete F&amp;B guide across four commercial developments in Hyderabad's tech belt, from Thai and Burmese to Telugu, Italian, Mediterranean and breweries."
      source="@YogiTweetz on X"
    />
  ];
  const catCounts = {};
  for (const x of rest) {
    const k = x.category || "other";
    catCounts[k] = (catCounts[k] || 0) + 1;
  }
  const cats = Object.entries(catCounts)
    .sort((x, y) => y[1] - x[1])
    .map(([key, count]) => ({ key, label: CAT[key] || "Other", count }));

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
        related={[
          { href: "/explore", label: "Explore by category" },
          { href: "/areas", label: "Food by area" },
          { href: "/rankings", label: "Weekly rankings" },
        ]}
      >
        <StoriesTabs
          guideCount={guideCards.length}
          storyCount={spots.length}
          cats={cats}
          featured={lead && <FeaturedStory s={lead} />}
          guides={
            <section className="stories-archive" aria-labelledby="curated-guides-title" style={{ marginTop: 24, marginBottom: 32 }}>
              <div className="stories-section-head">
                <h2 id="curated-guides-title">Curated Food Guides &amp; Deep Dives</h2>
                <p>Unbiased local consensus, verified batch timings, and neighborhood directories</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {guideCards}
              </div>

              <div style={{ marginTop: 36 }}>
                <div className="stories-section-head">
                  <h2>Weekly Food Races on r/hyderabad</h2>
                  <p>Live community ranking threads posted by u/EveningTarget3419 on r/hyderabad. No paid placements.</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {REDDIT_COMMUNITY_THREADS.map((thread) => (
                    <RedditCommunityPost key={thread.id} thread={thread} />
                  ))}
                </div>
              </div>
            </section>
          }
          stories={
    rest.length > 0 && (
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
            )
          }
          trail={
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
          }
        />

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
