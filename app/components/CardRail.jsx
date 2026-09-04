"use client";

import { useEffect, useRef } from "react";
import { TIERS } from "../../lib/eateryUtils.js";
import { photoUrl } from "../../lib/spotlight.js";
import { Icon, CategoryIcon, TierIcon } from "./Icons.jsx";
import { hasVoted } from "../../lib/voting.js";
import { isNewSpot } from "../../lib/eateryUtils.js";
import { isTrendingSpot } from "../../lib/trending.js";

const CAT_COLOR = {
  restaurant: "var(--restaurant)",
  "restro-bar": "var(--restro-bar)",
  cafe: "var(--cafe)",
  bakery: "var(--bakery)",
  "ice-cream": "var(--ice-cream)",
  local: "var(--local)",
};

// A swipeable deck of the spotlighted spots. This is the findability fix:
// browsing a short ranked deck beats hunting a field of 1600 identical pins.
// Scroll ↔ map selection stay in sync in both directions.
export default function CardRail({ spots, activeId, onActivate, onOpen, passport, featuredIds, voteMap = {}, onVote, distMap = {}, picksMap = {}, starOfWeek = null }) {
  const railRef = useRef(null);
  const suppress = useRef(false);

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
  // Debounced to scroll-settle: firing on every scroll event caused a selection
  // change (and a map repaint) per frame, which is what made scrolling janky.
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

  return (
    <>

      {/* Star of the week, hidden for now
      {starOfWeek?.name && (
        <div style={{
          position: "absolute", left: 14, right: 14, bottom: 210,
          zIndex: 901, background: "var(--cream-hi)", border: "1.5px solid var(--line)",
          borderRadius: "var(--r-pill)", padding: "7px 12px", fontSize: 11.5, fontWeight: 600,
          color: "var(--ink-soft)", boxShadow: "var(--e1)", display: "flex", alignItems: "center", gap: 6,
        }}>
          <Icon name="sparkle" size={13} width={2} color="var(--pop)" />
          Star of the week: <span style={{ color: "var(--ink)", fontWeight: 700 }}>{starOfWeek.name}</span>
        </div>
      )}
      */}

    <div
      ref={railRef}
      onScroll={onScroll}
      className="chip-rail"
      style={{
        position: "absolute", left: 0, right: 0, bottom: 0,
        padding: "0 14px 14px",
        gap: 10,
        scrollSnapType: "x mandatory",
        zIndex: 900,
      }}
    >
      {spots.map((e) => {
        const active = e.id === activeId;
        const color = CAT_COLOR[e.category] ?? "var(--muted)";
        const collected = !!passport.visited[e.id];
        const voteCount = voteMap[e.id]?.total || 0;
        const voted = hasVoted(e.id);
        const distKm = distMap[e.id] ?? null;
        const pick = picksMap[e.id];
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
              width: 210,
              height: 190,
              scrollSnapAlign: "center",
              // Category-tinted ground shows through if a photo fails to load,
              // so a broken image reads as a coloured card, never a blank hole.
              background: `linear-gradient(150deg, ${color} 0%, var(--ink) 130%)`,
              border: "none",
              borderRadius: "var(--r-lg)",
              padding: 0,
              overflow: "hidden",
              cursor: "pointer",
              textAlign: "left",
              // Selection is elevation and emphasis, no coloured ring. An
              // accent outline around an already-colourful photo reads as glow,
              // not focus; letting the unselected cards recede is cleaner.
              boxShadow: active ? "var(--e3)" : "var(--e1)",
              opacity: active ? 1 : 0.86,
              transform: active ? "translateY(-6px)" : "scale(0.955)",
              transformOrigin: "bottom center",
              transition:
                "transform .36s cubic-bezier(.2,0,0,1), box-shadow .3s ease, opacity .3s ease",
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
                filter: active ? "none" : "saturate(0.92)",
              }}
            />
            {featuredIds?.has(e.id) && (
              <span style={{
                position: "absolute", top: 8, right: 8, zIndex: 2,
                background: "var(--pop)", color: "#fff", fontSize: 10, fontWeight: 800,
                letterSpacing: "0.03em", padding: "3px 7px", borderRadius: 20,
                boxShadow: "0 2px 6px rgba(38,48,92,0.28)",
              }}>★ Story</span>
            )}
            {/* Full-height scrim: dark and dense at the foot for text, clearing
                to nothing by the midline so the photo still breathes up top. */}
            <div
              style={{
                position: "absolute", inset: 0,
                background:
                  "linear-gradient(to top, rgba(24,28,54,0.9) 0%, rgba(24,28,54,0.55) 26%, rgba(24,28,54,0) 58%)",
              }}
            />

            {/* Top row, category / collected on the left, rating on the right */}
            <div style={{ position: "absolute", top: 9, left: 9, right: 9, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
              {collected ? (
                <span
                  style={{
                    background: "var(--pop)", color: "#fff",
                    borderRadius: "var(--r-pill)", padding: "3px 9px 3px 7px",
                    fontSize: 10, fontWeight: 700, letterSpacing: "0.01em",
                    display: "flex", alignItems: "center", gap: 4,
                    boxShadow: "0 2px 6px rgba(184,72,26,0.35)",
                  }}
                >
                  <Icon name="check" size={11} width={3} /> Collected
                </span>
              ) : (
                <span
                  style={{
                    background: "rgba(24,28,54,0.42)",
                    backdropFilter: "blur(6px)",
                    color: "#fff",
                    borderRadius: "var(--r-pill)", padding: "4px 9px 4px 7px",
                    fontSize: 10, fontWeight: 700, letterSpacing: "0.02em",
                    textTransform: "capitalize",
                    display: "flex", alignItems: "center", gap: 4,
                  }}
                >
                  <span style={{ display: "flex", width: 13, height: 13, borderRadius: "50%", background: color, alignItems: "center", justifyContent: "center" }}>
                    <CategoryIcon category={e.category} size={9} width={2.4} color="#fff" />
                  </span>
                  {(e.category ?? "").replace("-", " ")}
                </span>
              )}
              <span
                style={{
                  background: "rgba(253,248,238,0.94)",
                  backdropFilter: "blur(8px)",
                  borderRadius: "var(--r-pill)",
                  padding: "3px 8px", fontSize: 11.5, fontWeight: 800,
                  color: "var(--ink)",
                  display: "flex", alignItems: "center", gap: 3,
                  boxShadow: "0 2px 6px rgba(24,28,54,0.2)",
                }}
              >
                <Icon name="star" size={11} width={2.3} color="var(--pop)" /> {e.rating ?? ", "}
              </span>
            </div>

            {/* "What to order" pick, a small hand-picked subset of spots only.
                Sits under the top row, left-aligned, out of the vote button's way. */}
            {pick && (
              <div
                style={{
                  position: "absolute", top: 37, left: 9,
                  display: "flex", alignItems: "center", gap: 4,
                  background: "rgba(91,33,182,0.82)",
                  backdropFilter: "blur(6px)",
                  borderRadius: "var(--r-pill)",
                  padding: "3px 9px 3px 7px",
                  maxWidth: "calc(100% - 18px)",
                  overflow: "hidden",
                }}
              >
                <Icon name="utensils" size={10} width={2.4} color="#fff" style={{ flexShrink: 0 }} />
                <span
                  style={{
                    fontSize: 10, fontWeight: 700, color: "#fff",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}
                >
                  {pick.dishes}
                  {pick.curator ? <span style={{ fontWeight: 500, opacity: 0.8 }}>, {pick.curator}</span> : null}
                </span>
              </div>
            )}

            {/* Vote button, floats above the foot, right-aligned */}
            <button
              onClick={(ev) => { ev.stopPropagation(); onVote?.(e.id); }}
              style={{
                position: "absolute", right: 9, bottom: 55,
                background: voted ? "var(--violet)" : "rgba(253,248,238,0.9)",
                backdropFilter: "blur(8px)",
                border: "none", borderRadius: "var(--r-pill)",
                padding: "4px 9px 4px 7px",
                display: "flex", alignItems: "center", gap: 4,
                fontSize: 11, fontWeight: 700,
                color: voted ? "#fff" : "var(--ink)",
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(24,28,54,0.22)",
                zIndex: 2,
              }}
            >
              <Icon name="heart" size={11} width={voted ? 0 : 2} color={voted ? "#fff" : "var(--restro-bar)"} />
              {voteCount > 0 ? voteCount : "Vote"}
            </button>


            {(isNewSpot(e.createdAt) || isTrendingSpot(e.n ?? e.name)) && (
              <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: 5, zIndex: 2 }}>
                {isNewSpot(e.createdAt) && (
                  <span style={{ background: "var(--pop)", color: "#fff", fontSize: 9.5, fontWeight: 800, padding: "3px 7px", borderRadius: "var(--r-pill)", letterSpacing: "0.06em" }}>NEW</span>
                )}
                {isTrendingSpot(e.n ?? e.name) && (
                  <span style={{ background: "var(--violet)", color: "#fff", fontSize: 9.5, fontWeight: 800, padding: "3px 7px", borderRadius: "var(--r-pill)", letterSpacing: "0.06em" }}>TRENDING</span>
                )}
              </div>
            )}

            {/* Foot, name over the scrim, then tier · review count */}
            <div style={{ position: "absolute", left: 12, right: 12, bottom: 11 }}>
              <div
                style={{
                  fontFamily: "Fraunces, serif",
                  fontSize: 16,
                  fontWeight: 600,
                  lineHeight: 1.18,
                  letterSpacing: "-0.014em",
                  color: "#fff",
                  textShadow: "0 1px 8px rgba(0,0,0,0.4)",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {e.n ?? e.name}
              </div>
              <div
                style={{
                  marginTop: 4,
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 11,
                  color: "rgba(255,255,255,0.82)",
                  fontWeight: 600,
                  letterSpacing: "0.01em",
                }}
              >
                {TIERS[e.tier] ? (
                  <span>
                    {TIERS[e.tier].label}
                    <span style={{ color: "rgba(255,255,255,0.62)", fontWeight: 500 }}> · +{TIERS[e.tier].points} pts</span>
                  </span>
                ) : null}
                {e.ratingCount ? (
                  <span style={{ whiteSpace: "nowrap", color: "rgba(255,255,255,0.62)", fontWeight: 500 }}>
                    {TIERS[e.tier] ? "· " : ""}
                    {e.ratingCount.toLocaleString("en-IN")} reviews
                  </span>
                ) : null}
                {distKm != null && (
                  <span style={{ whiteSpace: "nowrap", color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>
                    · {distKm < 1 ? `${Math.round(distKm * 1000)}m` : `${distKm.toFixed(1)}km`}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* End of the rail. Without this the last card just stops, which reads as
          a loading failure rather than "you've seen this area". */}
      <div
        style={{
          width: 176,
          scrollSnapAlign: "center",
          borderRadius: "var(--r-lg)",
          background: "rgba(38,48,92,0.04)",
          border: "1.5px dashed var(--line)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 9,
          padding: "18px 16px",
          textAlign: "center",
          alignSelf: "stretch",
        }}
      >
        <Icon name="map" size={22} width={1.6} color="var(--muted)" />
        <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 13.5, lineHeight: 1.3, color: "var(--ink-soft)" }}>
          That&apos;s this pocket
        </div>
        <div style={{ fontSize: 11.5, lineHeight: 1.35, color: "var(--muted)", fontWeight: 500 }}>
          Drag the map to turn up somewhere new
        </div>
      </div>
    </div>
    </>
  );
}
