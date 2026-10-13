import fs from "fs";
import path from "path";
import Link from "next/link";
import { pageMeta, getSiteUrl } from "../../lib/site.js";
import { ogImages } from "../../lib/og.js";
import SiteChrome from "../components/SiteChrome.jsx";
import BottomNav from "../components/BottomNav.jsx";
import OffersClient from "./OffersClient.jsx";
import { spotSlug } from "../../lib/siteData.js";
import HubAnswer, { HubFaq } from "../components/HubAnswer.jsx";
import { hubJsonLd, todayIso } from "../../lib/hubSeo.js";

// Static: the data is data/curated-offers.json inside the deployment, which only
// changes when a deploy ships a new offers refresh, so a per-request render gave
// no fresher data. It re-sent the same ~1.6MB on every view (CPU + origin
// transfer); now it is built once per deploy and served from the CDN.
export const revalidate = false;

const SLUG = "/offers";
const TITLE = "Hyderabad Dining Deals & Offers 2026";
const DESCRIPTION =
  "Swiggy Dineout and District offers for Hyderabad restaurants, side by side on one card: slot discounts, when they go live, and every bank card offer.";

export const metadata = {
  ...pageMeta({ title: TITLE, description: DESCRIPTION, path: SLUG }),
  openGraph: {
    ...pageMeta({ title: TITLE, description: DESCRIPTION, path: SLUG }).openGraph,
    images: ogImages(TITLE, DESCRIPTION, SLUG),
  },
  keywords: [
    "hyderabad restaurant offers",
    "district zomato deals hyderabad",
    "swiggy dineout offers hyderabad",
    "restaurant bank card offers hyderabad",
    "restaurant dining discounts hyderabad 2026",
    "best dining deals jubliee hills hitech city",
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

    const spotsList = [];
    for (const [spotId, entry] of Object.entries(offersJson.spots || {})) {
      // Only deals we actually scraped: real records carry fetchedAt; old template data doesn't.
      const d = entry.district?.fetchedAt && entry.district.hasOffers ? entry.district : null;
      const sw = entry.swiggy?.fetchedAt && entry.swiggy.hasOffers ? entry.swiggy : null;
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
  const areaCount = new Set(spotsList.map((x) => x.area).filter(Boolean)).size;
  const faqs = [
    { q: "Which app gives better restaurant offers in Hyderabad, Swiggy Dineout or District?", a: "It depends on the restaurant. This page puts both apps' current deals side by side for each spot, so you can pick the bigger saving before you book." },
    { q: "Do bank card offers stack with restaurant deals?", a: "Often, yes: many deals list an extra discount for specific bank cards. Check the card line under each offer and the bill minimum." },
    { q: "How often are the deals updated?", a: `They are fetched from Swiggy Dineout and District regularly; this list was last updated ${updated}. Offers change often, so confirm in the app before you pay.` },
  ];
  const hubLd = hubJsonLd({ name: TITLE, description: DESCRIPTION, path: SLUG, updated, faqs });

  return (
    <div style={{ paddingBottom: 84 }}>
      {hubLd.map((x, i) => <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(x) }} />)}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
      <SiteChrome
        active={SLUG}
        breadcrumb={[{ href: "/", label: "Home" }, { href: SLUG, label: "Dining Deals & Offers" }]}
        title="Hyderabad Dining Deals & Offers"
        description="Swiggy Dineout and District deals side by side for every restaurant. See which app saves you more before you book."
        related={[
          { href: "/stories", label: "Food stories" },
          { href: "/rankings", label: "Weekly rankings" },
          { href: "/areas", label: "Food by area" },
        ]}
      >
        <HubAnswer
          answer={`${spotsList.length} Hyderabad restaurants have live dining deals right now${areaCount ? ` across ${areaCount} areas` : ""}, with Swiggy Dineout and District offers side by side so you can see which app saves more before you book.`}
          stats={[{ value: spotsList.length, label: "spots with deals" }, { value: areaCount || "All", label: "areas" }, { value: 2, label: "apps compared" }]}
          updated={updated}
        />
        <OffersClient spotsList={spotsList} updatedAt={updatedAt} />
        <HubFaq faqs={faqs} />
      </SiteChrome>
      <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 1300 }}>
        <BottomNav routed activeKey="deals" />
      </div>
    </div>
  );
}
