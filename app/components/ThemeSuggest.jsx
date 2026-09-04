"use client";

import { useState } from "react";
import { suggestTheme } from "../../lib/themeVoting.js";
import { Icon } from "./Icons.jsx";

// "Request next week", visitors submit a dish-challenge idea. Submissions go
// to the admin (they're not listed publicly); the admin picks what's next.
export default function ThemeSuggest() {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [msg, setMsg] = useState("");

  const submit = async () => {
    const clean = text.trim();
    if (clean.length < 3) { setMsg("A few more characters…"); return; }
    setBusy(true);
    setMsg("");
    const res = await suggestTheme(clean);
    setBusy(false);
    if (res.ok) {
      setText("");
      setDone(true);
    } else {
      setMsg(res.reason === "rate-limited" ? "You've sent a few already, thanks!" : "Couldn't send, try again.");
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

      {done ? (
        <div style={{ fontSize: 13, color: "var(--ink-soft)", fontWeight: 500, lineHeight: 1.5, padding: "6px 0 2px" }}>
          Got it, thanks! Your idea's on its way to the kitchen. 🙌
          <button
            onClick={() => setDone(false)}
            className="pressable-sm"
            style={{ display: "block", marginTop: 10, border: "none", background: "transparent", color: "var(--violet)", fontSize: 12.5, fontWeight: 700, cursor: "pointer", padding: 0 }}
          >
            Suggest another
          </button>
        </div>
      ) : (
        <>
          <div style={{ fontSize: 12.5, color: "var(--muted)", fontWeight: 500, marginBottom: 12, lineHeight: 1.45 }}>
            What should the next dish challenge be? Send us your pick.
          </div>
          <div style={{ display: "flex", gap: 8 }}>
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
              Send
            </button>
          </div>
          {msg && <div style={{ fontSize: 12, fontWeight: 600, color: "var(--violet)", marginTop: 10 }}>{msg}</div>}
        </>
      )}
    </div>
  );
}
