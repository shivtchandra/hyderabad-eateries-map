"use client";
import { useEffect, useMemo, useState } from "react";
import { DISHES, mustTry, normalize } from "../../lib/recommendationShared.js";
import { trackRecommendationEvent } from "../../lib/recommendationTracking.js";

// "What's good here?" A small sheet to +1 a listed dish or add a new one.
// New dishes go public once 2 different people add them.
export default function AddDishSheet({ place, onClose, onSaved }) {
  const [state, setState] = useState({ dishes: [], available: null });
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    const c = new AbortController();
    fetch(`/api/recommendations/dishes?place=${encodeURIComponent(place.id)}`, { signal: c.signal })
      .then((r) => r.json()).then((d) => setState({ dishes: d.dishes || [], available: !!d.available }))
      .catch((e) => { if (e.name !== "AbortError") setState({ dishes: [], available: false }); });
    return () => c.abort();
  }, [place.id]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Listed dishes (theirs + ours), each with the visitor's own +1 state.
  const chips = useMemo(() => {
    const mine = new Map(state.dishes.map((d) => [normalize(d.name), d]));
    const out = new Map();
    for (const d of state.dishes) out.set(normalize(d.name), { name: d.name, mine: d.mine, pending: !d.public });
    for (const d of mustTry(place, 8)) { const k = normalize(d.name); if (!out.has(k)) out.set(k, { name: d.name, mine: !!mine.get(k)?.mine, pending: false }); }
    return [...out.values()];
  }, [state.dishes, place]);

  async function send(dish, add) {
    if (busy) return;
    setBusy(true); setNote("");
    try {
      const r = await fetch("/api/recommendations/dishes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ placeId: place.id, name: dish, add }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Could not save. Please retry.");
      setState((s) => {
        const rest = s.dishes.filter((x) => normalize(x.name) !== normalize(d.name));
        return { ...s, dishes: d.count > 0 && (d.public || d.mine) ? [{ name: d.name, count: d.count, public: d.public, mine: d.mine }, ...rest] : rest };
      });
      if (add) setNote(d.public ? `Added. ${d.count} people say try the ${d.name.toLowerCase()} here.` : "Thanks! It goes live when one more person agrees.");
      if (add) setName("");
      trackRecommendationEvent("dish_add", { outcome: add ? "add" : "remove" });
      onSaved?.(d);
    } catch (e) { setNote(e.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="dish-sheet-backdrop" onClick={onClose}>
      <div className="dish-sheet" role="dialog" aria-modal="true" aria-label={`What's good at ${place.name}?`} onClick={(e) => e.stopPropagation()}>
        <div className="dish-sheet-grip" aria-hidden="true" />
        <h3>What's good here?</h3>
        <p className="dish-sheet-sub">{place.name}</p>
        {state.available === null && <p className="dish-sheet-note" role="status">Loading…</p>}
        {state.available === false && <p className="dish-sheet-note" role="status">Adding dishes is unavailable right now.</p>}
        {state.available && <>
          {chips.length > 0 && <>
            <span className="dish-sheet-label">Tap to agree</span>
            <div className="dish-sheet-chips">
              {chips.map((c) => (
                <button key={c.name} type="button" aria-pressed={c.mine} disabled={busy} onClick={() => send(c.name, !c.mine)}>
                  {c.name}{c.mine && <small>{c.pending ? "pending" : "+1 you"}</small>}
                </button>
              ))}
            </div>
          </>}
          <form className="dish-sheet-form" onSubmit={(e) => { e.preventDefault(); if (name.trim()) send(name.trim(), true); }}>
            <label htmlFor="dish-sheet-input" className="dish-sheet-label">Something else?</label>
            <div>
              <input id="dish-sheet-input" list="dish-sheet-options" value={name} maxLength={40} placeholder="e.g. Mutton biryani" autoComplete="off" onChange={(e) => setName(e.target.value)} />
              <datalist id="dish-sheet-options">{DISHES.map((d) => <option key={d.id} value={d.name} />)}</datalist>
              <button type="submit" disabled={busy || name.trim().length < 2}>Add</button>
            </div>
          </form>
        </>}
        {note && <p className="dish-sheet-note" role="status">{note}</p>}
        <button type="button" className="dish-sheet-done" onClick={onClose}>Done</button>
      </div>
    </div>
  );
}
