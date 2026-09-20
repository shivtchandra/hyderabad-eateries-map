"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icons.jsx";
import { searchAreasAndSpots, geocodeAddress } from "../../lib/routeSearch.js";

// Labeled text input + autocomplete dropdown, matching an area centroid, an
// exact spot, or (debounced, once local matches run out) a free-text address
// via Nominatim, same "type anything" feel as Google Maps' from/to boxes.
// Used twice by RoutePanel, once for From and once for To.
export default function RouteSearchInput({ label, placeholder, value, onChange, onPick, eateries, areaCentroids, trailingReserve = 0 }) {
  const [open, setOpen] = useState(false);
  const [addressResults, setAddressResults] = useState([]);
  const [geocoding, setGeocoding] = useState(false);
  const inputRef = useRef(null);
  const localResults = searchAreasAndSpots(value, eateries, areaCentroids);
  const results = [...localResults, ...addressResults].slice(0, 8);

  // Debounced address lookup, only once local matches are thin, so a known
  // area/spot never waits on a network round trip.
  useEffect(() => {
    const q = value.trim();
    if (q.length < 3 || localResults.length >= 4) { setAddressResults([]); setGeocoding(false); return; }
    setGeocoding(true);
    const t = setTimeout(async () => {
      const rows = await geocodeAddress(q);
      setAddressResults(rows);
      setGeocoding(false);
    }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div style={{ position: "relative" }}>
      <div
        className="material"
        style={{
          display: "flex", alignItems: "center", gap: 9,
          height: 46, padding: `0 ${13 + trailingReserve}px 0 13px`, borderRadius: "var(--r-pill)",
        }}
      >
        <Icon name="search" size={16} color="var(--muted)" />
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.04em", flexShrink: 0 }}>
          {label}
        </span>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          placeholder={placeholder}
          style={{
            flex: 1, minWidth: 0, border: "none", outline: "none",
            background: "transparent", fontSize: 14, fontWeight: 600, color: "var(--ink)",
          }}
        />
        {value && (
          <button
            type="button"
            onClick={() => { onChange(""); inputRef.current?.focus(); }}
            aria-label={`Clear ${label}`}
            style={{ border: "none", background: "transparent", cursor: "pointer", display: "flex", padding: 2 }}
          >
            <Icon name="close" size={14} width={2.2} color="var(--muted)" />
          </button>
        )}
      </div>

      {open && value.trim() && (
        <div className="material search-results" role="listbox" aria-label={`${label} suggestions`}>
          {results.length ? (
            ["area", "spot", "address"].map((kind) => {
              const rows = results.filter((r) => r.kind === kind);
              if (!rows.length) return null;
              const groupLabel = kind === "area" ? "Areas" : kind === "spot" ? "Spots" : "Addresses";
              return (
                <div key={kind}>
                  <div
                    style={{
                      padding: "7px 14px 4px", fontSize: 10.5, fontWeight: 800,
                      textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)",
                    }}
                  >
                    {groupLabel}
                  </div>
                  {rows.map((r, i) => (
                    <button
                      key={`${r.kind}-${r.label}-${i}`}
                      type="button"
                      role="option"
                      aria-selected="false"
                      className="search-result pressable-sm"
                      // Tapping this blurs the input first on a real touch
                      // device, which starts the onBlur close-timer before
                      // the click finishes, so the dropdown can unmount out
                      // from under the tap. preventDefault on mousedown stops
                      // that blur from firing at all, so the click always lands.
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => { onPick(r); setOpen(false); }}
                    >
                      <Icon name={r.kind === "area" ? "locate" : r.kind === "address" ? "map" : "utensils"} size={14} width={2} color="var(--muted)" />
                      <span style={{ minWidth: 0, flex: 1 }}>
                        <span className="search-result-name">{r.label}</span>
                        <span className="search-result-meta">{r.sub}</span>
                      </span>
                    </button>
                  ))}
                </div>
              );
            })
          ) : (
            <div className="search-result-empty">{geocoding ? "Searching addresses…" : "No match, try an area, spot, or address"}</div>
          )}
        </div>
      )}
    </div>
  );
}
