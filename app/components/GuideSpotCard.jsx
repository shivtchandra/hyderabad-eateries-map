import Link from "next/link";

// One spot in a long-form guide (best biryani, cafes, tiffins, breweries...).
// The yellow/black template (DESIGN.md colour v3): #1 gets a yellow rank tile,
// the rest ink tiles with yellow numbers; the tag is an ink chip; must-order
// gets the highlighter. `rows` = [[label, text], ...], empty ones are skipped.
export default function GuideSpotCard({ s, rank, rows = [], cta = "View on map" }) {
  const meta = [s.rating && `★ ${s.rating}`, s.reviews && `(${s.reviews})`, s.priceForTwo].filter(Boolean).join(" ");
  return (
    <article className={`gsc${rank === 1 ? " gsc--first" : ""}`}>
      <div className="gsc-head">
        <span className="gsc-rank" aria-label={`Number ${rank}`}>#{rank}</span>
        <div className="gsc-title">
          <h2>{s.name}</h2>
          <p className="gsc-area">{s.area}{meta ? ` · ${meta}` : ""}</p>
        </div>
      </div>
      <div className="gsc-chips">
        {s.tag && <span className="ink-chip">{s.tag}</span>}
        {s.redditBadge && <span className="gsc-badge">{s.redditBadge}</span>}
      </div>
      {s.photo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="gsc-photo" src={s.photo} alt={s.name} loading="lazy" />
      )}
      {s.verdict && <p className="gsc-verdict">{s.verdict}</p>}
      {rows.some(([, t]) => t) && (
        <dl className="gsc-rows">
          {rows.filter(([, t]) => t).map(([label, text]) => (
            <div key={label}>
              <dt>{/must/i.test(label) ? <mark className="hl">{label}</mark> : label}</dt>
              <dd>{text}</dd>
            </div>
          ))}
        </dl>
      )}
      {s.quote && <blockquote className="gsc-quote">{s.quote.replace(/^[“"]|[”"]$/g, "")}</blockquote>}
      {s.href && <Link href={s.href} className="link-chip gsc-cta">{cta}</Link>}
    </article>
  );
}
