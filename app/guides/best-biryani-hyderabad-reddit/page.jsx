import GuideSpotCard from "../../components/GuideSpotCard.jsx";
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
        <div className="guide-byline">
          <div>
            <div className="ink-chip">
              Editorial Field Guide · 2026 Local Consensus
            </div>
            <div className="guide-updated">
              Updated September 2026 · Based on authentic community reviews &amp; batch visits
            </div>
          </div>
          <Link href="/" className="link-chip">
            Open Map
          </Link>
        </div>

        {/* Quick Picks Summary Card */}
        <section className="guide-quick">
          <h2 className="guide-quick-title">
            Quick Picks: Where to Eat
          </h2>
          <div className="guide-quick-grid">
            <div className="guide-quick-item">
              <div className="guide-quick-k">Old City Benchmark</div>
              <div className="guide-quick-name">Hotel Shadab (Charminar)</div>
              <div className="guide-quick-note">Mutton Dum Biryani + Tala Hua Ghost</div>
            </div>
            <div className="guide-quick-item">
              <div className="guide-quick-k">Best in Cyberabad</div>
              <div className="guide-quick-name">The Nawaabs (Gachibowli)</div>
              <div className="guide-quick-note">Consistent, tender meat without heavy grease</div>
            </div>
            <div className="guide-quick-item">
              <div className="guide-quick-k">Dakhni Wedding Style</div>
              <div className="guide-quick-name">Chicha&apos;s (Lakdikapul)</div>
              <div className="guide-quick-note">Homestyle shadi ki biryani &amp; Shikampurs</div>
            </div>
            <div className="guide-quick-item">
              <div className="guide-quick-k">Masaledar &amp; Marag</div>
              <div className="guide-quick-name">Peshawar (Lakdikapul)</div>
              <div className="guide-quick-note">Bold spices + steaming Mutton Marag</div>
            </div>
          </div>
        </section>

        {/* Spot Deep Dives */}
        <section className="guide-cards">
          {SPOTS.map((s, idx) => (
            <GuideSpotCard key={s.id} s={s} rank={idx + 1} rows={[["Must order", s.whatToOrder], ["Fresh batch tip", s.timingTip]]} />
          ))}
        </section>

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
