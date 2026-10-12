import Link from "next/link";
import { recommendationsEnabled } from "../../../lib/recommendationShared.js";
import { pageMeta } from "../../../lib/site.js";
import { ogImages } from "../../../lib/og.js";
import { SiteNav, SiteBreadcrumb, SiteFooter, SiteRelated } from "../../components/SiteChrome.jsx";
import { Icon } from "../../components/Icons.jsx";
import BottomNav from "../../components/BottomNav.jsx";
import BackButton from "../../components/BackButton.jsx";

const SLUG = "/guides/best-biryani-hyderabad-reddit";
const TITLE = "Best Biryani in Hyderabad: Reddit Local Picks";
const DESCRIPTION =
  "The authentic, unfiltered guide to Hyderabad's best biryani: Shadab, The Nawaabs, Chicha's, Peshawar, Meridian, and Shah Ghouse, with spice levels, meat cuts, and peak fresh batch timings.";

export const metadata = {
  ...pageMeta({ title: TITLE, description: DESCRIPTION, path: SLUG }),
  openGraph: {
    ...pageMeta({ title: TITLE, description: DESCRIPTION, path: SLUG }).openGraph,
    images: ogImages(TITLE, DESCRIPTION, SLUG),
  },
  keywords: [
    "best biryani in hyderabad reddit",
    "best biryani in hyderabad 2026",
    "shadab mutton biryani",
    "the nawaabs gachibowli biryani",
    "chichas biryani review",
    "peshawar lakdikapul biryani",
    "hyderabad biryani fresh batch timing",
    "meridian biryani panjagutta",
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
    { "@type": "ListItem", position: 3, name: "Best Biryani Guide", item: "https://eats.mapmyhyd.com" + SLUG },
  ],
};

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Which restaurant serves the best authentic Mutton Dum Biryani in Hyderabad?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Hotel Shadab in Old City (near Madina Building/Charminar) is widely rated by locals as the benchmark for traditional Mutton Dum Biryani, known for its fragrant masala, long-grain basmati rice, and tender meat.",
      },
    },
    {
      "@type": "Question",
      name: "Where can I get the best biryani in Gachibowli or HITEC City?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The Nawaabs in Gachibowli is the top-rated local pick in the tech corridor, acclaimed for its juicy meat, balanced spice profile, and consistent batch quality.",
      },
    },
    {
      "@type": "Question",
      name: "What is the best time of day to eat biryani in Hyderabad?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The peak fresh batches (first degh) come out between 12:30 PM and 1:30 PM for lunch, and between 7:30 PM and 8:30 PM for dinner. Eating right when the degh opens guarantees steaming hot, fluffy rice and succulent meat.",
      },
    },
  ],
};

const SPOTS = [
  {
    id: "shadab",
    name: "Hotel Shadab",
    tag: "Old City Gold Standard",
    tagBg: "#fef3c7",
    tagColor: "#92400e",
    area: "Old City / Madina",
    href: "/spot/hotel-shadab-ghansi-bazaar",
    verdict:
      "The enduring benchmark of Hyderabadi Dum Biryani. Shadab cooks in massive copper cauldrons with rich aromatic whole spices, saffron-infused long grain basmati, and exceptionally tender meat.",
    whatToOrder: "Mutton Dum Biryani, Tala Hua Ghost, Qubani Ka Meetha.",
    timingTip: "First lunch degh opens around 12:45 PM. Peak weekend lunch has long queues on ground floor; head to upper AC section.",
    quote: "“Shadab’s mutton biryani with a side of Tala Hua Ghost is still the gold standard in Hyderabad when you hit the fresh 1 PM batch.”",
  },
  {
    id: "nawaabs",
    name: "The Nawaabs",
    tag: "Cyberabad Local Favorite",
    tagBg: "#f0fdf4",
    tagColor: "#166534",
    area: "Gachibowli",
    href: "/spot/the-nawaabs-gachibowli",
    verdict:
      "For those in the tech corridor unwilling to travel 20km to Old City, The Nawaabs has emerged as the premier Cyberabad biryani house. Less oily than commercial chains with consistent meat-to-rice ratios.",
    whatToOrder: "Special Mutton Dum Biryani, Chicken Tikka, Double Ka Meetha.",
    timingTip: "Arrive before 1:00 PM for lunch or order for early dinner around 7:45 PM.",
    quote: "“Hands down the most consistent biryani in the Gachibowli/Kondapur belt. The meat falls off the bone.”",
  },
  {
    id: "chichas",
    name: "Chicha's",
    tag: "Authentic Dakhni Flavors",
    tagBg: "#fdf2f8",
    tagColor: "#86198f",
    area: "Lakdikapul & Masab Tank",
    href: "/spot/chichas-asif-nagar-west",
    verdict:
      "Chicha's celebrates home-style Dakhni Muslim cooking. The biryani has a distinctive peppery, clove-forward profile rather than heavy artificial coloring. It feels like wedding feast (shadi ki biryani) cooked with love.",
    whatToOrder: "Kacchi Dum Biryani, Shikampur Kebab, Bheja Fry, Kaddu Ki Kheer.",
    timingTip: "Late evening seating is lively and popular with local night crowds.",
    quote: "“Tastes exactly like authentic Hyderabadi Muslim wedding biryani. The Shikampurs are unbeatable.”",
  },
  {
    id: "peshawar",
    name: "Peshawar",
    tag: "Rich & Masaledar",
    tagBg: "#fff7ed",
    tagColor: "#9a3412",
    area: "Lakdikapul",
    href: "/spot/peshawar-lakdikapul",
    verdict:
      "Peshawar caters to those who prefer their biryani bold, richly spiced, and well-masalaed. The mutton pieces are succulent, and the rice is bursting with cinnamon and cardamom flavors.",
    whatToOrder: "Mutton Biryani, Mutton Marag, Zafrani Chicken.",
    timingTip: "Start with a hot bowl of Mutton Marag with Sheermal before the biryani arrives.",
    quote: "“If you want punchy flavor and rich masala rather than mild rice, Peshawar is top tier.”",
  },
];

export default function BestBiryaniGuidePage() {
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
              { href: SLUG, label: "Best Biryani Guide" },
            ]}
          />
          <div className="site-hero">
            <h1>Best Biryani in Hyderabad (2026)</h1>
            {recommendationsEnabled() && <p><Link href="/picks/biryani">See reviewed biryani recommendations and explore the map</Link></p>}
            <p>
              Unfiltered local recommendations on Hyderabad's best biryani houses: spice profiles, meat cuts, and verified fresh degh timings.
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
              Updated September 2026 · Based on authentic community reviews &amp; batch visits
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
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--violet)" }}>Old City Benchmark</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)", marginTop: 2 }}>Hotel Shadab (Charminar)</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>Mutton Dum Biryani + Tala Hua Ghost</div>
            </div>
            <div style={{ padding: "12px 14px", borderRadius: 10, background: "var(--cream)", border: "1px solid var(--line)" }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--violet)" }}>Best in Cyberabad</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)", marginTop: 2 }}>The Nawaabs (Gachibowli)</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>Consistent, tender meat without heavy grease</div>
            </div>
            <div style={{ padding: "12px 14px", borderRadius: 10, background: "var(--cream)", border: "1px solid var(--line)" }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--violet)" }}>Dakhni Wedding Style</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)", marginTop: 2 }}>Chicha&apos;s (Lakdikapul)</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>Homestyle shadi ki biryani &amp; Shikampurs</div>
            </div>
            <div style={{ padding: "12px 14px", borderRadius: 10, background: "var(--cream)", border: "1px solid var(--line)" }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--violet)" }}>Masaledar &amp; Marag</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)", marginTop: 2 }}>Peshawar (Lakdikapul)</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>Bold spices + steaming Mutton Marag</div>
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
                  <span><strong style={{ color: "var(--ink)" }}>Fresh batch tip:</strong> {s.timingTip}</span>
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
            <Link href="/guides/best-tiffins-hyderabad-reddit" className="site-pill">Best Tiffins Guide</Link>
            <Link href="/guides/best-cafes-hyderabad-reddit" className="site-pill">Best Cafes Guide</Link>
            <Link href="/guides/best-ice-cream-desserts-hyderabad" className="site-pill">Best Ice Cream &amp; Desserts</Link>
            <Link href="/guides/late-night-food-hyderabad-reddit" className="site-pill">Late Night Food Guide</Link>
            <Link href="/rankings/best-biryani-in-hyderabad" className="site-pill">Best Biryani Rankings</Link>
            <Link href="/areas/gachibowli" className="site-pill">Gachibowli Food</Link>
          </div>
        </section>
      </main>

      <SiteRelated
        links={[
          { href: "/rankings/best-biryani-in-hyderabad", label: "Best Biryani Rankings" },
          { href: "/rankings/best-chicken-biryani-in-hyderabad", label: "Chicken Biryani Rankings" },
          { href: "/explore/biryani-and-local", label: "Local Biryani & Kebabs" },
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
