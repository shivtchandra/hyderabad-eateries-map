"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { trackEvent } from "../../lib/engagement-client.js";
import { TAGS, TIERS, isOpenNow, validTagsFor } from "../../lib/eateryUtils.js";
import { Icon, CategoryIcon, TagIcon } from "./Icons.jsx";
import { hasVoted } from "../../lib/voting.js";
import { getThemeVoteSpot, castThemeVote } from "../../lib/themeVoting.js";
import MustOrder from "./MustOrder.jsx";

const CAT_META = {
  restaurant: { label: "Restaurant", color: "#9d2f4f", gradient: "linear-gradient(135deg, #9d2f4f 0%, #e2622a 100%)" },
  "restro-bar": { label: "Restro Bar", color: "#e2622a", gradient: "linear-gradient(135deg, #e2622a 0%, #dfa43a 100%)" },
  cafe: { label: "Cafe", color: "#2f4fc4", gradient: "linear-gradient(135deg, #2f4fc4 0%, #7c3aed 100%)" },
  bakery: { label: "Bakery", color: "#dfa43a", gradient: "linear-gradient(135deg, #dfa43a 0%, #e2622a 100%)" },
  "ice-cream": { label: "Ice Cream", color: "#e0899e", gradient: "linear-gradient(135deg, #e0899e 0%, #7c3aed 100%)" },
  local: { label: "Local Eats", color: "#2e8b6b", gradient: "linear-gradient(135deg, #2e8b6b 0%, #2f4fc4 100%)" },
};

const PRICE_ESTIMATE = {
  1: "₹200",
  2: "₹500",
  3: "₹1,000",
  4: "₹1,800+",
};

export default function DetailSheet({
  eatery, isMobile, photoUrl, dist, featured = false,
  passportState, onToggleVisited, onToggleSaved, onAddSticker, onClose, onAteHere,
  voteData, onVote, currentTheme, detailPending = false, pick, safety, locals = 0,
  curatedContent = null, recommendationContent = null, onShare, onDirections,
}) {
  const [themeVotePending, setThemeVotePending] = useState(false);
  const [themeCasting, setThemeCasting] = useState(false);
  const [themeVoteSpotLocal, setThemeVoteSpotLocal] = useState(null);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [offersData, setOffersData] = useState(null);

  const dialogRef = useRef(null);
  useEffect(() => {
    if (!curatedContent) return;
    const before = document.activeElement;
    const root = dialogRef.current;
    root?.querySelector("button")?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab") return;
      const items = [...root.querySelectorAll("a[href], button:not([disabled]), summary, input, select")].filter((el) => el.getClientRects().length);
      const first = items[0], last = items.at(-1);
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
    };
    root?.addEventListener("keydown", onKey);
    return () => { root?.removeEventListener("keydown", onKey); before?.focus?.(); };
  }, [eatery.id, !!curatedContent]);

  useEffect(() => {
    if (curatedContent) return;
    let active = true;
    fetch(`/api/offers?id=${encodeURIComponent(eatery.id)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data?.offers) setOffersData(data.offers);
      })
      .catch(() => {});
    return () => { active = false; };
  }, [eatery.id]);

  const cat = CAT_META[eatery.category] ?? CAT_META.cafe;
  const open = isOpenNow(eatery.hours);
  const tier = TIERS[eatery.tier];
  const visited = passportState === "visited";
  const saved = passportState === "saved";
  const voted = hasVoted(eatery.id);
  const voteCount = voteData?.total || 0;
  const weekVotes = voteData?.week_total || 0;

  const themeActive = currentTheme && !currentTheme.winnerId;
  const themeVoteSpot = themeActive ? (themeVoteSpotLocal ?? getThemeVoteSpot(currentTheme.id)) : null;
  const votedForThis = !!themeVoteSpot && themeVoteSpot === eatery.id;
  const votedForOther = !!themeVoteSpot && themeVoteSpot !== eatery.id;

  const handleThemeVote = useCallback(async () => {
    if (!currentTheme || votedForThis || themeCasting) return;
    if (votedForOther && !themeVotePending) { setThemeVotePending(true); return; }
    setThemeCasting(true);
    const result = await castThemeVote(currentTheme.id, eatery.id, eatery.name, { title: currentTheme.title });
    setThemeCasting(false);
    if (result.ok) { setThemeVoteSpotLocal(eatery.id); setThemeVotePending(false); }
  }, [currentTheme, votedForThis, votedForOther, themeCasting, themeVotePending, eatery.id, eatery.name]);

  const allTags = validTagsFor(eatery.category, eatery.tags || []);
  const visibleTags = allTags.slice(0, 3);
  const remainingTagCount = allTags.length - visibleTags.length;

  // Format reviews count cleanly (e.g. 25k+ or 142)
  const formattedReviews = eatery.ratingCount
    ? eatery.ratingCount >= 1000
      ? `${(eatery.ratingCount / 1000).toFixed(eatery.ratingCount >= 10000 ? 0 : 1).replace(/\.0$/, "")}k+`
      : `${eatery.ratingCount}`
    : voteCount > 0
    ? `${voteCount}`
    : "—";

  // Clean cost label (never an isolated '₹')
  const costLabel = eatery.costForTwo
    ? `₹${eatery.costForTwo}`
    : PRICE_ESTIMATE[eatery.priceLevel] ?? "₹₹";

  const cardWidth = isMobile ? "min(390px, 94vw)" : "390px";

  if (curatedContent) return <div className="rec-dialog-backdrop" onClick={onClose}>
    <section ref={dialogRef} className="rec-dialog" role="dialog" aria-modal="true" aria-labelledby="rec-detail-title" onClick={(e) => e.stopPropagation()}>
      <div className="rec-dialog-top"><span>{eatery.area}</span><button onClick={onClose} aria-label="Close place details">×</button></div>
      <h2 id="rec-detail-title">{eatery.name}</h2>
      <p className="rec-muted">{eatery.address}</p>
      <div className="rec-actions">
        <a href={`https://www.google.com/maps/dir/?api=1&destination=${eatery.lat},${eatery.lng}`} target="_blank" rel="noopener noreferrer" onClick={onDirections || (() => trackEvent("directions"))}>Directions</a>
        <button aria-pressed={saved} onClick={() => onToggleSaved(eatery.id)}>{saved ? "Saved" : "Save"}</button>
        <button onClick={onShare}>Share</button>
      </div>
      {curatedContent}
      <a href={eatery.path}>Full place page</a>
    </section>
  </div>;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={eatery.name}
      onClick={onClose}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 1500,
        background: "rgba(15, 20, 38, 0.62)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: isMobile ? "16px 12px 24px" : "20px 24px",
        boxSizing: "border-box",
        animation: "fade-in .2s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: cardWidth,
          maxWidth: "100%",
          maxHeight: isMobile ? "88%" : "90%",
          minHeight: 0,
          background: "#ffffff",
          borderRadius: 28,
          boxShadow: "0 28px 65px -10px rgba(15, 23, 42, 0.35), 0 0 0 1px rgba(15, 23, 42, 0.06)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          position: "relative",
          animation: "detail-card-in .28s cubic-bezier(.22,1,.36,1)",
        }}
      >
        {/* Scrollable Card Body */}
        <div
          style={{
            overflowY: "auto",
            flex: 1,
            WebkitOverflowScrolling: "touch",
            paddingBottom: 6,
          }}
        >
          {/* Header Banner */}
          <div
            style={{
              height: recommendationContent ? (isMobile ? 112 : 140) : (isMobile ? 154 : 168),
              position: "relative",
              background: photoUrl ? `url(${photoUrl}) center/cover no-repeat` : cat.gradient,
              backgroundColor: "#1e243d",
              overflow: "hidden",
            }}
          >
            {/* Soft top and bottom scrims for legibility */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(to bottom, rgba(15,23,42,0.5) 0%, rgba(15,23,42,0) 45%, rgba(15,23,42,0.4) 100%)",
              }}
            />

            {/* Featured / Story Badge */}
            {featured && (
              <span
                style={{
                  position: "absolute",
                  top: 14,
                  left: 14,
                  background: "rgba(226, 98, 42, 0.94)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  color: "#ffffff",
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  padding: "4px 10px",
                  borderRadius: 999,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                }}
              >
                ★ Story
              </span>
            )}

            {/* Distance badge if available */}
            {dist != null && (
              <span
                style={{
                  position: "absolute",
                  bottom: 12,
                  right: 14,
                  background: "rgba(255, 255, 255, 0.92)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  color: "#0f172a",
                  borderRadius: 999,
                  padding: "3px 9px",
                  fontSize: 11,
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3.5,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
                }}
              >
                <Icon name="navigate" size={11} width={2.2} color="#2f4fc4" />
                {dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`}
              </span>
            )}

            {/* Frosted Glass Close Button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              style={{
                position: "absolute",
                top: 13,
                right: 13,
                background: "rgba(255, 255, 255, 0.22)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "1px solid rgba(255, 255, 255, 0.35)",
                borderRadius: "50%",
                width: 32,
                height: 32,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                transition: "transform 120ms ease, background 150ms ease",
              }}
            >
              <Icon name="close" size={15} width={2.4} color="#ffffff" />
            </button>
          </div>

          {/* Avatar & Bookmark Row (Overlapping the banner) */}
          <div
            style={{
              padding: "0 20px",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              marginTop: -38,
              position: "relative",
              zIndex: 4,
            }}
          >
            {/* Circular Category / Brand Emblem (Never duplicate banner photo) */}
            <div
              style={{
                position: "relative",
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "#ffffff",
                boxShadow: "0 8px 24px -2px rgba(15, 23, 42, 0.18)",
                padding: 4,
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${cat.color}15 0%, ${cat.color}28 100%)`,
                  border: `1px solid ${cat.color}35`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CategoryIcon category={eatery.category} size={28} width={2} color={cat.color} />
              </div>

              {/* Live Status Indicator Dot (Apple/Discord style) */}
              {open != null && (
                <div
                  title={open ? "Open now" : "Closed"}
                  style={{
                    position: "absolute",
                    bottom: 2,
                    right: 2,
                    width: 15,
                    height: 15,
                    borderRadius: "50%",
                    background: open ? "#10b981" : "#94a3b8",
                    border: "3px solid #ffffff",
                    boxShadow: open ? "0 0 0 1px rgba(16,185,129,0.3), 0 2px 6px rgba(16,185,129,0.5)" : "none",
                  }}
                />
              )}
            </div>

            {/* Refined Bookmark Pill Button */}
            <button
              type="button"
              onClick={() => onToggleSaved(eatery.id)}
              aria-label={saved ? "Remove save" : "Save spot"}
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: saved ? "#fbe3d5" : "#ffffff",
                border: `1px solid ${saved ? "#f59e0b" : "#e2e8f0"}`,
                boxShadow: "0 4px 14px rgba(15, 23, 42, 0.08)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 150ms cubic-bezier(0.2, 0, 0, 1)",
              }}
            >
              <Icon
                name="bookmark"
                size={18}
                width={saved ? 0 : 2}
                color={saved ? "#b8481a" : "#475569"}
                style={saved ? { fill: "#b8481a" } : {}}
              />
            </button>
          </div>

          {/* Restaurant Identity: Name & Harmonious Subtitle */}
          <div style={{ padding: "12px 20px 0" }}>
            <h2
              style={{
                margin: 0,
                fontSize: 22,
                fontWeight: 700,
                fontFamily: "var(--font-outfit), sans-serif",
                color: "#0f172a",
                lineHeight: 1.22,
                letterSpacing: "-0.025em",
              }}
            >
              {eatery.name}
            </h2>
            <div
              style={{
                marginTop: 5,
                fontSize: 13,
                fontWeight: 500,
                color: "#64748b",
                display: "flex",
                alignItems: "center",
                gap: 6,
                flexWrap: "wrap",
              }}
            >
              <span style={{ color: "#334155", fontWeight: 600 }}>{cat.label}</span>
              {(eatery.discoveredIn || eatery.address) && (
                <>
                  <span style={{ color: "#cbd5e1" }}>·</span>
                  <span>{eatery.discoveredIn || eatery.address}</span>
                </>
              )}
              {tier && (
                <>
                  <span style={{ color: "#cbd5e1" }}>·</span>
                  <span
                    style={{
                      background: eatery.tier === "landmark" ? "#fef3c7" : eatery.tier === "hidden-gem" ? "#f3e8ff" : "#ecfdf5",
                      color: eatery.tier === "landmark" ? "#92400e" : eatery.tier === "hidden-gem" ? "#6b21a8" : "#065f46",
                      fontSize: 10.5,
                      fontWeight: 700,
                      padding: "2px 7px",
                      borderRadius: 6,
                      letterSpacing: "0.03em",
                      textTransform: "uppercase",
                    }}
                  >
                    {tier.label}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Why it's recommended: right under the name so it's seen without scrolling */}
          {recommendationContent && <div style={{ margin: "12px 20px 2px" }}>{recommendationContent}</div>}

          {/* Tags & Specialties Row with Sleek Pills */}
          {allTags.length > 0 && (
            <div
              style={{
                padding: "13px 20px 0",
                display: "flex",
                alignItems: "center",
                gap: 6,
                flexWrap: "wrap",
              }}
            >
              {visibleTags.map((t) => {
                const meta = TAGS[t];
                if (!meta) return null;
                return (
                  <span
                    key={t}
                    style={{
                      background: "#f1f5f9",
                      color: "#334155",
                      borderRadius: 999,
                      padding: "5px 12px",
                      fontSize: 12,
                      fontWeight: 500,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4.5,
                    }}
                  >
                    <TagIcon tag={t} size={12} width={1.8} color="#64748b" />
                    {meta.label}
                  </span>
                );
              })}

              {remainingTagCount > 0 && (
                <span
                  style={{
                    background: "#f1f5f9",
                    color: "#64748b",
                    borderRadius: 999,
                    padding: "5px 9px",
                    fontSize: 11.5,
                    fontWeight: 700,
                  }}
                  title={allTags.slice(3).map((t) => TAGS[t]?.label || t).join(", ")}
                >
                  +{remainingTagCount}
                </span>
              )}
            </div>
          )}

          {/* 3-Column Stats Row with Pure Obsidian Numbers */}
          <div
            style={{
              margin: "18px 20px 0",
              padding: "14px 0",
              borderTop: "1px solid #f1f5f9",
              borderBottom: "1px solid #f1f5f9",
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              textAlign: "center",
            }}
          >
            {/* Col 1: Rating */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 16, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.01em" }}>
                <span style={{ color: "#f59e0b", fontSize: 14 }}>★</span>
                {eatery.rating != null ? Number(eatery.rating).toFixed(1) : "—"}
              </div>
              <div style={{ fontSize: 10.5, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 3 }}>
                Rating
              </div>
            </div>

            {/* Col 2: Reviews / Community */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                borderLeft: "1px solid #f1f5f9",
                borderRight: "1px solid #f1f5f9",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 16, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.01em" }}>
                <Icon name="trophy" size={13} width={2.2} color="#6366f1" />
                {formattedReviews}
              </div>
              <div style={{ fontSize: 10.5, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 3 }}>
                {eatery.ratingCount ? "Reviews" : "Votes"}
              </div>
            </div>

            {/* Col 3: Cost for Two */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.01em" }}>
                {costLabel}
              </div>
              <div style={{ fontSize: 10.5, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 3 }}>
                For two
              </div>
            </div>
          </div>

          {/* Curated Dish Pick Highlight */}
          {pick && (
            <div
              style={{
                margin: "14px 20px 0",
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                background: "#f5f3ff",
                border: "1px solid #ddd6fe",
                borderRadius: 16,
                padding: "11px 14px",
              }}
            >
              <Icon name="utensils" size={15} width={2.1} color="#6d28d9" style={{ marginTop: 2, flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: "#5b21b6", lineHeight: 1.35 }}>
                  {pick.dishes}
                </div>
                {(pick.curator || pick.note) && (
                  <div style={{ fontSize: 11.5, color: "#6b7280", fontWeight: 500, marginTop: 2, lineHeight: 1.35 }}>
                    {pick.curator && <span>{pick.curator}</span>}
                    {pick.curator && pick.note && <span> · </span>}
                    {pick.note}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Locals' pick: distinct r/hyderabad people recommending it (scripts/reddit-picks.mjs) */}
          {locals > 0 && (
            <a
              href={`/spot/${encodeURIComponent(eatery.id)}#locals`}
              style={{
                margin: "10px 20px 0", display: "flex", alignItems: "center", gap: 9, textDecoration: "none",
                background: "var(--violet-wash)", border: "1px solid #ddd6fe", borderRadius: 16, padding: "10px 14px", color: "var(--violet-deep)",
              }}
            >
              <Icon name="heart" size={15} width={2.1} color="var(--violet)" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.35 }}>
                Locals' pick: recommended by {locals} people on r/hyderabad
                <span style={{ fontWeight: 500, color: "var(--ink-soft)" }}> · see what they said</span>
              </span>
            </a>
          )}

          {/* Food Safety Inspection Badge */}
          {safety && (
            <a
              href="/food-safety"
              style={{
                margin: "10px 20px 0",
                display: "flex",
                alignItems: "center",
                gap: 9,
                textDecoration: "none",
                background: "#fff7ed",
                border: "1px solid #fed7aa",
                borderRadius: 16,
                padding: "10px 14px",
                color: "#c2410c",
              }}
            >
              <Icon name="shield" size={15} width={2.1} color="#ea580c" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.35 }}>
                Food safety: {safety.label}, {safety.dateLabel}
                <span style={{ fontWeight: 500, color: "#78716c" }}> · TG SAFE inspection</span>
              </span>
            </a>
          )}

          <div style={{ margin: "12px 20px 0" }}>
            <MustOrder spotId={eatery.id} limit={3} />
          </div>

          {/* Dual-Platform Dining Offers Widget (District & Swiggy Dineout) */}
          {offersData && (offersData.district?.hasOffers || offersData.swiggy?.hasOffers) && (
            <div
              style={{
                margin: "12px 20px 0",
                background: "linear-gradient(135deg, #fdf4ff 0%, #fff1f2 50%, #fff7ed 100%)",
                border: "1px solid #fbcfe8",
                borderRadius: 20,
                padding: "14px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: "#9d174d", display: "flex", alignItems: "center", gap: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  <Icon name="ticket" size={14} width={2.2} color="#db2777" /> Dining Offers & Deals
                </span>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: "#be185d", background: "#fce7f3", padding: "2px 8px", borderRadius: 999 }}>
                  Live Deals
                </span>
              </div>

              {/* District by Zomato Block */}
              {offersData.district?.hasOffers && (
                <div style={{ background: "#ffffff", borderRadius: 14, padding: "10px 12px", border: "1px solid #fed7aa" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "#c2410c", display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ea580c" }} />
                      District by Zomato
                    </span>
                    {offersData.district.url && (
                      <a
                        href={offersData.district.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: 11, fontWeight: 700, color: "#ea580c", textDecoration: "none" }}
                      >
                        Book Table →
                      </a>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {offersData.district.offers.map((off, i) => (
                      <div key={i} style={{ fontSize: 11.5, color: "#334155", display: "flex", alignItems: "baseline", gap: 6 }}>
                        <span style={{ fontWeight: 700, color: "#9a3412" }}>{off.title}</span>
                        {off.desc && <span style={{ color: "#64748b", fontSize: 11 }}>· {off.desc}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Swiggy Dineout Block */}
              {offersData.swiggy?.hasOffers && (
                <div style={{ background: "#ffffff", borderRadius: 14, padding: "10px 12px", border: "1px solid #fed7aa" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "#ea580c", display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#fc8019" }} />
                      Swiggy Dineout
                    </span>
                    {offersData.swiggy.url && (
                      <a
                        href={offersData.swiggy.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: 11, fontWeight: 700, color: "#ea580c", textDecoration: "none" }}
                      >
                        Pay Bill & Save →
                      </a>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {offersData.swiggy.offers.map((off, i) => (
                      <div key={i} style={{ fontSize: 11.5, color: "#334155", display: "flex", alignItems: "baseline", gap: 6 }}>
                        <span style={{ fontWeight: 700, color: "#ea580c" }}>{off.title}</span>
                        {off.desc && <span style={{ color: "#64748b", fontSize: 11 }}>· {off.desc}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Editorial Blurb */}
          {eatery.blurb && (
            <p
              style={{
                margin: "14px 20px 0",
                fontSize: 13,
                lineHeight: 1.5,
                color: "#475569",
              }}
            >
              {eatery.blurb}
            </p>
          )}

          {/* Expandable Extra Information (Hours, Theme Vote, Dish Sticker) */}
          <div style={{ padding: "10px 20px 0" }}>
            <button
              type="button"
              onClick={() => setShowMoreDetails((prev) => !prev)}
              style={{
                background: "transparent",
                border: "none",
                padding: "4px 0",
                color: "#64748b",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Icon
                name="chevronDown"
                size={13}
                width={2.2}
                color="#94a3b8"
                style={{
                  transform: showMoreDetails ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 180ms ease",
                }}
              />
              {showMoreDetails ? "Hide extra info" : "More details & community vote"}
            </button>

            {showMoreDetails && (
              <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 9 }}>
                {/* Vote Widget */}
                <div
                  style={{
                    background: voted ? "#ede9fe" : "#f8fafc",
                    border: `1.5px solid ${voted ? "#a78bfa" : "#e2e8f0"}`,
                    borderRadius: 16,
                    padding: "10px 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <button
                    onClick={() => onVote?.(eatery.id)}
                    title={voted ? "Tap to remove your vote" : "Vote for this spot"}
                    style={{
                      border: "none",
                      borderRadius: 999,
                      padding: "6px 13px 6px 11px",
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      background: voted ? "#7c3aed" : "#ffffff",
                      color: voted ? "#ffffff" : "#0f172a",
                      fontWeight: 700,
                      fontSize: 12.5,
                      cursor: "pointer",
                      boxShadow: voted ? "none" : "0 2px 6px rgba(0,0,0,0.06)",
                      flexShrink: 0,
                    }}
                  >
                    <Icon name="heart" size={13} width={voted ? 0 : 2} color={voted ? "#ffffff" : "#e2622a"} />
                    {voted ? "Voted" : "Vote"}
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 12.5, color: voted ? "#5b21b6" : "#0f172a" }}>
                      {voteCount > 0 ? `${voteCount} vote${voteCount === 1 ? "" : "s"}` : "Be the first to vote"}
                    </div>
                    {weekVotes > 0 && (
                      <div style={{ fontSize: 11, color: "#64748b", fontWeight: 500 }}>
                        {weekVotes} this week
                      </div>
                    )}
                  </div>
                </div>

                {/* Dish Sticker Button */}
                <button
                  onClick={() => onAddSticker?.(eatery)}
                  style={{
                    ...secondaryBtn,
                    background: "#fff7ed",
                    color: "#c2410c",
                    border: "1px solid #fed7aa",
                    fontSize: 12.5,
                  }}
                >
                  <Icon name="ticket" size={14} width={2} /> Make a dish sticker
                </button>

                {/* Theme Voting */}
                {themeActive && (
                  <div>
                    {themeVotePending && (
                      <div style={{ fontSize: 12, color: "#92400e", background: "#fef3c7", border: "1.5px solid #f59e0b", borderRadius: 14, padding: "9px 12px", marginBottom: 6, fontWeight: 600, lineHeight: 1.4 }}>
                        Switch theme vote to <b>{eatery.name}</b>?
                        <button
                          onClick={() => setThemeVotePending(false)}
                          style={{ display: "block", marginTop: 4, border: "none", background: "transparent", color: "#92400e", textDecoration: "underline", fontSize: 11.5, fontWeight: 600, cursor: "pointer", padding: 0 }}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                    <button
                      onClick={handleThemeVote}
                      disabled={votedForThis || themeCasting}
                      style={{
                        ...secondaryBtn,
                        width: "100%",
                        fontSize: 12.5,
                        background: votedForThis ? "#ede9fe" : themeVotePending ? "#fde68a" : "#7c3aed",
                        color: votedForThis ? "#5b21b6" : themeVotePending ? "#92400e" : "#ffffff",
                        border: votedForThis ? "1.5px solid #7c3aed" : "none",
                        opacity: themeCasting ? 0.6 : 1,
                      }}
                    >
                      <Icon name="crown" size={14} width={2} color={votedForThis ? "#7c3aed" : themeVotePending ? "#92400e" : "#ffffff"} />
                      {votedForThis ? `Voted · ${currentTheme.title}` : themeVotePending ? "Confirm vote switch" : `Vote for "${currentTheme.title}"`}
                    </button>
                  </div>
                )}

                {/* Opening Hours */}
                {eatery.hours?.length > 0 && (
                  <details style={{ marginTop: 2 }}>
                    <summary style={{ fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#475569" }}>
                      Weekly opening hours
                    </summary>
                    <div style={{ marginTop: 6, paddingLeft: 4 }}>
                      {eatery.hours.map((h, i) => (
                        <div key={i} style={{ fontSize: 11.5, color: "#64748b", padding: "1.5px 0", fontWeight: 500 }}>
                          {h}
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Card Sticky Footer / Action Bar */}
        <div
          style={{
            flexShrink: 0,
            padding: "14px 20px 18px",
            borderTop: "1px solid #f1f5f9",
            background: "#ffffff",
            display: "flex",
            flexDirection: "column",
            gap: 9,
          }}
        >
          {/* Primary Action Button: Luxury Obsidian Stamp CTA */}
          <button
            onClick={() => (visited || !onAteHere ? onToggleVisited(eatery.id) : onAteHere(eatery.id))}
            style={{
              width: "100%",
              height: 50,
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: "-0.01em",
              borderRadius: 999,
              border: visited ? "1.5px solid #86efac" : "none",
              background: visited
                ? "#f0fdf4"
                : "linear-gradient(180deg, #1e2540 0%, #111425 100%)",
              color: visited ? "#15803d" : "#ffffff",
              boxShadow: visited
                ? "none"
                : "0 8px 24px -4px rgba(17, 20, 37, 0.35), 0 2px 6px rgba(17, 20, 37, 0.15)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "transform 100ms ease, box-shadow 150ms ease",
            }}
          >
            <Icon
              name={visited ? "check" : "ticket"}
              size={18}
              width={2.2}
              color={visited ? "#15803d" : "#ffffff"}
            />
            {visited ? "You ate here ✓" : `I ate here${tier ? ` (+${tier.points} pts)` : ""}`}
          </button>


          {/* Secondary Action Row: Sleek Frosted Pills */}
          <div style={{ display: "flex", gap: 8 }}>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${eatery.lat},${eatery.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent("directions")}
              style={{
                ...secondaryBtn,
                flex: 1,
              }}
            >
              <Icon name="navigate" size={14} width={2.1} color="#2f4fc4" /> Directions
            </a>

            {eatery.phone && (
              <a
                href={`tel:${eatery.phone.replace(/\s/g, "")}`}
                onClick={() => trackEvent("call")}
                style={{
                  ...secondaryBtn,
                  padding: "0 14px",
                }}
              >
                <Icon name="phone" size={14} width={2} color="#475569" /> Call
              </a>
            )}

            <a
              href={`/spot/${encodeURIComponent(eatery.id)}`}
              style={{
                ...secondaryBtn,
                flex: 1,
              }}
            >
              <Icon name="book" size={14} width={2} color="#475569" /> Full Page
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

const secondaryBtn = {
  height: 40,
  borderRadius: 999,
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  color: "#334155",
  fontFamily: "var(--font-outfit), Outfit, sans-serif",
  fontWeight: 600,
  fontSize: 13,
  textDecoration: "none",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  boxSizing: "border-box",
  boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
  transition: "all 120ms ease",
};
