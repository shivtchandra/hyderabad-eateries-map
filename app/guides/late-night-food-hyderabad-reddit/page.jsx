import Link from "next/link";
import { pageMeta } from "../../../lib/site.js";
import { ogImages } from "../../../lib/og.js";
import { SiteNav, SiteBreadcrumb, SiteFooter, SiteRelated } from "../../components/SiteChrome.jsx";
import { Icon } from "../../components/Icons.jsx";
import BottomNav from "../../components/BottomNav.jsx";
import BackButton from "../../components/BackButton.jsx";

const SLUG = "/guides/late-night-food-hyderabad-reddit";
const TITLE = "Late Night Food in Hyderabad: 24/7 Spots";
const DESCRIPTION =
  "Safe, verified late-night food in Hyderabad: DLF Street Food, Roast 24 Seven, Cafe Niloufer, and midnight mutton biryani spots open from 12 AM to 5 AM.";

export const metadata = {
  ...pageMeta({ title: TITLE, description: DESCRIPTION, path: SLUG }),
  openGraph: {
    ...pageMeta({ title: TITLE, description: DESCRIPTION, path: SLUG }).openGraph,
    images: ogImages(TITLE, DESCRIPTION),
  },
  keywords: [
    "late night food hyderabad reddit",
    "24 hours restaurants in hyderabad",
    "dlf street food timings hyderabad",
    "midnight biryani hyderabad",
    "roast 24 seven jubilee hills",
    "cafe niloufer midnight chai",
    "food open past 12am hyderabad",
    "late night eateries gachibowli",
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
    { "@type": "ListItem", position: 3, name: "Late Night Food Guide", item: "https://eats.mapmyhyd.com" + SLUG },
  ],
};

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Where can I get late night street food in Hyderabad after 1 AM?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The DLF Street Food lane in Gachibowli is the most famous late night food hub, active until 2:30 AM – 3:00 AM with stalls serving hot dosas, Maggi, momos, rolls, and shawarmas.",
      },
    },
    {
      "@type": "Question",
      name: "Are there 24/7 cafes in Hyderabad for working late at night?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, Roast 24 Seven in Jubilee Hills and Gachibowli operates 24 hours daily with specialty coffee, high-speed WiFi, and food service throughout the night.",
      },
    },
    {
      "@type": "Question",
      name: "Where is the best place for midnight Irani Chai in Hyderabad?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Cafe Niloufer's Banjara Hills and Himayatnagar branches stay open until 1:00 AM – 1:30 AM serving hot Irani chai, bun maska, and fresh bakery items.",
      },
    },
  ],
};

const SPOTS = [
  {
    id: "dlf",
    name: "DLF Street Food Lane",
    tag: "Midnight Street Hub (Till 3 AM)",
    tagBg: "#fef3c7",
    tagColor: "#92400e",
    area: "Gachibowli (Opp. DLF Cybercity)",
    href: "/spot/jai-bhawani-tiffin-center-dlf-gate-1-gachibowli",
    verdict:
      "The undisputed midnight street food epicentre of Cyberabad. Packed with dozens of stalls serving steaming hot butter dosas, cheese Maggi, fried momos, and shawarmas to night-shift techies and hungry partygoers.",
    whatToOrder: "Jai Bhawani Ghee Dosa, AM-PM Fried Momos, Egg Cheese Maggi.",
    timingTip: "Most active between 11:30 PM and 2:30 AM. Police patrolling starts clearing stalls near 3:00 AM.",
    quote: "“DLF is unmatched for 2 AM butter dosas and momos with friends.”",
  },
  {
    id: "roast247",
    name: "Roast 24 Seven",
    tag: "24/7 Specialty Cafe & Workspace",
    tagBg: "#eef2ff",
    tagColor: "#4338ca",
    area: "Jubilee Hills & Gachibowli",
    href: "/spot/roast-24-seven-jubilee-hills",
    verdict:
      "A rare 24/7 specialty coffeehouse with full food service, reliable air conditioning, and power outlets at almost every table. Excellent for midnight brainstorms or safe late-night coffee dates.",
    whatToOrder: "Single Origin Cold Brew, Truffle Mushroom Pasta, Dark Chocolate Croissant.",
    timingTip: "Open 24 hours daily with valet parking.",
    quote: "“Safe, quiet 3 AM workspace with incredible specialty coffee.”",
  },
  {
    id: "niloufer",
    name: "Cafe Niloufer",
    tag: "Midnight Irani Chai & Bun Maska",
    tagBg: "#f0fdf4",
    tagColor: "#166534",
    area: "Himayatnagar, Banjara Hills & HITEC City",
    href: "/spot/cafe-niloufer-himayatnagar-himayatnagar",
    verdict:
      "Hyderabad's most celebrated Irani chai institution keeps its ovens running late. The rich, creamy tea paired with butter-laden bun maska or crisp Osmania biscuits is the city's favorite midnight comfort ritual.",
    whatToOrder: "Special Irani Chai, Bun Maska with Jam, Osmania Biscuits, Paneer Roll.",
    timingTip: "Banjara Hills and Himayatnagar outlets remain lively until 1:00 AM – 1:30 AM.",
    quote: "“Midnight chai and bun maska at Niloufer is therapeutic.”",
  },
  {
    id: "shahghouse",
    name: "Shah Ghouse",
    tag: "Late-Night Mutton Biryani",
    tagBg: "#fff7ed",
    tagColor: "#9a3412",
    area: "Gachibowli, Tolichowki & Charminar",
    href: "/spot/shah-ghouse-cafe-and-restaurant-gachibowli",
    verdict:
      "When a severe midnight biryani craving strikes at 1:30 AM, Shah Ghouse is the reliable savior. Steaming hot plates of spicy mutton biryani, chicken 65, and tangdi kebabs continue serving late into the night.",
    whatToOrder: "Special Mutton Biryani, Chicken 65, Mutton Tangdi.",
    timingTip: "The Tolichowki and Gachibowli branches stay open till 1:30 AM – 2:00 AM.",
    quote: "“The only place that serves hot, spicy mutton biryani past 1 AM without compromising on taste.”",
  },
];

export default function LateNightGuidePage() {
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
              { href: SLUG, label: "Late Night Food Guide" },
            ]}
          />
          <div className="site-hero">
            <h1>Best Late Night Food &amp; 24/7 Eateries in Hyderabad</h1>
            <p>
              Verified midnight food spots open from 12 AM to 5 AM: street dosas, 24/7 specialty cafes, Irani chai counters, and late-night mutton biryani.
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
              Updated September 2026 · Verified night owl &amp; midnight food trails
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
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--violet)" }}>Midnight Street Food Hub</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)", marginTop: 2 }}>DLF Street Food (Till 3 AM)</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>Ghee dosas, momos &amp; egg Maggi</div>
            </div>
            <div style={{ padding: "12px 14px", borderRadius: 10, background: "var(--cream)", border: "1px solid var(--line)" }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--violet)" }}>24/7 Work &amp; Coffee</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)", marginTop: 2 }}>Roast 24 Seven</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>Round-the-clock specialty coffee &amp; food</div>
            </div>
            <div style={{ padding: "12px 14px", borderRadius: 10, background: "var(--cream)", border: "1px solid var(--line)" }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--violet)" }}>Midnight Irani Chai</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)", marginTop: 2 }}>Cafe Niloufer (Till 1:30 AM)</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>Special chai + warm bun maska</div>
            </div>
            <div style={{ padding: "12px 14px", borderRadius: 10, background: "var(--cream)", border: "1px solid var(--line)" }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--violet)" }}>Midnight Mutton Biryani</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)", marginTop: 2 }}>Shah Ghouse (Till 2 AM)</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>Hot mutton biryani + Chicken 65</div>
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
                  <span><strong style={{ color: "var(--ink)" }}>Timings &amp; police advisory:</strong> {s.timingTip}</span>
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
            <Link href="/guides/best-cafes-hyderabad-reddit" className="site-pill">Best Cafes Guide</Link>
            <Link href="/guides/best-ice-cream-desserts-hyderabad" className="site-pill">Best Ice Cream &amp; Desserts</Link>
            <Link href="/explore/restaurants" className="site-pill">All Restaurants</Link>
            <Link href="/areas/gachibowli" className="site-pill">Gachibowli Food</Link>
          </div>
        </section>
      </main>

      <SiteRelated
        links={[
          { href: "/explore/biryani-and-local", label: "Midnight Biryani & Eats" },
          { href: "/areas/gachibowli", label: "Gachibowli Late Night" },
          { href: "/explore/cafes", label: "24/7 Cafes" },
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
