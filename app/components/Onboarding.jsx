"use client";

import { useEffect, useState } from "react";
import { Icon } from "./Icons.jsx";

const KEY = "onboarding_done";

const SLIDES = [
  {
    icon: "map",
    title: "Explore 3,400+ spots",
    body: "Cafes, restro-bars, bakeries and local gems across Hyderabad, all on one map.",
  },
  {
    icon: "passport",
    title: "Stamp your passport",
    body: "Visit a spot, stamp it, and watch the map bloom into colour as you collect the city.",
  },
  {
    icon: "trophy",
    title: "Vote & compete",
    body: "Vote in weekly dish rankings and race friends to claim spots on the leaderboard.",
  },
];

export default function Onboarding() {
  const [open, setOpen] = useState(false);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) {
        const t = setTimeout(() => setOpen(true), 800);
        return () => clearTimeout(t);
      }
    } catch {}
  }, []);

  if (!open) return null;

  const done = () => {
    try { localStorage.setItem(KEY, "1"); } catch {}
    setOpen(false);
  };

  const s = SLIDES[slide];
  const last = slide === SLIDES.length - 1;

  return (
    <div
      role="dialog"
      aria-label="Welcome to Hyderabad Eats"
      onClick={done}
      style={{
        position: "absolute", inset: 0, zIndex: 1700,
        background: "rgba(30,22,16,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20, animation: "fade-in .2s ease",
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
        <div style={{ background: "var(--violet)", color: "#fff", padding: "28px 24px 24px", textAlign: "center" }}>
          <Icon name={s.icon} size={36} width={1.8} color="#fff" style={{ margin: "0 auto 14px" }} />
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.85 }}>
            {slide + 1} of {SLIDES.length}
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, marginTop: 8, lineHeight: 1.15 }}>{s.title}</div>
        </div>
        <div style={{ padding: "20px 24px 24px" }}>
          <p style={{ margin: "0 0 20px", fontSize: 15, lineHeight: 1.55, color: "var(--ink-soft)" }}>{s.body}</p>
          <div style={{ display: "flex", gap: 10 }}>
            {!last ? (
              <button
                onClick={() => setSlide((n) => n + 1)}
                className="pressable-sm"
                style={{ flex: 1, border: "none", borderRadius: 14, padding: "13px 16px", background: "var(--violet)", color: "#fff", fontSize: 14.5, fontWeight: 700, cursor: "pointer" }}
              >
                Next
              </button>
            ) : (
              <button
                onClick={done}
                className="pressable-sm"
                style={{ flex: 1, border: "none", borderRadius: 14, padding: "13px 16px", background: "var(--violet)", color: "#fff", fontSize: 14.5, fontWeight: 700, cursor: "pointer" }}
              >
                Start exploring
              </button>
            )}
            <button
              onClick={done}
              className="pressable-sm"
              style={{ border: "1.5px solid var(--line)", borderRadius: 14, padding: "13px 16px", background: "transparent", color: "var(--ink-soft)", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
            >
              Skip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
