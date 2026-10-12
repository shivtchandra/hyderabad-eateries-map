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

export default function SavedPanel({ eateries, passport, onSelect, onToggleVisited, onBrowse }) {
  const saved = eateries.filter((e) => passport.saved[e.id]);

  if (!saved.length) {
    return (
      // Empty state (DESIGN.md section 5): sticker, one sentence, one button.
      <div className="empty-state">
        <span className="empty-sticker" aria-hidden="true">
          <Icon name="bookmark" size={28} width={2.2} color="var(--ink)" />
        </span>
        <h2>Nothing saved yet.</h2>
        <p>Tap the bookmark on any spot and it lands here.</p>
        {onBrowse && <button type="button" className="empty-cta" onClick={onBrowse}>Open the map</button>}
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
