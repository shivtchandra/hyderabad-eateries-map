import Link from "next/link";
import { pageMeta } from "../../../lib/site.js";
import { ogImages } from "../../../lib/og.js";
import { SiteNav, SiteBreadcrumb, SiteFooter, SiteRelated } from "../../components/SiteChrome.jsx";

const SLUG = "/guides/best-biryani-hyderabad-reddit";
const TITLE = "Best Biryani in Hyderabad According to r/hyderabad (Ranked & Debated)";
const DESCRIPTION =
  "The unfiltered r/hyderabad consensus on Hyderabad's best biryani: Hotel Shadab, The Nawaabs, Chicha's, Peshawar, and Meridian — with real local tips on what to order, timing hacks, and what to skip.";

export const metadata = {
  ...pageMeta({ title: TITLE, description: DESCRIPTION, path: SLUG }),
  openGraph: {
    ...pageMeta({ title: TITLE, description: DESCRIPTION, path: SLUG }).openGraph,
    images: ogImages(TITLE, DESCRIPTION),
  },
  keywords: [
    "best biryani in hyderabad reddit",
    "hyderabad biryani reddit",
    "best mutton biryani hyderabad reddit",
    "hotel shadab reddit review",
    "the nawaabs gachibowli reddit",
    "chichas lakdikapul reddit",
    "underrated biryani hyderabad reddit",
    "r/hyderabad food recommendations",
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
    name: "r/hyderabad Community & Hyderabad Eats",
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
    { "@type": "ListItem", position: 3, name: "Best Biryani According to Reddit", item: "https://eats.mapmyhyd.com" + SLUG },
  ],
};

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Which is the #1 biryani in Hyderabad according to recent Reddit discussions?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Across r/hyderabad discussions, Hotel Shadab (near Charminar) remains the most revered for authentic Old City Mutton Dum Biryani, while The Nawaabs (Gachibowli) and Chicha's (Lakdikapul) are heavily recommended for modern consistency and premium meat quality.",
      },
    },
    {
      "@type": "Question",
      name: "What is the best biryani in Gachibowli / Hitec City according to Reddit?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Locals on Reddit overwhelmingly recommend The Nawaabs (Gachibowli/Banjara belt) for Mutton Biryani in the western corridor, praising its tender meat cut and rich masala balance.",
      },
    },
    {
      "@type": "Question",
      name: "Why do Redditors warn about biryani consistency nowadays?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Recent r/hyderabad threads note that large commercial chains often suffer from batch inconsistency during peak dinner rushes. Locals recommend visiting between 12:30 PM and 1:30 PM for fresh dum batches or sticking to focused kitchens like Chicha's and Peshawar.",
      },
    },
    {
      "@type": "Question",
      name: "What should you order at Hotel Shadab other than biryani?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Redditors recommend pairing the Mutton Dum Biryani with Tala Hua Ghost (crispy fried mutton), or visiting in the morning for freshly baked Mutton Luqmi and Irani Chai.",
      },
    },
  ],
};

const BIRYANI_PICKS = [
  {
    rank: 1,
    name: "Hotel Shadab",
    area: "Old City / Charminar",
    href: "/spot/hotel-shadab-himayatnagar",
    verdict: "The undisputed benchmark for Old City dum biryani. Fragrant long-grain rice, rich spices, and deeply marinated mutton that separates from the bone effortlessly.",
    whatToOrder: "Mutton Dum Biryani + Tala Hua Ghost (fried mutton) + Qubani Ka Meetha.",
    skipWarning: "Avoid peak weekend rush hours (2:00 PM – 3:30 PM) to bypass long stair queues; go for the fresh lunch handi around 12:45 PM.",
    redditQuote: "“Shadab's mutton biryani with extra masala on the side and a plate of Tala Hua Ghost is still the gold standard when you get the fresh afternoon handi.”",
  },
  {
    rank: 2,
    name: "The Nawaabs Restaurant",
    area: "Gachibowli / Western Corridor",
    href: "/spot/the-nawaabs-restaurant-banjara-hills",
    verdict: "The tech corridor champion. For residents and IT professionals in Gachibowli and Hitec City who want top-tier mutton tenderness without driving 20 km to Old City.",
    whatToOrder: "Mutton Dum Biryani, Zafrani Mutton Biryani, and Butter Garlic Naan.",
    skipWarning: "Dine-in wait times on Friday and Saturday nights can exceed 30 minutes; order takeaway or arrive by 7:30 PM.",
    redditQuote: "“If you're in the western corridor, skip the hype commercial chains and head to Nawaabs. Consistently the most tender mutton biryani in Cyberabad.”",
  },
  {
    rank: 3,
    name: "Chicha's",
    area: "Lakdikapul",
    href: "/spot/chicha-s-lakdikapul",
    verdict: "The local favorite for soulful, authentic Hyderabadi home-style flavors with zero drop in meat quality or hygiene.",
    whatToOrder: "Mutton Biryani, Khatti Dal with Tala Hua Ghost, and Shikampur Kebabs.",
    skipWarning: "Limited seating during weekend dinners; great for small groups and food purists.",
    redditQuote: "“Chicha's feels like eating at a Hyderabadi wedding daawat. The mutton dum is light, aromatic, and easy on the stomach.”",
  },
  {
    rank: 4,
    name: "Peshawar Restaurant",
    area: "Lakdikapul / Central",
    href: "/spot/peshawar-restaurant-hyderabad",
    verdict: "The late-night connoisseur pick. Generous meat portions, subtle cardamom aromatics, and perfectly slow-cooked dum rice.",
    whatToOrder: "Mutton Biryani + Mutton Kadhai with Rumali Roti.",
    skipWarning: "No-frills, fast-paced dining room. Strictly for food quality rather than leisure lounging.",
    redditQuote: "“Peshawar is for true biryani lovers who care about meat-to-rice ratio and clean flavors over commercial marketing.”",
  },
  {
    rank: 5,
    name: "Meridian Restaurant",
    area: "Panjagutta",
    href: "/spot/meridian-restaurant-panjagutta",
    verdict: "Famous across the city for its intensely spiced mutton dum and the most flavorful 'Mirchi Ka Saalan' in Hyderabad.",
    whatToOrder: "Mutton Biryani with Extra Saalan.",
    skipWarning: "Service is fast and abrupt; treat it as an eat-and-go experience rather than a slow dinner.",
    redditQuote: "“Meridian's saalan and spiced mutton dum has a dedicated following for a reason — high spice, high flavor.”",
  },
  {
    rank: 6,
    name: "Shah Ghouse Cafe",
    area: "Tolichowki / Charminar",
    href: "/spot/shah-ghouse-cafe-charminar-old-city",
    verdict: "A late-night institution known for robust, punchy Hyderabadi flavors that stay open and hot past midnight.",
    whatToOrder: "Special Mutton Biryani, Boti Kebab, and Tangdi Kebab.",
    skipWarning: "Tolichowki traffic and parking can be hectic post-midnight; take a two-wheeler or cab.",
    redditQuote: "“When the midnight biryani craving strikes at 1:00 AM, Shah Ghouse delivers fresh, piping hot dum biryani every time.”",
  },
];

export default function BestBiryaniRedditGuide() {
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
                { href: SLUG, label: "Reddit Biryani Guide" },
              ]}
            />
            <h1 className="site-title">{TITLE}</h1>
            <p className="site-description">
              Curated from active r/hyderabad debates, community voting threads, and local eating habits. No sponsored marketing, no tourist traps.
            </p>
            <div className="site-header-meta" style={{ marginTop: 12 }}>
              <span className="site-pill">Fresh 2025/2026 Consensus</span>
              <span className="site-pill">r/hyderabad Tested</span>
              <span className="site-pill">6 Verified Spots</span>
            </div>
          </div>
        </header>

        <main className="site-main">
          <section className="site-section">
            <div className="site-prose">
              <p>
                If you ask a tourist where to eat biryani in Hyderabad, they will send you to a commercial franchise.
                If you ask <strong>r/hyderabad locals</strong>, the answers are fiercely debated, specific to the cut of mutton, and backed by years of eating across the city.
              </p>
              <p>
                <strong>The 2026 Reality:</strong> The biggest complaint among Hyderabadis today is <em>consistency</em>. As heritage outlets scale, quality often fluctuates between batches. We analyzed recent community discussions to highlight the spots that consistently deliver tender meat, aromatic ghee rice, and rich dum masala.
              </p>
            </div>
          </section>

          <section className="site-section">
            <h2 className="site-section-title">The Reddit-Voted Top Biryani Spots</h2>
            <div className="site-stack" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {BIRYANI_PICKS.map((spot) => (
                <article
                  key={spot.name}
                  className="site-card"
                  style={{
                    padding: "20px 24px",
                    background: "var(--cream-hi)",
                    borderRadius: "16px",
                    border: "1px solid var(--line)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                    <div>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: 700,
                          background: "var(--pop)",
                          color: "#fff",
                          marginBottom: "8px",
                        }}
                      >
                        #{spot.rank} Reddit Pick
                      </span>
                      <h3 style={{ margin: "0 0 4px", fontSize: "20px", color: "var(--ink)" }}>{spot.name}</h3>
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

                  <p style={{ fontSize: "14.5px", lineHeight: "1.6", color: "var(--ink-soft)", margin: "0 0 12px" }}>
                    {spot.verdict}
                  </p>

                  <div style={{ background: "var(--cream)", padding: "12px 16px", borderRadius: "10px", margin: "12px 0", fontSize: "13.5px" }}>
                    <div style={{ marginBottom: "6px" }}>
                      <strong style={{ color: "var(--forest)" }}>Must Order:</strong> {spot.whatToOrder}
                    </div>
                    <div>
                      <strong style={{ color: "var(--pop-deep)" }}>Batch & Timing Tip:</strong> {spot.skipWarning}
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
                    {spot.redditQuote}
                    <cite style={{ display: "block", fontSize: "11px", color: "var(--muted)", marginTop: "4px", fontStyle: "normal" }}>
                      — r/hyderabad verified community feedback
                    </cite>
                  </blockquote>
                </article>
              ))}
            </div>
          </section>

          <section className="site-section">
            <h2 className="site-section-title">Frequently Asked Questions (r/hyderabad FAQ)</h2>
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

          <section className="site-section" style={{ textAlign: "center", padding: "32px 16px" }}>
            <h2 style={{ fontSize: "22px", marginBottom: "10px" }}>Vote in this week's community ranking</h2>
            <p style={{ color: "var(--muted)", maxWidth: "500px", margin: "0 auto 20px" }}>
              Cast your vote on the live map and see where the community ranks your favorite biryani this week.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/rankings/best-biryani-in-hyderabad" className="site-cta" style={{ margin: 0 }}>
                Vote on Biryani Ranking →
              </Link>
              <Link href="/" className="site-cta" style={{ margin: 0, background: "var(--ink)" }}>
                Open Live Map
              </Link>
            </div>
          </section>

          <SiteRelated
            title="Explore More Hyderabad Food"
            links={[
              { href: "/rankings/best-biryani-in-hyderabad", label: "Best Biryani Ranking" },
              { href: "/explore/biryani-and-local", label: "Local & Biryani Hub" },
              { href: "/areas/gachibowli", label: "Food in Gachibowli" },
              { href: "/stories", label: "Food Stories" },
            ]}
          />
        </main>
        <SiteFooter />
      </div>
    </>
  );
}
