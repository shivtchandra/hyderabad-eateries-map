"use client";
import { useMemo, useRef, useState } from "react";
import { haversineKm } from "../../lib/eateryUtils.js";
import { spotPhotoUrl } from "../../lib/photos.js";
import { mustTry } from "../../lib/recommendationShared.js";
import { trackRecommendationEvent } from "../../lib/recommendationTracking.js";

// Swipe-up list of recommended places over the map: one row per brand (nearest
// branch when we know where you are), with what to try there and a quick "+ add".
const score = (p) => (p.locals || 0) + (p.rankings || []).reduce((s, r) => s + (r.votes || 0), 0);
const rankLabel = (r) => `#${r.rank} ${r.title.replace(/ in Hyderabad$/i, "")}`;

export default function PicksSheet({ spots, recById, userLoc, dishName, onSelect, onAddDish, onSuggest }) {
  const [open, setOpen] = useState(false);
  const drag = useRef(null);

  const rows = useMemo(() => {
    const groups = new Map();
    for (const s of spots) {
      const rec = recById[s.id];
      if (!rec?.recommended) continue;
      const dist = userLoc ? haversineKm(userLoc, { lat: s.lat, lng: s.lng }) : null;
      const g = groups.get(rec.brandId);
      const branch = { id: s.id, rec, dist };
      if (!g) groups.set(rec.brandId, { best: branch, count: 1 });
      else { g.count += 1; if (dist != null && (g.best.dist == null || dist < g.best.dist)) g.best = branch; }
    }
    return [...groups.values()].sort((a, b) => (userLoc ? (a.best.dist ?? 1e9) - (b.best.dist ?? 1e9) : 0)
      || Number(b.best.rec.editorial) - Number(a.best.rec.editorial)
      || score(b.best.rec) - score(a.best.rec)
      || a.best.rec.name.localeCompare(b.best.rec.name));
  }, [spots, recById, userLoc]);

  const toggle = (next) => { setOpen(next); trackRecommendationEvent("list", { outcome: next ? "open" : "close", count: rows.length }); };
  const onPointerDown = (e) => { drag.current = { y: e.clientY, moved: false }; e.currentTarget.setPointerCapture?.(e.pointerId); };
  const onPointerMove = (e) => { if (drag.current && Math.abs(e.clientY - drag.current.y) > 8) drag.current.moved = true; };
  const onPointerUp = (e) => {
    const d = drag.current; drag.current = null;
    if (!d) return;
    const dy = e.clientY - d.y;
    if (!d.moved) toggle(!open);
    else if (dy < -40 && !open) toggle(true);
    else if (dy > 40 && open) toggle(false);
  };

  const title = `${rows.length} local pick${rows.length === 1 ? "" : "s"}${dishName ? ` for ${dishName.toLowerCase()}` : ""}${userLoc ? " near you" : ""}`;
  return (
    <section className={`picks-sheet${open ? " is-open" : ""}`} aria-label="Recommended places">
      <button type="button" className="picks-sheet-handle" aria-expanded={open}
        onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(!open); } }}>
        <span className="picks-sheet-grip" aria-hidden="true" />
        <span className="picks-sheet-title">★ {title}</span>
        <span className="picks-sheet-hint">{open ? "Show map" : "See list"}</span>
      </button>
      <ol className="picks-sheet-list">
        {rows.map(({ best, count }) => {
          const p = best.rec;
          const tries = mustTry(p, 2);
          return (
            <li key={p.brandId}>
              <button type="button" className="picks-row" onClick={() => { setOpen(false); onSelect(best.id); }}>
                <span className="picks-row-photo" aria-hidden="true">
                  <span>{p.name.slice(0, 1)}</span>
                  <img src={spotPhotoUrl(best.id)} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                </span>
                <span className="picks-row-body">
                  <strong>{p.name}</strong>
                  <span className="picks-row-meta">
                    {p.rankings?.[0]?.rank === 1 ? <b>{rankLabel(p.rankings[0])}</b>
                      : p.locals >= 3 ? <b>★ {p.locals} locals</b>
                      : p.rankings?.length ? <b>{rankLabel(p.rankings[0])}</b>
                      : <b>{p.reviewStatus === "community" ? "Suggested by locals" : "Editor's pick"}</b>}
                    <span>{p.area}{best.dist != null ? ` · ${best.dist < 1 ? `${Math.round(best.dist * 1000)} m` : `${best.dist.toFixed(1)} km`}` : ""}{count > 1 ? ` · ${count} branches` : ""}</span>
                  </span>
                  {tries.length > 0 && <span className="picks-row-try">Try: {tries.map((t) => t.name).join(", ")}</span>}
                </span>
              </button>
              <button type="button" className="picks-row-add" aria-label={`What's good at ${p.name}?`} onClick={() => onAddDish(p)}>+</button>
            </li>
          );
        })}
        <li className="picks-suggest">
          <p>Know a spot that belongs here?</p>
          <button type="button" onClick={onSuggest}>Suggest a place</button>
        </li>
      </ol>
    </section>
  );
}
