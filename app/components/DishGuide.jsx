import Link from "next/link";
import SiteChrome from "./SiteChrome.jsx";
import RecommendationMapLaunch from "./RecommendationMapLaunch.jsx";
import { getSiteUrl } from "../../lib/site.js";
import { breadcrumbJsonLd } from "../../lib/schema.js";
import { dishAreaPages } from "../../lib/recommendations.js";

// "Best X right now" guide (city or area). Server component; data from lib/dishPageView.js.
export default function DishGuide({ v, path }) {
  const site = getSiteUrl();
  const crumbs = [{ href: "/", label: "Map" }, { href: "/picks", label: "Dish guides" }, { href: `/picks/${v.dish.id}`, label: v.dish.name },
    ...(v.area ? [{ href: path, label: v.area.area }] : [])];
  const schema = [
    { "@context": "https://schema.org", "@type": "ItemList", name: v.h1, itemListOrder: "https://schema.org/ItemListOrderDescending",
      itemListElement: v.leaders.slice(0, 10).map((l, i) => ({ "@type": "ListItem", position: i + 1, name: l.name, url: `${site}${l.place.path}` })) },
    { "@context": "https://schema.org", "@type": "Article", headline: v.h1, description: v.answer, dateModified: new Date().toISOString(), inLanguage: "en-IN",
      author: { "@type": "Organization", name: "Hyderabad Eats", url: site }, publisher: { "@type": "Organization", name: "Hyderabad Eats", url: site } },
    breadcrumbJsonLd(crumbs.map((c) => ({ name: c.label, url: `${site}${c.href}` }))),
  ];
  const areas = dishAreaPages().filter((p) => p.dish === v.dish.id && (!v.area || p.area !== v.area.slug));
  return <SiteChrome title={v.h1} description={`Updated ${v.month}. Ranked by how many people recommend each place for ${v.dish.name.toLowerCase()} on r/hyderabad, plus Eats rankings and dishes visitors add.`} breadcrumb={crumbs}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
    <div className="ask-page">
      <section className="ask-answer" aria-label="Short answer"><span className="ask-label">Short answer</span><p>{v.answer}</p></section>
      <RecommendationMapLaunch dish={v.dish.id} />
      <section className="ask-block">
        <h2>The list</h2>
        <ol className="ask-ranked">{v.leaders.map((l) => <li key={l.id}>
          <div><b>{l.name}</b><span>{l.mentions ? `${l.mentions} people name it for ${v.dish.name.toLowerCase()}` : l.place.editorial ? "Editor's pick" : "Recommended by locals"} · {l.place.area}{l.branches.length > 1 ? ` · ${l.branches.length} branches` : ""}</span></div>
          {l.badge && <p><Link href={`/rankings/${l.badge.slug}`}>#{l.badge.rank} in {l.badge.title}</Link></p>}
          {l.tries.length > 0 && <p>Try: {l.tries.map((t) => t.name).join(", ")}</p>}
          <Link href={l.place.path}>Open place →</Link>
        </li>)}</ol>
      </section>
      {areas.length > 0 && <section className="ask-block"><h2>{v.dish.name} by area</h2><ul className="ask-related">{areas.map((a) => <li key={a.area}><Link href={`/picks/${v.dish.id}/${a.area}`}>Best {v.dish.name.toLowerCase()} in {a.area.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).replace("Hitec", "HITEC")}</Link></li>)}</ul></section>}
      {v.ask.length > 0 && <section className="ask-block"><h2>Questions locals ask</h2><ul className="ask-related">{v.ask.map((q) => <li key={q.slug}><Link href={`/ask/${q.slug}`}>{q.h1}</Link></li>)}</ul></section>}
      <section className="ask-block"><h2>More dishes</h2><div className="rec-actions">{v.others.map((d) => <Link key={d.id} href={`/picks/${d.id}`}>{d.name}</Link>)}</div></section>
      <p className="ask-muted">Counts are distinct r/hyderabad accounts over the last 18 months, plus dishes visitors confirm and weekly ranking votes. Not reviews or ratings. <Link href="/about/how-we-pick">How we pick</Link></p>
    </div>
  </SiteChrome>;
}
