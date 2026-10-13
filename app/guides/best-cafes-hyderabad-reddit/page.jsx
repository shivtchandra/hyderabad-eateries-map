import GuideSpotCard from "../../components/GuideSpotCard.jsx";
import SwipeDeck from "../../components/SwipeDeck.jsx";
import Link from "next/link";
import { pageMeta } from "../../../lib/site.js";
import { ogImages } from "../../../lib/og.js";
import { SiteNav, SiteBreadcrumb, SiteFooter, SiteRelated } from "../../components/SiteChrome.jsx";
import { Icon } from "../../components/Icons.jsx";
import BottomNav from "../../components/BottomNav.jsx";
import BackButton from "../../components/BackButton.jsx";

const SLUG = "/guides/best-cafes-hyderabad-reddit";
const TITLE = "Best Cafes in Hyderabad 2026: Local Guide";
const DESCRIPTION =
  "The definitive Hyderabad cafe guide: Roastery Coffee House, Conçu, Roast CCX, True Black, and Autumn Leaf, with honest notes on specialty brews, WiFi speeds, desserts, and quiet work vibes.";

export const metadata = {
  ...pageMeta({ title: TITLE, description: DESCRIPTION, path: SLUG }),
  openGraph: {
    ...pageMeta({ title: TITLE, description: DESCRIPTION, path: SLUG }).openGraph,
    images: ogImages(TITLE, DESCRIPTION, SLUG),
  },
  keywords: [
    "best cafes in hyderabad reddit",
    "best coffee shops hyderabad",
    "roastery coffee house hyderabad review",
    "concu jubilee hills pastry",
    "roast ccx gachibowli work cafe",
    "true black coffee hyderabad",
    "work friendly cafes hyderabad wifi",
    "specialty coffee hyderabad 2026",
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
    { "@type": "ListItem", position: 3, name: "Best Cafes Guide", item: "https://eats.mapmyhyd.com" + SLUG },
  ],
};

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Which is the best specialty coffee cafe in Hyderabad?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Roastery Coffee House in Banjara Hills and Roast CCX in Jubilee Hills/Gachibowli lead the specialty coffee scene with single-origin beans, in-house roasting, Cascara, and manual pourovers. For pure minimalist coffee craftsmanship, True Black in Jubilee Hills is the purist favorite.",
      },
    },
    {
      "@type": "Question",
      name: "Which Hyderabad cafe is best for working with laptops and WiFi?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Roast CCX (Gachibowli & Jubilee Hills), Third Wave Coffee (Madhapur/Kondapur), and Blue Tokai (Jubilee Hills/Financial District) offer power outlets at most tables, reliable high-speed WiFi, and spacious seating.",
      },
    },
    {
      "@type": "Question",
      name: "Where can you get the best French desserts and pastries in Hyderabad?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Conçu (Jubilee Hills, Begumpet, and Financial District) is Hyderabad's gold standard for European-grade desserts, celebrated for its banoffee tart, chocolate opera, macarons, and choux buns.",
      },
    },
  ],
};

const SPOTS = [
  {
    id: "roastery",
    name: "Roastery Coffee House",
    tag: "Garden Bungalow & Brews",
    tagBg: "#f0fdf4",
    tagColor: "#166534",
    area: "Banjara Hills",
    href: "/spot/roastery-coffee-house-banjara-hills",
    verdict:
      "Housed in an airy, heritage-style bungalow surrounded by lush green foliage, Roastery Coffee House pioneered specialty coffee culture in Hyderabad. Their menu spans manual pourovers (V60, Chemex, Aeropress) and signature cold concoctions like Cranberry Cold Brew and brewed coffee cherry tea (Cascara).",
    whatToOrder: "Cranberry Cold Brew, Cascara, Chicken BBQ Platter, Onion Rings.",
    timingTip: "Weekend evenings have heavy wait times (30–45 mins). Weekday mornings (8:30 AM – 11:30 AM) are peaceful.",
    quote: "“The garden ambience is unmatched. Sip a cold brew or cascara under the trees on a quiet morning.”",
  },
  {
    id: "concu",
    name: "Conçu",
    tag: "French Patisserie Benchmark",
    tagBg: "#fdf2f8",
    tagColor: "#86198f",
    area: "Jubilee Hills & Financial District",
    href: "/spot/concu-jubilee-hills",
    verdict:
      "Conçu is widely celebrated across Hyderabad as the benchmark for European baking. Founded by classically trained pastry chefs, every cake, tart, and choux bun is a masterclass in balance and texture. The ambiance is clean, minimalist, and upscale.",
    whatToOrder: "Banoffee Tart, Chocolate Opera, Tiramisu, Choux Buns, Flat White.",
    timingTip: "Great for quiet afternoon meetings or dessert runs. Popular items sell out by late evening.",
    quote: "“Unmatched precision in pastry. The Opera and Banoffee are easily the finest in the city.”",
  },
  {
    id: "roast",
    name: "Roast CCX & Roast 24 Seven",
    tag: "Tech Work & 24/7 Brews",
    tagBg: "#eef2ff",
    tagColor: "#4338ca",
    area: "Jubilee Hills & Gachibowli",
    href: "/spot/roast-ccx-jubilee-hills",
    verdict:
      "If you need a reliable work cafe in the tech corridor with dedicated power sockets, robust WiFi, and in-house micro-roasting, Roast CCX is the premier choice. The Gachibowli outlet (Roast 24 Seven) is open round-the-clock for night owls and founders.",
    whatToOrder: "Single-Origin Pourover, Vietnamese Iced Coffee, Avocado Toast, Bagels.",
    timingTip: "Ample indoor and outdoor seating with laptop-friendly power plugs throughout.",
    quote: "“Fast WiFi, great coffee, and sockets everywhere. The go-to spot for long deep-work sessions.”",
  },
  {
    id: "trueblack",
    name: "True Black",
    tag: "Specialty Coffee Purist",
    tagBg: "#f8fafc",
    tagColor: "#334155",
    area: "Jubilee Hills",
    href: "/spot/true-black-coffee-jubilee-hills",
    verdict:
      "True Black strips away commercial sugary syrups, focusing entirely on the craft of bean extraction. The baristas are passionate about origin profiles, grind size, and water temperature. It is a quiet, contemplative space frequented by designers and coffee purists.",
    whatToOrder: "Cortado, Tonic Espresso, Cold Drip, Manual Pourovers.",
    timingTip: "Intimate and quiet; best for focused reading and serious coffee appreciation.",
    quote: "“For pure espresso extraction and manual brews without commercial fluff, True Black is the gold standard.”",
  },
];

export default function BestCafesGuidePage() {
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
              { href: SLUG, label: "Best Cafes Guide" },
            ]}
          />
          <div className="site-hero">
            <h1>Best Cafes in Hyderabad (2026)</h1>
            <p>
              Specialty third-wave coffee roasters, quiet laptop work corners with fast WiFi, French patisserie, and peaceful garden courtyards.
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
              Updated September 2026 · Specialty coffee roasters &amp; cafe trails
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
              <div className="guide-quick-k">Garden Bungalow &amp; Cold Brew</div>
              <div className="guide-quick-name">Roastery Coffee House</div>
              <div className="guide-quick-note">Cascara + Cranberry Cold Brew</div>
            </div>
            <div className="guide-quick-item">
              <div className="guide-quick-k">French Pastry &amp; Desserts</div>
              <div className="guide-quick-name">Conçu (Jubilee Hills)</div>
              <div className="guide-quick-note">Opera cake &amp; Banoffee tart</div>
            </div>
            <div className="guide-quick-item">
              <div className="guide-quick-k">Work Cafe &amp; WiFi Outlets</div>
              <div className="guide-quick-name">Roast CCX (Gachibowli)</div>
              <div className="guide-quick-note">24/7 coffee + power sockets</div>
            </div>
            <div className="guide-quick-item">
              <div className="guide-quick-k">Specialty Coffee Purist</div>
              <div className="guide-quick-name">True Black (Jubilee Hills)</div>
              <div className="guide-quick-note">Single origin cortados &amp; tonic espresso</div>
            </div>
          </div>
        </section>

        {/* Spot Deep Dives */}
        <SwipeDeck label="Spots in this guide">
          {SPOTS.map((s, idx) => (
            <GuideSpotCard key={s.id} s={s} rank={idx + 1} rows={[["Must order", s.whatToOrder], ["Vibe and seating tip", s.timingTip]]} />
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
            <Link href="/guides/best-biryani-hyderabad-reddit" className="site-pill">Best Biryani Guide</Link>
            <Link href="/guides/best-tiffins-hyderabad-reddit" className="site-pill">Best Tiffins Guide</Link>
            <Link href="/guides/best-ice-cream-desserts-hyderabad" className="site-pill">Best Ice Cream &amp; Desserts</Link>
            <Link href="/guides/late-night-food-hyderabad-reddit" className="site-pill">Late Night Food Guide</Link>
            <Link href="/explore/cafes" className="site-pill">Browse All Cafes on Map</Link>
            <Link href="/areas/jubilee-hills" className="site-pill">Jubilee Hills Food</Link>
          </div>
        </section>
      </main>

      <SiteRelated
        links={[
          { href: "/explore/cafes", label: "All Cafes in Hyderabad" },
          { href: "/areas/jubilee-hills", label: "Jubilee Hills Cafes" },
          { href: "/rankings/best-cafe-in-hyderabad", label: "Best Cafe Rankings" },
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
