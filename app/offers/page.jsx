import fs from "fs";
import path from "path";
import { pageMeta, getSiteUrl } from "../../lib/site.js";
import { ogImages } from "../../lib/og.js";
import EateriesApp from "../page.jsx";
import { spotSlug } from "../../lib/siteData.js";
import { hubJsonLd, todayIso } from "../../lib/hubSeo.js";
import { OFFER_VIEWS, qualifiedOfferAreas, qualifiedOfferViews } from "../../lib/offerPageData.js";

// Static: the data is data/curated-offers.json inside the deployment, which only
// changes when a deploy ships a new offers refresh, so a per-request render gave
// no fresher data. It re-sent the same ~1.6MB on every view (CPU + origin
// transfer); now it is built once per deploy and served from the CDN.
export const revalidate = false;

const SLUG = "/offers";
const TITLE = "Swiggy Dineout vs District: Hyderabad Restaurant Deals";
const SEO_TITLE = "Swiggy Dineout vs District Offers in Hyderabad Today";
const DESCRIPTION =
  "Compare today's Swiggy Dineout and District restaurant offers in Hyderabad by exact branch, booking terms, meal time and estimated savings.";

export const metadata = {
  ...pageMeta({ title: SEO_TITLE, description: DESCRIPTION, path: SLUG }),
  openGraph: {
    ...pageMeta({ title: SEO_TITLE, description: DESCRIPTION, path: SLUG }).openGraph,
    images: ogImages(SEO_TITLE, DESCRIPTION, SLUG),
  },
  keywords: [
    "Swiggy Dineout vs District",
    "Hyderabad restaurant offers",
    "restaurant deals Hyderabad today",
    "Swiggy Dineout offers Hyderabad",
    "District offers Hyderabad",
    "50 percent off restaurants Hyderabad",
    "pre book restaurant deals Hyderabad",
    "walk in restaurant discounts Hyderabad",
    "lunch offers Hyderabad",
    "dinner offers Hyderabad",
    "restaurant card offers Hyderabad",
  ],
};

function getOffersData() {
  try {
    const offersPath = path.join(process.cwd(), "data", "curated-offers.json");
    const eateriesPath = path.join(process.cwd(), "data", "eateries.json");

    if (!fs.existsSync(offersPath)) return { spotsList: [], updatedAt: null };

    const offersJson = JSON.parse(fs.readFileSync(offersPath, "utf-8"));
    const eateriesList = fs.existsSync(eateriesPath) ? JSON.parse(fs.readFileSync(eateriesPath, "utf-8")) : [];

    const eateriesMap = new Map(eateriesList.map((e) => [e.id, e]));
    const referenceTime = Date.parse(offersJson.updatedAt) || Date.now();
    const isFresh = (source) => {
      const fetchedAt = Date.parse(source?.fetchedAt || "");
      return Boolean(source?.hasOffers && fetchedAt && referenceTime - fetchedAt <= 72 * 60 * 60 * 1000);
    };

    const spotsList = [];
    for (const [spotId, entry] of Object.entries(offersJson.spots || {})) {
      // A failed daily scrape must not leave an old offer looking current.
      const d = isFresh(entry.district) ? entry.district : null;
      const sw = isFresh(entry.swiggy) ? entry.swiggy : null;
      if (!d && !sw) continue;
      const match = eateriesMap.get(spotId);
      spotsList.push({
        spotId,
        name: match?.name || entry.name || "Restaurant",
        area: match?.area || entry.area || "",
        category: match?.category || entry.category || "dining",
        rating: match?.rating || null,
        ratingCount: match?.ratingCount || null,
        photo: match?.photos?.[0] || match?.image || null,
        slug: match ? spotSlug(match) : null,
        district: d,
        swiggy: sw,
      });
    }

    return {
      spotsList,
      updatedAt: offersJson.updatedAt || null,
    };
  } catch (err) {
    console.error("[OffersPage] Failed to load data:", err);
    return { spotsList: [], updatedAt: null };
  }
}

export default function OffersPage() {
  const siteUrl = getSiteUrl();
  const { spotsList, updatedAt } = getOffersData();
  const landingLinks = [
    ...qualifiedOfferViews().map((view) => ({ href: `/offers/${view}`, label: OFFER_VIEWS[view].title })),
    ...qualifiedOfferAreas().map(({ area, slug }) => ({ href: `/offers/in/${slug}`, label: `Restaurant deals in ${area}` })),
  ];


  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: TITLE,
    description: DESCRIPTION,
    url: siteUrl + SLUG,
    itemListElement: spotsList.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Restaurant",
        name: s.name,
        description: `Swiggy Dineout and District deals at ${s.name}, ${s.area}`,
        ...(s.slug ? { url: `${siteUrl}/spot/${s.slug}` } : {}),
      },
    })),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Dining Deals & Offers", item: siteUrl + SLUG },
    ],
  };

  const updated = (updatedAt && String(updatedAt).slice(0, 10)) || todayIso();
  const faqs = [
    { q: "Which app gives better restaurant offers in Hyderabad, Swiggy Dineout or District?", a: "It depends on the exact restaurant branch, time and booking type. This page compares savings only when both offers have matching conditions; pre-book, walk-in and later time-slot deals stay clearly separated." },
    { q: "Can I compare lunch and dinner restaurant offers separately?", a: "Yes. Use Lunch / afternoon or Dinner / evening to find timed offers. Each deal shows whether it is live now, starts later, requires pre-booking or works as a walk-in offer." },
    { q: "Do bank card offers stack with restaurant deals?", a: "Often, yes: many deals list an extra discount for specific bank cards. Check the card line under each offer and the bill minimum." },
    { q: "How often are the deals updated?", a: `They are fetched from Swiggy Dineout and District regularly; this list was last updated ${updated}. Offers change often, so confirm in the app before you pay.` },
  ];
  const hubLd = hubJsonLd({ name: TITLE, description: DESCRIPTION, path: SLUG, updated, faqs });

  return (
    <>
      {hubLd.map((x, i) => <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(x) }} />)}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
      <EateriesApp initialTab="deals" initialPageHeading={TITLE} initialDealsTitle="Hyderabad restaurant deals" initialDealsLandingLinks={landingLinks} />
    </>
  );
}
