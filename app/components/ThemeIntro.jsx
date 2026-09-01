"use client";

// First-visit announcement for the current weekly theme. Shows once per theme
// per device (localStorage flag keyed by theme id), then invites a vote.

import { useEffect, useState } from "react";
import { Icon } from "./Icons.jsx";

const seenKey = (id) => `theme-intro-seen-${id}`;

export default function ThemeIntro({ theme, onVote }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!theme?.id) return;
    let seen = false;
    try {
      seen = !!localStorage.getItem(seenKey(theme.id));
    } catch {
      /* private mode — treat as unseen, show once this session */
    }
    if (!seen) {
      const t = setTimeout(() => setOpen(true), 650);
      return () => clearTimeout(t);
    }
  }, [theme?.id]);

  if (!theme?.id) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(seenKey(theme.id), "1");
    } catch {}
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-label="This week's theme"
      onClick={dismiss}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 1600,
        background: "rgba(30,22,16,0.42)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        animation: "fade-in .2s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(400px, 92vw)",
          background: "var(--cream-hi)",
          borderRadius: 22,
          boxShadow: "var(--shadow-pop)",
          overflow: "hidden",
          animation: "sheet-rise .28s cubic-bezier(.2,.8,.25,1)",
        }}
      >
        <div style={{ background: "var(--violet, #7c5cff)", color: "#fff", padding: "22px 22px 20px", position: "relative" }}>
          <button
            onClick={dismiss}
            aria-label="Close"
            style={{
              position: "absolute", top: 14, right: 14, width: 30, height: 30, borderRadius: "50%",
              border: "none", background: "rgba(255,255,255,0.22)", color: "#fff", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Icon name="close" size={15} width={2.2} color="#fff" />
          </button>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.85 }}>
            This week’s theme
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, marginTop: 6, lineHeight: 1.12 }}>{theme.title}</div>
        </div>

        <div style={{ padding: "18px 22px 22px" }}>
          {theme.description && (
            <p style={{ margin: "0 0 16px", fontSize: 14.5, lineHeight: 1.5, color: "var(--ink-soft)" }}>
              {theme.description}
            </p>
          )}
          <p style={{ margin: "0 0 18px", fontSize: 14.5, lineHeight: 1.5, color: "var(--ink)" }}>
            Cast your vote — this week's ranking goes live at /rankings and updates as Hyderabad votes.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => { dismiss(); onVote?.(); }}
              className="pressable-sm"
              style={{
                flex: 1, border: "none", borderRadius: 14, padding: "13px 16px",
                background: "var(--violet, #7c5cff)", color: "#fff", fontSize: 14.5, fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              <Icon name="trophy" size={16} width={2} color="#fff" />
              Vote your favourite
            </button>
            <button
              onClick={dismiss}
              className="pressable-sm"
              style={{
                border: "1.5px solid var(--line)", borderRadius: 14, padding: "13px 16px",
                background: "transparent", color: "var(--ink-soft)", fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
