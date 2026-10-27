import { notFound } from "next/navigation";
import EateriesApp from "../../../page.jsx";
import { pageMeta } from "../../../../lib/site.js";
import { loadOfferPageData, qualifiedOfferAreas } from "../../../../lib/offerPageData.js";

export const dynamicParams = false;
export const revalidate = false;

export function generateStaticParams() {
  return qualifiedOfferAreas().map(({ slug }) => ({ area: slug }));
}

export async function generateMetadata({ params }) {
  const { area } = await params;
  const match = qualifiedOfferAreas().find((entry) => entry.slug === area);
  if (!match) return {};
  const title = `Restaurant Deals in ${match.area}, Hyderabad`;
  const description = `Compare ${match.count} currently verified Swiggy Dineout and District restaurant deals in ${match.area} by exact branch and booking terms.`;
  return { ...pageMeta({ title, description, path: `/offers/in/${area}` }), robots: { index: true, follow: true } };
}

export default async function OfferAreaPage({ params }) {
  const { area } = await params;
  const match = qualifiedOfferAreas(loadOfferPageData()).find((entry) => entry.slug === area);
  if (!match) notFound();
  const title = `Restaurant Deals in ${match.area}, Hyderabad`;
  return <EateriesApp initialTab="deals" initialPageHeading={title} initialDealsTitle={title} initialDealsArea={match.area} />;
}
