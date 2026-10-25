import Link from "next/link";
import { notFound } from "next/navigation";
import SiteChrome from "../../components/SiteChrome.jsx";
import BottomNav from "../../components/BottomNav.jsx";
import HubAnswer, { HubFaq } from "../../components/HubAnswer.jsx";
import GuideSpotCard from "../../components/GuideSpotCard.jsx";
import SwipeDeck from "../../components/SwipeDeck.jsx";
import { GEO_GUIDES, getGeoGuide } from "../../../lib/geoGuides.js";
import { getEateryById, spotPath } from "../../../lib/siteData.js";
import { pageMeta } from "../../../lib/site.js";
import { ogImages } from "../../../lib/og.js";
import { hubJsonLd } from "../../../lib/hubSeo.js";

const UPDATED = "2026-10-20";

export const dynamicParams = false;

export function generateStaticParams() {
  return GEO_GUIDES.map((guide) => ({ slug: guide.slug }));
}

export function generateMetadata({ params }) {
  const guide = getGeoGuide(params.slug);
  if (!guide) return { title: "Guide not found, Hyderabad Eats" };
  const path = `/guides/${guide.slug}`;
  const base = pageMeta({ title: guide.title, description: guide.description, path });
  return {
    ...base,
    keywords: guide.keywords,
    openGraph: { ...base.openGraph, images: ogImages(guide.title, guide.description, path) },
  };
}

function resolveSpot(item) {
  const venue = item.id ? getEateryById(item.id) : null;
  return {
    ...item,
    name: item.name || venue?.name || "Hyderabad food spot",
    area: item.area || venue?.discoveredIn || venue?.address?.split(",").slice(-3, -2)[0]?.trim() || "Hyderabad",
    href: item.href || (venue ? spotPath(venue) : "/"),
    redditBadge: item.evidence,
  };
}

function guideFaqs(guide, spots) {
  const names = spots.slice(0, 4).map((spot) => spot.name).join(", ");
  const orders = spots.slice(0, 3).map((spot) => `${spot.name}: ${spot.order}`).join("; ");
  const topic = guide.title.replace(/^Best /i, "").replace(/:.*$/, "");
  return [
    { q: `What does Hyderabad Eats recommend for ${topic.charAt(0).toLowerCase()}${topic.slice(1)}?`, a: guide.answer },
    { q: `Which places are included in this Hyderabad guide?`, a: `${names}${spots.length > 4 ? ` and ${spots.length - 4} more` : ""}. Each entry links to its Hyderabad Eats venue page or the most relevant map collection.` },
    { q: `What should you order from these places?`, a: orders || "Open each venue page for the current must-order dishes and visit notes." },
    { q: `How were these Hyderabad recommendations selected?`, a: guide.method || "The guide combines specific Mapping HYD visits with distinct local community recommendations already recorded in Hyderabad Eats. It does not treat generic star ratings as dish recommendations." },
  ];
}

export default function GeoGuidePage({ params }) {
  const guide = getGeoGuide(params.slug);
  if (!guide) notFound();
  const path = `/guides/${guide.slug}`;
  const spots = guide.spots.map(resolveSpot);
  const faqs = guideFaqs(guide, spots);
  const jsonLd = hubJsonLd({
    name: guide.title,
    description: guide.description,
    path,
    updated: UPDATED,
    faqs,
    items: spots.map((spot) => ({ name: spot.name, url: spot.href })),
  });
  const related = [
    { href: "/rankings", label: "Hyderabad food rankings" },
    ...GEO_GUIDES
      .filter((item) => item.slug !== guide.slug)
      .slice(0, 4)
      .map((item) => ({ href: `/guides/${item.slug}`, label: item.title.replace(/ in Hyderabad.*$/, "") })),
  ];

  return (
    <div style={{ paddingBottom: 84 }}>
      {jsonLd.map((item, index) => (
        <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }} />
      ))}
      <SiteChrome
        active="/guides"
        backFallback="/guides"
        breadcrumb={[
          { href: "/", label: "Home" },
          { href: "/guides", label: "Guides" },
          { href: path, label: guide.title },
        ]}
        title={guide.title}
        description={guide.description}
        related={related}
      >
        <HubAnswer
          answer={guide.answer}
          stats={[
            { value: spots.length, label: spots.length === 1 ? "named place" : "named places" },
            { value: spots.filter((spot) => spot.id).length, label: "mapped venues" },
          ]}
          updated={UPDATED}
        />

        <div className="guide-byline">
          <div>
            <div className="ink-chip">Mapping HYD local answer</div>
            <div className="guide-updated">Specific dishes, areas and caveats—not a generic ratings list</div>
          </div>
          <Link href={guide.mapHref || "/"} className="link-chip">Open map</Link>
        </div>

        <section className="guides-section" aria-labelledby="geo-guide-spots">
          <h2 id="geo-guide-spots" className="site-section-title">Where to go and what to order</h2>
          <SwipeDeck label={`${guide.title} recommendations`}>
            {spots.map((spot, index) => (
              <GuideSpotCard
                key={`${spot.id || spot.name}-${index}`}
                s={spot}
                rank={index + 1}
                rows={[
                  ["Must order", spot.order],
                  ["Know before you go", spot.caveat],
                ]}
              />
            ))}
          </SwipeDeck>
        </section>

        <section className="hub-answer" aria-label="How this guide was made">
          <h2 className="site-section-title">How this answer was made</h2>
          <p className="hub-answer-text">{guide.method || "This guide combines Mapping HYD visit notes with distinct Hyderabad community recommendations already stored in the site. Named dishes are kept separate from generic venue ratings."}</p>
        </section>

        <HubFaq faqs={faqs} />
      </SiteChrome>
      <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 1300 }}>
        <BottomNav routed activeKey="guides" />
      </div>
    </div>
  );
}
