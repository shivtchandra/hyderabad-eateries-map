import Link from "next/link";
import { getEateryBySlugOrId, getEateries, hasSpotPhoto } from "../../lib/siteData.js";
import { spotPhotoUrl } from "../../lib/photos.js";

// One spot in a long-form guide, as a swipe card (SwipeDeck): full photo with
// the rank pill (#1 yellow) and the name on it, then must-order, a short
// verdict, tips folded away, and an Open button. All text stays in the HTML.
// `rows` = [[label, text], ...].
const norm = (x = "") => x.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
// The guide's own photo, else the linked spot's, else the best-reviewed spot
// with the same name (some guide links use older spot addresses).
function photoFor(s) {
  if (s.photo) return s.photo;
  const slug = (s.href || "").replace(/^\/spot\//, "");
  const bySlug = slug ? getEateryBySlugOrId(slug) : null;
  if (bySlug && hasSpotPhoto(bySlug.id)) return spotPhotoUrl(bySlug.id);
  const want = norm(s.name);
  const byName = getEateries()
    .filter((e) => hasSpotPhoto(e.id) && (norm(e.name) === want || norm(e.name).startsWith(`${want} `)))
    .sort((a, b) => (b.ratingCount || 0) - (a.ratingCount || 0))[0];
  return byName ? spotPhotoUrl(byName.id) : null;
}

export default function GuideSpotCard({ s, rank, rows = [], showRank = true }) {
  const photo = photoFor(s);
  const meta = [s.area, s.rating && `★ ${s.rating}`, s.priceForTwo].filter(Boolean).join(" · ");
  const must = rows.find(([label, t]) => /must/i.test(label) && t);
  const rest = rows.filter(([label, t]) => t && !/must/i.test(label));
  const first = showRank && rank === 1;
  return (
    <article className={`sw${first ? " sw--first" : ""}`}>
      <Link href={s.href || "#"} className={`sw-media${photo ? "" : " sw-media--plain"}`}>
        {photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt={s.name} loading={showRank && rank <= 2 ? "eager" : "lazy"} />
        )}
        <span className="sw-rank">{showRank ? `#${rank}${s.tag ? ` · ${s.tag}` : ""}` : (s.tag || "Guide pick")}</span>
        <span className="sw-cap">
          <b>{s.name}</b>
          <span>{meta}</span>
        </span>
      </Link>
      <div className="sw-body">
        {must && <p className="sw-order"><mark className="hl">Must order</mark> {must[1]}</p>}
        {s.redditBadge && <p className="sw-badge">{s.redditBadge}</p>}
        {s.verdict && <p className="sw-verdict">{s.verdict}</p>}
        {(rest.length > 0 || s.quote) && (
          <details className="sw-more">
            <summary>Tips and what locals say</summary>
            {rest.map(([label, text]) => <p key={label}><b>{label}</b> {text}</p>)}
            {s.quote && <p className="sw-quote">{s.quote.replace(/^[“"]|[”"]$/g, "")}</p>}
          </details>
        )}
        {s.href && <Link href={s.href} className="sw-go">Open {s.name}</Link>}
      </div>
    </article>
  );
}
