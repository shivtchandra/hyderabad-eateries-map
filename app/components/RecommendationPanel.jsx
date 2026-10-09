"use client";
import { useEffect, useState } from "react";
import { trackRecommendationEvent } from "../../lib/recommendationTracking.js";
import { mustTry, normalize } from "../../lib/recommendationShared.js";

// Why a place is recommended, Product Hunt style: one big upvote for the place
// (r/hyderabad locals + site upvotes), then what to order, each dish with its own
// upvote, and a row to add a dish you loved.
export default function RecommendationPanel({ place, brand, publishedDishes = [], onAddDish, rev = 0 }) {
  const [votes, setVotes] = useState({});
  const [available, setAvailable] = useState(false);
  const [dishState, setDishState] = useState({ dishes: null, available: false });
  const [pending, setPending] = useState(null);
  const [error, setError] = useState("");
  const [ask, setAsk] = useState([]);

  useEffect(() => {
    const c = new AbortController();
    setError(""); setAvailable(false); setVotes({});
    fetch(`/api/recommendations?spot=${encodeURIComponent(place.id)}`, { signal: c.signal })
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => { setVotes(d.votes || {}); setAvailable(!!d.available); setAsk(d.ask || []); })
      .catch(() => {});
    return () => c.abort();
  }, [place.id]);
  useEffect(() => {
    const c = new AbortController();
    fetch(`/api/recommendations/dishes?place=${encodeURIComponent(place.id)}`, { signal: c.signal })
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => setDishState({ dishes: d.dishes || [], available: !!d.available }))
      .catch(() => setDishState({ dishes: null, available: false }));
    return () => c.abort();
  }, [place.id, rev]);

  async function upvotePlace() {
    if (pending || !available) return;
    setPending("place"); setError("");
    const next = votes.place?.vote === 1 ? 0 : 1;
    try {
      const r = await fetch("/api/recommendations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ placeId: place.id, dishId: null, vote: next }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Could not save. Please retry.");
      setVotes((v) => ({ ...v, place: d }));
      trackRecommendationEvent("vote", { outcome: "success" });
    } catch (e) { setError(e.message); trackRecommendationEvent("vote", { outcome: "failure" }); }
    finally { setPending(null); }
  }
  async function upvoteDish(name, mine) {
    if (pending || !dishState.available) return;
    setPending(name); setError("");
    try {
      const r = await fetch("/api/recommendations/dishes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ placeId: place.id, name, add: !mine }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Could not save. Please retry.");
      setDishState((s) => ({ ...s, dishes: [{ name: d.name, count: d.count, public: d.public, mine: d.mine }, ...(s.dishes || []).filter((x) => normalize(x.name) !== normalize(d.name))] }));
      trackRecommendationEvent("dish_add", { outcome: mine ? "remove" : "add" });
    } catch (e) { setError(e.message); }
    finally { setPending(null); }
  }

  // Fresh site counts (incl. the visitor's own pending adds) replace the list snapshot.
  const live = dishState.dishes ? { ...place, communityDishes: dishState.dishes.filter((d) => d.count > 0) } : place;
  const mineSet = new Set((dishState.dishes || []).filter((d) => d.mine).map((d) => normalize(d.name)));
  const tries = mustTry(live, 4);
  const locals = place.locals || 0;
  const placeVote = votes.place || { up: 0, vote: 0 };
  const rankings = place.rankings || [];
  const rank = rankings[0];
  const rankingVotes = rankings.reduce((s, r) => s + (r.votes || 0), 0);
  const total = locals + (placeVote.up || 0) + (place.nominations || 0) + rankingVotes;
  const kicker = locals >= 3 ? "Locals' top pick" : rank ? `Ranked #${rank.rank}` : place.reviewStatus === "community" ? "Suggested by locals" : "Editor's pick";
  const lovedFor = tries.filter((t) => !t.star).slice(0, 2).map((t) => t.name.toLowerCase());
  const categoryTitle = rank?.title ? rank.title.replace(/^Best\s+/i, "").replace(/\s+in\s+Hyderabad$/i, "").toLowerCase() : "";
  const tagline = place.signature?.name ? `Famous for the ${place.signature.name.toLowerCase()}`
    : rank?.dishName ? `Loved for ${rank.dishName.toLowerCase()}`
    : rank && !rank.dishName ? (rank.rank === 1 ? `Voted Hyderabad's best ${categoryTitle}` : `Top-rated in ${rank.title}`)
    : lovedFor.length ? `Loved for ${lovedFor.join(" and ")}` : "A local favourite";
  const sub = locals >= 3 ? `${locals} locals recommend it on r/hyderabad`
    : rankings.length > 1 ? `${rankingVotes} total votes across ${rankings.length} weekly rankings`
    : rank ? `${rank.votes} vote${rank.votes === 1 ? "" : "s"} in our ${rank.live ? "live " : ""}ranking`
    : place.reviewStatus === "community" ? "Suggested by visitors, checked by the Eats team" : "Hand-picked by the Eats team";
  const source = place.research?.evidence?.[0]?.url || brand?.dishes?.[0]?.evidence?.[0]?.url;
  const dishHref = (t) => (t.id && publishedDishes.includes(t.id) ? `/picks/${t.id}` : null);

  return <section className="ph-card" aria-label="Why it's recommended">
    <div className="ph-head">
      <div className="ph-head-text">
        <span className="ph-kicker">★ {kicker}{place.editorial && locals >= 3 ? " · Editor's pick" : ""}</span>
        <p className="ph-tagline">{tagline}</p>
        <p className="ph-sub">{sub}</p>
        {rankings.length > 0 && <div className="ph-rank-links">
          {rankings.map((r) => (
            <a key={r.slug} className="ph-rank-link" href={`/rankings/${r.slug}`}>
              #{r.rank} in {r.title}{r.winner ? ", winner" : ""}{rankings.length > 1 && r.votes ? ` · ${r.votes} votes` : ""} →
            </a>
          ))}
        </div>}
      </div>
      <button type="button" className="ph-upvote" aria-pressed={placeVote.vote === 1} disabled={!available || pending === "place"}
        aria-label={placeVote.vote === 1 ? "Remove your upvote" : `Upvote ${place.name}`} onClick={upvotePlace}>
        <span aria-hidden="true">▲</span>
        <b>{total || "Upvote"}</b>
      </button>
    </div>

    {(tries.length > 0 || onAddDish) && <div className="ph-order">
      <span className="ph-label">What to order</span>
      <ol>
        {tries.map((t, i) => {
          const mine = mineSet.has(normalize(t.name));
          const href = dishHref(t);
          return <li key={t.name}>
            <span className="ph-rank">{i + 1}</span>
            <span className="ph-dish">
              {href ? <a href={href}>{t.name}</a> : t.name}
              {t.star && <em>Signature</em>}
              {t.star && place.signature?.why && <small>{place.signature.why.replace(/—/g, ",")}</small>}
            </span>
            {dishState.available
              ? <button type="button" className="ph-dish-vote" aria-pressed={mine} disabled={pending === t.name}
                  aria-label={mine ? `Remove your upvote for ${t.name}` : `Upvote ${t.name}`} onClick={() => upvoteDish(t.name, mine)}>
                  <span aria-hidden="true">▲</span>{t.count || ""}
                </button>
              : t.count > 0 && <span className="ph-dish-count">▲ {t.count}</span>}
          </li>;
        })}
        {onAddDish && <li className="ph-add">
          <button type="button" onClick={() => onAddDish(place)}><span aria-hidden="true">+</span> Add a dish you loved</button>
        </li>}
      </ol>
    </div>}

    {ask.length > 0 && <div className="ph-ask">{ask.slice(0, 3).map((q) => <a key={q.slug} href={`/ask/${q.slug}`}>{q.h1}</a>)}</div>}
    {source && <a className="ph-source" href={source} target="_blank" rel="noopener noreferrer">Read what locals said →</a>}
    {error && <p className="ph-error" role="alert">{error}</p>}
  </section>;
}
