"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Icon, CategoryIcon } from "./Icons.jsx";
import { TIERS, tierFor, haversineKm } from "../../lib/eateryUtils.js";

const CATEGORY_META = {
  restaurant: { label: "Restaurant", color: "var(--restaurant)" },
  "restro-bar": { label: "Restro Bar", color: "var(--restro-bar)" },
  cafe: { label: "Cafe", color: "var(--cafe)" },
  bakery: { label: "Bakery", color: "var(--bakery)" },
  "ice-cream": { label: "Ice Cream", color: "var(--ice-cream)" },
  local: { label: "Local Eats", color: "var(--local)" },
};

export default function QuickClaimSheet({
  isOpen,
  onClose,
  eateries = [],
  userLoc = null,
  passport = null,
  onClaimSpot,
  onViewOnMap,
}) {
  const [query, setQuery] = useState("");
  const [claimingId, setClaimingId] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setClaimingId(null);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Pre-calculate distance if userLoc is provided
  const enrichedEateries = useMemo(() => {
    if (!userLoc) return eateries;
    return eateries.map((e) => {
      const dist = haversineKm(userLoc, { lat: Number(e.lat), lng: Number(e.lng) });
      return { ...e, _distKm: dist };
    });
  }, [eateries, userLoc]);

  // Nearby spots (within 3km if location on)
  const nearbySpots = useMemo(() => {
    if (!userLoc) return [];
    return enrichedEateries
      .filter((e) => e._distKm != null && e._distKm <= 5)
      .sort((a, b) => (a._distKm ?? Infinity) - (b._distKm ?? Infinity))
      .slice(0, 6);
  }, [enrichedEateries, userLoc]);

  // High point gems when query is empty and no nearby spots
  const highPointGems = useMemo(() => {
    return eateries
      .filter((e) => (e.ratingCount || 0) < 200 && (e.rating || 0) >= 4.2)
      .slice(0, 6);
  }, [eateries]);

  // Search results
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const tokens = q.split(/\s+/).filter(Boolean);

    const matches = [];
    for (const e of enrichedEateries) {
      const name = (e.name || e.n || "").toLowerCase();
      const area = (e.discoveredIn || e.a || "").toLowerCase();
      const cat = (e.category || e.c || "").toLowerCase();

      const matchesAll = tokens.every(
        (t) => name.includes(t) || area.includes(t) || cat.includes(t)
      );

      if (matchesAll) {
        matches.push(e);
        if (matches.length >= 25) break;
      }
    }
    return matches;
  }, [enrichedEateries, query]);

  if (!isOpen) return null;

  const displayList = query.trim() ? searchResults : (nearbySpots.length > 0 ? nearbySpots : highPointGems);
  const listTitle = query.trim()
    ? `Matches (${searchResults.length})`
    : nearbySpots.length > 0
    ? "Spots near you right now (GPS)"
    : "Top +25 pts Hidden Gems";

  const handleClaim = async (spot) => {
    setClaimingId(spot.id);
    try {
      await onClaimSpot?.(spot);
    } finally {
      setClaimingId(null);
      onClose();
    }
  };

  return (
    <div
      className="quick-claim-backdrop"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1550,
        background: "rgba(15, 23, 42, 0.55)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        animation: "fade-in 0.18s ease",
      }}
    >
      <div
        className="quick-claim-sheet"
        role="dialog"
        aria-label="Claim a spot"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 520,
          margin: "0 auto",
          background: "var(--cream)",
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          padding: "16px 16px calc(24px + env(safe-area-inset-bottom, 0px))",
          boxShadow: "0 -8px 36px rgba(15, 23, 42, 0.28)",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          animation: "sheet-up 0.26s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {/* Grab bar */}
        <div
          style={{
            width: 36,
            height: 4,
            borderRadius: 2,
            background: "rgba(20, 20, 20,0.18)",
            margin: "0 auto 12px",
          }}
        />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 10,
                  background: "var(--violet-wash)",
                  color: "var(--violet-deep)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="trophy" size={17} width={2} />
              </div>
              <h2
                className="groovy"
                style={{
                  fontSize: 21,
                  lineHeight: 1.15,
                  margin: 0,
                  color: "var(--ink)",
                }}
              >
                Claim a Spot
              </h2>
            </div>
            <p
              style={{
                fontSize: 12.5,
                color: "var(--muted)",
                margin: "4px 0 0",
                fontWeight: 500,
              }}
            >
              Pick a place you ate at. Scores Race points + stamps your passport.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="pressable-sm"
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              border: "none",
              background: "rgba(20, 20, 20,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
            aria-label="Close"
          >
            <Icon name="close" size={16} width={2.2} color="var(--ink-soft)" />
          </button>
        </div>

        {/* Search input */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "0 12px",
            height: 44,
            background: "var(--cream-hi)",
            border: "1.5px solid var(--line)",
            borderRadius: "var(--r-pill)",
            marginBottom: 12,
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <Icon name="search" size={18} color="var(--muted)" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type place name or area (e.g. Niloufer, Concu)..."
            style={{
              flex: 1,
              minWidth: 0,
              border: "none",
              outline: "none",
              background: "transparent",
              fontFamily: "var(--font-ui), sans-serif",
              fontSize: 14.5,
              fontWeight: 500,
              color: "var(--ink)",
            }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              style={{
                border: "none",
                background: "transparent",
                cursor: "pointer",
                padding: 4,
                display: "flex",
              }}
            >
              <Icon name="close" size={14} color="var(--muted)" />
            </button>
          )}
        </div>

        {/* List Title */}
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "var(--muted)",
            padding: "4px 4px 8px",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>{listTitle}</span>
          {!query && nearbySpots.length > 0 && (
            <span style={{ color: "var(--forest)", fontWeight: 700 }}>● GPS On</span>
          )}
        </div>

        {/* List of spots */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 8,
            paddingRight: 2,
            maxHeight: "48vh",
          }}
        >
          {displayList.length === 0 ? (
            <div
              style={{
                padding: "24px 16px",
                textAlign: "center",
                color: "var(--muted)",
                fontSize: 13.5,
                fontWeight: 500,
              }}
            >
              No spots found matching &quot;{query}&quot;. Try another name or search on the map.
            </div>
          ) : (
            displayList.map((spot) => {
              const name = spot.name || spot.n;
              const area = spot.discoveredIn || spot.a || "Hyderabad";
              const catKey = spot.category || spot.c || "cafe";
              const cat = CATEGORY_META[catKey] ?? CATEGORY_META.cafe;
              const rating = spot.rating ?? spot.r;
              const ratingCount = spot.ratingCount ?? spot.rc ?? 0;
              const tierKey = spot.tier ?? spot.t ?? tierFor(ratingCount);
              const tier = TIERS[tierKey] || TIERS["hidden-gem"];
              const distKm = spot._distKm;
              const isClaimed = !!passport?.visited?.[spot.id];
              const isClaiming = claimingId === spot.id;

              return (
                <div
                  key={spot.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    background: "var(--cream-hi)",
                    borderRadius: 16,
                    border: "1px solid var(--line)",
                    boxShadow: "var(--e1)",
                  }}
                >
                  {/* Category icon circle */}
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: `${cat.color}18`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <CategoryIcon category={catKey} size={18} color={cat.color} />
                  </div>

                  {/* Spot info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 14,
                        color: "var(--ink)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {name}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginTop: 2,
                        fontSize: 11.5,
                        color: "var(--muted)",
                        fontWeight: 500,
                      }}
                    >
                      <span>{area}</span>
                      {rating != null && (
                        <span>★ {Number(rating).toFixed(1)}</span>
                      )}
                      {distKm != null && (
                        <span style={{ color: "var(--ink-soft)", fontWeight: 600 }}>
                          {distKm < 1 ? `${Math.round(distKm * 1000)}m away` : `${distKm.toFixed(1)}km away`}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tier Points Pill */}
                  <span
                    style={{
                      background: "var(--violet-wash)",
                      color: "var(--violet-deep)",
                      borderRadius: "var(--r-pill)",
                      padding: "3px 8px",
                      fontSize: 11,
                      fontWeight: 800,
                      flexShrink: 0,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    +{tier.points} pts
                  </span>

                  {/* Claim button */}
                  <button
                    type="button"
                    onClick={() => handleClaim(spot)}
                    disabled={isClaiming}
                    className="pressable-sm"
                    style={{
                      padding: "7px 12px",
                      borderRadius: "var(--r-pill)",
                      border: "none",
                      background: isClaimed ? "var(--forest-wash)" : "var(--violet)",
                      color: isClaimed ? "var(--forest)" : "#fff",
                      fontWeight: 700,
                      fontSize: 12.5,
                      cursor: "pointer",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      opacity: isClaiming ? 0.7 : 1,
                    }}
                  >
                    {isClaiming ? (
                      "Claiming…"
                    ) : isClaimed ? (
                      <>
                        <Icon name="check" size={12} width={2.4} color="var(--forest)" /> Ate here
                      </>
                    ) : (
                      "I ate here"
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer map shortcut */}
        <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--line)", textAlign: "center" }}>
          <button
            type="button"
            onClick={() => {
              onClose();
              onViewOnMap?.();
            }}
            style={{
              background: "none",
              border: "none",
              color: "var(--violet-deep)",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <Icon name="map" size={15} width={2} color="var(--violet-deep)" />
            Can&apos;t find it? Open full Map to search &amp; claim →
          </button>
        </div>
      </div>
    </div>
  );
}
