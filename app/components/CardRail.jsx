"use client";

import { useEffect, useRef, useState } from "react";
import { TIERS, tierFor } from "../../lib/eateryUtils.js";
import { photoUrl } from "../../lib/spotlight.js";
import { Icon, CategoryIcon } from "./Icons.jsx";
import { hasVoted } from "../../lib/voting.js";
import { isNewSpot } from "../../lib/eateryUtils.js";
import { isTrendingSpot } from "../../lib/trending.js";

const CAT_META = {
  restaurant: { label: "Restaurant", color: "#9d2f4f" },
  "restro-bar": { label: "Restro Bar", color: "#e2622a" },
  cafe: { label: "Cafe", color: "#2f4fc4" },
  bakery: { label: "Bakery", color: "#dfa43a" },
  "ice-cream": { label: "Ice Cream", color: "#e0899e" },
  local: { label: "Local Eats", color: "#2e8b6b" },
};

const PRICE_ESTIMATE = {
  1: "₹200 for 2",
  2: "₹500 for 2",
  3: "₹1k for 2",
  4: "₹1.8k+ for 2",
};

// A swipeable deck of the spotlighted spots. This is the findability fix:
// browsing a short ranked deck beats hunting a field of 1600 identical pins.
// Scroll ↔ map selection stay in sync in both directions.
export default function CardRail({
  spots, activeId, onActivate, onOpen, passport, featuredIds, voteMap = {}, onVote, distMap = {}, picksMap = {}, starOfWeek = null,
  open: openProp, onOpenChange,
}) {
  const railRef = useRef(null);
  const suppress = useRef(false);
  const [openState, setOpenState] = useState(true);
  const open = openProp ?? openState;
  const setOpen = onOpenChange ?? setOpenState;

  // Map → rail: bring the selected card into view
  useEffect(() => {
    if (!activeId || !railRef.current) return;
    const el = railRef.current.querySelector(`[data-id="${activeId}"]`);
    if (!el) return;
    suppress.current = true;
    el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    const t = setTimeout(() => (suppress.current = false), 420);
    return () => clearTimeout(t);
  }, [activeId]);

  // Rail → map: whichever card is centred becomes the selection.
  const settleTimer = useRef(null);
  const onScroll = () => {
    if (suppress.current || !railRef.current) return;
    clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      const rail = railRef.current;
      if (!rail) return;
      const mid = rail.scrollLeft + rail.clientWidth / 2;
      let best = null, bestD = Infinity;
      for (const el of rail.children) {
        const c = el.offsetLeft + el.offsetWidth / 2;
        const d = Math.abs(c - mid);
        if (d < bestD) { bestD = d; best = el; }
      }
      const id = best?.dataset?.id;
      if (id && id !== activeId) onActivate(id, { fromRail: true });
    }, 90);
  };

  useEffect(() => () => clearTimeout(settleTimer.current), []);

  if (!spots.length) return null;

  // Collapsed: sleek frosted pill, tap to bring the rail back.
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="pressable-sm"
        style={{
          position: "absolute", left: 14, bottom: 14, zIndex: 900,
          display: "flex", alignItems: "center", gap: 6,
          height: 38, padding: "0 14px 0 12px",
          border: "1px solid rgba(255,255,255,0.7)",
          borderRadius: "var(--r-pill)",
          background: "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          boxShadow: "0 8px 24px rgba(15,23,42,0.14)",
          fontSize: 13, fontWeight: 700, color: "#0f172a", cursor: "pointer",
          outline: "none", WebkitTapHighlightColor: "transparent",
        }}
      >
        <Icon name="chevronDown" size={14} width={2.3} color="#64748b" style={{ transform: "rotate(180deg)" }} />
        {spots.length} spot{spots.length === 1 ? "" : "s"}
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(false)}
        aria-label="Hide cards"
        className="pressable-sm"
        style={{
          position: "absolute", left: 14, bottom: 218, zIndex: 901,
          width: 32, height: 32,
          border: "1px solid rgba(255,255,255,0.7)",
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 14px rgba(15,23,42,0.12)", cursor: "pointer",
          outline: "none", WebkitTapHighlightColor: "transparent",
        }}
      >
        <Icon name="chevronDown" size={14} width={2.3} color="#64748b" />
      </button>

      <div
        ref={railRef}
        onScroll={onScroll}
        className="chip-rail"
        style={{
          position: "absolute", left: 0, right: 0, bottom: 0,
          padding: "0 14px 14px",
          gap: 12,
          scrollSnapType: "x mandatory",
          zIndex: 900,
        }}
      >
        {spots.map((e) => {
          const active = e.id === activeId;
          const cat = CAT_META[e.c ?? e.category] ?? CAT_META.cafe;
          const collected = !!passport?.visited?.[e.id];
          const voteCount = voteMap[e.id]?.total || 0;
          const voted = hasVoted(e.id);
          const distKm = distMap[e.id] ?? null;
          const name = e.n ?? e.name;
          const area = e.a ?? e.discoveredIn;
          const rating = e.r ?? e.rating;
          const ratingCount = e.rc ?? e.ratingCount;
          const tierKey = e.t ?? e.tier ?? tierFor(ratingCount);
          const tier = TIERS[tierKey] || TIERS["hidden-gem"];
          const priceLevel = e.p ?? e.priceLevel;

          const formattedReviews = ratingCount
            ? ratingCount >= 1000
              ? `${(ratingCount / 1000).toFixed(ratingCount >= 10000 ? 0 : 1).replace(/\.0$/, "")}k+`
              : `${ratingCount}`
            : voteCount > 0
            ? `${voteCount} votes`
            : "Popular";

          const costLabel = e.costForTwo
            ? `₹${e.costForTwo} for 2`
            : PRICE_ESTIMATE[priceLevel] ?? "₹₹";

          return (
            <div
              key={e.id}
              data-id={e.id}
              role="button"
              tabIndex={0}
              onClick={() => (active ? onOpen?.(e.id) : onActivate(e.id))}
              onKeyDown={(ev) => ev.key === "Enter" && (active ? onOpen?.(e.id) : onActivate(e.id))}
              style={{
                position: "relative",
                width: 232,
                height: 206,
                scrollSnapAlign: "center",
                // Frosted Glass Aesthetic
                background: "rgba(255, 255, 255, 0.76)",
                backdropFilter: "blur(20px) saturate(180%)",
                WebkitBackdropFilter: "blur(20px) saturate(180%)",
                border: active ? "1.5px solid rgba(255, 255, 255, 0.95)" : "1px solid rgba(255, 255, 255, 0.55)",
                borderRadius: 22,
                overflow: "hidden",
                cursor: "pointer",
                textAlign: "left",
                // Pure neutral elevation: NO color outline or colored border ring
                boxShadow: active
                  ? "0 18px 42px -6px rgba(15, 23, 42, 0.22), 0 4px 12px rgba(0, 0, 0, 0.04)"
                  : "0 4px 16px rgba(15, 23, 42, 0.08)",
                opacity: active ? 1 : 0.9,
                transform: active ? "translateY(-6px)" : "scale(0.96)",
                transformOrigin: "bottom center",
                transition: "transform .32s cubic-bezier(.2,0,0,1), box-shadow .25s ease, opacity .25s ease",
                display: "flex",
                flexDirection: "column",
                outline: "none",
                WebkitTapHighlightColor: "transparent",
                userSelect: "none",
                WebkitTouchCallout: "none",
              }}
            >
              {/* Top Half: Photo Frame with Badges */}
              <div
                style={{
                  height: 104,
                  position: "relative",
                  background: cat.color,
                  backgroundColor: "#1e243d",
                  overflow: "hidden",
                }}
              >
                <img
                  src={photoUrl(e.id)}
                  alt=""
                  loading="lazy"
                  onError={(ev) => { ev.currentTarget.style.display = "none"; }}
                  style={{
                    position: "absolute", inset: 0,
                    width: "100%", height: "100%", objectFit: "cover", display: "block",
                    filter: active ? "none" : "saturate(0.95)",
                  }}
                />

                {/* Scrim Overlay */}
                <div
                  style={{
                    position: "absolute", inset: 0,
                    background: "linear-gradient(to bottom, rgba(15,23,42,0.45) 0%, rgba(15,23,42,0) 45%, rgba(15,23,42,0.3) 100%)",
                  }}
                />

                {/* Top Badges (Story / New / Trending) */}
                <div style={{ position: "absolute", top: 8, left: 8, display: "flex", gap: 5, zIndex: 2 }}>
                  {featuredIds?.has(e.id) && (
                    <span style={{
                      background: "rgba(226, 98, 42, 0.95)", color: "#fff", fontSize: 9.5, fontWeight: 800,
                      letterSpacing: "0.04em", padding: "2.5px 7px", borderRadius: 999,
                      boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
                    }}>★ Story</span>
                  )}
                  {isNewSpot(e.ca ?? e.createdAt) && !featuredIds?.has(e.id) && (
                    <span style={{ background: "#e2622a", color: "#fff", fontSize: 9, fontWeight: 800, padding: "2.5px 6px", borderRadius: 999 }}>NEW</span>
                  )}
                  {isTrendingSpot(name) && !featuredIds?.has(e.id) && (
                    <span style={{ background: "#1e243d", color: "#fff", fontSize: 9, fontWeight: 800, padding: "2.5px 6px", borderRadius: 999 }}>TRENDING</span>
                  )}
                </div>

                {/* Rating Badge (Top Right) */}
                <span
                  style={{
                    position: "absolute", top: 8, right: 8, zIndex: 2,
                    background: "rgba(255, 255, 255, 0.92)",
                    backdropFilter: "blur(8px)",
                    WebkitBackdropFilter: "blur(8px)",
                    borderRadius: 999,
                    padding: "2.5px 8px", fontSize: 11, fontWeight: 800,
                    color: "#0f172a",
                    display: "flex", alignItems: "center", gap: 3,
                    boxShadow: "0 2px 6px rgba(0,0,0,0.16)",
                  }}
                >
                  <span style={{ color: "#f59e0b", fontSize: 11 }}>★</span> {rating != null ? Number(rating).toFixed(1) : "—"}
                </span>

                {/* Distance Badge (Bottom Right on Photo) */}
                {distKm != null && (
                  <span
                    style={{
                      position: "absolute", bottom: 6, right: 8, zIndex: 2,
                      background: "rgba(15, 23, 42, 0.65)",
                      backdropFilter: "blur(6px)",
                      WebkitBackdropFilter: "blur(6px)",
                      color: "#ffffff",
                      borderRadius: 999,
                      padding: "2px 7px", fontSize: 10, fontWeight: 600,
                    }}
                  >
                    {distKm < 1 ? `${Math.round(distKm * 1000)}m` : `${distKm.toFixed(1)}km`}
                  </span>
                )}
              </div>

              {/* Bottom Half: Frosted Card Body with Overlapping Emblem */}
              <div
                style={{
                  flex: 1,
                  padding: "9px 12px 10px",
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  background: "rgba(255, 255, 255, 0.65)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                }}
              >
                {/* Overlapping Category Emblem */}
                <div
                  style={{
                    position: "absolute",
                    top: -19,
                    left: 12,
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    background: "#ffffff",
                    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.14)",
                    padding: 2.5,
                    boxSizing: "border-box",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 3,
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, ${cat.color}15 0%, ${cat.color}25 100%)`,
                      border: `1px solid ${cat.color}35`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CategoryIcon category={e.c ?? e.category} size={18} width={2} color={cat.color} />
                  </div>

                  {/* Live Status Dot */}
                  <span
                    style={{
                      position: "absolute",
                      bottom: 0,
                      right: 0,
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: "#10b981",
                      border: "2px solid #ffffff",
                      boxShadow: "0 0 4px rgba(16,185,129,0.5)",
                    }}
                  />
                </div>

                {/* Top Row: Points Badge & Collected status or Vote Button */}
                <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 5, minHeight: 22 }}>
                  <span
                    style={{
                      background: "var(--violet-wash)",
                      color: "var(--violet-deep)",
                      borderRadius: 999,
                      padding: "2px 7px",
                      fontSize: 10,
                      fontWeight: 800,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 2.5,
                      letterSpacing: "-0.01em",
                    }}
                    title={`${tier.label} · ${tier.points} pts in The Race`}
                  >
                    +{tier.points} pts
                  </span>
                  {collected ? (
                    <span
                      style={{
                        background: "rgba(240, 253, 244, 0.9)",
                        color: "#15803d",
                        border: "1px solid #bbf7d0",
                        borderRadius: 999,
                        padding: "2px 7px",
                        fontSize: 10,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        gap: 3,
                      }}
                    >
                      <Icon name="check" size={10} width={2.5} color="#15803d" /> Claimed
                    </span>
                  ) : (
                    <button
                      onClick={(ev) => { ev.stopPropagation(); onVote?.(e.id); }}
                      style={{
                        background: voted ? "#1e243d" : "rgba(255, 255, 255, 0.8)",
                        border: `1px solid ${voted ? "#1e243d" : "rgba(0,0,0,0.08)"}`,
                        borderRadius: 999,
                        padding: "2.5px 8px",
                        display: "flex",
                        alignItems: "center",
                        gap: 3.5,
                        fontSize: 10.5,
                        fontWeight: 700,
                        color: voted ? "#fff" : "#475569",
                        cursor: "pointer",
                        outline: "none",
                        WebkitTapHighlightColor: "transparent",
                      }}
                    >
                      <Icon name="heart" size={10} width={voted ? 0 : 2} color={voted ? "#fff" : "#e2622a"} />
                      {voteCount > 0 ? voteCount : "Vote"}
                    </button>
                  )}
                </div>

                {/* Restaurant Name & Subtitle */}
                <div style={{ marginTop: 2 }}>
                  <div
                    style={{
                      fontSize: 14.5,
                      fontWeight: 700,
                      fontFamily: "var(--font-outfit), sans-serif",
                      letterSpacing: "-0.015em",
                      lineHeight: 1.22,
                      color: "#0f172a",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {name}
                  </div>
                  <div
                    style={{
                      marginTop: 2,
                      fontSize: 11.5,
                      color: "#64748b",
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {cat.label} · {area || "Hyderabad"}{tier ? ` · ${tier.label}` : ""}
                  </div>
                </div>

                {/* Micro Stats Strip at Foot */}
                <div
                  style={{
                    marginTop: 6,
                    paddingTop: 5,
                    borderTop: "1px solid rgba(0,0,0,0.06)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: 11,
                    color: "#64748b",
                  }}
                >
                  <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {formattedReviews} · <strong style={{ color: "#0f172a", fontWeight: 700 }}>{costLabel}</strong>
                  </span>
                  {active ? (
                    <span style={{ color: "#0f172a", fontWeight: 700, fontSize: 10.5, whiteSpace: "nowrap" }}>
                      Open card →
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}

        {/* End of the Rail Card (Frosted Glass) */}
        <div
          style={{
            width: 176,
            scrollSnapAlign: "center",
            borderRadius: 22,
            background: "rgba(255, 255, 255, 0.6)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1.5px dashed rgba(100, 116, 139, 0.4)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "18px 16px",
            textAlign: "center",
            alignSelf: "stretch",
          }}
        >
          <Icon name="map" size={20} width={1.8} color="#64748b" />
          <div style={{ fontWeight: 700, fontSize: 13, color: "#334155" }}>
            That&apos;s this area
          </div>
          <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.35 }}>
            Pan the map to explore another pocket
          </div>
        </div>
      </div>
    </>
  );
}
