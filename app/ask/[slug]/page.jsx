import Link from "next/link";
import { notFound } from "next/navigation";
import SiteChrome from "../../components/SiteChrome.jsx";
import PollCard from "../../components/PollCard.jsx";
import { askPage, askPages, askStats, askUpdated, complaintLabel, praiseLabel } from "../../../lib/askPages.js";
import { recommendationsEnabled } from "../../../lib/recommendationShared.js";
import { getSiteUrl, pageMeta } from "../../../lib/site.js";
import { breadcrumbJsonLd } from "../../../lib/schema.js";
import { getAdminDb } from "../../../lib/firebaseAdmin.js";
import { readPoll } from "../../../lib/polls.js";

// Question pages built from r/hyderabad (lib/askPages.js). Static: the weekly data commit
// redeploys them, so there is no ISR (plan limits).
export function generateStaticParams() { return recommendationsEnabled() ? askPages().map((p) => ({ slug: p.slug })) : []; }
export function generateMetadata({ params }) {
  const p = recommendationsEnabled() && askPage(params.slug);
  return p ? pageMeta({ title: p.title, description: p.answer, path: `/ask/${p.slug}` }) : { title: "Question not found", robots: { index: false } };
}

async function buildTimeTotals(slug) {
  try {
    const db = await Promise.race([getAdminDb(), new Promise((r) => setTimeout(() => r(null), 4000))]);
    return db ? await readPoll(db, slug) : { counts: {}, total: 0 };
  } catch { return { counts: {}, total: 0 }; }
}

const trendLine = (t) => t.label === "rising" ? `More people talked about it in the last 90 days than the 90 before (${t.recent90} vs ${t.prior90}).`
  : t.label === "cooling" ? `Fewer people talked about it in the last 90 days than the 90 before (${t.recent90} vs ${t.prior90}).`
  : `Talked about steadily: ${t.recent90} people in the last 90 days, ${t.prior90} in the 90 before.`;

function Themes({ title, items, label }) {
  const list = Object.entries(items || {}).slice(0, 4);
  if (!list.length) return null;
  return <div className="ask-themes"><span className="ask-label">{title}</span><ul>{list.map(([k, n]) => <li key={k}>{label(k)} <b>{n}</b></li>)}</ul></div>;
}
function Quotes({ items }) {
  if (!items?.length) return null;
  return <ul className="ask-quotes">{items.map((q) => <li key={q.url}><q>{q.text}</q> <a href={q.url} target="_blank" rel="noopener noreferrer nofollow">r/hyderabad, {q.date}</a></li>)}</ul>;
}
function Tries({ v, limit = 4 }) {
  if (!v.tries?.length) return null;
  return <ol className="ask-tries">{v.tries.slice(0, limit).map((t) => <li key={t.name}><b>{t.name}</b>{t.count ? <span>{t.count} locals</span> : t.star ? <span>Signature</span> : null}</li>)}</ol>;
}
const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
const PlaceLink = ({ v }) => v.place ? <Link className="ask-place-link" href={v.place.path}>See {v.name} on Hyderabad Eats →</Link> : null;

export default async function AskPage({ params }) {
  if (!recommendationsEnabled()) notFound();
  const p = askPage(params.slug);
  if (!p) notFound();
  const site = getSiteUrl();
  const updated = askUpdated();
  const stats = askStats();
  const totals = await buildTimeTotals(p.slug);
  const [a, b] = p.views;
  const crumbs = [{ href: "/", label: "Map" }, { href: "/ask", label: "Questions" }, { href: `/ask/${p.slug}`, label: p.h1 }];
  const listItems = p.type === "need" ? p.places.map((x) => x.view).filter(Boolean) : p.type === "what-to-order" ? a.tries : null;
  const schema = [
    { "@context": "https://schema.org", "@type": "Article", headline: p.h1, description: p.answer, dateModified: updated.iso, inLanguage: "en-IN",
      author: { "@type": "Organization", name: "Hyderabad Eats", url: site }, publisher: { "@type": "Organization", name: "Hyderabad Eats", url: site },
      mainEntityOfPage: `${site}/ask/${p.slug}`, about: p.views.map((v) => ({ "@type": "Restaurant", name: v.name, ...(v.place ? { url: `${site}${v.place.path}` } : {}) })) },
    breadcrumbJsonLd(crumbs.map((c) => ({ name: c.label, url: `${site}${c.href}` }))),
    ...(listItems ? [{ "@context": "https://schema.org", "@type": "ItemList", name: p.h1, itemListElement: listItems.map((x, i) => ({ "@type": "ListItem", position: i + 1, name: x.name, ...(x.place ? { url: `${site}${x.place.path}` } : {}) })) }] : []),
  ];

  return <SiteChrome title={p.h1} description={`Updated ${updated.label}. From ${stats.comments.toLocaleString("en-IN")} comments in ${stats.threads.toLocaleString("en-IN")} r/hyderabad threads.`} breadcrumb={crumbs}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
    <div className="ask-page">
      <section className="ask-answer" aria-label="Short answer">
        <span className="ask-label">Short answer</span>
        <p>{p.answer}</p>
      </section>

      {p.type === "what-to-order" && <section className="ask-block">
        <h2>What locals order at {a.name}</h2>
        <Tries v={a} />
        {a.place?.signature?.why && <p className="ask-muted">{a.place.signature.why.replace(/—/g, ",")}</p>}
        <Themes title="Locals like it for" items={a.praise} label={praiseLabel} />
        <Quotes items={a.quotes.praise} />
        <PlaceLink v={a} />
      </section>}

      {p.type === "worth-it" && <>
        <section className="ask-block">
          <h2>What locals like</h2>
          <Themes title="Mentioned for" items={a.praise} label={praiseLabel} />
          <Quotes items={a.quotes.praise} />
        </section>
        <section className="ask-block">
          <h2>What locals complain about</h2>
          <Themes title="Complaints" items={a.complaints} label={complaintLabel} />
          <Quotes items={a.quotes.complaints} />
          <p className="ask-muted">{trendLine(a.trend)}</p>
        </section>
        <section className="ask-block">
          <h2>If you go, order this</h2>
          <Tries v={a} limit={3} />
          <PlaceLink v={a} />
        </section>
      </>}

      {p.type === "vs" && <section className="ask-block">
        <h2>Side by side</h2>
        <div className="ask-table-wrap"><table className="ask-table">
          <thead><tr><th scope="col"></th><th scope="col">{a.name}</th><th scope="col">{b.name}</th></tr></thead>
          <tbody>
            <tr><th scope="row">Locals recommending</th><td>{a.locals}</td><td>{b.locals}</td></tr>
            <tr><th scope="row">Say skip it</th><td>{a.negatives}</td><td>{b.negatives}</td></tr>
            <tr><th scope="row">Known for</th><td>{a.topPraise ? cap(praiseLabel(a.topPraise[0])) : "Not enough data"}</td><td>{b.topPraise ? cap(praiseLabel(b.topPraise[0])) : "Not enough data"}</td></tr>
            <tr><th scope="row">Main complaint</th><td>{a.topComplaint ? cap(complaintLabel(a.topComplaint[0])) : "None stands out"}</td><td>{b.topComplaint ? cap(complaintLabel(b.topComplaint[0])) : "None stands out"}</td></tr>
            <tr><th scope="row">Order</th><td>{a.tries[0]?.name || "Biryani"}</td><td>{b.tries[0]?.name || "Biryani"}</td></tr>
            <tr><th scope="row">Last 90 days</th><td>{cap(a.trend.label)}</td><td>{cap(b.trend.label)}</td></tr>
          </tbody>
        </table></div>
        <div className="ask-two">
          {[a, b].map((v) => <div key={v.key}><h3>{v.name}</h3><Quotes items={[...v.quotes.praise.slice(0, 1), ...v.quotes.complaints.slice(0, 1)]} /><PlaceLink v={v} /></div>)}
        </div>
      </section>}

      {p.type === "need" && <section className="ask-block">
        <h2>Where locals send you</h2>
        <ol className="ask-ranked">{p.places.map((x) => x.view && <li key={x.brand}>
          <div><b>{x.view.name}</b><span>{x.people} people{x.view.place ? ` · ${x.view.place.area}` : ""}</span></div>
          {x.view.tries[0] && <p>Try: {x.view.tries.slice(0, 2).map((t) => t.name).join(", ")}</p>}
          {x.view.place && <Link href={x.view.place.path}>Open place →</Link>}
        </li>)}</ol>
      </section>}

      <PollCard id={p.slug} question={p.poll.question} options={p.poll.options} initial={totals} />

      {p.related.length > 0 && <section className="ask-block">
        <h2>Related questions</h2>
        <ul className="ask-related">{p.related.map((r) => <li key={r.slug}><Link href={`/ask/${r.slug}`}>{r.h1}</Link></li>)}</ul>
      </section>}

      <p className="ask-muted">Counts are distinct r/hyderabad accounts in the last {stats.months} months, not reviews or ratings. Quotes link to the original comments. <Link href="/about/how-we-pick">How we pick</Link> · <Link href="/?mode=recommended">Open the map</Link></p>
    </div>
  </SiteChrome>;
}
