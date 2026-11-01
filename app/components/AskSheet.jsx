"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { askSpots, answerLine, parseAsk, surpriseFor, CRAVINGS, CRAVING_CHIPS } from "../../lib/askEngine.js";
import { buildAreaCentroids } from "../../lib/eateryUtils.js";
import { photoUrl } from "../../lib/spotlight.js";
import BotIcon from "./BotIcon.jsx";

const BAND_TAG = ["ask-tag--vote", "ask-tag--pick", "ask-tag--yours", "ask-tag--google"];

const GO_TO_QUESTIONS = [
  "Is Bawarchi at RTC X Roads better than Paradise?",
  "Best quiet cafes to work from with good coffee in Jubilee Hills",
  "Late night shawarma & rolls near Madhapur under 300",
  "Where can I get authentic Telugu vegetarian bhojanam?",
  "Best Irani chai and bun maska in Old City",
  "Where to get the best mutton mandi in Hyderabad?"
];

function renderBubbleText(text, streaming) {
  if (!text) return streaming ? <span className="ask-cursor" /> : null;
  // Strip [spot:ID] markers from rendered prose because rich cards appear below
  const clean = text.replace(/\[spot:[^\]]*\]?/g, "").replace(/\s+,/g, ",").replace(/ {2,}/g, " ").trim();
  const paras = clean.split(/\n{2,}/);
  return (
    <>
      {paras.map((p, idx) => {
        const parts = p.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={idx} className="ask-p">
            {parts.map((part, i) => {
              if (part.startsWith("**") && part.endsWith("**")) {
                return <strong key={i}>{part.slice(2, -2)}</strong>;
              }
              const lines = part.split("\n");
              return lines.map((line, j) => (
                <span key={j}>
                  {j > 0 && <br />}
                  {line}
                </span>
              ));
            })}
          </p>
        );
      })}
      {streaming && <span className="ask-cursor" />}
    </>
  );
}

export default function AskSheet({ open, onClose, seed, eateries, userLoc, onRequestLocation, ctx, onOpenSpot }) {
  const [msgs, setMsgs] = useState(() => [
    {
      from: "bot",
      text: "Hey! What are you craving in Hyderabad? Tap a go-to question below to get an insider's take, pick a craving, or ask any question.",
      prompts: GO_TO_QUESTIONS,
      chips: CRAVING_CHIPS
    }
  ]);
  const [input, setInput] = useState("");
  const [rankBySpot, setRankBySpot] = useState(null);
  const [pending, setPending] = useState(null);
  const [last, setLast] = useState(null);
  const logRef = useRef(null);
  const seedRef = useRef(null);
  const abortRef = useRef(null);

  const eateryById = useMemo(() => new Map(eateries.map((e) => [e.id, e])), [eateries]);
  const areas = useMemo(() => buildAreaCentroids(eateries).filter((a) => a.count >= 20).sort((a, b) => b.count - a.count), [eateries]);

  useEffect(() => {
    if (!open || rankBySpot) return;
    fetch("/api/rankings?bySpot=1")
      .then((r) => (r.ok ? r.json() : { bySpot: {} }))
      .then((d) => setRankBySpot(d.bySpot || {}))
      .catch(() => setRankBySpot({}));
  }, [open, rankBySpot]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs]);

  const say = (m) => setMsgs((list) => [...list, m]);

  // Local fallback engine (Ask Eats v1)
  const runLocal = useCallback((q0) => {
    const q = q0.cravingId === "surprise"
      ? { ...q0, ...(() => { const s = surpriseFor(new Date()); return { cravingId: s.cravingId, surprise: s }; })() }
      : q0;
    const area = q.areaName ? areas.find((a) => a.area === q.areaName) : null;
    const origin = area ? { lat: area.lat, lng: area.lng } : userLoc;
    if (!origin) {
      setPending(q0);
      say({
        from: "bot",
        text: "Where are you? Share your location, or pick an area.",
        locate: true,
        areas: areas.slice(0, 8).map((a) => a.area)
      });
      return;
    }
    const res = askSpots(eateries, {
      origin,
      cravingId: q.cravingId,
      cheap: q.cheap,
      openNow: q.openNow,
      exclude: q.exclude || [],
      limit: q.closer ? 20 : 5,
      vary: !!q.surprise,
      ctx: { ...ctx, rankBySpot: rankBySpot || {} }
    });
    if (q.closer) res.results = [...res.results].sort((a, b) => a.dist - b.dist).slice(0, 5);
    setLast({ ...q, shown: res.results.map((r) => r.e.id) });
    say({
      from: "bot",
      text: answerLine(res, { areaName: q.areaName, cheap: q.cheap, openNow: q.openNow, surprise: q.surprise }),
      results: res.results,
      followups: res.results.length > 0,
      chips: res.results.length ? null : CRAVING_CHIPS
    });
  }, [areas, ctx, eateries, rankBySpot, userLoc]);

  // Fast streaming AI query with OpenAI gpt-4o-mini
  const askAi = useCallback(async (queryText, overrideArea = null, exclude = null) => {
    const t = queryText.trim();
    if (!t) return;

    // Detect if an area is explicitly in the query or preserved from last query
    const parsed = parseAsk(t, areas.map((a) => a.area));
    const activeArea = overrideArea || parsed.area || last?.areaName || null;

    // If query asks for "near me" and we don't have user coordinates or an area:
    if (/ (near me|nearby|around me|close to me|near) /i.test(` ${t.toLowerCase()} `) && !userLoc && !activeArea) {
      say({ from: "me", text: t });
      setPending({ rawQuery: t });
      say({
        from: "bot",
        text: "Where are you in Hyderabad right now? Share your location or pick an area below so I can show what's closest:",
        locate: true,
        areas: areas.slice(0, 8).map((a) => a.area)
      });
      return;
    }

    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    // Add user message and initial streaming placeholder
    const userMsg = { from: "me", text: t };
    const placeholder = { from: "bot", text: "", streaming: true, results: [] };

    setMsgs((list) => [...list.map((m) => (m.streaming ? { ...m, streaming: false, text: m.text || "Stopped." } : m)), userMsg, placeholder]);

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: t,
          history: msgs.filter((m) => m.text && !m.streaming).slice(-6).map(({ from, text }) => ({ from, text })),
          userLoc,
          areaName: activeArea,
          savedSpots: Object.keys(ctx?.passport?.saved || {}).slice(0, 300),
          visitedSpots: Object.keys(ctx?.passport?.visited || {}).slice(0, 300),
          exclude: exclude || []
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const contentType = response.headers.get("Content-Type") || "";
      if (contentType.includes("application/json")) {
        const json = await response.json();
        if (json.fallback) {
          setMsgs((list) => list.filter((m) => !m.streaming));
          runLocal({ cravingId: parsed.craving || "near", areaName: activeArea, cheap: parsed.cheap, openNow: parsed.openNow });
          return;
        }
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let text = "";
      let metaSpots = [];
      let finished = false;

      // Cards only for candidates the server sent; tag first, bare name as backup.
      const toResults = (full) => {
        const known = new Map(metaSpots.map((s) => [s.id, s]));
        let ids = Array.from(new Set(Array.from(full.matchAll(/\[spot:([^\]\s]+)\]/g), (m) => m[1]))).filter((id) => known.has(id));
        if (!ids.length) {
          const lower = full.toLowerCase();
          ids = metaSpots.filter((s) => s.name && lower.includes(s.name.toLowerCase())).map((s) => s.id);
        }
        return ids.map((id) => {
          const e = eateryById.get(id);
          const meta = known.get(id);
          return e ? { e, distLabel: meta.distLabel, why: meta.why, safety: meta.safety, band: meta.band ?? 3 } : null;
        }).filter(Boolean);
      };
      const update = (patch) => setMsgs((list) => {
        const copy = [...list];
        const i = copy.length - 1;
        if (copy[i]?.streaming) copy[i] = { ...copy[i], ...patch };
        return copy;
      });
      const finish = () => {
        const results = toResults(text);
        setLast({ areaName: activeArea, shown: [...new Set([...(exclude || []), ...results.map((r) => r.e.id)])] });
        update({ text, streaming: false, results, followups: results.length > 0 });
      };

      while (!finished) {
        const { done, value } = await reader.read();
        if (done) break;
        // An event can straddle two network chunks: keep the tail for the next read.
        buf += decoder.decode(value, { stream: true });
        const events = buf.split("\n\n");
        buf = events.pop();
        for (const evt of events) {
          if (!evt.startsWith("data: ")) continue;
          let payload;
          try { payload = JSON.parse(evt.slice(6)); } catch { continue; }
          if (payload.type === "meta") {
            metaSpots = payload.spots || [];
          } else if (payload.type === "delta") {
            text += payload.text;
            update({ text, results: toResults(text) });
          } else if (payload.type === "done" || payload.type === "error") {
            finished = true;
          }
        }
      }
      if (!text) throw new Error("empty answer");
      finish();
    } catch (err) {
      if (err.name === "AbortError") return;
      console.warn("[AskSheet] AI chat failed, falling back to local engine:", err);
      setMsgs((list) => list.filter((m) => !m.streaming));
      runLocal({ cravingId: parsed.craving || "near", areaName: activeArea, cheap: parsed.cheap, openNow: parsed.openNow });
    }
  }, [areas, ctx, eateryById, last?.areaName, msgs, runLocal, userLoc]);

  // Location arrived for a question that was waiting on it.
  useEffect(() => {
    if (userLoc && pending) {
      const q = pending;
      setPending(null);
      if (q.rawQuery) {
        askAi(q.rawQuery);
      } else {
        runLocal(q);
      }
    }
  }, [userLoc, pending, askAi, runLocal]);

  const pickCraving = (id) => {
    const c = CRAVINGS.find((x) => x.id === id);
    if (!c) return;
    if (id === "surprise") {
      runLocal({ cravingId: "surprise", areaName: last?.areaName || null });
      return;
    }
    if (id === "near" && !userLoc && !last?.areaName) {
      say({ from: "me", text: c.label });
      setPending({ rawQuery: "Best food near me now" });
      say({
        from: "bot",
        text: "Where are you in Hyderabad right now? Share your location or pick an area below so I can show what's closest:",
        locate: true,
        areas: areas.slice(0, 8).map((a) => a.area)
      });
      return;
    }
    const prompt = last?.areaName
      ? `Best ${c.label.toLowerCase()} around ${last.areaName}`
      : `Best ${c.label.toLowerCase()} in Hyderabad`;
    askAi(prompt);
  };

  const followUp = (kind) => {
    if (kind === "closer") {
      if (!userLoc) {
        setPending({ rawQuery: "Which of these are closest to me?" });
        onRequestLocation();
        return;
      }
      askAi("Which of these are closest to me?");
    } else if (kind === "cheap") {
      askAi("Cheaper options?");
    } else if (kind === "open") {
      askAi("Which of these are open right now?");
    } else if (kind === "other") {
      askAi("Show me other spots", null, last?.shown || []);
    }
  };

  // Seed question typed into search bar
  useEffect(() => {
    if (open && seed && seed.key !== seedRef.current) {
      seedRef.current = seed.key;
      askAi(seed.text);
    }
  }, [open, seed, askAi]);

  // Closing the sheet stops a reply mid-stream.
  useEffect(() => {
    if (open) return;
    abortRef.current?.abort();
    setMsgs((list) => (list.some((m) => m.streaming) ? list.map((m) => (m.streaming ? { ...m, streaming: false, text: m.text || "Stopped." } : m)) : list));
  }, [open]);

  return (
    <div className={`ask-sheet${open ? " is-open" : ""}`} role="dialog" aria-label="Ask Eats" aria-hidden={!open}>
      <div className="ask-head">
        <span className="ask-bot" aria-hidden="true"><BotIcon /></span>
        <div className="ask-head-text">
          <b>Ask Eats <i className="ask-badge">AI Assistant</i></b>
          <span>Hyper-local Hyderabad food concierge powered by OpenAI</span>
        </div>
        <button type="button" className="ask-close" onClick={onClose} aria-label="Close Ask Eats">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <div className="ask-log" ref={logRef} aria-live="polite">
        {msgs.map((m, i) => (
          <div key={i} className={`ask-msg ask-msg--${m.from}`}>
            {m.text != null && (
              m.from === "bot" ? (
                <div className="ask-bot-row">
                  <span className="ask-bot ask-bot--sm" aria-hidden="true"><BotIcon size={16} /></span>
                  <div className="ask-bubble">{renderBubbleText(m.text, m.streaming)}</div>
                </div>
              ) : (
                <p className="ask-bubble">{m.text}</p>
              )
            )}

            {m.results?.length > 0 && (
              <ul className="ask-results">
                {m.results.map((r) => (
                  <li key={r.e.id}>
                    <button type="button" className="ask-card" onClick={() => onOpenSpot(r.e.id)}>
                      <span className="ask-card-ph">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photoUrl(r.e.id)}
                          alt=""
                          loading="lazy"
                          onError={(ev) => { ev.currentTarget.style.display = "none"; }}
                        />
                      </span>
                      <span className="ask-card-body">
                        <b>{r.e.name}</b>
                        {r.why?.[0] && <span className={`ask-tag ${BAND_TAG[r.band] || "ask-tag--pick"}`}>{r.why[0]}</span>}
                        <span className="ask-card-meta">{[r.distLabel, r.why?.[1]].filter(Boolean).join(" · ")}</span>
                        {r.safety && <span className="ask-card-safety">{r.safety}</span>}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {m.prompts && i === msgs.length - 1 && (
              <div className="ask-prompts-group">
                <span className="ask-prompts-label">Go-to local questions</span>
                <div className="ask-prompts">
                  {m.prompts.map((q) => (
                    <button
                      key={q}
                      type="button"
                      className="ask-chip--prompt"
                      onClick={() => askAi(q)}
                    >
                      <span>&ldquo;{q}&rdquo;</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {m.chips && i === msgs.length - 1 && (
              <div className="ask-prompts-group">
                <span className="ask-prompts-label">Or pick by craving</span>
                <div className="ask-chips">
                  {m.chips.map((id) => {
                    const c = CRAVINGS.find((x) => x.id === id);
                    return (
                      <button
                        key={id}
                        type="button"
                        className={`ask-chip${id === "surprise" ? " ask-chip--sun" : ""}`}
                        onClick={() => pickCraving(id)}
                      >
                        {c?.label || id}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {m.locate && i === msgs.length - 1 && (
              <div className="ask-chips">
                <button type="button" className="ask-chip ask-chip--go" onClick={() => onRequestLocation()}>
                  Use my location
                </button>
                {m.areas?.map((a) => (
                  <button
                    key={a}
                    type="button"
                    className="ask-chip"
                    onClick={() => {
                      const q = pending?.rawQuery || `Best food around ${a}`;
                      setPending(null);
                      askAi(q, a);
                    }}
                  >
                    {a}
                  </button>
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

      <form
        className="ask-input"
        onSubmit={(e) => {
          e.preventDefault();
          const query = input;
          setInput("");
          askAi(query);
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything: “mutton biryani vs mandi”, “quiet cafes”..."
          aria-label="Ask Eats a question"
        />
        <button type="submit" aria-label="Send" disabled={!input.trim()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </form>
    </div>
  );
}
