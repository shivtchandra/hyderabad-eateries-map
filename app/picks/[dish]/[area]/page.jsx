import { notFound, permanentRedirect } from "next/navigation";
import DishGuide from "../../../components/DishGuide.jsx";
import { DISH_AREA_SLUGS, getRecommendations } from "../../../../lib/recommendations.js";
import { recommendationsEnabled } from "../../../../lib/recommendationShared.js";
import { dishView } from "../../../../lib/dishPageView.js";
import { pageMeta } from "../../../../lib/site.js";
import { getAreaBySlug } from "../../../../lib/siteData.js";
import { dishDestination } from "../../../../lib/dishDestinations.js";

// These legacy URLs redirect to the live map. Keep concrete params for static
// export even when no dish-area guide currently passes the publication gate.
export function generateStaticParams() {
  const dishes = recommendationsEnabled() ? getRecommendations().dishes.map((dish) => dish.id) : [];
  const ids = ["biryani", ...dishes.filter((dish) => dish !== "biryani")];
  return ids.flatMap((dish) => DISH_AREA_SLUGS.map((area) => ({ dish, area })));
}
export const dynamicParams = false;
export function generateMetadata({ params }) {
  const v = recommendationsEnabled() && dishView(params.dish, params.area);
  if (!v) return { title: "Not found", robots: { index: false } };
  const area = getAreaBySlug(params.area);
  return {
    ...pageMeta({ title: v.title, description: v.answer, path: dishDestination(params.dish, area?.area || "") }),
    robots: { index: false, follow: true },
  };
}
export default function DishAreaPage({ params }) {
  const area = getAreaBySlug(params.area);
  permanentRedirect(dishDestination(params.dish, area?.area || ""));
  if (!recommendationsEnabled()) notFound();
  const v = dishView(params.dish, params.area);
  if (!v) notFound();
  return <DishGuide v={v} path={`/picks/${v.dish.id}/${params.area}`} />;
}
