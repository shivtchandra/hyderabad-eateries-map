import GuideSpotCard from "../../components/GuideSpotCard.jsx";
import SwipeDeck from "../../components/SwipeDeck.jsx";
import Link from "next/link";
import { pageMeta } from "../../../lib/site.js";
import { ogImages } from "../../../lib/og.js";
import { SiteNav, SiteBreadcrumb, SiteFooter, SiteRelated } from "../../components/SiteChrome.jsx";
import { Icon } from "../../components/Icons.jsx";
import BottomNav from "../../components/BottomNav.jsx";
import BackButton from "../../components/BackButton.jsx";

const SLUG = "/guides/best-ice-cream-desserts-hyderabad";
const TITLE = "Best Ice Cream & Desserts in Hyderabad 2026";
const DESCRIPTION =
  "From 1951 hand-churned pot ice creams at Mozamjahi Market (Famous Ice Cream) to Italian gelato at Milano and stone-slab sundaes at Cream Stone, the ultimate Hyderabad dessert trail.";

export const metadata = {
  ...pageMeta({ title: TITLE, description: DESCRIPTION, path: SLUG }),
  openGraph: {
    ...pageMeta({ title: TITLE, description: DESCRIPTION, path: SLUG }).openGraph,
    images: ogImages(TITLE, DESCRIPTION, SLUG),
  },
  keywords: [
    "best ice cream in hyderabad",
    "famous ice cream mozamjahi market review",
    "milano gelato jubilee hills",
    "cream stone hyderabad willy wonka",
    "best desserts in hyderabad 2026",
    "huber and holly hyderabad",
    "late night ice cream hyderabad",
  ],
};

const articleLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: TITLE,
  description: DESCRIPTION,
  url: "https://eats.mapmyhyd.com" + SLUG,
  datePublished: "2026-09-17",
  dateModified: "2026-09-17",
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
    { "@type": "ListItem", position: 3, name: "Best Ice Cream Guide", item: "https://eats.mapmyhyd.com" + SLUG },
  ],
};

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Where can you get the most iconic heritage ice cream in Hyderabad?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Famous Ice Cream inside Mozamjahi Market (operating since 1951) is legendary for seasonal hand-churned fruit pot ice creams like Custard Apple (Sitaphal), Sapota (Chiku), Mango, and Anjeer.",
      },
    },
    {
      "@type": "Question",
      name: "Where is the best authentic Italian gelato in Hyderabad?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Milano Ice Cream in Jubilee Hills serves authentic Italian artisan gelato and dairy-free fruit sorbets made with imported natural ingredients.",
      },
    },
    {
      "@type": "Question",
      name: "Which Hyderabad ice cream spots are open late at night?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Famous Ice Cream at Mozamjahi Market remains bustling until 12:30 AM – 1:00 AM, and Cream Stone outlets across Banjara Hills, Jubilee Hills, and Gachibowli are open till 1:30 AM – 2:00 AM for post-dinner crowds.",
      },
    },
  ],
};

const SPOTS = [
  {
    id: "famous",
    name: "Famous Ice Cream",
    tag: "1951 Heritage Pot Ice Cream",
    tagBg: "#fef3c7",
    tagColor: "#92400e",
    area: "Mozamjahi Market / Abids",
    href: "/spot/famous-ice-cream-mozamjahi-market",
    verdict:
      "Founded in 1951 within the historic stone arches of Mozamjahi Market (MJ Market), Famous Ice Cream is an indispensable Hyderabad tradition. They churn fresh milk and seasonal fruits in wooden-encased metal pots using ice and rock salt. The texture is distinctly rustic, non-commercial, and light on the palate.",
    whatToOrder: "Sitaphal (Custard Apple), Sapota (Chiku), Mango, Anjeer.",
    timingTip: "Under ₹60 per bowl. Open until 1:00 AM; the historic courtyard buzzes with night crowds.",
    quote: "“The Sitaphal and Mango pot ice creams in earthenware bowls under MJ Market arches are pure nostalgia.”",
  },
  {
    id: "milano",
    name: "Milano Ice Cream",
    tag: "Authentic Italian Gelato",
    tagBg: "#f0fdf4",
    tagColor: "#166534",
    area: "Jubilee Hills",
    href: "/spot/milano-ice-cream-jubilee-hills",
    verdict:
      "For those seeking true Italian gelato with slow-churned dense texture and lower butterfat than American ice creams, Milano is unmatched in Hyderabad. Their pistachio gelato is made with genuine roasted nut paste without artificial coloring, and their dark chocolate and fruit sorbets are velvety.",
    whatToOrder: "Pistachio Gelato, Belgian Dark Chocolate, Raspberry Sorbet in fresh waffle cone.",
    timingTip: "Great post-dinner dessert stop in Jubilee Hills.",
    quote: "“Actual authentic Italian gelato texture. The pistachio and dark chocolate are exceptional.”",
  },
  {
    id: "creamstone",
    name: "Cream Stone",
    tag: "Late-Night Cold Slab Mixes",
    tagBg: "#fdf2f8",
    tagColor: "#86198f",
    area: "Banjara Hills, Jubilee Hills & Citywide",
    href: "/spot/cream-stone-banjara-hills",
    verdict:
      "Cream Stone turned post-dinner dessert runs into a Hyderabad ritual. Ice cream scoops are chopped and blended with fudges, brownies, fresh berries, and nuts on frozen granite slabs before being scooped into waffle bowls.",
    whatToOrder: "Willy Wonka, Devil’s Brownie, Fruit Factory, Ferrero Rocher Crunch.",
    timingTip: "Open until 1:30 AM – 2:00 AM daily across most branches.",
    quote: "“The late-night Willy Wonka run after dinner is a Hyderabad rite of passage.”",
  },
  {
    id: "huber",
    name: "Huber & Holly",
    tag: "Gourmet Fresh Churned",
    tagBg: "#fff7ed",
    tagColor: "#9a3412",
    area: "Banjara Hills & Jubilee Hills",
    href: "/spot/huber-and-holly-banjara-hills",
    verdict:
      "Freshly churns small batches on-site every few hours. Famous for its jet-black charcoal waffle cones and high-end dessert creations like the 24k gold leaf 'Mighty Midas' cone and Belgian chocolate truffle pots.",
    whatToOrder: "Belgian Dark Chocolate, Charcoal Cone with Hazelnut Rocher, Mighty Midas.",
    timingTip: "Higher price tier, but great for celebration desserts.",
    quote: "“Freshly churned gourmet scoops with crisp charcoal waffle cones.”",
  },
  {
    id: "dumont",
    name: "Dumont Creamery",
    tag: "Artisanal Creamery & Experimental Flavors",
    tagBg: "#fdf4ff",
    tagColor: "#a21caf",
    area: "Jubilee Hills, Begumpet & Citywide",
    href: "/spot/dumont-experimental-ice-creams-jubilee-hills",
    verdict:
      "Dumont has become one of Hyderabad's go-to modern ice cream destinations, celebrated for rich dairy bases and crave-worthy sundaes. Their pure Vanilla is aromatic and velvety, and their Death By Chocolate (DBC) layers warm chocolate fudge with gooey cake.",
    whatToOrder: "Vanilla, Death By Chocolate (DBC).",
    timingTip: "Open until 1:00 AM daily across branches for late-night cravings.",
    quote: "“Their DBC and pure vanilla scoops hit the sweet spot every single time.”",
  },
];

export default function BestIceCreamGuidePage() {
  return (
    <div className="site-page" style={{ paddingBottom: 84 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      <header className="site-header">
        <div className="site-header-inner">
          <SiteNav active="/stories" />
          <BackButton fallback="/stories" />
          <SiteBreadcrumb
            items={[
              { href: "/", label: "Home" },
              { href: "/stories", label: "Stories & Guides" },
              { href: SLUG, label: "Ice Cream & Desserts Guide" },
            ]}
          />
          <div className="site-hero">
            <h1>Best Ice Cream &amp; Desserts in Hyderabad (2026)</h1>
            <p>
              From 1951 hand-churned seasonal pot ice creams at Mozamjahi Market to Italian artisan gelato and late-night granite cold-slab sundaes.
            </p>
          </div>
        </div>
      </header>

      <main className="site-body">
        {/* Byline */}
        <div className="guide-byline">
          <div>
            <div className="ink-chip">
              Editorial Field Guide · 2026 Local Consensus
            </div>
            <div className="guide-updated">
              Updated September 2026 · Heritage pot ice creams &amp; artisanal gelato
            </div>
          </div>
          <Link href="/" className="link-chip">
            Open Map
          </Link>
        </div>

        {/* Quick Picks Summary Card */}
        <section className="guide-quick">
          <h2 className="guide-quick-title">
            Quick Picks: Where to Go
          </h2>
          <div className="guide-quick-grid">
            <div className="guide-quick-item">
              <div className="guide-quick-k">Heritage Pot Ice Cream</div>
              <div className="guide-quick-name">Famous Ice Cream (MJ Market)</div>
              <div className="guide-quick-note">Hand-churned Sitaphal/Mango in pot</div>
            </div>
            <div className="guide-quick-item">
              <div className="guide-quick-k">Authentic Italian Gelato</div>
              <div className="guide-quick-name">Milano Ice Cream</div>
              <div className="guide-quick-note">Pure Sicilian pistachio &amp; dark chocolate</div>
            </div>
            <div className="guide-quick-item">
              <div className="guide-quick-k">Midnight Cold Slab Sundaes</div>
              <div className="guide-quick-name">Cream Stone (Till 2 AM)</div>
              <div className="guide-quick-note">Willy Wonka &amp; chocolate fudge mixes</div>
            </div>
            <div className="guide-quick-item">
              <div className="guide-quick-k">Gourmet Fresh Churned</div>
              <div className="guide-quick-name">Huber &amp; Holly</div>
              <div className="guide-quick-note">Charcoal cones &amp; Belgian chocolate</div>
            </div>
          </div>
        </section>

        {/* Spot Deep Dives */}
        <SwipeDeck label="Spots in this guide">
          {SPOTS.map((s, idx) => (
            <GuideSpotCard key={s.id} s={s} rank={idx + 1} rows={[["Must order", s.whatToOrder], ["Hours and tips", s.timingTip]]} />
          ))}
        </SwipeDeck>

        {/* FAQs */}
        <section className="guide-faq">
          <h2 className="guide-faq-title">
            Frequently Asked Questions
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {faqLd.mainEntity.map((faq, i) => (
              <details key={i}>
                <summary>
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
            <Link href="/guides/best-cafes-hyderabad-reddit" className="site-pill">Best Cafes Guide</Link>
            <Link href="/guides/best-biryani-hyderabad-reddit" className="site-pill">Best Biryani Guide</Link>
            <Link href="/guides/best-tiffins-hyderabad-reddit" className="site-pill">Best Tiffins Guide</Link>
            <Link href="/guides/late-night-food-hyderabad-reddit" className="site-pill">Late Night Food Guide</Link>
            <Link href="/explore/ice-cream" className="site-pill">Browse Ice Cream Spots</Link>
            <Link href="/areas/banjara-hills" className="site-pill">Banjara Hills Food</Link>
          </div>
        </section>
      </main>

      <SiteRelated
        links={[
          { href: "/explore/ice-cream", label: "Ice Cream Spots on Map" },
          { href: "/explore/cafes", label: "Cafes & Bakeries" },
          { href: "/areas/banjara-hills", label: "Banjara Hills Food" },
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
