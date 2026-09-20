import Link from "next/link";
import { pageMeta } from "../../../lib/site.js";
import { ogImages } from "../../../lib/og.js";
import { SiteNav, SiteBreadcrumb, SiteFooter, SiteRelated } from "../../components/SiteChrome.jsx";
import { Icon } from "../../components/Icons.jsx";
import BottomNav from "../../components/BottomNav.jsx";
import BackButton from "../../components/BackButton.jsx";

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
    { "@type": "ListItem", position: 2, name: "Stories & Guides", item: "https://eats.mapmyhyd.com/stories" },
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
        text: "Penam is known for its homestyle, village-style preparation, particularly their crispy pungaralu, authentic podi idlis, and rich ground chutneys that taste like home cooking.",
      },
    },
    {
      "@type": "Question",
      name: "Where can you find authentic Rayalaseema Ghee Karam Dosa in Hyderabad?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Panchakattu Dosa in Begumpet and Nallagandla specializes in fiery Rayalaseema-style ghee karam dosas with signature red garlic paste.",
      },
    },
    {
      "@type": "Question",
      name: "Is Kanchi Cafe worth visiting in 2026?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Kanchi Cafe serves great Kumbakonam degree filter coffee and ghee button idlis, but weekend peak hours (9:00 AM to 11:30 AM) get heavily overcrowded. For the best experience, visit on weekday mornings.",
      },
    },
  ],
};

const SPOTS = [
  {
    id: "ishtaa",
    name: "Ishtaa",
    tag: "Chutney Spread Champion (Pure Veg)",
    tagBg: "#f0fdf4",
    tagColor: "#166534",
    area: "Madhapur / HITEC City",
    href: "/spot/ishtaa-pure-veg-restaurant-hitech-city-madhapur-hitec",
    verdict:
      "Easily one of the top tiffin destinations in Cyberabad. The dosas are crisp outside and tender inside, but the real star is the chutney spread: multiple distinct varieties, all freshly ground. Sits on the higher price tier, but the hygiene, ambiance, and chutney quality justify every rupee.",
    whatToOrder: "Ghee Roast Dosa with Chutney Platter, Filter Coffee, and Idli Vada combo.",
    timingTip: "Arrive before 8:45 AM on weekends or visit on weekdays for calm dining without queues.",
    quote: "“The dosa slapped, the chutneys were excellent with real variety, and even though prices are on the higher side, it is totally worth it.”",
  },
  {
    id: "penam",
    name: "Penam - Village Style Dosa",
    tag: "Honest Homestyle & Pungaralu",
    tagBg: "#fff7ed",
    tagColor: "#9a3412",
    area: "Jubilee Hills",
    href: "/spot/penam-jubilee-hills",
    verdict:
      "Penam keeps things deliberately focused: rustic village-style dosas, piping hot pungaralu, and a chutney game that carries the entire meal. Nothing overly commercialized—it feels like eating breakfast fresh off a village griddle.",
    whatToOrder: "Village Style Dosa, Pungaralu, and Ghee Podi Idli.",
    timingTip: "Seating is intimate; perfect for quick, no-nonsense breakfast stops.",
    quote: "“Both the dosa and pungaralu feel like true home cooking. Menu is limited, but that chutney alone makes Penam one of the best small tiffin spots.”",
  },
  {
    id: "panchakattu",
    name: "Panchakattu Dosa",
    tag: "Fiery Rayalaseema Ghee Karam",
    tagBg: "#fef2f2",
    tagColor: "#991b1b",
    area: "Begumpet / Nallagandla",
    href: "/spot/panchakattu-dosa-begumpet",
    verdict:
      "The benchmark destination for rich, spicy Andhra & Rayalaseema style breakfast. Generous pure ghee roasting, fiery red garlic karam chutney spread across the crepe, and golden crisp edges.",
    whatToOrder: "Panchakattu Special Ghee Karam Dosa, Upma Dosa, and Kumbakonam Filter Coffee.",
    timingTip: "The spice level is bold and authentic; ask baristas for mild if you have a sensitive palate.",
    quote: "“When you want a real ghee-roasted karam dosa that wakes you up, Panchakattu is the most authentic pick in town.”",
  },
  {
    id: "kanchi",
    name: "Kanchi Cafe",
    tag: "Popular Spot (Weekday Advisory)",
    tagBg: "#fef3c7",
    tagColor: "#92400e",
    area: "HITEC City / Manikonda",
    href: "/spot/kanchi-cafe-hitech-city",
    verdict:
      "Kanchi Cafe gained massive popularity for its Kumbakonam degree filter coffee and traditional temple-style breakfast vibe. While their coffee remains authentic, intense weekend crowds have made the kitchen turnover hit-or-miss during peak rush hours.",
    whatToOrder: "Kumbakonam Degree Coffee, Ghee Sambar Button Idlis.",
    timingTip: "Avoid peak weekend 9:00 AM – 11:30 AM rush; visit on weekday mornings for the best consistency.",
    quote: "“Great degree coffee and button idlis, but visit during off-peak hours on weekdays to avoid the crazy weekend rush.”",
  },
];

export default function BestTiffinsGuidePage() {
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
              { href: SLUG, label: "Best Tiffins Guide" },
            ]}
          />
          <div className="site-hero">
            <h1>Best Tiffins &amp; Breakfast in Hyderabad (2026)</h1>
            <p>
              Unfiltered local insights on Hyderabad's top breakfast spots: from 4-chutney spreads and homestyle pungaralu to spicy Rayalaseema ghee karam dosas.
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
              Updated September 2026 · Based on authentic community reviews &amp; food visits
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
            Quick Picks: Where to Eat
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            <div style={{ padding: "12px 14px", borderRadius: 10, background: "var(--cream)", border: "1px solid var(--line)" }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--violet)" }}>Top Chutney Spread</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)", marginTop: 2 }}>Ishtaa (HITEC City)</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>Crisp dosas + multi-chutney platter</div>
            </div>
            <div style={{ padding: "12px 14px", borderRadius: 10, background: "var(--cream)", border: "1px solid var(--line)" }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--violet)" }}>Homestyle &amp; Pungaralu</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)", marginTop: 2 }}>Penam (Jubilee Hills)</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>Village-style dosas &amp; rich chutney</div>
            </div>
            <div style={{ padding: "12px 14px", borderRadius: 10, background: "var(--cream)", border: "1px solid var(--line)" }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--violet)" }}>Spicy Ghee Karam</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)", marginTop: 2 }}>Panchakattu Dosa</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>Rayalaseema red garlic karam</div>
            </div>
            <div style={{ padding: "12px 14px", borderRadius: 10, background: "var(--cream)", border: "1px solid var(--line)" }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--violet)" }}>Degree Filter Coffee</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)", marginTop: 2 }}>Kanchi Cafe</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>Kumbakonam degree brew (weekdays best)</div>
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
                  <span><strong style={{ color: "var(--ink)" }}>Crowd advisory:</strong> {s.timingTip}</span>
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
            <Link href="/guides/best-cafes-hyderabad-reddit" className="site-pill">Best Cafes Guide</Link>
            <Link href="/guides/best-ice-cream-desserts-hyderabad" className="site-pill">Best Ice Cream &amp; Desserts</Link>
            <Link href="/guides/late-night-food-hyderabad-reddit" className="site-pill">Late Night Food Guide</Link>
            <Link href="/rankings/best-dosa-in-hyderabad" className="site-pill">Best Dosa Rankings</Link>
            <Link href="/areas/jubilee-hills" className="site-pill">Jubilee Hills Food</Link>
          </div>
        </section>
      </main>

      <SiteRelated
        links={[
          { href: "/rankings/best-dosa-in-hyderabad", label: "Best Dosa Rankings" },
          { href: "/explore/biryani-and-local", label: "Local Eats & Tiffins" },
          { href: "/areas/jubilee-hills", label: "Jubilee Hills Breakfast" },
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
