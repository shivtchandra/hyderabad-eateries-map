import { notFound } from "next/navigation";
import EateriesApp from "../../page.jsx";
import { pageMeta } from "../../../lib/site.js";
import { hubJsonLd, todayIso } from "../../../lib/hubSeo.js";
import { OFFERS_ROBOTS, OFFER_VIEWS, loadOfferPageData, qualifiedOfferViews, spotsForOfferView } from "../../../lib/offerPageData.js";

export const dynamicParams = false;
export const revalidate = false;

// Static export needs at least one param; with no qualifying view the
// placeholder renders notFound() and the sitemap lists nothing.
export function generateStaticParams() {
  const views = qualifiedOfferViews().map((view) => ({ view }));
  return views.length ? views : [{ view: "none" }];
}

export async function generateMetadata({ params }) {
  const { view } = await params;
  const config = OFFER_VIEWS[view];
  if (!config) return {};
  return {
    ...pageMeta({ title: config.seoTitle || config.title, description: config.description, path: `/offers/${view}` }),
    keywords: config.keywords,
    robots: OFFERS_ROBOTS,
  };
}

export default async function OfferViewPage({ params }) {
  const { view } = await params;
  const config = OFFER_VIEWS[view];
  const data = loadOfferPageData();
  if (!config || !qualifiedOfferViews(data).includes(view)) notFound();
  const spots = spotsForOfferView(view, data);
  const updated = (data.updatedAt && String(data.updatedAt).slice(0, 10)) || todayIso();
  const jsonLd = hubJsonLd({
    name: config.seoTitle || config.title,
    description: config.description,
    path: `/offers/${view}`,
    updated,
    items: spots.map((spot) => ({ name: `${spot.name} restaurant offers in ${spot.area}`, url: spot.slug ? `/spot/${spot.slug}` : "/offers" })),
  });
  return (
    <>
      {jsonLd.map((item, index) => <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }} />)}
      <EateriesApp initialTab="deals" initialPageHeading={config.title} initialDealsTitle={config.title} initialDealsFilter={config.filter} initialDealsDate={config.date} />
    </>
  );
}
