import { notFound } from "next/navigation";
import EateriesApp from "../../page.jsx";
import { pageMeta } from "../../../lib/site.js";
import { OFFER_VIEWS, loadOfferPageData, qualifiedOfferViews, spotsForOfferView } from "../../../lib/offerPageData.js";

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
  const count = spotsForOfferView(view).length;
  return { ...pageMeta({ title: config.title, description: config.description, path: `/offers/${view}` }), robots: { index: count >= 15, follow: true } };
}

export default async function OfferViewPage({ params }) {
  const { view } = await params;
  const config = OFFER_VIEWS[view];
  if (!config || !qualifiedOfferViews(loadOfferPageData()).includes(view)) notFound();
  return <EateriesApp initialTab="deals" initialPageHeading={config.title} initialDealsTitle={config.title} initialDealsFilter={config.filter} initialDealsDate={config.date} />;
}
