"use client";

import { isOpenNow, TIERS } from "../../lib/eateryUtils.js";
import { Icon, CategoryIcon, TierIcon } from "./Icons.jsx";

const CAT_COLOR = {
  "restro-bar": "var(--restro-bar)",
  cafe: "var(--cafe)",
  bakery: "var(--bakery)",
  "ice-cream": "var(--ice-cream)",
  local: "var(--local)",
};

export default function SavedPanel({ eateries, passport, onSelect, onToggleVisited }) {
  const saved = eateries.filter((e) => passport.saved[e.id]);

  if (!saved.length) {
    return (
      <div style={{ flex: 1, background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", padding: 30 }}>
        <div style={{ textAlign: "center", color: "var(--muted)", maxWidth: 290 }}>
          <Icon name="bookmark" size={44} width={1.4} color="var(--line)" style={{ margin: "0 auto 12px" }} />
          <div style={{ fontFamily: "var(--font-display), system-ui, sans-serif", fontWeight: 600, fontSize: 16, color: "var(--ink)" }}>
            Nothing saved yet
          </div>
          <div style={{ fontSize: 13.5, marginTop: 6, lineHeight: 1.5 }}>
            Tap a spot and hit <strong style={{ color: "var(--cafe)" }}>Want to go</strong> to build your hit-list.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", background: "var(--cream)", padding: "14px 14px 48px" }}>
      {saved.map((e) => {
        const color = CAT_COLOR[e.category] ?? "var(--muted)";
        const open = isOpenNow(e.hours);
        return (
          <div
            key={e.id}
            style={{
              background: "var(--cream-hi)", borderRadius: 17, padding: 12,
              border: "1.5px solid var(--line)", marginBottom: 9,
              display: "flex", gap: 11, alignItems: "center",
            }}
          >
            <button
              onClick={() => onSelect(e)}
              style={{
                background: "var(--cream)", border: `1.5px solid ${color}`, borderRadius: 13,
                width: 44, height: 44, minWidth: 44, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
              aria-label={e.name}
            >
              <CategoryIcon category={e.category} size={22} width={1.85} color={color} />
            </button>

            <button
              onClick={() => onSelect(e)}
              style={{ flex: 1, minWidth: 0, border: "none", background: "transparent", textAlign: "left", cursor: "pointer", padding: 0 }}
            >
              <div style={{ fontSize: 14.5, fontWeight: 600, fontFamily: "var(--font-display), system-ui, sans-serif", lineHeight: 1.2, marginBottom: 3 }}>
                {e.name}
              </div>
              <div style={{ fontSize: 11.5, color: "var(--muted)", fontWeight: 500, display: "flex", gap: 9, flexWrap: "wrap", alignItems: "center" }}>
                {e.rating && (
                  <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                    <Icon name="star" size={12} width={2} color="var(--pop-deep)" /> {e.rating}
                  </span>
                )}
                {open != null && (
                  <span style={{ color: open ? "var(--forest)" : "var(--restro-bar)", fontWeight: 600 }}>
                    {open ? "Open" : "Closed"}
                  </span>
                )}
                {TIERS[e.tier] && (
                  <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                    <TierIcon tier={e.tier} size={12} width={1.9} /> {TIERS[e.tier].label}
                  </span>
                )}
              </div>
            </button>

            <button
              onClick={() => onToggleVisited(e.id)}
              style={{
                background: "var(--pop)", color: "var(--ink)", border: "none",
                borderRadius: 12, padding: "0 13px", height: 38, minWidth: 44,
                fontFamily: "var(--font-ui), sans-serif", fontWeight: 600, fontSize: 12.5, cursor: "pointer",
                whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6,
              }}
            >
              <Icon name="ticket" size={15} width={2} /> Stamp
            </button>
          </div>
        );
      })}
    </div>
  );
}
