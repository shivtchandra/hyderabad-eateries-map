"use client";

import { useState } from "react";
import { TAGS } from "../../lib/eateryUtils.js";
import { Icon, CategoryIcon, TagIcon } from "./Icons.jsx";

const CAT_ORDER = ["all", "cafe", "restaurant", "local", "restro-bar", "bakery", "ice-cream"];
const CAT_META = {
  all:          { label: "All",        color: "var(--violet)" },
  restaurant:   { label: "Restaurant", color: "var(--restaurant)" },
  "restro-bar": { label: "Restro Bar", color: "var(--restro-bar)" },
  cafe:         { label: "Cafe",       color: "var(--cafe)" },
  bakery:       { label: "Bakery",     color: "var(--bakery)" },
  "ice-cream":  { label: "Ice Cream",  color: "var(--ice-cream)" },
  local:        { label: "Local Eats", color: "var(--local)" },
};

export default function FilterChips({
  activeCategory, setActiveCategory,
  activeTags, toggleTag,
  openNowOnly, setOpenNowOnly, openNowLoading = false,
  counts, tagCounts,
  userLoc, nearbyOnly, setNearbyOnly, nearbyArea,
  newOnly, setNewOnly,
}) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeFilterCount = (openNowOnly ? 1 : 0) + activeTags.length + (nearbyOnly ? 1 : 0) + (newOnly ? 1 : 0);

  return (
    <div className="material edge-below" style={{ flexShrink: 0, position: "relative", zIndex: 19 }}>
      {/* Category scroll + always-visible filter button as siblings */}
      <div style={{ display: "flex", alignItems: "center", padding: "8px 0 10px" }}>
        {/* Scrollable category chips */}
        <div className="chip-rail" style={{ flex: 1, paddingLeft: 14, minWidth: 0 }}>
          {userLoc && (
            <button onClick={() => setNearbyOnly((v) => !v)} className="pressable-sm" style={chip(nearbyOnly, "var(--forest)")}>
              <Icon name="locate" size={15} width={2} color={nearbyOnly ? "#fff" : "var(--forest)"} />
              {nearbyArea ? `Near ${nearbyArea.split(" ").slice(0, 2).join(" ")}` : "Nearby"}
            </button>
          )}
          {CAT_ORDER.map((key) => {
            const meta = CAT_META[key];
            const active = activeCategory === key;
            return (
              <button key={key} onClick={() => setActiveCategory(key)} className="pressable-sm" style={chip(active, meta.color)}>
                {key === "all"
                  ? <Icon name="utensils" size={15} width={2} color={active ? "#fff" : meta.color} />
                  : <CategoryIcon category={key} size={15} width={2} color={active ? "#fff" : meta.color} />}
                {meta.label}
                <span style={badge(active)}>{counts[key] ?? 0}</span>
              </button>
            );
          })}
        </div>

        {/* Filter button — never scrolls away */}
        <div style={{
          flexShrink: 0,
          paddingLeft: 6,
          paddingRight: 14,
          background: "linear-gradient(to right, transparent, var(--cream-hi) 30%)",
        }}>
          <button
            onClick={() => setFiltersOpen((v) => !v)}
            className="pressable-sm"
            aria-label="Filters"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              height: 34,
              padding: "0 13px",
              border: "none",
              borderRadius: "var(--r-pill)",
              background: filtersOpen || activeFilterCount > 0 ? "var(--violet)" : "rgba(38,48,92,0.07)",
              color: filtersOpen || activeFilterCount > 0 ? "#fff" : "var(--ink)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              transition: "background .18s ease, color .18s ease",
            }}
          >
            <Icon
              name="filter"
              size={15}
              width={2}
              color={filtersOpen || activeFilterCount > 0 ? "#fff" : "var(--ink-soft)"}
            />
            Filters
            {activeFilterCount > 0 && (
              <span style={{
                background: "rgba(255,255,255,0.28)",
                color: "#fff",
                borderRadius: "var(--r-pill)",
                padding: "1px 7px",
                fontSize: 11,
                fontWeight: 700,
              }}>
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Expanded filter panel — open now + vibe tags */}
      {filtersOpen && (
        <div style={{
          padding: "0 14px 12px",
          display: "flex",
          flexWrap: "wrap",
          gap: "7px 6px",
          borderTop: "1px solid var(--line)",
          paddingTop: 10,
        }}>
          <button
            onClick={() => setOpenNowOnly(!openNowOnly)}
            className="pressable-sm"
            aria-busy={openNowLoading}
            style={chip(openNowOnly, "var(--forest)")}
          >
            <Icon name="clock" size={15} width={2} color={openNowOnly ? "#fff" : "var(--forest)"} />
{openNowLoading ? "Checking hours…" : "Open now"}
          </button>
          <button onClick={() => setNewOnly((v) => !v)} className="pressable-sm" style={chip(newOnly, "var(--pop)")}>
            <Icon name="sparkle" size={15} width={2} color={newOnly ? "#fff" : "var(--pop-deep)"} />
            New
          </button>

          {Object.entries(TAGS).map(([key, meta]) => {
            if (!tagCounts[key]) return null;
            const active = activeTags.includes(key);
            return (
              <button key={key} onClick={() => toggleTag(key)} className="pressable-sm" style={chip(active, "var(--ink-soft)")}>
                <TagIcon tag={key} size={15} width={2} color={active ? "#fff" : "var(--ink-soft)"} />
                {meta.label}
              </button>
            );
          })}
          <button
            onClick={() => setFiltersOpen(false)}
            className="pressable-sm"
            style={{ ...chip(false, "var(--muted)"), marginLeft: "auto", color: "var(--muted)", fontWeight: 600 }}
          >
            <Icon name="close" size={13} width={2.2} color="var(--muted)" /> Done
          </button>
        </div>
      )}
    </div>
  );
}

function chip(active, color) {
  return {
    background: active ? color : "rgba(38,48,92,0.045)",
    color: active ? "#fff" : "var(--ink)",
    border: "none",
    borderRadius: "var(--r-pill)",
    padding: "0 13px",
    height: 34,
    fontSize: 13,
    fontWeight: active ? 600 : 500,
    letterSpacing: "-0.002em",
    cursor: "pointer",
    transition: "background .18s ease, color .18s ease, transform .12s cubic-bezier(.2,0,0,1)",
    display: "flex",
    alignItems: "center",
    gap: 6,
    whiteSpace: "nowrap",
    flexShrink: 0,
  };
}

function badge(active) {
  return {
    background: active ? "rgba(255,255,255,0.22)" : "rgba(38,48,92,0.07)",
    color: active ? "#fff" : "var(--muted)",
    borderRadius: "var(--r-pill)",
    padding: "1px 7px",
    fontSize: 11,
    fontWeight: 600,
  };
}
