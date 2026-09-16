import Link from "next/link";
import { pageMeta } from "../../../lib/site.js";
import { ogImages } from "../../../lib/og.js";
import { SiteNav, SiteBreadcrumb, SiteFooter, SiteRelated } from "../../components/SiteChrome.jsx";

const SLUG = "/guides/best-tiffins-hyderabad-reddit";
const TITLE = "Best Tiffins & Breakfast in Hyderabad (2026): The Real Local Guide";
const DESCRIPTION =
  "The authentic, unfiltered guide to Hyderabad's best tiffin spots: Ishtaa, Penam, Panchakattu Dosa, and Kanchi Cafe — with honest reviews on chutneys, ghee karam dosas, and peak weekend crowds.";

export const metadata = {
  ...pageMeta({ title: TITLE, description: DESCRIPTION, path: SLUG }),
  openGraph: {
    ...pageMeta({ title: TITLE, description: DESCRIPTION, path: SLUG }).openGraph,
    images: ogImages(TITLE, DESCRIPTION),
  },
  keywords: [
    "best tiffins in hyderabad reddit",
    "best breakfast places hyderabad",
    "ishtaa hitec city review",
    "penam dosa jubilee hills",
    "panchakattu dosa hyderabad",
    "kanchi cafe hyderabad review",
    "best dosa in hyderabad",
    "hyderabad south indian breakfast",
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
    { "@type": "ListItem", position: 2, name: "Guides", item: "https://eats.mapmyhyd.com/guides" },
    { "@type": "ListItem", position: 3, name: "Best Tiffins Guide", item: "https://eats.mapmyhyd.com" + SLUG },
  ],
};

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Where can you get the best dosa with variety of chutneys in Hyderabad?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Ishtaa in Madhapur/HITEC City is widely considered the gold standard for premium South Indian tiffins in Hyderabad, famous for its crisp dosas and wide variety of fresh, flavorful chutneys.",
      },
    },
    {
      "@type": "Question",
      name: "What is special about Penam Tiffins in Jubilee Hills?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Penam focuses on simple, homestyle village cooking with a tight menu centered around village-style dosas and pungaralu paired with exceptional homemade chutney.",
      },
    },
    {
      "@type": "Question",
      name: "Where can you find authentic Rayalaseema Ghee Karam Dosa in Hyderabad?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Panchakattu Dosa (outlets in Begumpet and Nallagandla) is the top choice for authentic Rayalaseema ghee-roasted dosas coated with spicy red chili-garlic paste and podi.",
      },
    },
    {
      "@type": "Question",
      name: "Is Kanchi Cafe worth visiting in 2026?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Kanchi Cafe was a standout opening, but recent 2026 visits show extreme weekend crowding and inconsistent quality during peak rushes. For a more reliable sit-down breakfast, Ishtaa or Panchakattu are currently more consistent.",
      },
    },
  ],
};

const TIFFIN_PICKS = [
  {
    name: "Ishtaa",
    tagline: "The Chutney Spread Champion (Pure Veg)",
    area: "Madhapur / HITEC City",
    href: "/spot/ishtaa-madhapur-hitec",
    verdict:
      "Easily one of the top tiffin destinations in the city. The dosas are crisp outside and tender inside, but the real flex is the chutney spread: multiple distinct varieties, all freshly made. Sits on the higher price tier, but the quality and hygiene justify every rupee.",
    whatToOrder: "Ghee Roast Dosa with Chutney Spread, Filter Coffee, and Idli Vada combo.",
    timingTip: "Arrive before 9:00 AM on weekends or visit on weekdays for peaceful dining.",
    quote: "“The dosa slapped, the chutneys were excellent with real variety, and even though prices are on the higher side, it is totally worth it.”",
  },
  {
    name: "Penam - Village Style Dosa",
    tagline: "Honest Homestyle Dosa & Pungaralu",
    area: "Jubilee Hills",
    href: "/spot/penam-village-style-dosa-jubilee-hills",
    verdict:
      "Penam keeps things deliberately focused: village-style dosas, pungaralu, and a chutney game that carries the entire table. Nothing overly commercialized—it feels like eating breakfast right at home.",
    whatToOrder: "Village Style Dosa, Pungaralu, and Ghee Podi Idli.",
    timingTip: "Seating is limited; perfect for quick, no-nonsense breakfast stops.",
    quote: "“Both the dosa and pungaralu feel like true home cooking. Menu is limited, but that chutney alone makes Penam one of the best small tiffin spots.”",
  },
  {
    name: "Panchakattu Dosa",
    tagline: "Spicy Rayalaseema Ghee Karam Dosa",
    area: "Begumpet / Nallagandla",
    href: "/spot/panchakattu-dosa-begumpet",
    verdict:
      "The go-to destination for rich, spicy Andhra/Rayalaseema style tiffins. Generous pure ghee roasting, fiery red garlic karam chutney spread, and crisp golden edges.",
    whatToOrder: "Panchakattu Special Ghee Karam Dosa, Upma Dosa, and Filter Coffee.",
    timingTip: "The spice level is bold and authentic; ask for mild if you have a lower spice tolerance.",
    quote: "“When you want a real ghee-roasted karam dosa that wakes you up, Panchakattu is the most authentic pick in town.”",
  },
  {
    name: "Kanchi Cafe",
    tagline: "Popular Spot (Note: Peak Weekend Quality Alert)",
    area: "Hitec City / Manikonda",
    href: "/spot/kanchi-cafe-hitech-city",
    verdict:
      "Kanchi Cafe gained massive popularity for its Kumbakonam degree coffee and traditional temple-style breakfast vibe. However, in 2025/2026, intense weekend crowds and high turnover have made the food quality hit-or-miss during rush hours.",
    whatToOrder: "Kumbakonam Degree Coffee, Ghee Sambar Button Idli.",
    timingTip: "Avoid peak weekend 9 AM – 11 AM rush; visit on weekday mornings for the best experience.",
    quote: "“Used to be top-tier, but recently quality has dipped during peak weekend rushes. Great coffee, but visit during off-peak hours.”",
  },
];

export default function BestTiffinsGuidePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <div className="site-page">
        <header className="site-header">
          <div className="site-header-inner">
            <SiteNav />
            <SiteBreadcrumb
              items={[
                { href: "/", label: "Home" },
                { href: "/guides", label: "Guides" },
                { href: SLUG, label: "Best Tiffins Guide" },
              ]}
            />
            <h1 className="site-title">{TITLE}</h1>
            <p className="site-description">
              First-hand editorial reviews and honest local insights on Hyderabad's breakfast spots. No paid influencer promotions.
            </p>
            <div className="site-header-meta" style={{ marginTop: 12 }}>
              <span className="site-pill">Updated 2026</span>
              <span className="site-pill">4 Editorial Picks</span>
              <span className="site-pill">Verified Tiffin Data</span>
            </div>
          </div>
        </header>

        <main className="site-main">
          {/* AEO Quick Decision Matrix */}
          <section className="site-section">
            <div
              style={{
                background: "var(--cream-hi)",
                border: "2px solid var(--violet)",
                borderRadius: "16px",
                padding: "20px 24px",
                marginBottom: 24,
              }}
            >
              <h2 style={{ fontSize: "18px", margin: "0 0 12px", color: "var(--violet-deep)" }}>
                🎯 AEO Decision Matrix: Where Should You Eat?
              </h2>
              <ul style={{ margin: 0, paddingLeft: 20, color: "var(--ink-soft)", lineHeight: 1.8, fontSize: "14.5px" }}>
                <li>
                  <strong>Go to Ishtaa if:</strong> You want a premium sit-down experience with the best multi-chutney spread and crisp dosas in HITEC City.
                </li>
                <li>
                  <strong>Go to Penam if:</strong> You crave homestyle, small-batch village dosas and pungaralu in Jubilee Hills.
                </li>
                <li>
                  <strong>Go to Panchakattu if:</strong> You want bold, spicy Rayalaseema ghee karam dosas with authentic fiery red paste.
                </li>
                <li>
                  <strong>Visit Kanchi Cafe if:</strong> You want classic degree coffee on a weekday morning when it isn't overwhelmed by weekend crowds.
                </li>
              </ul>
            </div>
          </section>

          {/* Detailed Spot Reviews */}
          <section className="site-section">
            <h2 className="site-section-title">The Top Tiffin Stops (Ranked & Reviewed)</h2>
            <div className="site-stack" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {TIFFIN_PICKS.map((spot, i) => (
                <article
                  key={spot.name}
                  className="site-card"
                  style={{
                    padding: "22px 24px",
                    background: "var(--cream-hi)",
                    borderRadius: "16px",
                    border: "1px solid var(--line)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                    <div>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: 700,
                          background: i === 0 ? "var(--forest)" : "var(--pop)",
                          color: "#fff",
                          marginBottom: "8px",
                        }}
                      >
                        #{i + 1} {spot.tagline}
                      </span>
                      <h3 style={{ margin: "0 0 4px", fontSize: "21px", color: "var(--ink)" }}>{spot.name}</h3>
                      <p style={{ margin: "0 0 12px", fontSize: "13px", color: "var(--muted)" }}>📍 {spot.area}</p>
                    </div>
                    <Link
                      href={spot.href}
                      className="site-pill"
                      style={{ background: "var(--blue-wash)", color: "var(--blue)", textDecoration: "none", fontWeight: 600 }}
                    >
                      View on Map →
                    </Link>
                  </div>

                  <p style={{ fontSize: "14.5px", lineHeight: "1.6", color: "var(--ink-soft)", margin: "0 0 14px" }}>
                    {spot.verdict}
                  </p>

                  <div style={{ background: "var(--cream)", padding: "14px 16px", borderRadius: "10px", margin: "12px 0", fontSize: "13.5px" }}>
                    <div style={{ marginBottom: "6px" }}>
                      <strong style={{ color: "var(--forest)" }}>Must Order:</strong> {spot.whatToOrder}
                    </div>
                    <div>
                      <strong style={{ color: "var(--pop-deep)" }}>Timing & Crowd Tip:</strong> {spot.timingTip}
                    </div>
                  </div>

                  <blockquote
                    style={{
                      margin: "12px 0 0",
                      paddingLeft: "12px",
                      borderLeft: "3px solid var(--violet)",
                      fontStyle: "italic",
                      fontSize: "13px",
                      color: "var(--ink-soft)",
                    }}
                  >
                    {spot.quote}
                    <cite style={{ display: "block", fontSize: "11px", color: "var(--muted)", marginTop: "4px", fontStyle: "normal" }}>
                      — Hyderabad Eats Editorial & Local Note
                    </cite>
                  </blockquote>
                </article>
              ))}
            </div>
          </section>

          {/* FAQ Section */}
          <section className="site-section">
            <h2 className="site-section-title">Frequently Asked Questions</h2>
            <div className="spot-faq" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {faqLd.mainEntity.map((f, i) => (
                <details
                  key={i}
                  open={i === 0}
                  style={{
                    background: "var(--cream-hi)",
                    border: "1px solid var(--line)",
                    borderRadius: "12px",
                    padding: "14px 18px",
                  }}
                >
                  <summary style={{ fontWeight: 600, color: "var(--ink)", cursor: "pointer", fontSize: "15px" }}>
                    {f.name}
                  </summary>
                  <p style={{ margin: "10px 0 0", color: "var(--ink-soft)", fontSize: "14px", lineHeight: 1.6 }}>
                    {f.acceptedAnswer.text}
                  </p>
                </details>
              ))}
            </div>
          </section>

          {/* Map CTA */}
          <section className="site-section" style={{ textAlign: "center", padding: "32px 16px" }}>
            <h2 style={{ fontSize: "22px", marginBottom: "10px" }}>Find Breakfast Spots Near You</h2>
            <p style={{ color: "var(--muted)", maxWidth: "500px", margin: "0 auto 20px" }}>
              Explore over 3,400 places on the live map with community votes, timings, and directions.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/rankings/best-dosa-in-hyderabad" className="site-cta" style={{ margin: 0 }}>
                Vote on Dosa Ranking →
              </Link>
              <Link href="/" className="site-cta" style={{ margin: 0, background: "var(--ink)" }}>
                Open Live Map
              </Link>
            </div>
          </section>

          <SiteRelated
            title="Explore More Guides"
            links={[
              { href: "/guides/best-biryani-hyderabad-reddit", label: "Best Biryani (Reddit Guide)" },
              { href: "/guides/late-night-food-hyderabad-reddit", label: "Late Night Food Guide" },
              { href: "/areas/jubilee-hills", label: "Food in Jubilee Hills" },
              { href: "/rankings", label: "Weekly Rankings" },
            ]}
          />
        </main>
        <SiteFooter />
      </div>
    </>
  );
}
