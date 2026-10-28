import Link from "next/link";
import { pageMeta } from "../../../lib/site.js";
import { ogImages } from "../../../lib/og.js";
import { SiteNav, SiteBreadcrumb, SiteFooter, SiteRelated } from "../../components/SiteChrome.jsx";
import BottomNav from "../../components/BottomNav.jsx";
import BackButton from "../../components/BackButton.jsx";

// One evergreen URL for "new restaurants in Hyderabad": refresh OPENINGS and
// MONTH each month instead of starting a new page, so the URL keeps its rank.
// Every entry must carry a published source and the date it was reported.
const SLUG = "/guides/new-restaurants-in-hyderabad";
const MONTH = "October 2026";
const UPDATED = "2026-10-28";
const TITLE = `New Restaurants, Cafes & Bars in Hyderabad (${MONTH})`;
const DESCRIPTION =
  "Every Hyderabad restaurant, cafe, bar and brewery reported as newly opened in October 2026: Oktober in Jubilee Hills, HOSA and The All American Diner at RMZ The Loft, Babylon 2.0, Foxie and Du Jour, with what they serve and the source for each.";

export const metadata = {
  ...pageMeta({ title: TITLE, description: DESCRIPTION, path: SLUG }),
  openGraph: {
    ...pageMeta({ title: TITLE, description: DESCRIPTION, path: SLUG }).openGraph,
    images: ogImages(TITLE, DESCRIPTION, SLUG),
  },
  keywords: [
    "new restaurants in hyderabad",
    "new cafes in hyderabad",
    "new restaurants hyderabad october 2026",
    "new openings hyderabad",
    "new brewery hyderabad",
    "new bars jubilee hills",
  ],
};

const OPENINGS = [
  {
    name: "Oktober",
    kind: "Brewery and restaurant",
    area: "Road No. 10, Jubilee Hills",
    reported: "26 Oct 2026",
    what: "Craft beer, cocktails, music, and Indian and international food. Founded by Snehit Reddy and Rashmi Reddy; designed by Srikanth Reddy of 23 Degrees Design Shift, with terraces overlooking a park.",
    order: "Beers include Wise Men (hefeweizen), Hell Yes! (helles lager), Cloud 10 (hazy IPA) and Dhorasani (pineapple cider). Food includes Truffle Tandoori Paneer Tikka, Banana Leaf Chilli Fish and Qubani Cheesecake.",
    source: { label: "Telangana Today", url: "https://telanganatoday.com/oktober-opens-in-jubilee-hills-bringing-cocktails-and-dining-together" },
  },
  {
    name: "HOSA",
    kind: "Contemporary South Indian",
    area: "RMZ The Loft, HITEC City",
    reported: "23 Oct 2026",
    what: "A contemporary South Indian restaurant with a menu drawing on Andhra Pradesh and Telangana regional cooking.",
    source: { label: "Indian Retailer", url: "https://www.indianretailer.com/news/rmz-loft-adds-hosa-and-all-american-diner-hitec-city" },
  },
  {
    name: "The All American Diner",
    kind: "American diner",
    area: "RMZ The Loft, HITEC City",
    reported: "23 Oct 2026",
    what: "A Delhi diner brand with about two decades behind it, now in Hyderabad with retro interiors: cherry-red seats, chrome and a jukebox.",
    order: "All-day breakfast, sunrise skillets, stacked pancakes, burgers, hot dogs, thick shakes and pecan pie.",
    source: { label: "Indian Retailer", url: "https://www.indianretailer.com/news/rmz-loft-adds-hosa-and-all-american-diner-hitec-city" },
  },
  {
    name: "Babylon Brewery & Club 2.0",
    kind: "Brewery and club",
    area: "Financial District",
    reported: "23 Oct 2026",
    what: "A large venue combining brewing, dining and entertainment: a brewery by day that turns into a club at night.",
    source: { label: "BW Hotelier", url: "https://www.bwhotelier.com/article/babylon-brewery-club-2-0-opens-in-hyderabad-s-financial-district-582599" },
  },
  {
    name: "Foxie",
    kind: "Cocktail bar",
    area: "Jubilee Hills, one floor below Lili",
    reported: "14 Oct 2026",
    what: "An art and cocktail bar from the team behind Lili (founders Naveen Krishna and Navyatha Reddy). The nine-cocktail menu is built around the nine tails of the fox from Japanese folklore, and artist Siddharth Kerkar made the 100 fox artworks on the walls.",
    order: "Truffle lobster cone and hoisin duck zambusa from the bar menu.",
    href: "/spot/foxie-cocktail-bar-jubilee-hills",
    source: { label: "Esquire India October hotlist", url: "https://www.esquireindia.co.in/food-and-drinks/what-to-eat/esquire-india-october-hotlist-new-restaurants-and-bars-across-india-fitour-n%C4%81m-chor-bizarre-and-more" },
  },
  {
    name: "Du Jour",
    kind: "Bakery cafe",
    area: "Jubilee Hills",
    reported: "14 Oct 2026",
    what: "A 15-seat cafe for viennoiserie, specialty coffee and matcha, from a bakery that started as a cloud kitchen.",
    order: "Chocolate Crobun, Pistachio and Raspberry Crobun, and the Cheese & Olive savoury bake.",
    href: "/spot/du-jour-jubilee-hills",
    source: { label: "Esquire India October hotlist", url: "https://www.esquireindia.co.in/food-and-drinks/what-to-eat/esquire-india-october-hotlist-new-restaurants-and-bars-across-india-fitour-n%C4%81m-chor-bizarre-and-more" },
  },
];

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: `What new restaurants opened in Hyderabad in ${MONTH}?`,
      acceptedAnswer: {
        "@type": "Answer",
        text: `${OPENINGS.length} openings were reported in ${MONTH}: ${OPENINGS.map((o) => `${o.name} (${o.area})`).join(", ")}.`,
      },
    },
    {
      "@type": "Question",
      name: "What is the newest brewery in Hyderabad?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Oktober on Road No. 10, Jubilee Hills, reported open on 26 October 2026, and Babylon Brewery & Club 2.0 in the Financial District, reported on 23 October 2026.",
      },
    },
    {
      "@type": "Question",
      name: "Which new restaurants opened at RMZ The Loft in HITEC City?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "HOSA, a contemporary South Indian restaurant drawing on Andhra and Telangana cooking, and The All American Diner, both reported on 23 October 2026.",
      },
    },
    {
      "@type": "Question",
      name: "What is the newest cafe in Jubilee Hills?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Du Jour's 15-seat cafe for viennoiserie, specialty coffee and matcha, listed in Esquire India's October 2026 hotlist.",
      },
    },
  ],
};

const articleLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: TITLE,
  description: DESCRIPTION,
  url: "https://eats.mapmyhyd.com" + SLUG,
  datePublished: UPDATED,
  dateModified: UPDATED,
  author: { "@type": "Person", name: "Shiva Chandra" },
  publisher: { "@type": "Organization", name: "Hyderabad Eats", url: "https://eats.mapmyhyd.com" },
};

const listLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: TITLE,
  itemListElement: OPENINGS.map((o, i) => ({ "@type": "ListItem", position: i + 1, name: `${o.name}, ${o.area}` })),
};

export default function NewRestaurantsPage() {
  return (
    <div className="site-page" style={{ paddingBottom: 84 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(listLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      <header className="site-header">
        <div className="site-header-inner">
          <SiteNav active="/stories" />
          <BackButton fallback="/stories" />
          <SiteBreadcrumb
            items={[
              { href: "/", label: "Home" },
              { href: "/stories", label: "Stories & Guides" },
              { href: SLUG, label: "New in Hyderabad" },
            ]}
          />
          <div className="site-hero">
            <h1>New restaurants, cafes and bars in Hyderabad ({MONTH})</h1>
            <p>
              {OPENINGS.length} places reported as newly opened this month, from a Jubilee Hills brewery to two new dining rooms at
              RMZ The Loft. Each one links to the report it comes from.
            </p>
          </div>
        </div>
      </header>

      <main className="site-body">
        <div className="guide-byline">
          <div>
            <div className="ink-chip">New openings · {MONTH}</div>
            <div className="guide-updated">Updated 28 October 2026 · By Shiva Chandra</div>
          </div>
          <Link href="/" className="link-chip">Open Map</Link>
        </div>

        <section className="guide-faq">
          <h2 className="guide-faq-title">Openings at a glance</h2>
          <table className="guide-table">
            <thead>
              <tr><th>Place</th><th>What</th><th>Where</th><th>Reported</th></tr>
            </thead>
            <tbody>
              {OPENINGS.map((o) => (
                <tr key={o.name}>
                  <td>{o.href ? <Link href={o.href}>{o.name}</Link> : <b>{o.name}</b>}</td>
                  <td>{o.kind}</td>
                  <td>{o.area}</td>
                  <td>{o.reported}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {OPENINGS.map((o) => (
          <section key={o.name} className="guide-faq">
            <h2 className="guide-faq-title">{o.name}</h2>
            <p className="guide-method">{o.kind} · {o.area} · reported {o.reported}</p>
            <p>{o.what}</p>
            {o.order && <p><b>On the menu:</b> {o.order}</p>}
            <p className="guide-method">
              Source: <a href={o.source.url} target="_blank" rel="noopener noreferrer nofollow">{o.source.label}</a>
              {o.href && <> · <Link href={o.href}>See {o.name} on the map</Link></>}
            </p>
          </section>
        ))}

        <section className="guide-faq">
          <h2 className="guide-faq-title">Frequently Asked Questions</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {faqLd.mainEntity.map((faq, i) => (
              <details key={i}>
                <summary>{faq.name}</summary>
                <p style={{ margin: "10px 0 0", fontSize: 14, color: "var(--muted)", lineHeight: 1.55 }}>{faq.acceptedAnswer.text}</p>
              </details>
            ))}
          </div>
        </section>

        <p className="guide-method" style={{ marginTop: 24 }}>
          How this list is made: only places a publication reported as newly opened during the month, with the report date shown.
          We have not visited them yet; visit notes get added to each spot page when we do.
        </p>
      </main>

      <SiteRelated
        links={[
          { href: "/guides/best-cafes-hyderabad-reddit", label: "Best Cafes in Hyderabad" },
          { href: "/guides/best-breweries-in-hyderabad", label: "Best Breweries in Hyderabad" },
          { href: "/areas/jubilee-hills", label: "Jubilee Hills Food" },
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
