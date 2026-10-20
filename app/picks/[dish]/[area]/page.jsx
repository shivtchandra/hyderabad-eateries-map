import { notFound, permanentRedirect } from "next/navigation";
import DishGuide from "../../../components/DishGuide.jsx";
import { dishAreaPages } from "../../../../lib/recommendations.js";
import { recommendationsEnabled } from "../../../../lib/recommendationShared.js";
import { dishView } from "../../../../lib/dishPageView.js";
import { pageMeta } from "../../../../lib/site.js";
import { getAreaBySlug } from "../../../../lib/siteData.js";
import { dishDestination } from "../../../../lib/dishDestinations.js";

// Only dish + area pairs with 3+ recommended brands exist (dishAreaPages), so no thin pages.
export function generateStaticParams() { return recommendationsEnabled() ? dishAreaPages().map((p) => ({ dish: p.dish, area: p.area })) : []; }
export const dynamicParams = false;
export function generateMetadata({ params }) {
  const v = recommendationsEnabled() && dishView(params.dish, params.area);
  return v ? pageMeta({ title: v.title, description: v.answer, path: `/picks/${v.dish.id}/${params.area}` }) : { title: "Not found", robots: { index: false } };
}
export default function DishAreaPage({ params }) {
  const area = getAreaBySlug(params.area);
  permanentRedirect(dishDestination(params.dish, area?.area || ""));
  if (!recommendationsEnabled()) notFound();
  const v = dishView(params.dish, params.area);
  if (!v) notFound();
  return <DishGuide v={v} path={`/picks/${v.dish.id}/${params.area}`} />;
}
