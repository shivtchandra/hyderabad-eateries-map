import Link from "next/link";
import { getEateryBySlugOrId, getEateries, hasSpotPhoto } from "../../lib/siteData.js";
import { spotPhotoUrl } from "../../lib/photos.js";

// One spot in a long-form guide, in the mockup's language (canvas GuidesAfter /
// SpotAfter): photo first with the rank on it (#1 yellow), the name big beside
// a violet arrow tile, then plain text: verdict, must-order (highlighted label),
// tips, a light quote. No boxes inside boxes. `rows` = [[label, text], ...].
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

export default function GuideSpotCard({ s, rank, rows = [] }) {
  const photo = photoFor(s);
  const meta = [s.area, s.rating && `★ ${s.rating}`, s.priceForTwo].filter(Boolean).join(" · ");
  const Wrap = ({ children, className }) => (s.href ? <Link href={s.href} className={className}>{children}</Link> : <div className={className}>{children}</div>);
  return (
    <article className="gsc">
      {photo && (
        <Wrap className="gsc-media">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo} alt={s.name} loading={rank <= 2 ? "eager" : "lazy"} />
          <span className={`gsc-rank${rank === 1 ? " is-first" : ""}`}>#{rank}{s.tag ? ` · ${s.tag}` : ""}</span>
        </Wrap>
      )}
      <Wrap className="gsc-title">
        <span className="gsc-name">{!photo && <span className={`gsc-num${rank === 1 ? " is-first" : ""}`}>#{rank}</span>}{s.name}</span>
        {s.href && (
          <span className="gsc-go" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </span>
        )}
      </Wrap>
      <p className="gsc-meta">{meta}{!photo && s.tag ? ` · ${s.tag}` : ""}</p>
      {s.redditBadge && <p className="gsc-badge"><mark className="hl">{s.redditBadge}</mark></p>}
      {s.verdict && <p className="gsc-verdict">{s.verdict}</p>}
      {rows.filter(([, t]) => t).map(([label, text]) => (
        <p key={label} className="gsc-line">
          <b>{/must/i.test(label) ? <mark className="hl">{label}</mark> : label}</b> {text}
        </p>
      ))}
      {s.quote && <p className="gsc-quote">{s.quote.replace(/^[“"]|[”"]$/g, "")}</p>}
    </article>
  );
}
