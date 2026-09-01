"use client";

import { useEffect, useState, useCallback } from "react";
import { fetchSuggestions, suggestTheme, upvoteSuggestion, hasUpvotedSuggestion } from "../../lib/themeVoting.js";
import { Icon } from "./Icons.jsx";

// "Request next week's theme" — anyone can suggest a dish challenge and upvote
// others'. The admin reads the ranked list to pick what's next.
export default function ThemeSuggest() {
  const [list, setList] = useState([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [voted, setVoted] = useState({});

  const load = useCallback(async () => {
    const s = await fetchSuggestions();
    setList(s);
    const v = {};
    s.forEach((x) => { if (hasUpvotedSuggestion(x.id)) v[x.id] = true; });
    setVoted(v);
  }, []);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    const clean = text.trim();
    if (clean.length < 3) { setMsg("A few more characters…"); return; }
    setBusy(true);
    setMsg("");
    const res = await suggestTheme(clean);
    setBusy(false);
    if (res.ok) {
      setText("");
      setMsg("Thanks — added to the list.");
      setVoted((v) => ({ ...v, [res.suggestion.id]: true }));
      load();
    } else {
      setMsg(res.reason === "rate-limited" ? "You've suggested a few already." : "Couldn't send — try again.");
    }
  };

  const up = async (id) => {
    if (voted[id]) return;
    setVoted((v) => ({ ...v, [id]: true }));
    setList((l) => l.map((x) => (x.id === id ? { ...x, upvotes: (x.upvotes || 0) + 1 } : x)).sort((a, b) => b.upvotes - a.upvotes));
    const res = await upvoteSuggestion(id);
    if (res.ok && typeof res.upvotes === "number") {
      setList((l) => l.map((x) => (x.id === id ? { ...x, upvotes: res.upvotes } : x)).sort((a, b) => b.upvotes - a.upvotes));
    }
  };

  return (
    <div style={{ margin: "18px 16px 8px", background: "var(--cream-hi)", borderRadius: "var(--r-lg)", boxShadow: "var(--e1)", padding: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <Icon name="sparkle" size={16} width={1.8} color="var(--violet)" />
        <div style={{ fontFamily: "Fraunces, serif", fontWeight: 700, fontSize: 16, color: "var(--ink)" }}>
          Request next week
        </div>
      </div>
      <div style={{ fontSize: 12.5, color: "var(--muted)", fontWeight: 500, marginBottom: 12, lineHeight: 1.45 }}>
        What should the next dish challenge be? Suggest one, or upvote what you'd like to see.
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: list.length ? 14 : 0 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          maxLength={80}
          placeholder="e.g. Best haleem, filter coffee, momos…"
          style={{
            flex: 1, minWidth: 0, boxSizing: "border-box",
            border: "1.5px solid var(--line)", borderRadius: "var(--r-md)",
            padding: "10px 14px", fontSize: 14, fontFamily: "Outfit, sans-serif",
            background: "var(--cream)", color: "var(--ink)", outline: "none",
          }}
        />
        <button
          onClick={submit}
          disabled={busy}
          className="pressable-sm"
          style={{
            flexShrink: 0, border: "none", borderRadius: "var(--r-md)",
            padding: "0 16px", fontSize: 13.5, fontWeight: 700, cursor: "pointer",
            background: "var(--violet)", color: "#fff", opacity: busy ? 0.6 : 1,
          }}
        >
          Suggest
        </button>
      </div>

      {msg && <div style={{ fontSize: 12, fontWeight: 600, color: "var(--violet)", marginBottom: list.length ? 12 : 0 }}>{msg}</div>}

      {list.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {list.map((s) => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--cream)", borderRadius: "var(--r-md)", padding: "9px 12px" }}>
              <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>{s.text}</span>
              <button
                onClick={() => up(s.id)}
                disabled={!!voted[s.id]}
                className="pressable-sm"
                aria-label="Upvote"
                style={{
                  flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 5,
                  border: `1.5px solid ${voted[s.id] ? "var(--violet)" : "var(--line)"}`,
                  background: voted[s.id] ? "var(--violet-wash)" : "transparent",
                  color: voted[s.id] ? "var(--violet)" : "var(--ink-soft)",
                  borderRadius: "var(--r-pill)", padding: "5px 11px",
                  fontSize: 12.5, fontWeight: 700, cursor: voted[s.id] ? "default" : "pointer",
                }}
              >
                <span style={{ fontSize: 10, lineHeight: 1 }}>▲</span>
                {s.upvotes || 0}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
