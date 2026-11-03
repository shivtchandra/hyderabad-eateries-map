import Link from "next/link";
import { RECENT_OPENINGS as OPENINGS } from "../../../lib/recentOpenings.js";
import { pageMeta } from "../../../lib/site.js";
import { ogImages } from "../../../lib/og.js";
import { SiteNav, SiteBreadcrumb, SiteFooter, SiteRelated } from "../../components/SiteChrome.jsx";
import BottomNav from "../../components/BottomNav.jsx";
import BackButton from "../../components/BackButton.jsx";
import { slugFromTitle } from "../../../lib/rankings.js";
import { getEateryBySlugOrId } from "../../../lib/siteData.js";
import { googleMapsPlaceUrl } from "../../../lib/placeMapLinks.js";
import "./new-openings.css";

// Direct publisher image links; no image files are downloaded into this project.
const COVER = { src: "https://media.assettype.com/esquireindia%2F2026-10-14%2Fpxje5ge9%2F35b4f7add761d00e27fc9ab178905669.avif?w=1200&auto=format%2Ccompress&fit=max", alt: "Du Jour pastries in Jubilee Hills", credit: "Du Jour · photo: Esquire India" };
const OPENING_PHOTOS = {
  "Anaganaga – Telugu Culinary Tales": { src: "https://restaurantindia.s3.ap-south-1.amazonaws.com/s3fs-public/2026-10/Anaganaga%20Opens%20200-Cover%20Telugu%20Restaurant%20in%20Hyderabad.jpg", alt: "Anaganaga Telugu restaurant in Jubilee Hills", credit: "Anaganaga · photo: Restaurant India" },
  "Oktober": { src: "https://media.telanganatoday.com/wp-content/uploads/2026/10/Oktober-opens-in-Jubilee-Hills-bringing-cocktails-and-dining-together.jpg", alt: "Oktober brewery and restaurant in Jubilee Hills", credit: "Oktober · photo: Telangana Today" },
  "HOSA": { src: "https://media.assettype.com/esquireindia%2F2026-10-15%2Ff9apy15v%2F1000136548.jpg?w=1200&auto=format%2Ccompress&fit=max", alt: "Paper fish curry at HOSA Hyderabad", credit: "HOSA · photo: Esquire India" },
  "The All American Diner": { src: "https://media.assettype.com/esquireindia%2F2026-10-15%2Fp2vd3sqf%2F5-1.jpg?w=1200&auto=format%2Ccompress&fit=max", alt: "The All American Diner at The Loft in Hyderabad", credit: "The All American Diner · photo: Esquire India" },
  "Foxie": { src: "https://b.zmtcdn.com/data/pictures/3/22941453/6772e5b392de1ea03926c560a51ba32a.jpg", alt: "Foxie Cocktail Bar in Jubilee Hills", credit: "Foxie · venue photo via District" },
  "Du Jour": COVER,
};

// One evergreen URL for "new restaurants in Hyderabad": refresh OPENINGS and
// MONTH each month instead of starting a new page, so the URL keeps its rank.
// Every entry must carry a published source and the date it was reported.
const SLUG = "/guides/new-restaurants-in-hyderabad";
const MONTH = "October 2026";
const UPDATED = "2026-11-02";
const TITLE = "New Restaurants in Hyderabad: Cafes & Bars";
const DESCRIPTION =
  "Find new restaurants and cafes in Hyderabad: sourced recent openings, neighbourhoods, menu highlights and map links. Updated 2 November 2026.";

function openingMapLinks(opening) {
  const venue = opening.href ? getEateryBySlugOrId(opening.href.split("/").pop()) : null;
  return { map: venue ? `/#spot=${encodeURIComponent(venue.id)}` : null,
    google: googleMapsPlaceUrl(venue?.placeId || venue?.id, `${opening.name}, ${opening.area}`) };
}

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



const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Which new and recently opened Hyderabad restaurants does this guide cover?",
      acceptedAnswer: {
        "@type": "Answer",
        text: `${OPENINGS.length} places covered in ${MONTH} opening reports: ${OPENINGS.map((o) => `${o.name} (${o.area})`).join(", ")}. Report dates are not necessarily opening dates; confirmed opening dates are shown on the entries.`,
      },
    },
    {
      "@type": "Question",
      name: "Which new breweries in Hyderabad are covered here?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Oktober on Road No. 10, Jubilee Hills, reported open by Telangana Today on 26 October 2026. Verify the current tap list, menu and service hours with the venue.",
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
      name: "Which new cafe in Jubilee Hills is covered here?",
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
  datePublished: "2026-10-28",
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
    <div id="top" className="site-page openings-page" style={{ paddingBottom: 84 }}>
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
          <div className="site-hero openings-hero">
            <div className="openings-hero-copy">
              <p className="openings-eyebrow">The Hyderabad opening list</p>
              <h1>New restaurants<br />in <span>Hyderabad</span></h1>
              <p className="openings-deck">For the friend who always asks, “Where should we eat?” {OPENINGS.length} recently reported restaurants, cafes and bars for your next plan.</p>
              <p className="openings-coverage">Reports from {MONTH} · Updated 2 November 2026</p>
              <a className="openings-primary" href="#openings">Find your next stop <span aria-hidden="true">↓</span></a>
            </div>
            <figure className="openings-cover">
              <img src={COVER.src} alt={COVER.alt} width={1000} height={750} fetchPriority="high" decoding="async" />
              <span className="openings-photo-note" aria-hidden="true">Group chat<br />material ↗</span>
              <figcaption>{COVER.credit}</figcaption>
            </figure>
          </div>
        </div>
      </header>

      <nav className="openings-jump" aria-label="Jump to a place">
        <div><a href="#overview">Overview</a>{OPENINGS.map((o) => <a key={o.name} href={`#${slugFromTitle(o.name)}`}>{o.name.split(" – ")[0]}</a>)}<a href="#questions">Questions</a></div>
      </nav>
      <main className="site-body">
        <div className="guide-byline">
          <div>
            <div className="ink-chip">New openings · {MONTH}</div>
            <div className="guide-updated">Updated 2 November 2026 · By Shiva Chandra</div>
          </div>
          <Link href="/" className="link-chip">Open Map</Link>
        </div>

        <section id="overview" className="guide-faq openings-intro">
          <p className="openings-eyebrow">Pick the plan first</p>
          <h2 className="guide-faq-title">Somewhere new, for the right reason.</h2>
          <p>Choose a small cafe for coffee, a regional restaurant for dinner or a brewery for a group evening.
            Pick your plan below, then jump straight to the place.</p>
          <ul>
            <li><b>Coffee and pastries:</b> <a href="#du-jour">Du Jour</a>, the bakery cafe in Jubilee Hills.</li>
            <li><b>South Indian dining:</b> <a href="#hosa">HOSA</a> at RMZ The Loft in HITEC City.</li>
            <li><b>Breakfast plates and diner food:</b> <a href="#the-all-american-diner">The All American Diner</a>, also at The Loft.</li>
            <li><b>A new Jubilee Hills brewery:</b> <a href="#oktober">Oktober</a> on Road No. 10.</li>
            <li><b>Cocktails:</b> <a href="#foxie">Foxie</a>, below Lili in Jubilee Hills.</li>
          </ul>
          <p>These are reported openings, not our first-hand restaurant reviews or a ranked best-of list.
            The dates below are report dates, which may differ from the first day of service.</p>
        </section>

        <section id="openings" className="guide-faq">
          <p className="openings-eyebrow">The shortlist</p>
          <h2 className="guide-faq-title">Openings at a glance</h2>
          <ol className="openings-index">{OPENINGS.map((o, index) => <li key={o.name}>
            <a href={`#${slugFromTitle(o.name)}`}><span className="openings-index-number">{String(index + 1).padStart(2, "0")}</span><span><b>{o.name}</b><small>{o.kind} · {o.area}</small></span><span aria-hidden="true">↗</span></a>
          </li>)}</ol>
        </section>

        <div className="openings-places">
          {OPENINGS.map((o, index) => {
            const photo = OPENING_PHOTOS[o.name];
            const links = openingMapLinks(o);
            return <article key={o.name} id={slugFromTitle(o.name)} className={`opening-card${photo ? " has-photo" : ""}`}>
              {photo && <figure className="opening-photo">
                <img src={photo.src} alt={photo.alt} width={900} height={675} loading="lazy" decoding="async" />
                <figcaption>{photo.credit}</figcaption>
              </figure>}
              <div className="opening-copy">
                <p className="openings-eyebrow"><span>{String(index + 1).padStart(2, "0")}</span> {o.kind}</p>
                <h2>{o.name}</h2>
                <p className="opening-area">{o.area}{o.opened && <> · Opened {o.opened}</>}</p>
                <p>{o.what}</p>
                {o.order && <p className="opening-order"><b>On the menu</b>{o.order}</p>}
                <div className="opening-actions">
                  {links.map && <a className="opening-map" href={links.map}>Open in our map ↗</a>}
                  <a href={links.google} target="_blank" rel="noopener noreferrer">Google Maps ↗</a>
                  {o.href && <Link href={o.href}>Venue details</Link>}
                </div>
                <p className="opening-source">Reported {o.reported} · <a href={o.source.url} target="_blank" rel="noopener noreferrer nofollow">{o.source.label}</a>{o.timingSource && <> · <a href={o.timingSource} target="_blank" rel="noopener noreferrer nofollow">Opening timeline</a></>}</p>
              </div>
            </article>;
          })}
        </div>

        <section className="guide-faq">
          <h2 className="guide-faq-title">New cafes in Hyderabad, or an established favourite?</h2>
          <p>For a new cafe from this shortlist, start with Du Jour. Esquire describes a small, 15-seat space for bakes, coffee and matcha.
            If you need a work session, a date spot or more room for a group, compare the broader
            {" "}<Link href="/guides/best-cafes-hyderabad-reddit">Hyderabad cafe guide</Link> and
            {" "}<Link href="/rankings/best-cafe-in-hyderabad">live cafe ranking</Link> before choosing.</p>
          <p>Already tried a new opening? Add your preference to the
            {" "}<Link href="/rankings/best-new-cafe-in-hyderabad">new-cafe ballot</Link> or the
            {" "}<Link href="/rankings/new-restaurants-in-hyderabad">new-restaurant ballot</Link>.
            Those community votes are separate from the publication reports collected here.</p>
        </section>

        <section id="questions" className="guide-faq openings-questions">
          <h2 className="guide-faq-title">Before you go</h2>
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
          How this list is made: places covered in published opening reports, with each report date shown. A report date is not necessarily the first day of service.
          We have not visited them yet; visit notes get added to each spot page when we do.
        </p>
        <a className="openings-back-top" href="#top">Back to top ↑</a>
      </main>

      <SiteRelated
        links={[
          { href: "/rankings/new-restaurants-in-hyderabad", label: "New restaurants: community ballot" },
          { href: "/rankings/best-new-cafe-in-hyderabad", label: "New cafes: community ballot" },
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
