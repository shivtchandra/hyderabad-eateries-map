"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { askSpots, answerLine, parseAsk, surpriseFor, CRAVINGS, CRAVING_CHIPS } from "../../lib/askEngine.js";
import { buildAreaCentroids } from "../../lib/eateryUtils.js";
import { photoUrl } from "../../lib/spotlight.js";
import BotIcon from "./BotIcon.jsx";

// Ask Eats v1 (no LLM): craving chips, "near me", simple free text. Answers
// come from our own data first (lib/askEngine.js). Lives behind the search
// pill (DESIGN.md 4a: one home per option). Kept mounted while closed so the
// conversation survives opening a spot and coming back.
const BAND_TAG = ["ask-tag--vote", "ask-tag--pick", "ask-tag--yours", "ask-tag--google"];

export default function AskSheet({ open, onClose, seed, eateries, userLoc, onRequestLocation, ctx, onOpenSpot }) {
  const [msgs, setMsgs] = useState(() => [{ from: "bot", text: "Hey! What are you in the mood for? Pick one, or just type it.", chips: CRAVING_CHIPS }]);
  const [input, setInput] = useState("");
  const [rankBySpot, setRankBySpot] = useState(null);
  const [pending, setPending] = useState(null);
  const [last, setLast] = useState(null);
  const logRef = useRef(null);
  const seedRef = useRef(null);

  const areas = useMemo(() => buildAreaCentroids(eateries).filter((a) => a.count >= 20).sort((a, b) => b.count - a.count), [eateries]);

  useEffect(() => {
    if (!open || rankBySpot) return;
    fetch("/api/rankings?bySpot=1").then((r) => (r.ok ? r.json() : { bySpot: {} })).then((d) => setRankBySpot(d.bySpot || {})).catch(() => setRankBySpot({}));
  }, [open, rankBySpot]);

  useEffect(() => { logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" }); }, [msgs]);

  const say = (m) => setMsgs((list) => [...list, m]);

  const run = (q0) => {
    // "Surprise me" becomes a craving that fits the hour (lib/askEngine.js).
    const q = q0.cravingId === "surprise" ? { ...q0, ...(() => { const s = surpriseFor(new Date()); return { cravingId: s.cravingId, surprise: s }; })() } : q0;
    const area = q.areaName ? areas.find((a) => a.area === q.areaName) : null;
    const origin = area ? { lat: area.lat, lng: area.lng } : userLoc;
    if (!origin) {
      setPending(q0);
      say({ from: "bot", text: "Where are you? Share your location, or pick an area.", locate: true, areas: areas.slice(0, 8).map((a) => a.area) });
      return;
    }
    const res = askSpots(eateries, {
      origin, cravingId: q.cravingId, cheap: q.cheap, openNow: q.openNow, exclude: q.exclude || [],
      limit: q.closer ? 20 : 5, vary: !!q.surprise,
      ctx: { ...ctx, rankBySpot: rankBySpot || {} },
    });
    if (q.closer) res.results = [...res.results].sort((a, b) => a.dist - b.dist).slice(0, 5);
    setLast({ ...q, shown: res.results.map((r) => r.e.id) });
    say({
      from: "bot",
      text: answerLine(res, { areaName: q.areaName, cheap: q.cheap, openNow: q.openNow, surprise: q.surprise }),
      results: res.results,
      followups: res.results.length > 0,
      chips: res.results.length ? null : CRAVING_CHIPS,
    });
  };

  // Location arrived for a question that was waiting on it.
  useEffect(() => {
    if (userLoc && pending) { const q = pending; setPending(null); run(q); }
  }, [userLoc]); // eslint-disable-line react-hooks/exhaustive-deps

  const pickCraving = (id) => {
    const c = CRAVINGS.find((x) => x.id === id);
    say({ from: "me", text: c.label });
    run({ cravingId: id, areaName: last?.areaName || null });
  };

  const followUp = (kind) => {
    if (!last) return;
    const label = { closer: "Closer", cheap: "Cheaper", open: "Open now", other: "Something else" }[kind];
    say({ from: "me", text: label });
    if (kind === "closer") run({ ...last, closer: true, exclude: [] });
    if (kind === "cheap") run({ ...last, cheap: true, closer: false, exclude: [] });
    if (kind === "open") run({ ...last, openNow: true, closer: false, exclude: [] });
    if (kind === "other") run({ ...last, closer: false, exclude: [...(last.exclude || []), ...(last.shown || [])] });
  };

  const ask = (text) => {
    const t = text.trim();
    if (!t) return;
    say({ from: "me", text: t });
    const p = parseAsk(t, areas.map((a) => a.area));
    if (!p.craving && !p.area) {
      say({ from: "bot", text: "I can find food by craving and place. Try one of these, or say something like “biryani near Kondapur”.", chips: CRAVING_CHIPS });
      return;
    }
    run({ cravingId: p.craving || "near", areaName: p.area, cheap: p.cheap, openNow: p.openNow });
  };

  // A question typed into the search bar opens the sheet with it.
  useEffect(() => {
    if (open && seed && seed.key !== seedRef.current) { seedRef.current = seed.key; ask(seed.text); }
  }, [open, seed]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`ask-sheet${open ? " is-open" : ""}`} role="dialog" aria-label="Ask Eats" aria-hidden={!open}>
      <div className="ask-head">
<span className="ask-bot" aria-hidden="true"><BotIcon /></span>
        <div className="ask-head-text">
          <b>Ask Eats <i className="ask-badge">Chatbot</i></b>
          <span>An automated helper. Locals&apos; votes and our picks first</span>
        </div>
        <button type="button" className="ask-close" onClick={onClose} aria-label="Close Ask Eats">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </div>

      <div className="ask-log" ref={logRef} aria-live="polite">
        {msgs.map((m, i) => (
          <div key={i} className={`ask-msg ask-msg--${m.from}`}>
            {m.text && (m.from === "bot" ? <div className="ask-bot-row"><span className="ask-bot ask-bot--sm" aria-hidden="true"><BotIcon size={16} /></span><p className="ask-bubble">{m.text}</p></div> : <p className="ask-bubble">{m.text}</p>)}
            {m.results?.length > 0 && (
              <ul className="ask-results">
                {m.results.map((r) => (
                  <li key={r.e.id}>
                    <button type="button" className="ask-card" onClick={() => onOpenSpot(r.e.id)}>
                      <span className="ask-card-ph">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={photoUrl(r.e.id)} alt="" loading="lazy" onError={(ev) => { ev.currentTarget.style.display = "none"; }} />
                      </span>
                      <span className="ask-card-body">
                        <b>{r.e.name}</b>
                        {r.why[0] && <span className={`ask-tag ${BAND_TAG[r.band]}`}>{r.why[0]}</span>}
                        <span className="ask-card-meta">{[r.distLabel, r.why[1]].filter(Boolean).join(" · ")}</span>
                        {r.safety && <span className="ask-card-safety">{r.safety}</span>}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {m.chips && i === msgs.length - 1 && (
              <div className="ask-chips">
                {m.chips.map((id) => {
                  const c = CRAVINGS.find((x) => x.id === id);
                  return <button key={id} type="button" className={`ask-chip${id === "surprise" ? " ask-chip--sun" : ""}`} onClick={() => pickCraving(id)}>{c.label}</button>;
                })}
              </div>
            )}
            {m.locate && i === msgs.length - 1 && (
              <div className="ask-chips">
                <button type="button" className="ask-chip ask-chip--go" onClick={() => onRequestLocation()}>Use my location</button>
                {m.areas.map((a) => (
                  <button key={a} type="button" className="ask-chip" onClick={() => { say({ from: "me", text: a }); const q = { ...(pending || { cravingId: "near" }), areaName: a }; setPending(null); run(q); }}>{a}</button>
                ))}
              </div>
            )}
            {m.followups && i === msgs.length - 1 && (
              <div className="ask-chips">
                <button type="button" className="ask-chip" onClick={() => followUp("closer")}>Closer</button>
                <button type="button" className="ask-chip" onClick={() => followUp("cheap")}>Cheaper</button>
                <button type="button" className="ask-chip" onClick={() => followUp("open")}>Open now</button>
                <button type="button" className="ask-chip ask-chip--sun" onClick={() => followUp("other")}>Something else</button>
              </div>
            )}
          </div>
        ))}
      </div>

      <form className="ask-input" onSubmit={(e) => { e.preventDefault(); ask(input); setInput(""); }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Try “cheap biryani near Kondapur”" aria-label="Ask Eats a question" />
        <button type="submit" aria-label="Send" disabled={!input.trim()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </button>
      </form>
    </div>
  );
}
