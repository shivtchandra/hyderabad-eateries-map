"use client";

import { Icon, CategoryIcon } from "./Icons.jsx";

const CAT_COLOR = {
  restaurant: "var(--restaurant)",
  "restro-bar": "var(--restro-bar)",
  cafe: "var(--cafe)",
  bakery: "var(--bakery)",
  "ice-cream": "var(--ice-cream)",
  local: "var(--local)",
};

function Arrow() {
  return (
    <span className="you-arrow" aria-hidden="true">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 17L17 7M9 7h8v8" />
      </svg>
    </span>
  );
}

// The You tab (DESIGN.md 4a, "You" mockup): one page for everything personal.
// Passport card, a peek at Saved, then one row per thing you can open. Each
// row opens the existing panel; nothing here is a second copy of a feature.
export default function YouHub({ visitedCount = 0, saved = [], stickerCount = 0, onOpen, onSelectSpot }) {
  const peek = saved.slice(0, 3);
  return (
    <div className="you-hub">
      <h1 className="you-hub-title">You</h1>

      <button type="button" className="you-passport" onClick={() => onOpen("passport")}>
        <span className="you-passport-top">
          <span>
            <span className="you-passport-kicker">Food passport</span>
            <span className="you-passport-count">
              <b>{visitedCount}</b> {visitedCount === 1 ? "stamp" : "stamps"}
            </span>
          </span>
          <span className="you-passport-go" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M9 7h8v8" /></svg>
          </span>
        </span>
        <span className="you-passport-note">Stamp spots you’ve eaten at. Fill an area to finish it.</span>
      </button>

      <section className="you-hub-section" aria-labelledby="you-saved-title">
        <div className="you-hub-head">
          <h2 id="you-saved-title">Saved</h2>
          {saved.length > 0 && (
            <button type="button" className="you-hub-more" onClick={() => onOpen("saved")}>
              See all {saved.length}
            </button>
          )}
        </div>
        {peek.length > 0 ? (
          <ul className="you-list">
            {peek.map((e) => {
              const color = CAT_COLOR[e.category] ?? "var(--muted)";
              return (
                <li key={e.id} className="you-row">
                  <button type="button" className="you-row-main" onClick={() => onSelectSpot(e)}>
                    <span className="you-row-icon" style={{ color }} aria-hidden="true">
                      <CategoryIcon category={e.category} size={22} width={1.9} color={color} />
                    </span>
                    <span className="you-row-text">
                      <span className="you-row-name">{e.name}</span>
                      {e.discoveredIn && !e.discoveredIn.startsWith("text:") && (
                        <span className="you-row-meta">{e.discoveredIn}</span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="you-saved-empty">
            <span className="empty-sticker" aria-hidden="true">
              <Icon name="bookmark" size={28} width={2.2} color="var(--ink)" />
            </span>
            <span>
              <b>Nothing saved yet.</b>
              <span>Tap the bookmark on any spot.</span>
            </span>
          </div>
        )}
      </section>

      <ul className="you-links">
        <li>
          <button type="button" className="you-link" onClick={() => onOpen("ask")}>
            <span><b>Ask Eats</b><span>What to eat near you: locals&apos; votes, our picks and your saves</span></span>
            <Arrow />
          </button>
        </li>
        <li>
          <button type="button" className="you-link" onClick={() => onOpen("stickers")}>
            <span><b>Sticker book</b><span>{stickerCount > 0 ? `${stickerCount} stickers from spots and votes` : "Stickers from spots and votes"}</span></span>
            <Arrow />
          </button>
        </li>
        <li>
          <button type="button" className="you-link" onClick={() => onOpen("route")}>
            <span><b>Food on your route</b><span>Good spots along a drive or commute</span></span>
            <Arrow />
          </button>
        </li>
        <li>
          <button type="button" className="you-link" onClick={() => onOpen("leaderboard")}>
            <span><b>Leaderboard</b><span>Top food explorers this month</span></span>
            <Arrow />
          </button>
        </li>
        <li>
          <button type="button" className="you-link" onClick={() => onOpen("add")}>
            <span><b>Add a place</b><span>Missing a spot? Put it on the map</span></span>
            <Arrow />
          </button>
        </li>
      </ul>
    </div>
  );
}
