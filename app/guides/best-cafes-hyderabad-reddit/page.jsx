import Link from "next/link";
import { pageMeta } from "../../../lib/site.js";
import { ogImages } from "../../../lib/og.js";
import { SiteNav, SiteBreadcrumb, SiteFooter, SiteRelated } from "../../components/SiteChrome.jsx";
import { Icon } from "../../components/Icons.jsx";
import BottomNav from "../../components/BottomNav.jsx";
import BackButton from "../../components/BackButton.jsx";

const SLUG = "/guides/best-cafes-hyderabad-reddit";
const TITLE = "Best Cafes in Hyderabad (2026): Specialty Coffee, Work Corners & Desserts";
const DESCRIPTION =
  "The definitive Hyderabad cafe guide: Roastery Coffee House, Conçu, Roast CCX, True Black, and Autumn Leaf — with honest notes on specialty brews, WiFi speeds, desserts, and quiet work vibes.";

export const metadata = {
  ...pageMeta({ title: TITLE, description: DESCRIPTION, path: SLUG }),
  openGraph: {
    ...pageMeta({ title: TITLE, description: DESCRIPTION, path: SLUG }).openGraph,
    images: ogImages(TITLE, DESCRIPTION),
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
          <SiteNav linksHidden />
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 24, paddingBottom: 16, borderBottom: "1.5px solid var(--line)" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--violet)" }}>
              Editorial Field Guide · 2026 Local Consensus
            </div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 3 }}>
              Updated September 2026 · Specialty coffee roasters &amp; cafe trails
            </div>
          </div>
          <Link href="/" style={{ flexShrink: 0, fontSize: 13, fontWeight: 800, color: "var(--violet)", textDecoration: "none", padding: "8px 14px", borderRadius: 999, background: "var(--violet-wash)" }}>
            Open Map
          </Link>
        </div>

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
            Quick Picks: Where to Go
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            <div style={{ padding: "12px 14px", borderRadius: 10, background: "var(--cream)", border: "1px solid var(--line)" }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--violet)" }}>Garden Bungalow &amp; Cold Brew</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)", marginTop: 2 }}>Roastery Coffee House</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>Cascara + Cranberry Cold Brew</div>
            </div>
            <div style={{ padding: "12px 14px", borderRadius: 10, background: "var(--cream)", border: "1px solid var(--line)" }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--violet)" }}>French Pastry &amp; Desserts</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)", marginTop: 2 }}>Conçu (Jubilee Hills)</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>Opera cake &amp; Banoffee tart</div>
            </div>
            <div style={{ padding: "12px 14px", borderRadius: 10, background: "var(--cream)", border: "1px solid var(--line)" }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--violet)" }}>Work Cafe &amp; WiFi Outlets</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)", marginTop: 2 }}>Roast CCX (Gachibowli)</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>24/7 coffee + power sockets</div>
            </div>
            <div style={{ padding: "12px 14px", borderRadius: 10, background: "var(--cream)", border: "1px solid var(--line)" }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--violet)" }}>Specialty Coffee Purist</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)", marginTop: 2 }}>True Black (Jubilee Hills)</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>Single origin cortados &amp; tonic espresso</div>
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
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
                    <Icon name="locate" size={12} width={2} color="var(--muted)" /> {s.area}
                  </div>
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
                      background: "var(--cream)",
                      border: "1px solid var(--line)",
                      color: "var(--ink-soft)",
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

              <p className="review-prose" style={{ margin: "0 0 16px", fontSize: 15, lineHeight: 1.6, color: "var(--ink-soft, #333)" }}>
                {s.verdict}
              </p>

              <div style={{ background: "var(--cream)", border: "1px solid var(--line)", borderRadius: 10, padding: "12px 16px", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 13.5, color: "var(--ink)" }}>
                  <Icon name="utensils" size={13} width={2} color="var(--ink-soft)" style={{ marginTop: 2, flexShrink: 0 }} />
                  <span><strong style={{ color: "var(--ink)" }}>Must order:</strong> {s.whatToOrder}</span>
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 13, color: "var(--muted)", marginTop: 6 }}>
                  <Icon name="clock" size={13} width={2} color="var(--muted)" style={{ marginTop: 2, flexShrink: 0 }} />
                  <span><strong style={{ color: "var(--ink)" }}>Vibe &amp; seating tip:</strong> {s.timingTip}</span>
                </div>
              </div>

              <blockquote
                style={{
                  margin: 0,
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: "var(--violet-wash)",
                  border: "1.5px solid var(--line)",
                  fontFamily: "var(--font-fraunces), serif",
                  fontSize: 14,
                  fontStyle: "italic",
                  lineHeight: 1.45,
                  color: "var(--ink)",
                }}
              >
                {s.quote}
              </blockquote>
            </article>
          ))}
        </section>

        {/* FAQs */}
        <section style={{ marginTop: 40, borderTop: "1.5px solid var(--line)", paddingTop: 28 }}>
          <h2 style={{ fontFamily: "var(--font-fraunces), serif", fontSize: 22, color: "var(--ink)", marginBottom: 16 }}>
            Frequently Asked Questions
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
