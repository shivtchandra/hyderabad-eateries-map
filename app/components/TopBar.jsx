"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "./Icons.jsx";
import AddPlace from "./AddPlace.jsx";

const CATEGORY_META = {
  restaurant: { label: "Restaurant", color: "var(--restaurant)" },
  "restro-bar": { label: "Restro Bar", color: "var(--restro-bar)" },
  cafe: { label: "Cafe", color: "var(--cafe)" },
  bakery: { label: "Bakery", color: "var(--bakery)" },
  "ice-cream": { label: "Ice Cream", color: "var(--ice-cream)" },
  local: { label: "Local Eats", color: "var(--local)" },
};

// Compact 54px bar. Search is an icon until tapped, then takes the full width, // on a phone every vertical pixel above the map is expensive.
export default function TopBar({
  search, setSearch, searchOpen, setSearchOpen,
  searchResults = [], onSelectResult, onPreviewResult,
  count, visitedCount,
}) {
  const [added, setAdded] = useState(null); // name of a place just added from search
  useEffect(() => { setAdded(null); }, [search]);
  const inputRef = useRef(null);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  return (
    <div style={{ flexShrink: 0, padding: "10px 12px 6px", position: "relative", zIndex: 1400 }}>
    <div
      className="material"
      style={{
        height: "var(--topbar-h)",
        display: "flex",
        alignItems: "center",
        gap: 9,
        padding: "0 10px 0 12px",
        borderRadius: "var(--r-pill)",
        boxShadow: "var(--e2)",
      }}
    >
      {searchOpen ? (
        <>
          <Icon name="search" size={19} color="var(--muted)" />
          <input
            ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") { setSearch(""); setSearchOpen(false); }
              if (e.key === "Enter" && searchResults[0]) onSelectResult?.(searchResults[0]);
            }}
            role="combobox"
            aria-expanded={search.trim().length > 0}
            aria-controls="eatery-search-results"
            aria-autocomplete="list"
            placeholder="Search cafes, biryani, bars…"
            style={{
              flex: 1,
              minWidth: 0,
              height: 38,
              border: "none",
              outline: "none",
              background: "transparent",
              fontFamily: "Outfit, sans-serif",
              fontWeight: 500,
              fontSize: 15,
              color: "var(--ink)",
            }}
          />
          <button
            onClick={() => { setSearch(""); setSearchOpen(false); }}
            className="pressable-sm" style={iconBtn}
            aria-label="Close search"
          >
            <Icon name="close" size={17} color="var(--ink-soft)" />
          </button>
        </>
      ) : (
        <>
          {/* Logo mark, biryani handi */}
          <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
            <rect width="30" height="30" rx="9" fill="var(--violet)" />
            {/* steam */}
            <path d="M11 6.5 Q9.5 4.5 11 3.5" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
            <path d="M15 6 Q13.5 4 15 3" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
            <path d="M19 6.5 Q20.5 4.5 19 3.5" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
            {/* dome lid */}
            <path d="M9.5 13.5 Q9.5 8 15 7.5 Q20.5 8 20.5 13.5 Z" fill="white" opacity="0.95"/>
            {/* knob */}
            <circle cx="15" cy="7.8" r="1.5" fill="white"/>
            {/* neck band */}
            <rect x="8.5" y="12.5" width="13" height="2.5" rx="1.25" fill="white"/>
            {/* wide belly */}
            <path d="M8.5 15 Q6 15.5 5.5 18.5 Q5.5 23.5 15 24 Q24.5 23.5 24.5 18.5 Q24 15.5 21.5 15 Z" fill="white" opacity="0.95"/>
            {/* base ring */}
            <ellipse cx="15" cy="24" rx="6" ry="1.4" fill="white" opacity="0.65"/>
          </svg>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              className="groovy"
              style={{
                fontSize: 17,
                lineHeight: 1.15,
                color: "var(--violet-deep)",
                letterSpacing: "-0.005em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              Hyderabad Eats
            </div>
            <div className="t-cap" style={{ color: "var(--muted)", fontWeight: 500, marginTop: 2 }}>
              {visitedCount > 0
                ? `${visitedCount} stamped · ${count} spots`
                : `${count} spots · stamp your passport`}
            </div>
          </div>
          <Link href="/rankings" className="pressable-sm" style={{ ...iconBtn, textDecoration: "none" }} aria-label="Rankings" title="Weekly rankings">
            <Icon name="trophy" size={17} color="var(--ink-soft)" />
          </Link>
          <button onClick={() => setSearchOpen(true)} className="pressable-sm" style={iconBtn} aria-label="Search">
            <Icon name="search" size={18} color="var(--ink-soft)" />
          </button>
        </>
      )}
    </div>

    {searchOpen && search.trim() && (
      <div
        id="eatery-search-results"
        role="listbox"
        className="material search-results"
        aria-label="Restaurant search results"
      >
        {searchResults.length ? searchResults.map((spot) => {
          const meta = CATEGORY_META[spot.category] ?? CATEGORY_META.cafe;
          const area = spot.discoveredIn && !spot.discoveredIn.startsWith("text:")
            ? spot.discoveredIn
            : meta.label;
          return (
            <button
              key={spot.id}
              type="button"
              role="option"
              aria-selected="false"
              className="search-result pressable-sm"
              onClick={() => onSelectResult?.(spot)}
              onMouseEnter={() => onPreviewResult?.(spot.id)}
            >
              <span className="search-result-dot" style={{ background: meta.color }} />
              <span style={{ minWidth: 0, flex: 1 }}>
                <span className="search-result-name">{spot.name}</span>
                <span className="search-result-meta">
                  {area} · {meta.label}{spot._dist != null ? ` · ${spot._dist < 1 ? `${Math.round(spot._dist * 1000)}m` : `${spot._dist.toFixed(1)}km`}` : ""}
                </span>
              </span>
              {spot.rating != null && <span className="search-result-rating">★ {spot.rating.toFixed(1)}</span>}
            </button>
          );
        }) : (
          <div className="search-result-empty">No matching spots</div>
        )}
        {added ? (
          <div className="add-place-done">
            <Icon name="check" size={14} width={2.4} color="var(--forest)" />
            Thanks! {added} is added. It shows on the map once we verify it.
          </div>
        ) : (
          <AddPlace
            query={search}
            onAdded={(p) => setAdded(p.name)}
            submitLabel="Add place"
            note="We check new places before they appear on the map."
          />
        )}
      </div>
    )}
    </div>
  );
}

const iconBtn = {
  width: 38,
  height: 38,
  minWidth: 38,
  borderRadius: "50%",
  border: "none",
  background: "rgba(38,48,92,0.05)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
