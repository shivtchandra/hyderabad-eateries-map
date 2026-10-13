"use client";

import { useEffect, useRef, useState } from "react";
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
  onFilters = null, filtersOpen = false, filterCount = 0, onAsk = null,
}) {
  const [added, setAdded] = useState(null); // name of a place just added from search
  useEffect(() => { setAdded(null); }, [search]);
  const inputRef = useRef(null);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  return (
    <div className="topbar" style={{ flexShrink: 0, padding: "12px 16px 8px", position: "relative", zIndex: 1400 }}>
    {/* Mockup row: logo tile, search pill, Filters button (map tab only). */}
    <div className="topbar-row">
      {!searchOpen && (
        <span className="topbar-logo" role="img" aria-label="Hyderabad Eats">E</span>
      )}
      <div className="topbar-pill">
        {searchOpen ? (
          <>
            <Icon name="search" size={19} color="var(--muted)" />
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") { setSearch(""); setSearchOpen(false); }
                if (e.key !== "Enter") return;
                // A question goes to Ask Eats; a name goes to the top match.
                if (onAsk && (looksLikeAsk(search) || !searchResults.length)) onAsk(search);
                else if (searchResults[0]) onSelectResult?.(searchResults[0]);
              }}
              role="combobox"
              aria-expanded={search.trim().length > 0}
              aria-controls="eatery-search-results"
              aria-autocomplete="list"
              placeholder={onAsk ? "Search a place, or ask: biryani near me" : "Search a dish, place or area"}
              className="topbar-input"
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
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="topbar-search"
            aria-label="Search dishes, places or areas"
          >
            <Icon name="search" size={19} color="var(--ink-soft)" />
            <span>{onAsk ? "Ask Eats or search" : "Biryani, cafes, an area"}</span>
          </button>
        )}
      </div>
      {!searchOpen && onFilters && (
        <button
          type="button"
          onClick={onFilters}
          aria-expanded={filtersOpen}
          aria-label={filterCount > 0 ? `Filters, ${filterCount} on` : "Filters"}
          className={`topbar-filter pressable-sm${filtersOpen || filterCount > 0 ? " is-lit" : ""}`}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2" /><circle cx="10" cy="17" r="2" /></svg>
          {filterCount > 0 && <span className="topbar-filter-badge">{filterCount}</span>}
        </button>
      )}
    </div>

    {searchOpen && onAsk && !search.trim() && (
      <div className="material search-results">
        <button type="button" className="ask-entry" onClick={() => onAsk("")}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/stickers/biryani.webp" alt="" width={40} height={40} />
          <span><b>Not sure what to eat?</b><span>Ask Eats. Locals&apos; votes and our picks first.</span></span>
        </button>
      </div>
    )}

    {searchOpen && search.trim() && (
      <div
        id="eatery-search-results"
        role="listbox"
        className="material search-results"
        aria-label="Restaurant search results"
      >
        {onAsk && (
          <button type="button" className="ask-entry ask-entry--q" onClick={() => onAsk(search)}>
            <span className="ask-entry-badge" aria-hidden="true">Ask</span>
            <span><b>Ask Eats: &ldquo;{search.trim()}&rdquo;</b><span>Get picks near you</span></span>
          </button>
        )}
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
  background: "rgba(20, 20, 20,0.05)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

// "biryani near me", "best chai?", "something cheap": a question, not a name.
function looksLikeAsk(q = "") {
  return /\?|\b(near|nearby|around|best|where|want|good|cheap|craving|suggest|recommend|open now|hungry|eat)\b/i.test(q);
}
