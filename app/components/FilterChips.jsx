"use client";

import { useState } from "react";
import { TAGS } from "../../lib/eateryUtils.js";
import { Icon, TagIcon } from "./Icons.jsx";

// Five chips at most (DESIGN.md 4a). Tap an active chip again to clear it.
// Bakery and Ice Cream share one Desserts chip (page.jsx filters both).
// Everything else (open now, nearby, dish, vibe tags, the every-spot toggle)
// sits behind the one Filters button, so the map keeps a single calm row.
const CHIPS = [
  { key: "recos", label: "Recos", icon: "sparkle" }, // spots we recommend something at
  { key: "restaurant", label: "Restaurants", icon: "restaurant" },
  { key: "cafe", label: "Cafes", icon: "cafe" },
  { key: "restro-bar", label: "Bars", icon: "restro-bar" },
  { key: "desserts", label: "Desserts", icon: "ice-cream" },
];

export default function FilterChips({
  curatedEnabled = false, recommendedOnly = false, setRecommendedOnly,
  recommendationDish = "", setRecommendationDish, recommendationDishes = [],
  activeCategory, setActiveCategory,
  activeTags, toggleTag,
  openNowOnly, setOpenNowOnly, openNowLoading = false,
  tagCounts,
  userLoc, nearbyOnly, setNearbyOnly, nearbyArea,
  newOnly, setNewOnly,
  safetyOnly = false, setSafetyOnly = () => {}, safetyCount = 0,
  localsOnly = false, setLocalsOnly = () => {}, localsCount = 0,
  showAll = false, setShowAll = () => {}, hiddenCount = 0,
  // The Filters button lives in the top bar (TopBar.jsx); the page owns the
  // open state and passes it here so this row can render the panel.
  filtersOpen: filtersOpenProp, setFiltersOpen: setFiltersOpenProp, hideFiltersButton = false,
}) {
  const [filtersOpenLocal, setFiltersOpenLocal] = useState(false);
  const filtersOpen = filtersOpenProp ?? filtersOpenLocal;
  const setFiltersOpen = setFiltersOpenProp ?? setFiltersOpenLocal;
  const activeDish = recommendationDishes.find((d) => d.id === recommendationDish);
  const activeFilterCount = countActiveFilters({ openNowOnly, activeTags, nearbyOnly, newOnly, safetyOnly, localsOnly, activeDish, curatedEnabled, recommendedOnly, hiddenCount, showAll });
  const close = () => setFiltersOpen(false);
  const pickDish = (id) => { setRecommendationDish(id); if (id) setRecommendedOnly(true); close(); };
  const filtersLit = filtersOpen || activeFilterCount > 0;

  return (
    <div className={hideFiltersButton ? "map-chips" : "material edge-below"} style={{ flexShrink: 0, position: "relative", zIndex: 19 }}>
      <div style={{ display: "flex", alignItems: "center", padding: "var(--s2) 0 var(--s3)" }}>
        <div className="chip-rail" style={{ flex: 1, paddingLeft: "var(--s4)", minWidth: 0 }}>
          {CHIPS.map((c) => {
            const active = activeCategory === c.key;
            return (
              <button
                key={c.key}
                type="button"
                aria-pressed={active}
                onClick={() => setActiveCategory(active ? "all" : c.key)}
                className="pressable-sm"
                style={chip(active)}
              >
                {c.label}
              </button>
            );
          })}
        </div>
        {/* Filters button never scrolls away (unless the top bar carries it) */}
        {!hideFiltersButton && <div style={{ flexShrink: 0, paddingLeft: "var(--s2)", paddingRight: "var(--s4)", background: "linear-gradient(to right, transparent, var(--cream-hi) 30%)" }}>
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            className="pressable-sm"
            aria-expanded={filtersOpen}
            style={{ ...chip(filtersLit), background: filtersLit ? "var(--violet)" : "var(--cream-hi)", boxShadow: filtersLit ? "none" : "inset 0 0 0 1.5px var(--line)" }}
          >
            <Icon name="filter" size={16} width={2} color={filtersLit ? "#fff" : "var(--ink-soft)"} />
            Filters
            {activeFilterCount > 0 && <span style={badge}>{activeFilterCount}</span>}
          </button>
        </div>}
      </div>

      {filtersOpen && (
        <div className="filters-panel">
          <div className="chip-wrap">
            <button type="button" onClick={() => { setOpenNowOnly(!openNowOnly); close(); }} aria-busy={openNowLoading} className="pressable-sm" style={chip(openNowOnly)}>
              <Icon name="clock" size={16} width={2} color={openNowOnly ? "#fff" : "var(--ink-soft)"} />
              {openNowLoading ? "Checking hours…" : "Open now"}
            </button>
            {userLoc && (
              <button type="button" onClick={() => { setNearbyOnly((v) => !v); close(); }} className="pressable-sm" style={chip(nearbyOnly)}>
                <Icon name="locate" size={16} width={2} color={nearbyOnly ? "#fff" : "var(--ink-soft)"} />
                {nearbyArea ? `Near ${nearbyArea.split(" ").slice(0, 2).join(" ")}` : "Nearby"}
              </button>
            )}
            <button type="button" onClick={() => { setNewOnly((v) => !v); close(); }} className="pressable-sm" style={chip(newOnly)}>
              <Icon name="sparkle" size={16} width={2} color={newOnly ? "#fff" : "var(--ink-soft)"} />
              New
            </button>
            {safetyCount > 0 && (
              <button type="button" onClick={() => { setSafetyOnly((v) => !v); close(); }} className="pressable-sm" style={chip(safetyOnly)}>
                <Icon name="shield" size={16} width={2} color={safetyOnly ? "#fff" : "var(--ink-soft)"} />
                Food safety record
              </button>
            )}
            {!curatedEnabled && localsCount > 0 && (
              <button type="button" onClick={() => { setLocalsOnly((v) => !v); close(); }} className="pressable-sm" style={chip(localsOnly)}>
                <Icon name="heart" size={16} width={2} color={localsOnly ? "#fff" : "var(--ink-soft)"} />
                Locals’ picks
              </button>
            )}
            {curatedEnabled && (
              <button type="button" aria-pressed={!recommendedOnly}
                onClick={() => { if (recommendedOnly) { setRecommendedOnly(false); setRecommendationDish(""); } else setRecommendedOnly(true); close(); }}
                className="pressable-sm" style={chip(!recommendedOnly)}>
                <Icon name="map" size={16} width={2} color={!recommendedOnly ? "#fff" : "var(--ink-soft)"} />
                Every spot, not just picks
              </button>
            )}
            {!curatedEnabled && hiddenCount > 0 && (
              <button type="button" aria-pressed={!showAll} onClick={() => { setShowAll((v) => !v); close(); }} className="pressable-sm" style={chip(!showAll)}>
                <Icon name="star" size={16} width={2} color={!showAll ? "#fff" : "var(--ink-soft)"} />
                Top places only
              </button>
            )}
          </div>

          {curatedEnabled && recommendationDishes.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--s2)" }}>
              <span className="t-over" style={{ color: "var(--muted)" }}>Dish</span>
              <div className="chip-wrap" role="listbox" aria-label="Pick a dish">
                {recommendationDishes.map((d) => {
                  const selected = recommendationDish === d.id;
                  return (
                    <button key={d.id} type="button" role="option" aria-selected={selected} onClick={() => pickDish(selected ? "" : d.id)} className="pressable-sm" style={chip(selected)}>
                      {d.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {Object.keys(TAGS).some((k) => tagCounts[k]) && (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--s2)" }}>
              <span className="t-over" style={{ color: "var(--muted)" }}>Vibe</span>
              <div className="chip-wrap">
                {Object.entries(TAGS).map(([key, meta]) => {
                  if (!tagCounts[key]) return null;
                  const active = activeTags.includes(key);
                  return (
                    <button key={key} type="button" onClick={() => { toggleTag(key); close(); }} className="pressable-sm" style={chip(active)}>
                      <TagIcon tag={key} size={16} width={2} color={active ? "#fff" : "var(--ink-soft)"} />
                      {meta.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <button type="button" onClick={close} className="pressable-sm" style={{ ...chip(false), alignSelf: "flex-end", background: "transparent", color: "var(--muted)" }}>
            <Icon name="close" size={14} width={2.2} color="var(--muted)" /> Done
          </button>
        </div>
      )}
    </div>
  );
}

// Counts only what the person changed from the default view. Shared with the
// page so the top bar's Filters button can show the same number.
export function countActiveFilters({ openNowOnly, activeTags = [], nearbyOnly, newOnly, safetyOnly, localsOnly, activeDish, curatedEnabled, recommendedOnly, hiddenCount = 0, showAll }) {
  return (openNowOnly ? 1 : 0) + activeTags.length + (nearbyOnly ? 1 : 0) + (newOnly ? 1 : 0) +
    (safetyOnly ? 1 : 0) + (localsOnly ? 1 : 0) + (activeDish ? 1 : 0) +
    (curatedEnabled && !recommendedOnly ? 1 : 0) + (!curatedEnabled && hiddenCount > 0 && !showAll ? 1 : 0);
}

function chip(active) {
  return {
    background: active ? "var(--violet)" : "rgba(20, 20, 20, 0.05)",
    color: active ? "#fff" : "var(--ink)",
    border: "none",
    borderRadius: "var(--r-pill)",
    padding: "0 var(--s4)",
    height: 40,
    fontSize: 15,
    fontWeight: active ? 600 : 500,
    cursor: "pointer",
    transition: "background var(--dur-2) ease, color var(--dur-2) ease, transform var(--dur-1) cubic-bezier(.2,0,0,1)",
    display: "flex",
    alignItems: "center",
    gap: 6,
    whiteSpace: "nowrap",
    flexShrink: 0,
  };
}

const badge = {
  background: "rgba(255,255,255,0.28)",
  color: "#fff",
  borderRadius: "var(--r-pill)",
  padding: "1px 7px",
  fontSize: 12,
  fontWeight: 700,
};
