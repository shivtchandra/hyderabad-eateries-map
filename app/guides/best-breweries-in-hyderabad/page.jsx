import Link from "next/link";
import { pageMeta } from "../../../lib/site.js";
import { ogImages } from "../../../lib/og.js";
import { SiteNav, SiteBreadcrumb, SiteFooter, SiteRelated } from "../../components/SiteChrome.jsx";
import { Icon } from "../../components/Icons.jsx";
import BottomNav from "../../components/BottomNav.jsx";
import BackButton from "../../components/BackButton.jsx";
import { spotPhotoUrl } from "../../../lib/photos.js";
import RedditCommunityPost from "../../components/RedditCommunityPost.jsx";
import { getThreadForCategory } from "../../../lib/redditThreads.js";

const SLUG = "/guides/best-breweries-in-hyderabad";
const TITLE = "Best Breweries in Hyderabad (2026): Top Microbreweries & Craft Beers";
const DESCRIPTION =
  "The definitive local guide to Hyderabad's top microbreweries: Broadway, Zero40, Prost, Windmills, Forge, Red Rhino, Zythum, and Onegolf. Craft beers on tap, vibes, and what to order.";

export const metadata = {
  ...pageMeta({ title: TITLE, description: DESCRIPTION, path: SLUG }),
  openGraph: {
    ...pageMeta({ title: TITLE, description: DESCRIPTION, path: SLUG }).openGraph,
    images: ogImages(TITLE, DESCRIPTION, SLUG),
  },
  keywords: [
    "best breweries in hyd",
    "best breweries in hyderabad",
    "best microbreweries in hyderabad",
    "craft beer hyderabad",
    "best breweries in jubilee hills",
    "microbrewery hyderabad",
    "prost hyderabad review",
    "zero40 brewing hyderabad",
    "broadway the brewery hyderabad",
    "windmills craftworks hyderabad",
    "forge breu hous hyderabad",
    "breweries financial district hyderabad",
    "top breweries in hyderabad with price",
  ],
};

const discussionLd = {
  "@context": "https://schema.org",
  "@type": "DiscussionForumPosting",
  headline: "This week we're ranking the best breweries in Hyderabad. Current standings inside.",
  url: "https://www.reddit.com/r/hyderabad/comments/1whsnai/this_week_were_ranking_the_best_breweries_in/",
  author: {
    "@type": "Person",
    name: "u/EveningTarget3419",
  },
  interactionStatistic: [
    {
      "@type": "InteractionCounter",
      interactionType: "https://schema.org/LikeAction",
      userInteractionCount: 5,
    },
    {
      "@type": "InteractionCounter",
      interactionType: "https://schema.org/CommentAction",
      userInteractionCount: 21,
    },
  ],
};

const articleLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: TITLE,
  description: DESCRIPTION,
  url: "https://eats.mapmyhyd.com" + SLUG,
  datePublished: "2026-10-09",
  dateModified: "2026-10-09",
  author: {
    "@type": "Organization",
    name: "Mapping HYD Eats Editorial Team",
  },
  publisher: {
    "@type": "Organization",
    name: "Hyderabad Eats",
    url: "https://eats.mapmyhyd.com",
  },
};

const breadcrumbLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://eats.mapmyhyd.com" },
    { "@type": "ListItem", position: 2, name: "Stories & Guides", item: "https://eats.mapmyhyd.com/stories" },
    { "@type": "ListItem", position: 3, name: "Best Breweries Guide", item: "https://eats.mapmyhyd.com" + SLUG },
  ],
};

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Which brewery in Hyderabad has the best craft beer?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Zero40 Brewing (Jubilee Hills & Financial District) and Windmills Craftworks (Madhapur) are widely considered the benchmark craft beer purists in Hyderabad. Zero40 is praised for its seasonal Belgian Wits and Cherry Beer-Ritas, while Windmills crafts exceptional German Hefeweizens and Golden Ales.",
      },
    },
    {
      "@type": "Question",
      name: "What are the best microbreweries in Jubilee Hills?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Jubilee Hills is Hyderabad's microbrewery capital. Top spots include Prost Brewpub (steampunk landmark with 18,000+ reviews), Broadway The Brewery (massive glasshouse with sports screenings and wood-fired pizzas), Zero40 Brewing (relaxing alfresco vibes), Forge Breu-Hous (poolside deck), and Zythum Brewing Co.",
      },
    },
    {
      "@type": "Question",
      name: "Which breweries are best in Financial District & Madhapur?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "In the Cyberabad / Financial District tech corridor, the top breweries are Zero40 Financial District (sprawling green lawns), Red Rhino at Dallas Center, Windmills Craftworks in Sattva Knowledge City, Onegolf Brewery (with golf simulators), and The Beer Cartel in Sattva Knowledge Park.",
      },
    },
    {
      "@type": "Question",
      name: "What is the average cost for two at Hyderabad microbreweries?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A craft beer session for two in Hyderabad typically ranges between ₹1,800 and ₹2,600, covering a beer sampler flight (or 3-4 pints) and two food starters or pizzas. Windmills Craftworks sits on the higher end (₹2,800+), while daytime happy hours and weekday flights offer great value across most spots.",
      },
    },
    {
      "@type": "Question",
      name: "What fresh craft beer styles are brewed in Hyderabad?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Most Hyderabad microbreweries pour 5-8 styles on tap: Belgian Witbier (citrus/coriander), German Hefeweizen (banana/clove notes), Irish Red Ale, Apple Cider, India Pale Ale (IPA), and Oatmeal or Chocolate Stouts. Seasonal brews like Mango Wit and Spiced Ales frequently rotate during summer and winter.",
      },
    },
  ],
};

const SPOTS = [
  {
    id: "broadway",
    name: "Broadway The Brewery",
    tag: "Match Screenings & Energy",
    tagBg: "#fdf2f8",
    tagColor: "#86198f",
    redditBadge: "#1 in r/hyderabad Food Race (19 Votes)",
    area: "CBI Colony, Jubilee Hills",
    href: "/spot/broadway-the-brewery",
    photo: spotPhotoUrl("ChIJ7Ytbpx2RyzsRhX0HHSG12lQ"),
    rating: "4.3",
    reviews: "10.8k reviews",
    priceForTwo: "₹2,200 for 2",
    verdict:
      "Massive glasshouse amphitheatre in Jubilee Hills with towering copper kettles, stadium screens for live matches, and buzzing weekend DJ sets.",
    craftBeers: "Apple Beer (must-try!), Irish Red Ale, Belgian Wit, Dark Matter Stout",
    whatToOrder: "Apple Beer, Wood-Fired Chicken Pizza, Ghee Roast Chicken, Truffle Fries",
    vibeTip: "Electric on match nights. Grab terrace seating before 8 PM if you want conversation.",
  },
  {
    id: "zero40",
    name: "Zero40 Brewing",
    tag: "Craft Beer Purist",
    tagBg: "#f0fdf4",
    tagColor: "#166534",
    redditBadge: "Craft Beer Consensus Contender on r/hyderabad",
    area: "Road No. 10, Jubilee Hills & Financial District",
    href: "/spot/zero40-brewing-jubilee-hills",
    photo: spotPhotoUrl("ChIJZ_3mlzCRyzsRNcddIknL_CU"),
    rating: "4.3",
    reviews: "14k reviews",
    priceForTwo: "₹2,000 for 2",
    verdict:
      "The city's darling for craft beer nuance. Sunlit glasshouse and green courtyards with balanced Belgian Wits and bold IPAs.",
    craftBeers: "Vincent Van Wit (Belgian Wit), Reet (Ginger Beer), Cherry Beer-Rita",
    whatToOrder: "Beer Tasting Flight, Ghee Roast Chicken Pizza, Pulled Pork Sliders",
    vibeTip: "Relaxed outdoor seating with conversational music volume during early evenings.",
  },
  {
    id: "prost",
    name: "Prost Brewpub",
    tag: "Steampunk Landmark",
    tagBg: "#fef3c7",
    tagColor: "#92400e",
    redditBadge: "#3 in r/hyderabad Food Race (3 Votes)",
    area: "Road No. 45, Jubilee Hills",
    href: "/spot/prost-jubilee-hills",
    photo: spotPhotoUrl("ChIJPU_G2E6RyzsRs95LdTHxZek"),
    rating: "4.3",
    reviews: "18.8k reviews",
    priceForTwo: "₹2,200 for 2",
    verdict:
      "Multi-level steampunk heavyweight on Road 45 with exposed pipes, high-energy weekend DJ sets, and legendary bar snacks.",
    craftBeers: "Apple Beer (signature tap!), Belgian Wit, Bangalore Daze IPA",
    whatToOrder: "Kodi Chips (must-order!), Cheese Balls, Chicken Popcorn, Apple Beer",
    vibeTip: "Intense weekend rush. Arrive before 7:30 PM on Fri/Sat or book ahead to avoid door lines.",
  },
  {
    id: "windmills",
    name: "Windmills Craftworks",
    tag: "Library Vibe & Refined Dining",
    tagBg: "#eff6ff",
    tagColor: "#1d4ed8",
    area: "Sattva Knowledge City, Madhapur",
    href: "/spot/windmills-craftworks-madhapur-madhapur",
    photo: spotPhotoUrl("ChIJV47u-zeTyzsRg1GyNX8ogOQ"),
    rating: "4.6",
    reviews: "Top-rated in Cyberabad",
    priceForTwo: "₹2,800 for 2",
    verdict:
      "Upscale library lounge with acoustic architecture and hundreds of curated books. Refined date-night spot with smooth jazz.",
    craftBeers: "German Hefeweizen (gold standard), Golden Ale, Stout",
    whatToOrder: "Hefeweizen Pint, Butternut Squash Risotto, Bacon-Wrapped Sausages",
    vibeTip: "Quiet and conversational. The best brewery in Hyderabad for dates where you want to actually talk.",
  },
  {
    id: "forge",
    name: "Forge Breu-Hous",
    tag: "Poolside Deck & Alfresco",
    tagBg: "#fff7ed",
    tagColor: "#9a3412",
    area: "Road No. 36, Jubilee Hills",
    href: "/spot/forge-breu-hous-jubilee-hills",
    photo: spotPhotoUrl("ChIJR3kyF-6RyzsR7s1vrhhYBEg"),
    rating: "4.5",
    reviews: "3.1k reviews",
    priceForTwo: "₹2,000 for 2",
    verdict:
      "Industrial warehouse design with an open poolside deck and breezy rooftop terrace overlooking Road 36.",
    craftBeers: "Adam’s Route Cider, Loki’s Wit, House IPA",
    whatToOrder: "Peri Peri Chicken Skewers, Thin-Crust Pizza, Craft Cider",
    vibeTip: "Poolside deck tables during sunset are prime seats for a relaxed evening.",
  },
  {
    id: "redrhino",
    name: "Red Rhino",
    tag: "Tech Belt Taproom",
    tagBg: "#f5f3ff",
    tagColor: "#6d28d9",
    area: "Dallas Center, Financial District",
    href: "/spot/red-rhino-madhapur",
    photo: spotPhotoUrl("ChIJ97bwQweTyzsRdFUn0_v-2eA"),
    rating: "4.5",
    reviews: "4.3k reviews",
    priceForTwo: "₹2,200 for 2",
    verdict:
      "Sleek tech-corridor taproom at Dallas Center pouring Bangalore Daze IPA, built for after-work team pints and IPAs.",
    craftBeers: "Bangalore Daze IPA (top pick!), Belgian Wit, Black Knight Stout",
    whatToOrder: "Bangalore Daze Pint, Mezze Platter, Wood-Fired Margherita, Chilli Pork",
    vibeTip: "Peak after-work crowd from 6 PM to 9 PM; vibrant taproom vibe later.",
  },
  {
    id: "zythum",
    name: "Zythum Brewing Co.",
    tag: "Egyptian Themed Rooftop",
    tagBg: "#fef9c3",
    tagColor: "#854d0e",
    area: "Road No. 36, Jubilee Hills",
    href: "/spot/zythum-brewing-co-jubilee-hills",
    photo: spotPhotoUrl("ChIJ26RxOfiRyzsR8Q68u_UqP2Y"),
    rating: "4.5",
    reviews: "3.8k reviews",
    priceForTwo: "₹2,000 for 2",
    verdict:
      "Three-floor Egyptian-themed microbrewery with expansive community seating, rooftop breezes, and live music.",
    craftBeers: "Spaten Wheat, Zythos Signature, Dark Dunkel",
    whatToOrder: "Loaded Nachos Grande, Spicy Chicken Tikka, Crispy Chilli Corn",
    vibeTip: "Top floor terrace is scenic; live acoustic singers perform Thursdays and Sundays.",
  },
  {
    id: "onegolf",
    name: "Onegolf Brewery",
    tag: "Craft Beer & Golf Bays",
    tagBg: "#ecfdf5",
    tagColor: "#065f46",
    area: "Financial District / Gandipet",
    href: "/spot/onegolf-brewery-financial-district",
    photo: spotPhotoUrl("ChIJN3OZCzOTyzsRMnzgaAdgXKM"),
    rating: "4.3",
    reviews: "7.1k reviews",
    priceForTwo: "₹2,500 for 2",
    verdict:
      "Virtual golf simulator bays meet microbrewery with massive outdoor lawns in Gandipet, great for active group hangouts.",
    craftBeers: "Belgian Wit, German Wheat, Craft Cider",
    whatToOrder: "Craft Beer Pitcher, Handcrafted Burgers, BBQ Chicken Wings",
    vibeTip: "Book a simulator bay ahead on weekends; lawn seating is great for large groups.",
  },
  {
    id: "hoppery",
    name: "The Hoppery",
    tag: "Lake Views & Romantic Cottage",
    tagBg: "#f0fdf4",
    tagColor: "#15803d",
    area: "Road No. 36, Jubilee Hills",
    href: "/spot/the-hoppery-road-no-36-jh",
    photo: spotPhotoUrl("ChIJSfsvCFGRyzsRVVHDEqPTedg"),
    rating: "4.1",
    reviews: "1.6k reviews",
    priceForTwo: "₹2,200 for 2",
    verdict:
      "Charming European glasshouse cottage perched beside Durgam Cheruvu lake. Best sunset date-night view in Jubilee Hills.",
    craftBeers: "Apple & Pear Cider (signature), House Witbier, Pale Ale",
    whatToOrder: "Apple & Pear Cider, Truffle Fries, Artisanal Thin Crust Pizza",
    vibeTip: "Arrive around 5:30 PM for sunset over Durgam Cheruvu before the night rush.",
  },
  {
    id: "beercartel",
    name: "The Beer Cartel",
    tag: "Knowledge Park Quick Pints",
    tagBg: "#fef2f2",
    tagColor: "#991b1b",
    area: "Sattva Knowledge Park, Raidurg",
    href: "/spot/the-beer-cartel",
    photo: spotPhotoUrl("ChIJEy_-QQCTyzsR_6KR4VJT4t8"),
    rating: "4.5",
    reviews: "1.1k reviews",
    priceForTwo: "₹1,800 for 2",
    verdict:
      "Convenient taproom inside Knowledge Park for after-work craft lagers without battling cross-city traffic.",
    craftBeers: "Craft Pilsner, Belgian Wit, Seasonal Fruit Brews",
    whatToOrder: "Cold Beer Flight, Cartel Chicken Wings, Masala Peanut Chaat",
    vibeTip: "Fills up quickly between 5:30 PM and 8 PM as nearby tech offices clock out.",
  },
];

const itemListLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: TITLE,
  description: DESCRIPTION,
  numberOfItems: SPOTS.length,
  itemListElement: SPOTS.map((s, idx) => ({
    "@type": "ListItem",
    position: idx + 1,
    name: s.name,
    url: "https://eats.mapmyhyd.com" + s.href,
  })),
};

export default function BestBreweriesGuidePage() {
  const breweryThread = getThreadForCategory("breweries");

  return (
    <div className="site-page" style={{ paddingBottom: 84 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(discussionLd) }} />

      <header className="site-header">
        <div className="site-header-inner">
          <SiteNav active="/stories" />
          <BackButton fallback="/stories" />
          <SiteBreadcrumb
            items={[
              { href: "/", label: "Home" },
              { href: "/stories", label: "Stories & Guides" },
              { href: SLUG, label: "Best Breweries Guide" },
            ]}
          />
          <div className="site-hero">
            <h1>Best Breweries in Hyderabad (2026)</h1>
            <p>
              The candid, local field guide to Hyderabad’s top microbreweries: craft beers on tap, tasting flights, wood-fired pizzas, and where to book for dates vs loud match screenings.
            </p>
          </div>
        </div>
      </header>

      <main className="site-body">
        {/* Byline */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: "1.5px solid var(--line)" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--violet)" }}>
              Field Guide · Backed by r/hyderabad Community Votes
            </div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 3 }}>
              Updated October 2026 · Microbreweries &amp; craft beer consensus
            </div>
          </div>
          <Link href="/rankings/best-brewery-in-hyderabad" style={{ flexShrink: 0, fontSize: 13, fontWeight: 800, color: "var(--violet)", textDecoration: "none", padding: "8px 14px", borderRadius: 999, background: "var(--violet-wash)" }}>
            Vote in Weekly Race →
          </Link>
        </div>

        {/* Live r/hyderabad Community Thread */}
        {breweryThread && (
          <RedditCommunityPost thread={breweryThread} />
        )}

        {/* Quick Picks Summary Card */}
        <section
          style={{
            background: "var(--paper)",
            border: "1.5px solid var(--line)",
            borderRadius: 14,
            padding: "20px 22px",
            marginBottom: 32,
            boxShadow: "var(--e1, 0 1px 3px rgba(0,0,0,0.05))",
          }}
        >
          <h2 style={{ fontFamily: "var(--font-fraunces), serif", fontSize: 20, margin: "0 0 14px", color: "var(--ink)" }}>
            Quick Decision Guide: Where to Go
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            <div style={{ padding: "12px 14px", borderRadius: 10, background: "var(--cream)", border: "1px solid var(--line)" }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--violet)" }}>Steampunk Landmark &amp; Energy</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)", marginTop: 2 }}>Prost Brewpub</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>Crisp Apple Cider &amp; Pretzels (Jubilee Hills)</div>
            </div>
            <div style={{ padding: "12px 14px", borderRadius: 10, background: "var(--cream)", border: "1px solid var(--line)" }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--violet)" }}>Craft Beer Purist</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)", marginTop: 2 }}>Zero40 Brewing</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>Belgian Wit &amp; Cherry Beer-Rita (JH &amp; Fin Dist)</div>
            </div>
            <div style={{ padding: "12px 14px", borderRadius: 10, background: "var(--cream)", border: "1px solid var(--line)" }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--violet)" }}>Match Screenings &amp; Pizza</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)", marginTop: 2 }}>Broadway The Brewery</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>Huge glasshouse &amp; Wood-fired pizza (Jubilee Hills)</div>
            </div>
            <div style={{ padding: "12px 14px", borderRadius: 10, background: "var(--cream)", border: "1px solid var(--line)" }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--violet)" }}>Quiet Date Night &amp; Jazz</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)", marginTop: 2 }}>Windmills Craftworks</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>Library atmosphere &amp; German Hefeweizen (Madhapur)</div>
            </div>
          </div>
        </section>

        {/* Spot Deep Dives */}
        <section style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          {SPOTS.map((s, idx) => (
            <article
              key={s.id}
              style={{
                background: "var(--paper)",
                border: "1.5px solid var(--line)",
                borderRadius: 14,
                padding: "22px 24px",
                boxShadow: "var(--e1, 0 1px 3px rgba(0,0,0,0.05))",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)" }}>#{idx + 1}</span>
                    <h2 style={{ fontFamily: "var(--font-fraunces), serif", fontSize: "clamp(20px, 3.5vw, 24px)", margin: 0, color: "var(--ink)" }}>
                      {s.name}
                    </h2>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--muted)", marginTop: 4, flexWrap: "wrap" }}>
                    <span><Icon name="locate" size={12} width={2} color="var(--muted)" /> {s.area}</span>
                    <span>•</span>
                    <span style={{ fontWeight: 700, color: "var(--ink)" }}>★ {s.rating}</span>
                    <span>({s.reviews})</span>
                    <span>•</span>
                    <span>{s.priceForTwo}</span>
                  </div>
                  {s.redditBadge && (
                    <div style={{ marginTop: 6 }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          fontSize: 11.5,
                          fontWeight: 700,
                          color: "#c2410c",
                          background: "rgba(255, 69, 0, 0.08)",
                          border: "1px solid rgba(255, 69, 0, 0.2)",
                          borderRadius: 999,
                          padding: "2px 9px",
                        }}
                      >
                        {s.redditBadge}
                      </span>
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.03em",
                      textTransform: "uppercase",
                      padding: "4px 10px",
                      borderRadius: 999,
                      background: s.tagBg || "var(--cream)",
                      color: s.tagColor || "var(--ink)",
                    }}
                  >
                    {s.tag}
                  </span>
                  <Link
                    href={s.href}
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "var(--violet)",
                      textDecoration: "none",
                      padding: "4px 10px",
                      borderRadius: 999,
                      background: "var(--violet-wash)",
                    }}
                  >
                    View on map →
                  </Link>
                </div>
              </div>

              {s.photo && (
                <div style={{ margin: "14px 0", borderRadius: 12, overflow: "hidden", maxHeight: 320, background: "var(--cream)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={s.photo}
                    alt={s.name}
                    style={{ width: "100%", height: "100%", maxHeight: 320, objectFit: "cover", display: "block" }}
                    loading="lazy"
                  />
                </div>
              )}

              <p style={{ margin: "0 0 14px", fontSize: 14.5, lineHeight: 1.5, color: "var(--ink)" }}>
                {s.verdict}
              </p>

              <div
                style={{
                  background: "var(--cream)",
                  border: "1.5px solid var(--line)",
                  borderRadius: 12,
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: "var(--violet)",
                      minWidth: 84,
                      flexShrink: 0,
                    }}
                  >
                    On Tap
                  </span>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)", lineHeight: 1.45 }}>
                    {s.craftBeers}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", borderTop: "1px dashed var(--line)", paddingTop: 8 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: "#c2410c",
                      minWidth: 84,
                      flexShrink: 0,
                    }}
                  >
                    Must-Eat
                  </span>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)", lineHeight: 1.45 }}>
                    {s.whatToOrder}
                  </span>
                </div>

                {s.vibeTip && (
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", borderTop: "1px dashed var(--line)", paddingTop: 8 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        color: "var(--muted)",
                        minWidth: 84,
                        flexShrink: 0,
                      }}
                    >
                      Pro-Tip
                    </span>
                    <span style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.45 }}>
                      {s.vibeTip}
                    </span>
                  </div>
                )}
              </div>

              <Link
                href={s.href}
                className="site-cta"
                style={{
                  margin: "14px 0 0",
                  width: "100%",
                  textAlign: "center",
                  display: "block",
                  padding: "10px 16px",
                  fontSize: 13,
                  textDecoration: "none",
                  boxSizing: "border-box",
                }}
              >
                View on Map &amp; Menu →
              </Link>
            </article>
          ))}
        </section>

        {/* FAQs */}
        <section style={{ marginTop: 40, borderTop: "1.5px solid var(--line)", paddingTop: 28 }}>
          <h2 style={{ fontFamily: "var(--font-fraunces), serif", fontSize: 22, color: "var(--ink)", marginBottom: 16 }}>
            Frequently Asked Questions: Hyderabad Breweries
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {faqLd.mainEntity.map((faq, i) => (
              <details
                key={i}
                style={{
                  background: "var(--paper)",
                  border: "1.5px solid var(--line)",
                  borderRadius: 10,
                  padding: "14px 18px",
                }}
              >
                <summary style={{ fontWeight: 700, fontSize: 15, cursor: "pointer", color: "var(--ink)" }}>
                  {faq.name}
                </summary>
                <p style={{ margin: "10px 0 0", fontSize: 14, color: "var(--muted)", lineHeight: 1.55 }}>
                  {faq.acceptedAnswer.text}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* Explore Hub Pills */}
        <section style={{ marginTop: 36, borderTop: "1.5px solid var(--line)", paddingTop: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--violet)", marginBottom: 10 }}>
            More Curated Guides &amp; Explore Hubs
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <Link href="/rankings/best-brewery-in-hyderabad" className="site-pill">Vote in Best Brewery Race</Link>
            <Link href="/guides/best-cafes-hyderabad-reddit" className="site-pill">Best Cafes in Hyderabad</Link>
            <Link href="/guides/best-biryani-hyderabad-reddit" className="site-pill">Best Biryani Guide</Link>
            <Link href="/guides/late-night-food-hyderabad-reddit" className="site-pill">Late Night Food Guide</Link>
            <Link href="/guides/restaurants-in-sattva-knowledge-city-hyderabad" className="site-pill">Sattva Knowledge City Guide</Link>
            <Link href="/areas/jubilee-hills" className="site-pill">Jubilee Hills Food &amp; Nightlife</Link>
          </div>
        </section>
      </main>

      <SiteRelated
        links={[
          { href: "/rankings/best-brewery-in-hyderabad", label: "Best Brewery Weekly Ranking" },
          { href: "/areas/jubilee-hills", label: "Jubilee Hills Breweries & Eateries" },
          { href: "/explore/restaurants", label: "Restaurants & Bars on Map" },
          { href: "/stories", label: "All Food Stories & Guides" },
        ]}
      />
      <SiteFooter />
      <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 1300 }}>
        <BottomNav routed activeKey="stories" />
      </div>
    </div>
  );
}
