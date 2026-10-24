import Link from "next/link";
import SiteChrome from "./SiteChrome.jsx";
import RecommendationMapLaunch from "./RecommendationMapLaunch.jsx";
import { getSiteUrl } from "../../lib/site.js";
import { breadcrumbJsonLd, faqJsonLd } from "../../lib/schema.js";
import { dishAreaPages } from "../../lib/recommendations.js";

// "Best X right now" guide (city or area). Server component; data from lib/dishPageView.js.
export default function DishGuide({ v, path }) {
  const site = getSiteUrl();
  const crumbs = [{ href: "/", label: "Map" }, { href: "/picks", label: "Dish guides" }, { href: `/picks/${v.dish.id}`, label: v.dish.name },
    ...(v.area ? [{ href: path, label: v.area.area }] : [])];
  const schema = [
    { "@context": "https://schema.org", "@type": "ItemList", name: v.h1, itemListOrder: "https://schema.org/ItemListOrderDescending",
      itemListElement: v.leaders.slice(0, 10).map((l, i) => ({ "@type": "ListItem", position: i + 1, name: l.name, url: `${site}${l.place.path}` })) },
    { "@context": "https://schema.org", "@type": "Article", headline: v.h1, description: v.answer, dateModified: v.updatedAt, inLanguage: "en-IN",
      author: { "@type": "Organization", name: "Hyderabad Eats", url: site }, publisher: { "@type": "Organization", name: "Hyderabad Eats", url: site } },
    breadcrumbJsonLd(crumbs.map((c) => ({ name: c.label, url: `${site}${c.href}` }))),
    faqJsonLd(v.faqs),
  ];
  const areas = dishAreaPages().filter((p) => p.dish === v.dish.id && (!v.area || p.area !== v.area.slug));
  return <SiteChrome title={v.h1} description={`Updated ${v.month}. Ranked by distinct r/hyderabad accounts discussing each place for ${v.dish.name.toLowerCase()}, with Mapping HYD editorial evidence used only for eligibility and tie-breaks.`} breadcrumb={crumbs}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
    <div className="ask-page">
      <section className="ask-answer" aria-label="Short answer"><span className="ask-label">Short answer</span><p>{v.answer}</p></section>
      <section className="ask-block">
        <h2>Why these places rank</h2>
        <p>{v.area
          ? `These are ${v.dish.name.toLowerCase()} places with a branch in ${v.area.area}, ordered by Hyderabad-wide local recommendation evidence for each brand.`
          : v.dish.mentions && v.dish.brands
            ? `${v.dish.mentions.toLocaleString("en-IN")} local recommendation signals across ${v.dish.brands} brands feed this ${v.dish.name.toLowerCase()} list.`
            : `Local discussion evidence feeds this ${v.dish.name.toLowerCase()} list.`} Displayed counts come from distinct r/hyderabad accounts in the analyzed discussions. Mapping HYD editorial evidence can qualify a place or break a tie; it is not added to the count.</p>
      </section>
      <RecommendationMapLaunch dish={v.dish.id} />
      <section className="ask-block">
        <h2>The list</h2>
        <ol className="ask-ranked">{v.leaders.map((l) => <li key={l.id}>
          <div><b>{l.name}</b><span>{l.mentions ? `${l.mentions} local recommendation signals for ${v.dish.name.toLowerCase()}` : l.place.editorial ? "Editor's pick" : "Recommended by locals"} · {l.place.area}{l.branches.length > 1 ? ` · ${l.branches.length} branches` : ""}</span></div>
          {l.badge && <p><Link href={`/rankings/${l.badge.slug}`}>#{l.badge.rank} in {l.badge.title}</Link></p>}
          {l.tries.length > 0 && <p>Try: {l.tries.map((t) => t.name).join(", ")}</p>}
          <Link href={l.place.path}>Open place →</Link>
        </li>)}</ol>
      </section>
      {areas.length > 0 && <section className="ask-block"><h2>{v.dish.name} by area</h2><ul className="ask-related">{areas.map((a) => <li key={a.area}><Link href={`/picks/${v.dish.id}/${a.area}`}>Best {v.dish.name.toLowerCase()} in {a.area.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).replace("Hitec", "HITEC")}</Link></li>)}</ul></section>}
      {v.ask.length > 0 && <section className="ask-block"><h2>Questions locals ask</h2><ul className="ask-related">{v.ask.map((q) => <li key={q.slug}><Link href={`/ask/${q.slug}`}>{q.h1}</Link></li>)}</ul></section>}
      {v.dish.id === "biryani" && !v.area && <section className="ask-block"><h2>Other biryani views</h2><ul className="ask-related">
        <li><Link href="/rankings/best-biryani-in-hyderabad">Live Hyderabad biryani vote and results</Link></li>
        <li><Link href="/guides/best-biryani-hyderabad-reddit">Hyderabad biryani picks from Reddit discussions</Link></li>
        <li><Link href="/explore/biryani-and-local">Hyderabad biryani and local-food map</Link></li>
      </ul></section>}
      <section className="ask-block"><h2>Frequently asked questions</h2><div className="spot-faq">{v.faqs.map((f) => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}</div></section>
      <section className="ask-block"><h2>More dishes</h2><div className="rec-actions">{v.others.map((d) => <Link key={d.id} href={`/picks/${d.id}`}>{d.name}</Link>)}</div></section>
      <p className="ask-muted">Counts represent distinct r/hyderabad accounts in the analyzed discussions. Mapping HYD editorial evidence affects eligibility or tie-breaks only; Google reviews and star ratings are not counted. <Link href="/about/how-we-pick">How we pick</Link></p>
    </div>
  </SiteChrome>;
}
