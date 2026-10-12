"use client";

import { useEffect, useRef, useState } from "react";
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
  curatedEnabled = false, recommendedOnly = false, setRecommendedOnly,
  recommendationDish = "", setRecommendationDish, recommendationDishes = [],
  activeCategory, setActiveCategory,
  activeTags, toggleTag,
  openNowOnly, setOpenNowOnly, openNowLoading = false,
  counts, tagCounts,
  userLoc, nearbyOnly, setNearbyOnly, nearbyArea,
  newOnly, setNewOnly,
  safetyOnly = false, setSafetyOnly = () => {}, safetyCount = 0,
  localsOnly = false, setLocalsOnly = () => {}, localsCount = 0,
  showAll = false, setShowAll = () => {}, hiddenCount = 0,
}) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [dishOpen, setDishOpen] = useState(false);
  const [menuLeft, setMenuLeft] = useState(14);
  const rootRef = useRef(null);
  const dishBtnRef = useRef(null);
  // Anchor the dropdown under the Dish button, kept inside the screen.
  const toggleDish = () => {
    if (!dishOpen && rootRef.current && dishBtnRef.current) {
      const root = rootRef.current.getBoundingClientRect();
      const btn = dishBtnRef.current.getBoundingClientRect();
      setMenuLeft(Math.max(8, Math.min(btn.left - root.left, root.width - 228)));
    }
    setDishOpen((v) => !v);
  };
  useEffect(() => {
    if (!dishOpen) return;
    const onKey = (e) => { if (e.key === "Escape") setDishOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dishOpen]);
  const pickDish = (id) => { setRecommendationDish(id); if (id) setRecommendedOnly(true); setDishOpen(false); };
  const activeFilterCount = (openNowOnly ? 1 : 0) + activeTags.length + (nearbyOnly ? 1 : 0) + (newOnly ? 1 : 0) + (safetyOnly ? 1 : 0) + (localsOnly ? 1 : 0) + (showAll ? 0 : 1) + (curatedEnabled && recommendationDish ? 1 : 0);
  const activeDish = recommendationDishes.find((d) => d.id === recommendationDish);

  return (
    <div ref={rootRef} className="material edge-below" style={{ flexShrink: 0, position: "relative", zIndex: dishOpen ? 1300 : 19 }}>
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
          {curatedEnabled && (
            <>
              <button className="pressable-sm" aria-pressed={recommendedOnly} onClick={() => setRecommendedOnly(true)} style={chip(recommendedOnly, "var(--violet)")}>
                <Icon name="star" size={15} width={2} color={recommendedOnly ? "#fff" : "var(--violet)"} />
                Recommended
              </button>
              <button className="pressable-sm" aria-pressed={!recommendedOnly} onClick={() => { setRecommendedOnly(false); setRecommendationDish(""); }} style={chip(!recommendedOnly, "var(--ink)")}>
                All
              </button>
            </>
          )}
          {curatedEnabled && recommendationDishes.length > 0 && (
            <button ref={dishBtnRef} className="pressable-sm" aria-haspopup="listbox" aria-expanded={dishOpen} onClick={toggleDish}
              style={{ ...chip(!!activeDish, "var(--ink)"), boxShadow: dishOpen && !activeDish ? "inset 0 0 0 1.5px var(--ink)" : "none" }}>
              <Icon name="utensils" size={15} width={2} color={activeDish ? "#fff" : "var(--ink-soft)"} />
              {activeDish ? activeDish.name : "Dish"}
              <Icon name="chevronDown" size={13} width={2.2} color={activeDish ? "#fff" : "var(--ink-soft)"} style={{ transform: dishOpen ? "rotate(180deg)" : "none", transition: "transform .18s ease" }} />
            </button>
          )}
          {CAT_ORDER.filter((key) => !(curatedEnabled && key === "all")).map((key) => {
            const meta = CAT_META[key];
            const active = activeCategory === key;
            return (
              <button key={key} aria-pressed={active} onClick={() => setActiveCategory(curatedEnabled && active ? "all" : key)} className="pressable-sm" style={chip(active, meta.color)}>
                {key === "all"
                  ? <Icon name="utensils" size={15} width={2} color={active ? "#fff" : meta.color} />
                  : <CategoryIcon category={key} size={15} width={2} color={active ? "#fff" : meta.color} />}
                {meta.label}
                <span style={badge(active)}>{counts[key] ?? 0}</span>
              </button>
            );
          })}
        </div>

        {/* Filter button, never scrolls away */}
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
              background: filtersOpen || activeFilterCount > 0 ? "var(--violet)" : "rgba(20, 20, 20,0.07)",
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
            {!curatedEnabled && "Filters"}
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

      {/* Dish dropdown: a short list anchored under the Dish button */}
      {dishOpen && (
        <>
          <div className="dish-menu-scrim" onClick={() => setDishOpen(false)} />
          <div className="dish-menu" role="listbox" aria-label="Pick a dish" style={{ left: menuLeft }}>
            {[{ id: "", name: "Any dish" }, ...recommendationDishes].map((d) => {
              const selected = recommendationDish === d.id;
              return (
                <button key={d.id || "any"} role="option" aria-selected={selected} onClick={() => pickDish(d.id)}>
                  <span>{d.name}</span>
                  {selected ? <Icon name="check" size={15} width={2.4} color="var(--violet)" /> : d.count > 0 && <small>{d.count}</small>}
                </button>
              );
            })}
            <a href="/picks" className="dish-menu-guides">Dish guides →</a>
          </div>
        </>
      )}

      {/* Expanded filter panel, open now + vibe tags */}
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
            onClick={() => { setOpenNowOnly(!openNowOnly); setFiltersOpen(false); }}
            className="pressable-sm"
            aria-busy={openNowLoading}
            style={chip(openNowOnly, "var(--forest)")}
          >
            <Icon name="clock" size={15} width={2} color={openNowOnly ? "#fff" : "var(--forest)"} />
{openNowLoading ? "Checking hours…" : "Open now"}
          </button>
          {!curatedEnabled && localsCount > 0 && (
            <button onClick={() => { setLocalsOnly((v) => !v); setFiltersOpen(false); }} className="pressable-sm" style={chip(localsOnly, "var(--violet)")}>
              <Icon name="heart" size={15} width={2} color={localsOnly ? "#fff" : "var(--violet)"} />
              Locals' picks
            </button>
          )}
          <button onClick={() => { setNewOnly((v) => !v); setFiltersOpen(false); }} className="pressable-sm" style={chip(newOnly, "var(--pop)")}>
            <Icon name="sparkle" size={15} width={2} color={newOnly ? "#fff" : "var(--pop-deep)"} />
            New
          </button>
          {!curatedEnabled && hiddenCount > 0 && (
            <button onClick={() => { setShowAll((v) => !v); setFiltersOpen(false); }} className="pressable-sm" style={chip(!showAll, "var(--ink-soft)")}>
              <Icon name="star" size={15} width={2} color={!showAll ? "#fff" : "var(--ink-soft)"} />
              Top places only
            </button>
          )}
          {safetyCount > 0 && (
            <button onClick={() => { setSafetyOnly((v) => !v); setFiltersOpen(false); }} className="pressable-sm" style={chip(safetyOnly, "var(--pop-deep)")}>
              <Icon name="shield" size={15} width={2} color={safetyOnly ? "#fff" : "var(--pop-deep)"} />
              Food safety record
            </button>
          )}

          {Object.entries(TAGS).map(([key, meta]) => {
            if (!tagCounts[key]) return null;
            const active = activeTags.includes(key);
            return (
              <button key={key} onClick={() => { toggleTag(key); setFiltersOpen(false); }} className="pressable-sm" style={chip(active, "var(--ink-soft)")}>
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
    background: active ? color : "rgba(20, 20, 20,0.045)",
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
    background: active ? "rgba(255,255,255,0.22)" : "rgba(20, 20, 20,0.07)",
    color: active ? "#fff" : "var(--muted)",
    borderRadius: "var(--r-pill)",
    padding: "1px 7px",
    fontSize: 11,
    fontWeight: 600,
  };
}
