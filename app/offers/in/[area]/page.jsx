import { notFound } from "next/navigation";
import EateriesApp from "../../../page.jsx";
import { pageMeta } from "../../../../lib/site.js";
import { hubJsonLd, todayIso } from "../../../../lib/hubSeo.js";
import { loadOfferPageData, qualifiedOfferAreas } from "../../../../lib/offerPageData.js";

export const dynamicParams = false;
export const revalidate = false;

// Static export needs at least one param; with no qualifying area the
// placeholder renders notFound() and the sitemap lists nothing.
export function generateStaticParams() {
  const areas = qualifiedOfferAreas().map(({ slug }) => ({ area: slug }));
  return areas.length ? areas : [{ area: "none" }];
}

export async function generateMetadata({ params }) {
  const { area } = await params;
  const match = qualifiedOfferAreas().find((entry) => entry.slug === area);
  if (!match) return {};
  const title = `Restaurant Deals in ${match.area}: Swiggy vs District`;
  const description = `Compare ${match.count} verified restaurant offers in ${match.area}, Hyderabad on Swiggy Dineout and District by exact branch and booking terms.`;
  return {
    ...pageMeta({ title, description, path: `/offers/in/${area}` }),
    keywords: [
      `restaurant deals ${match.area}`,
      `restaurant offers ${match.area}`,
      `Swiggy Dineout offers ${match.area}`,
      `District offers ${match.area}`,
      `restaurant discounts ${match.area} Hyderabad`,
    ],
    robots: { index: true, follow: true },
  };
}

export default async function OfferAreaPage({ params }) {
  const { area } = await params;
  const data = loadOfferPageData();
  const match = qualifiedOfferAreas(data).find((entry) => entry.slug === area);
  if (!match) notFound();
  const title = `Restaurant Deals in ${match.area}, Hyderabad`;
  const description = `Compare ${match.count} verified restaurant offers in ${match.area}, Hyderabad on Swiggy Dineout and District by exact branch and booking terms.`;
  const updated = (data.updatedAt && String(data.updatedAt).slice(0, 10)) || todayIso();
  const jsonLd = hubJsonLd({
    name: `Restaurant Deals in ${match.area}: Swiggy vs District`,
    description,
    path: `/offers/in/${area}`,
    updated,
    items: data.spotsList
      .filter((spot) => spot.area === match.area)
      .map((spot) => ({ name: `${spot.name} restaurant offers in ${match.area}`, url: spot.slug ? `/spot/${spot.slug}` : "/offers" })),
  });
  return (
    <>
      {jsonLd.map((item, index) => <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }} />)}
      <EateriesApp initialTab="deals" initialPageHeading={title} initialDealsTitle={title} initialDealsArea={match.area} />
    </>
  );
}
