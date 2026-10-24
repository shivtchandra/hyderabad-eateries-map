import GuideSpotCard from "../../components/GuideSpotCard.jsx";
import SwipeDeck from "../../components/SwipeDeck.jsx";
import Link from "next/link";
import { recommendationsEnabled } from "../../../lib/recommendationShared.js";
import { pageMeta } from "../../../lib/site.js";
import { ogImages } from "../../../lib/og.js";
import { SiteNav, SiteBreadcrumb, SiteFooter, SiteRelated } from "../../components/SiteChrome.jsx";
import { Icon } from "../../components/Icons.jsx";
import BottomNav from "../../components/BottomNav.jsx";
import BackButton from "../../components/BackButton.jsx";

const SLUG = "/guides/best-tiffins-hyderabad-reddit";
const TITLE = "Best Tiffin Centres in Hyderabad (2026): Top Breakfast & Ghee Dosas";
const DESCRIPTION =
  "The authentic, unfiltered guide to Hyderabad's best tiffins: Varalakshmi (unmatched taste & pricing, precise bondas), Ishtaa, Penam, Panchakattu, and Kanchi Cafe.";

export const metadata = {
  ...pageMeta({ title: TITLE, description: DESCRIPTION, path: SLUG }),
  openGraph: {
    ...pageMeta({ title: TITLE, description: DESCRIPTION, path: SLUG }).openGraph,
    images: ogImages(TITLE, DESCRIPTION, SLUG),
  },
  keywords: [
    "best tiffins in hyderabad reddit",
    "best breakfast places hyderabad",
    "varalakshmi tiffins review taste pricing",
    "varalakshmi tiffins mysore bonda",
    "varalakshmi tiffins dlf poori",
    "poori spots in hyderabad",
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
  dateModified: "2026-10-02",
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
      name: "Why is Varalakshmi Tiffins considered one of the best breakfast spots in Hyderabad?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Varalakshmi Tiffins is celebrated as easily one of the best tiffin shops in Hyderabad for both taste and accessible pricing. Highlights include their exceptionally crisp and precise Mysore Bondas, signature ghee podi idlis swimming in warm ghee, and newly added hot pooris. While patrons note that dosa portions have slightly reduced recently, the quality and punchy chutney flavors remain top-tier.",
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
        text: "Panchakattu Dosa in Begumpet and Nallagandla specializes in Rayalaseema-style dosas. Mapping HYD's personal must-order recommendation is the Neyyi Kaaram Palyam Dosa.",
      },
    },
    {
      "@type": "Question",
      name: "Where can you find good pooris and late-night ghee tiffins in DLF Gachibowli?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Varalakshmi Tiffins outside DLF Cybercity in Gachibowli is famous for ghee podi idlis and has newly introduced hot, fluffy Pooris served with flavorful potato kurma and spicy chutneys, earning top marks for taste.",
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
    id: "varalakshmi",
    name: "Varalakshmi Tiffins",
    tag: "Taste & Pricing Champion",
    tagBg: "#ecfdf5",
    tagColor: "#047857",
    area: "DLF Gachibowli & Multiple Locations",
    href: "/areas/gachibowli",
    verdict:
      "Easily the best tiffin shop in Hyderabad when balancing supreme taste against honest pricing. While newer boutique tiffin places charge premium rates, Varalakshmi delivers extraordinary flavor per rupee. The Mysore Bondas here are phenomenal, golden crisp on the outside, soft, airy, and geometrically precise inside without heavy oiliness. Their dosas are equally delicious and flavorful with generous ghee and bold spice, though frequent regulars observe that the overall portion size has slightly reduced recently. Don't skip their newly introduced hot pooris with potato kurma or their signature ghee podi idlis swimming in fragrant melted ghee.",
    whatToOrder: "Crispy Mysore Bonda (very precise), Newly added Hot Poori with potato kurma, Ghee Podi Idli, Ghee Karam Dosa.",
    timingTip: "Early morning breakfast starts by 6:30 AM; the DLF outlet stays bustling until late midnight.",
    quote: "“Easily the best tiffin spot in town for taste and pricing. The bondas are wonderfully crisp and precise, and while dosa portions feel slightly smaller lately, the taste remains unbeatable.”",
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
      "Penam keeps things deliberately focused: rustic village-style dosas, piping hot pungaralu, and a chutney game that carries the entire meal. Nothing overly commercialized, it feels like eating breakfast fresh off a village griddle.",
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
    whatToOrder: "Neyyi Kaaram Palyam Dosa first, followed by the Panchakattu Special Ghee Karam Dosa, Upma Dosa, and Kumbakonam Filter Coffee.",
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
          <SiteNav active="/stories" />
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
            {recommendationsEnabled() && <p><Link href="/?dish=tiffins">See tiffins recommendations on the map</Link></p>}
            <p>
              Unfiltered local insights on Hyderabad's top breakfast spots: from 4-chutney spreads and homestyle pungaralu to spicy Rayalaseema ghee karam dosas.
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
              Updated September 2026 · Based on authentic community reviews &amp; food visits
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
              <div className="guide-quick-k">Best Taste &amp; Pricing</div>
              <div className="guide-quick-name">Varalakshmi Tiffins</div>
              <div className="guide-quick-note">Precise Mysore bondas, pooris &amp; ghee idlis</div>
            </div>
            <div className="guide-quick-item">
              <div className="guide-quick-k">Top Chutney Spread</div>
              <div className="guide-quick-name">Ishtaa (HITEC City)</div>
              <div className="guide-quick-note">Crisp dosas + multi-chutney platter</div>
            </div>
            <div className="guide-quick-item">
              <div className="guide-quick-k">Homestyle &amp; Pungaralu</div>
              <div className="guide-quick-name">Penam (Jubilee Hills)</div>
              <div className="guide-quick-note">Village-style dosas &amp; rich chutney</div>
            </div>
            <div className="guide-quick-item">
              <div className="guide-quick-k">Spicy Ghee Karam</div>
              <div className="guide-quick-name">Panchakattu Dosa</div>
              <div className="guide-quick-note">Rayalaseema red garlic karam</div>
            </div>
            <div className="guide-quick-item">
              <div className="guide-quick-k">Degree Filter Coffee</div>
              <div className="guide-quick-name">Kanchi Cafe</div>
              <div className="guide-quick-note">Kumbakonam degree brew (weekdays best)</div>
            </div>
          </div>
        </section>

        {/* Spot Deep Dives */}
        <SwipeDeck label="Spots in this guide">
          {SPOTS.map((s, idx) => (
            <GuideSpotCard key={s.id} s={s} rank={idx + 1} rows={[["Must order", s.whatToOrder], ["Crowd advisory", s.timingTip]]} />
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
