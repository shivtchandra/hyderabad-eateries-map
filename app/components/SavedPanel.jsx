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
    <div className="you-panel">
      <div className="you-head">
        <h2>Saved</h2>
        <p>{saved.length} {saved.length === 1 ? "spot" : "spots"} to try</p>
      </div>
      <ul className="you-list">
        {saved.map((e) => {
          const color = CAT_COLOR[e.category] ?? "var(--muted)";
          const open = isOpenNow(e.hours);
          return (
            <li key={e.id} className="you-row">
              <button type="button" className="you-row-main" onClick={() => onSelect(e)}>
                <span className="you-row-icon" style={{ color }} aria-hidden="true">
                  <CategoryIcon category={e.category} size={22} width={1.9} color={color} />
                </span>
                <span className="you-row-text">
                  <span className="you-row-name">{e.name}</span>
                  <span className="you-row-meta">
                    {e.rating && <span className="you-row-meta-item"><Icon name="star" size={13} width={2} color="var(--ink-soft)" /> {e.rating}</span>}
                    {open != null && <span className="you-row-meta-item" style={{ color: open ? "var(--forest)" : "var(--muted)" }}>{open ? "Open now" : "Closed"}</span>}
                    {TIERS[e.tier] && <span className="you-row-meta-item"><TierIcon tier={e.tier} size={13} width={1.9} /> {TIERS[e.tier].label}</span>}
                  </span>
                </span>
              </button>
              <button type="button" className="you-row-action" onClick={() => onToggleVisited(e.id)}>
                <Icon name="ticket" size={16} width={2} /> Stamp
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
