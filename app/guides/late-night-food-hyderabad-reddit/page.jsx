import Link from "next/link";
import { pageMeta } from "../../../lib/site.js";
import { ogImages } from "../../../lib/og.js";
import { SiteNav, SiteBreadcrumb, SiteFooter, SiteRelated } from "../../components/SiteChrome.jsx";

const SLUG = "/guides/late-night-food-hyderabad-reddit";
const TITLE = "Late Night Food in Hyderabad (12 AM – 5 AM): The Reddit Midnight Guide";
const DESCRIPTION =
  "Where to eat past midnight in Hyderabad according to r/hyderabad: DLF Street food stalls, Roast 24/7, late-night tiffins, midnight biryani, and 24-hour chai hubs with verified timings.";

export const metadata = {
  ...pageMeta({ title: TITLE, description: DESCRIPTION, path: SLUG }),
  openGraph: {
    ...pageMeta({ title: TITLE, description: DESCRIPTION, path: SLUG }).openGraph,
    images: ogImages(TITLE, DESCRIPTION),
  },
  keywords: [
    "late night food hyderabad reddit",
    "midnight food hyderabad",
    "dlf street food timings reddit",
    "food open at 2 am hyderabad",
    "24 hour cafes in hyderabad",
    "late night biryani hyderabad reddit",
    "late night dosa hyderabad",
    "r/hyderabad midnight food",
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
    { "@type": "ListItem", position: 3, name: "Late Night Food Guide", item: "https://eats.mapmyhyd.com" + SLUG },
  ],
};

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Where is the best street food open after 1 AM in Hyderabad?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "DLF Street in Gachibowli is the most famous and reliable late-night food hub in Hyderabad, with dozens of active stalls serving momos, Maggi, shawarma, and tiffins until 2:30 AM – 3:00 AM.",
      },
    },
    {
      "@type": "Question",
      name: "Which cafes are open 24/7 in Hyderabad for coffee and food?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Roast 24 Seven in Jubilee Hills/Gachibowli belt is the top-voted 24/7 cafe on r/hyderabad for late-night coffee, food, and quiet work spaces.",
      },
    },
    {
      "@type": "Question",
      name: "Where can you get late-night biryani in Hyderabad?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Shah Ghouse (Tolichowki & Charminar) and Peshawar (Lakdikapul) are the go-to spots for hot mutton dum biryani served well past midnight.",
      },
    },
    {
      "@type": "Question",
      name: "Is Cafe Niloufer open late for midnight chai?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, Cafe Niloufer branches (such as Himayatnagar and Lakdi Ka Pul) serve hot Irani chai, bun maska, and Osmania biscuits until around 1:00 AM – 1:30 AM.",
      },
    },
  ],
};

const LATE_NIGHT_SPOTS = [
  {
    rank: 1,
    name: "DLF Street Food Belt (Gachibowli)",
    timing: "Open until 2:30 AM – 3:00 AM",
    area: "Gachibowli, opposite DLF Cybercity",
    href: "/spot/jai-bhawani-tiffin-center-dlf-gate-1-gachibowli",
    verdict: "The undisputed capital of midnight street cravings for techies and night owls. The entire stretch is alive with steaming tiffins, fried momos, and Maggi.",
    whatToOrder: "Egg Cheese Maggi, AM-PM Momos, and Ghee Karampodi Dosa at Jai Bhawani.",
    tip: "Park near Gate 2 or take a cab, as the main road gets crowded between 12:30 AM and 1:30 AM.",
    redditQuote: "“DLF is the only place in Cyberabad where you can get momos, crispy dosa, and fresh fruit juice together at 2:00 AM.”",
  },
  {
    rank: 2,
    name: "Roast 24 Seven",
    timing: "Open 24 Hours (Round the clock)",
    area: "Jubilee Hills / Western Belt",
    href: "/spot/roast-24-seven-jubilee-hills",
    verdict: "The top-recommended premium midnight haven. High-speed Wi-Fi, artisanal coffee, gourmet sandwiches, and comfortable seating all night.",
    whatToOrder: "Cold Brew, Pour-Over Specialty Coffee, and Truffle Fries / Pasta.",
    tip: "Perfect for midnight coding, reading, or quiet conversations away from noisy street stalls.",
    redditQuote: "“When you need proper coffee and a quiet table at 3:30 AM with zero stress, Roast 24 Seven is unbeatable.”",
  },
  {
    rank: 3,
    name: "Cafe Niloufer (Midnight Chai)",
    timing: "Open until 1:00 AM – 1:30 AM",
    area: "Himayatnagar / Lakdikapul",
    href: "/spot/cafe-niloufer-himayatnagar-himayatnagar",
    verdict: "The ultimate midnight ritual in Hyderabad. Thick, creamy Irani chai served in porcelain cups alongside hot bun maska and fresh Osmania biscuits.",
    whatToOrder: "Special Irani Chai, Bun Maska with Jam, and Paneer Puff.",
    tip: "Standing outside the counter with friends gives you the authentic local Hyderabad midnight vibe.",
    redditQuote: "“A midnight drive on Tank Bund ending with hot chai at Niloufer Himayatnagar is a quintessential Hyderabad experience.”",
  },
  {
    rank: 4,
    name: "Shah Ghouse Cafe (Midnight Dum Biryani)",
    timing: "Open until 1:30 AM – 2:00 AM",
    area: "Tolichowki / Charminar",
    href: "/spot/shah-ghouse-cafe-charminar-old-city",
    verdict: "When your late-night hunger requires serious food. Fresh handis of mutton dum biryani and smoky boti kebabs served hot until the early hours.",
    whatToOrder: "Mutton Dum Biryani, Boti Kebab, and Mutton Marag.",
    tip: "Ask for extra 'saalan' (mirchi curry) to drizzle over the steaming midnight rice.",
    redditQuote: "“Shah Ghouse Tolichowki is the savior when you land at RGIA airport past midnight and need real food.”",
  },
];

export default function LateNightFoodRedditGuide() {
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
                { href: SLUG, label: "Midnight Food Guide" },
              ]}
            />
            <h1 className="site-title">{TITLE}</h1>
            <p className="site-description">
              Verified late-night eateries, street hubs, 24/7 cafes, and midnight chai spots tested by r/hyderabad night owls.
            </p>
            <div className="site-header-meta" style={{ marginTop: 12 }}>
              <span className="site-pill">Verified Timings</span>
              <span className="site-pill">12 AM – 5 AM Hubs</span>
              <span className="site-pill">r/hyderabad Tested</span>
            </div>
          </div>
        </header>

        <main className="site-main">
          <section className="site-section">
            <div className="site-prose">
              <p>
                Hyderabad is a city that never sleeps hungry. Whether you are wrapping up a late shift in the IT corridor, landing at the airport past midnight, or on a night drive with friends, there are dependable spots that serve incredible food until sunrise.
              </p>
              <p>
                Here is the <strong>r/hyderabad verified guide</strong> to where to eat after midnight without running into closed shutters or stale food.
              </p>
            </div>
          </section>

          <section className="site-section">
            <h2 className="site-section-title">The Top Late-Night Hubs (Ranked)</h2>
            <div className="site-stack" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {LATE_NIGHT_SPOTS.map((spot) => (
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
                        #{spot.rank} Late-Night Pick
                      </span>
                      <h3 style={{ margin: "0 0 4px", fontSize: "20px", color: "var(--ink)" }}>{spot.name}</h3>
                      <p style={{ margin: "0 0 12px", fontSize: "13px", color: "var(--muted)" }}>
                        📍 {spot.area} · <strong style={{ color: "var(--forest)" }}>🕒 {spot.timing}</strong>
                      </p>
                    </div>
                    <Link
                      href={spot.href}
                      className="site-pill"
                      style={{ background: "var(--blue-wash)", color: "var(--blue)", textDecoration: "none", fontWeight: 600 }}
                    >
                      View Spot →
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
                      <strong style={{ color: "var(--pop-deep)" }}>Night Owl Tip:</strong> {spot.tip}
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
                      — r/hyderabad community tip
                    </cite>
                  </blockquote>
                </article>
              ))}
            </div>
          </section>

          <section className="site-section">
            <h2 className="site-section-title">Late-Night Frequently Asked Questions</h2>
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
            <h2 style={{ fontSize: "22px", marginBottom: "10px" }}>Explore 3,400+ Spots on the Live Map</h2>
            <p style={{ color: "var(--muted)", maxWidth: "500px", margin: "0 auto 20px" }}>
              Filter places by open timings, check live community votes, and find the best food near you right now.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/" className="site-cta" style={{ margin: 0 }}>
                Open Live Map →
              </Link>
              <Link href="/areas/gachibowli" className="site-cta" style={{ margin: 0, background: "var(--ink)" }}>
                Explore Gachibowli Eateries
              </Link>
            </div>
          </section>

          <SiteRelated
            title="More Guides & Rankings"
            links={[
              { href: "/guides/best-biryani-hyderabad-reddit", label: "Best Biryani (Reddit Guide)" },
              { href: "/rankings/best-cafe-in-hyderabad", label: "Best Cafe Rankings" },
              { href: "/areas/gachibowli", label: "Food in Gachibowli" },
              { href: "/stories", label: "Local Food Stories" },
            ]}
          />
        </main>
        <SiteFooter />
      </div>
    </>
  );
}
