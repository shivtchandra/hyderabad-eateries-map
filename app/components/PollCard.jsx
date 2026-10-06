"use client";
import { useEffect, useState } from "react";
import { trackRecommendationEvent } from "../../lib/recommendationTracking.js";

const MIN_SHOWN = 20; // lib/polls.js POLL_MIN_SHOWN

// Live poll on an /ask page. The page ships with build-time totals (crawlers see real
// numbers); this refreshes them and lets the visitor vote or change their vote.
export default function PollCard({ id, question, options, initial = { counts: {}, total: 0 } }) {
  const [state, setState] = useState({ ...initial, mine: null, available: true });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const c = new AbortController();
    fetch(`/api/polls?id=${encodeURIComponent(id)}`, { signal: c.signal })
      .then((r) => r.json()).then((d) => setState((s) => ({ ...s, ...d, available: d.available !== false })))
      .catch(() => {});
    return () => c.abort();
  }, [id]);

  async function vote(option) {
    if (busy) return;
    setBusy(true); setError("");
    try {
      const r = await fetch("/api/polls", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, option: state.mine === option ? null : option }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Could not save. Please retry.");
      setState((s) => ({ ...s, ...d }));
      trackRecommendationEvent("vote", { outcome: "success", view: "ask" });
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  const showResults = !!state.mine || state.total >= MIN_SHOWN;
  return (
    <section className="ask-poll" aria-label="Poll">
      <span className="ask-label">Your take</span>
      <h2>{question}</h2>
      <div className="ask-poll-options">
        {options.map((o) => {
          const n = state.counts?.[o.id] || 0;
          const pct = state.total ? Math.round((n / state.total) * 100) : 0;
          return (
            <button key={o.id} type="button" aria-pressed={state.mine === o.id} disabled={busy || !state.available} onClick={() => vote(o.id)}>
              {showResults && <span className="ask-poll-bar" style={{ width: `${pct}%` }} aria-hidden="true" />}
              <span className="ask-poll-text">{o.label}</span>
              {showResults && <b>{pct}%</b>}
            </button>
          );
        })}
      </div>
      <p className="ask-poll-meta" role="status">
        {!state.available ? "Voting is unavailable right now."
          : state.total >= MIN_SHOWN ? `${state.total} votes so far${state.mine ? ". Tap your pick again to remove it." : "."}`
          : state.mine ? "Thanks! Results firm up as more people vote." : "Be one of the first to vote."}
      </p>
      {error && <p className="ask-poll-meta" role="alert">{error}</p>}
    </section>
  );
}
