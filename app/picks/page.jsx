import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import SiteChrome from "../components/SiteChrome.jsx";
import { getRecommendations } from "../../lib/recommendations.js";
import { recommendationsEnabled } from "../../lib/recommendationShared.js";
import { pageMeta } from "../../lib/site.js";
export const metadata = pageMeta({ title: "Best food in Hyderabad right now, dish by dish", description: "Biryani, haleem, dosa, shawarma and more: the places Hyderabad locals recommend most, counted from r/hyderabad and updated monthly.", path: "/picks" });
export default function PicksPage() {
  permanentRedirect("/guides/dishes");
  if (!recommendationsEnabled()) notFound();
  const model = getRecommendations();
  return <SiteChrome backFallback="/guides" title="What are you craving?" description="The places Hyderabad locals recommend most for each dish, counted from r/hyderabad and updated monthly." breadcrumb={[{ href: "/", label: "Map" }, { href: "/picks", label: "Dish guides" }]}>
    <div className="rec-seo-grid">{model.dishes.map((d) => <article className="rec-seo-card" key={d.id}><h2><Link href={`/picks/${d.id}`}>Best {d.name.toLowerCase()} right now</Link></h2><p>{d.brands} places, {d.mentions} local recommendations</p><Link href={`/?dish=${d.id}`}>Explore on the map</Link></article>)}</div>
    <p>Other dishes stay searchable on the map until enough locals recommend them. <Link href="/">Open Recommended</Link> · <Link href="/ask">Questions locals ask</Link> · <Link href="/about/how-we-pick">How we pick</Link></p>
  </SiteChrome>;
}
