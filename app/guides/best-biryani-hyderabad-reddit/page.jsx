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

const SLUG = "/guides/best-biryani-hyderabad-reddit";
const TITLE = "Hyderabad Biryani Picks from Reddit Discussions";
const DESCRIPTION =
  "A discussion-led Hyderabad biryani guide built from recurring Reddit mentions, with restaurant context, dishes people discuss, and links to the evidence-ranked Mapping HYD list.";

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
      name: "Which mutton biryani restaurants recur in Hyderabad discussions?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Hotel Shadab is one recurring Old City name in Mapping HYD's discussion dataset. This page also links to the evidence-ranked biryani list so readers can compare it with other frequently mentioned brands.",
      },
    },
    {
      "@type": "Question",
      name: "Where can I get the best biryani in Gachibowli or HITEC City?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The Nawaabs is one recurring Gachibowli name in the analyzed discussions. Use the Mapping HYD biryani list for count-based comparisons rather than treating this editorial guide as a vote result.",
      },
    },
    {
      "@type": "Question",
      name: "What is the best time of day to eat biryani in Hyderabad?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "There is no citywide batch time that can be guaranteed. Batch schedules vary by restaurant and day, so call the outlet before travelling if a fresh degh is important to you.",
      },
    },
  ],
};

const SPOTS = [
  {
    id: "shadab",
    name: "Hotel Shadab",
    tag: "Old City discussion pick",
    tagBg: "#fef3c7",
    tagColor: "#92400e",
    area: "Old City / Madina",
    href: "/spot/hotel-shadab-ghansi-bazaar",
    verdict:
      "Hotel Shadab is a recurring Old City name in Hyderabad biryani conversations. This guide treats it as a discussion pick, not a community-vote winner.",
    whatToOrder: "Mutton Dum Biryani, Tala Hua Ghost, Qubani Ka Meetha.",
    timingTip: "Peak meal periods can be busy. Confirm current timings and availability with the restaurant before a special trip.",
  },
  {
    id: "nawaabs",
    name: "The Nawaabs",
    tag: "Gachibowli discussion pick",
    tagBg: "#f0fdf4",
    tagColor: "#166534",
    area: "Gachibowli",
    href: "/spot/the-nawaabs-gachibowli",
    verdict:
      "The Nawaabs is a recurring Gachibowli name in the analyzed biryani discussions and a practical tech-corridor option to compare in the evidence list.",
    whatToOrder: "Special Mutton Dum Biryani, Chicken Tikka, Double Ka Meetha.",
    timingTip: "Check the outlet's current service hours and expected wait before peak lunch or dinner.",
  },
  {
    id: "chichas",
    name: "Chicha's",
    tag: "Dakhni-style discussion pick",
    tagBg: "#fdf2f8",
    tagColor: "#86198f",
    area: "Lakdikapul & Masab Tank",
    href: "/spot/chichas-asif-nagar-west",
    verdict:
      "Chicha's recurs in discussions about Dakhni-style food and shadi-ki-biryani preferences. Treat the flavour description as editorial context, not a quoted Reddit verdict.",
    whatToOrder: "Kacchi Dum Biryani, Shikampur Kebab, Bheja Fry, Kaddu Ki Kheer.",
    timingTip: "Late evening seating is lively and popular with local night crowds.",
  },
  {
    id: "peshawar",
    name: "Peshawar",
    tag: "Masaledar discussion pick",
    tagBg: "#fff7ed",
    tagColor: "#9a3412",
    area: "Lakdikapul",
    href: "/spot/peshawar-lakdikapul",
    verdict:
      "Peshawar appears in conversations from diners looking for a richer, more masaledar biryani style. This is an editorial summary rather than a direct quote from a Reddit account.",
    whatToOrder: "Mutton Biryani, Mutton Marag, Zafrani Chicken.",
    timingTip: "Start with a hot bowl of Mutton Marag with Sheermal before the biryani arrives.",
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
            <h1>Hyderabad biryani picks from Reddit discussions</h1>
            {recommendationsEnabled() && <p><Link href="/rankings/best-biryani-in-hyderabad">See the live biryani ranking and vote</Link></p>}
            <p>
              A discussion-led view of Hyderabad biryani houses, recurring restaurant names, spice preferences and dishes people talk about.
            </p>
          </div>
        </div>
      </header>

      <main className="site-body">
        {/* Byline */}
        <div className="guide-byline">
          <div>
            <div className="ink-chip">
              Editorial discussion guide · 2026
            </div>
            <div className="guide-updated">
              Updated September 2026 · Based on Hyderabad Reddit discussions and Mapping HYD venue data
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
              <div className="guide-quick-k">Old City discussion pick</div>
              <div className="guide-quick-name">Hotel Shadab (Charminar)</div>
              <div className="guide-quick-note">Mutton Dum Biryani + Tala Hua Ghost</div>
            </div>
            <div className="guide-quick-item">
              <div className="guide-quick-k">Gachibowli discussion pick</div>
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
        <SwipeDeck label="Spots in this guide">
          {SPOTS.map((s, idx) => (
            <GuideSpotCard key={s.id} s={s} rank={idx + 1} showRank={false} rows={[["Dishes discussed", s.whatToOrder], ["Visit note", s.timingTip]]} />
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
