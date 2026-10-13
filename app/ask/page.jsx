import Link from "next/link";
import { notFound } from "next/navigation";
import SiteChrome from "../components/SiteChrome.jsx";
import { askList, askStats, askUpdated } from "../../lib/askPages.js";
import { recommendationsEnabled } from "../../lib/recommendationShared.js";
import { pageMeta } from "../../lib/site.js";

export function generateMetadata() {
  return recommendationsEnabled()
    ? pageMeta({ title: "Hyderabad food questions, answered by locals", description: "Is it worth it, what to order, which is better: answers built from what r/hyderabad actually recommends, updated monthly.", path: "/ask" })
    : { title: "Not found", robots: { index: false } };
}

const GROUPS = [["what-to-order", "What to order"], ["worth-it", "Is it worth it?"], ["vs", "Which is better?"], ["need", "Specific cravings"]];

export default function AskHub() {
  if (!recommendationsEnabled()) notFound();
  const list = askList();
  const stats = askStats();
  return <SiteChrome backFallback="/guides" title="Hyderabad food questions, answered by locals" description={`Built from ${stats.comments.toLocaleString("en-IN")} r/hyderabad comments. Updated ${askUpdated().label}.`} breadcrumb={[{ href: "/", label: "Map" }, { href: "/ask", label: "Questions" }]}>
    <div className="ask-page">
      {GROUPS.map(([type, label]) => {
        const items = list.filter((x) => x.type === type);
        return items.length ? <section className="ask-block" key={type}><h2>{label}</h2><ul className="ask-related">{items.map((x) => <li key={x.slug}><Link href={`/ask/${x.slug}`}>{x.h1}</Link></li>)}</ul></section> : null;
      })}
      <p className="ask-muted"><Link href="/about/how-we-pick">How we pick</Link></p>
    </div>
  </SiteChrome>;
}
