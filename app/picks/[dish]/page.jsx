import { notFound, permanentRedirect } from "next/navigation";
import DishGuide from "../../components/DishGuide.jsx";
import { getRecommendations } from "../../../lib/recommendations.js";
import { recommendationsEnabled } from "../../../lib/recommendationShared.js";
import { dishView } from "../../../lib/dishPageView.js";
import { pageMeta } from "../../../lib/site.js";
import { dishDestination } from "../../../lib/dishDestinations.js";

export function generateStaticParams() { return recommendationsEnabled() ? getRecommendations().dishes.map((d) => ({ dish: d.id })) : []; }
export function generateMetadata({ params }) {
  const v = recommendationsEnabled() && dishView(params.dish);
  return v ? pageMeta({ title: v.title, description: v.answer, path: `/picks/${v.dish.id}` }) : { title: "Dish guide not found", robots: { index: false } };
}
export default function DishPage({ params }) {
  permanentRedirect(dishDestination(params.dish));
  if (!recommendationsEnabled()) notFound();
  const v = dishView(params.dish);
  if (!v) notFound();
  return <DishGuide v={v} path={`/picks/${v.dish.id}`} />;
}
