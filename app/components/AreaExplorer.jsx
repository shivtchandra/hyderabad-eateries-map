"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import SpotsMapClient from "./SpotsMapClient.jsx";

// An area page you can use, not read: filter by kind of place, search, sort,
// and see the result on a map. Filters live in the URL (?kind=cafe&sort=votes)
// so a filtered view can be shared. Spots arrive from the server page as
// small plain objects (see app/areas/[slug]/page.jsx).
const KINDS = [
  ["restaurant", "Restaurants"], ["local", "Local eats"], ["cafe", "Cafes"],
  ["restro-bar", "Bars"], ["bakery", "Bakeries"], ["ice-cream", "Ice cream"],
];
const KIND_ONE = { restaurant: "Restaurant", local: "Local eats", cafe: "Cafe", "restro-bar": "Bar", bakery: "Bakery", "ice-cream": "Ice cream" };
const PRICE = { 1: "₹200 for 2", 2: "₹500 for 2", 3: "₹1k for 2", 4: "₹1.8k+ for 2" };
const PAGE = 24;

const fmtCount = (n) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n));

export default function AreaExplorer({ area, spots }) {
  const [kind, setKind] = useState("all");
  const [sort, setSort] = useState("reviews");
  const [q, setQ] = useState("");
  const [shown, setShown] = useState(PAGE);
  const hasVotes = spots.some((s) => s.rank);

  // Read a shared filter once, then keep the URL in step (no history spam).
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const k = sp.get("kind"), s = sp.get("sort");
    if (k && KIND_ONE[k]) setKind(k);
    if (s === "rating" || (s === "votes" && hasVotes)) setSort(s);
  }, [hasVotes]);
  useEffect(() => {
    const url = new URL(window.location.href);
    if (kind === "all") url.searchParams.delete("kind"); else url.searchParams.set("kind", kind);
    if (sort === "reviews") url.searchParams.delete("sort"); else url.searchParams.set("sort", sort);
    window.history.replaceState(window.history.state, "", url);
  }, [kind, sort]);
  useEffect(() => { setShown(PAGE); }, [kind, sort, q]);

  const counts = useMemo(() => {
    const c = {};
    for (const s of spots) c[s.category] = (c[s.category] || 0) + 1;
    return c;
  }, [spots]);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const out = spots.filter((s) => (kind === "all" || s.category === kind) && (!needle || s.name.toLowerCase().includes(needle)));
    const byReviews = (a, b) => (b.ratingCount || 0) - (a.ratingCount || 0);
    if (sort === "rating") {
      // A 5.0 from 6 reviews shouldn't beat a 4.6 from 6,000.
      const solid = (s) => (s.ratingCount || 0) >= 50;
      out.sort((a, b) => (solid(b) - solid(a)) || ((b.rating || 0) - (a.rating || 0)) || byReviews(a, b));
    } else if (sort === "votes") {
      out.sort((a, b) => (!!b.rank - !!a.rank) || ((a.rank?.n || 99) - (b.rank?.n || 99)) || byReviews(a, b));
    } else {
      out.sort(byReviews);
    }
    return out;
  }, [spots, kind, sort, q]);

  const points = useMemo(() => list.map((s) => ({
    lat: s.lat, lng: s.lng, title: s.name, href: s.path,
    sub: [KIND_ONE[s.category], s.rating ? `★ ${s.rating}` : null].filter(Boolean).join(" · "),
    ...(s.rank ? { kind: "rank", label: `#${s.rank.n}` } : { kind: "spot" }),
  })), [list]);

  return (
    <section className="ax" aria-label={`Places in ${area}`}>
      <div className="ax-chips" role="group" aria-label="Kind of place">
        <button type="button" className="ax-chip" aria-pressed={kind === "all"} onClick={() => setKind("all")}>
          All <span>{spots.length}</span>
        </button>
        {KINDS.filter(([k]) => counts[k]).map(([k, label]) => (
          <button key={k} type="button" className="ax-chip" aria-pressed={kind === k} onClick={() => setKind(k)}>
            {label} <span>{counts[k]}</span>
          </button>
        ))}
      </div>

      <div className="ax-tools">
        <input
          type="search" className="ax-search" value={q} onChange={(e) => setQ(e.target.value)}
          placeholder={`Search ${area}`} aria-label={`Search places in ${area}`}
        />
        <select className="ax-sort" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
          <option value="reviews">Most reviewed</option>
          <option value="rating">Top rated</option>
          {hasVotes && <option value="votes">Locals&apos; votes</option>}
        </select>
      </div>

      {points.length > 0 && (
        <div className="ax-map">
          <SpotsMapClient points={points} height={300} />
        </div>
      )}

      <p className="ax-count" aria-live="polite">
        {list.length === 0 ? "Nothing matches. Try another kind or clear the search." : `${list.length} ${list.length === 1 ? "place" : "places"}`}
      </p>

      <ul className="ax-list">
        {list.slice(0, shown).map((s) => (
          <li key={s.id}>
            <Link href={s.path} className="ax-card">
              <span className="ax-thumb">
                {s.photo
                  ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={s.photo} alt="" loading="lazy" width={76} height={76} />
                  : <span className="ax-thumb-letter" aria-hidden="true">{s.name.charAt(0)}</span>}
              </span>
              <span className="ax-body">
                <span className="ax-name">{s.name}</span>
                <span className="ax-meta">
                  {[KIND_ONE[s.category], s.rating ? `★ ${s.rating}${s.ratingCount ? ` (${fmtCount(s.ratingCount)})` : ""}` : null, PRICE[s.priceLevel]].filter(Boolean).join(" · ")}
                </span>
                {(s.rank || s.safety) && (
                  <span className="ax-badges">
                    {s.rank && <span className="ax-badge ax-badge--rank">#{s.rank.n} {s.rank.title}</span>}
                    {s.safety && <span className="ax-badge ax-badge--safety" style={{ "--t": s.safety.tone }}>Food safety: {s.safety.label}</span>}
                  </span>
                )}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {list.length > shown && (
        <button type="button" className="ax-more" onClick={() => setShown((n) => n + PAGE)}>
          Show {Math.min(PAGE, list.length - shown)} more
        </button>
      )}
    </section>
  );
}
