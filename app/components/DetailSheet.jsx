"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { trackEvent } from "../../lib/engagement-client.js";
import { TAGS, TIERS, isOpenNow, validTagsFor } from "../../lib/eateryUtils.js";
import { Icon, CategoryIcon, TagIcon } from "./Icons.jsx";
import { hasVoted } from "../../lib/voting.js";
import { getThemeVoteSpot, castThemeVote } from "../../lib/themeVoting.js";
import MustOrder from "./MustOrder.jsx";
import VoteFollowUp from "./VoteFollowUp.jsx";

const CAT_META = {
  restaurant: { label: "Restaurant", color: "#9d2f4f", gradient: "#9d2f4f" },
  "restro-bar": { label: "Restro Bar", color: "#e2622a", gradient: "#e2622a" },
  cafe: { label: "Cafe", color: "#2f4fc4", gradient: "#2f4fc4" },
  bakery: { label: "Bakery", color: "#dfa43a", gradient: "#dfa43a" },
  "ice-cream": { label: "Ice Cream", color: "#e0899e", gradient: "#e0899e" },
  local: { label: "Local Eats", color: "#2e8b6b", gradient: "#2e8b6b" },
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
  const [themeVoteFailed, setThemeVoteFailed] = useState(false);
  const [themeJustVoted, setThemeJustVoted] = useState(false);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [offersData, setOffersData] = useState(null);
  const [shareCopied, setShareCopied] = useState(false);

  const handleShareClick = useCallback(async (e) => {
    e?.stopPropagation?.();
    trackEvent("share_sheet");
    if (onShare) {
      onShare(eatery);
      return;
    }
    const slug = eatery.slug || eatery.id;
    const url = typeof window !== "undefined" ? `${window.location.origin}/spot/${encodeURIComponent(slug)}` : `/spot/${encodeURIComponent(slug)}`;
    const text = `Check out ${eatery.name} on Hyderabad Eats!`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: `${eatery.name} | Hyderabad Eats`, text, url });
        return;
      } catch (err) {
        if (err?.name === "AbortError") return;
      }
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2500);
      } catch {}
    }
  }, [eatery, onShare]);

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
    // Optimistic: show the vote (and the VOTED stamp) straight away, roll back
    // with a short message if the server says no.
    const previous = themeVoteSpotLocal;
    setThemeCasting(true);
    setThemeVoteFailed(false);
    setThemeVoteSpotLocal(eatery.id);
    setThemeVotePending(false);
    const result = await castThemeVote(currentTheme.id, eatery.id, eatery.name, { title: currentTheme.title });
    setThemeCasting(false);
    if (!result.ok) { setThemeVoteSpotLocal(previous); setThemeVoteFailed(true); }
    else setThemeJustVoted(true);
  }, [currentTheme, votedForThis, votedForOther, themeCasting, themeVotePending, themeVoteSpotLocal, eatery.id, eatery.name]);

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
    : "-";

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
              backgroundColor: "var(--ink)",
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
                  color: "var(--ink)",
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
                <Icon name="navigate" size={11} width={2.2} color="var(--violet-deep)" />
                {dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`}
              </span>
            )}

            {/* Frosted Glass Share Button */}
            <button
              type="button"
              onClick={handleShareClick}
              aria-label="Share spot card"
              style={{
                position: "absolute",
                top: 13,
                right: 52,
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
                color: "#ffffff",
              }}
              title="Share place card"
            >
              <Icon name={shareCopied ? "check" : "share"} size={14} width={2.2} color="#ffffff" />
            </button>

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
                  background: `${cat.color}1f`,
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
                    background: open ? "#10b981" : "var(--muted)",
                    border: "3px solid #ffffff",
                    boxShadow: open ? "0 0 0 1px rgba(16,185,129,0.3), 0 2px 6px rgba(16,185,129,0.5)" : "none",
                  }}
                />
              )}
            </div>

          </div>

          {/* Restaurant Identity: Name & Harmonious Subtitle */}
          <div style={{ padding: "12px 20px 0" }}>
            <h2
              style={{
                margin: 0,
                // Spot mockup: the name in big display type.
                fontSize: 34,
                fontWeight: 800,
                fontFamily: "var(--font-display), system-ui, sans-serif",
                color: "var(--ink)",
                lineHeight: 0.95,
                letterSpacing: "-0.04em",
              }}
            >
              {eatery.name}
            </h2>
            <div
              style={{
                marginTop: 5,
                fontSize: 13,
                fontWeight: 500,
                color: "var(--muted)",
                display: "flex",
                alignItems: "center",
                gap: 6,
                flexWrap: "wrap",
              }}
            >
              <span style={{ color: "var(--ink)", fontWeight: 600 }}>{cat.label}</span>
              {(eatery.discoveredIn || eatery.address) && (
                <>
                  <span style={{ color: "var(--line)" }}>·</span>
                  <span>{eatery.discoveredIn || eatery.address}</span>
                </>
              )}
              {tier && (
                <>
                  <span style={{ color: "var(--line)" }}>·</span>
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
                      background: "var(--cream)",
                      color: "var(--ink)",
                      borderRadius: 999,
                      padding: "5px 12px",
                      fontSize: 12,
                      fontWeight: 500,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4.5,
                    }}
                  >
                    <TagIcon tag={t} size={12} width={1.8} color="var(--muted)" />
                    {meta.label}
                  </span>
                );
              })}

              {remainingTagCount > 0 && (
                <span
                  style={{
                    background: "var(--cream)",
                    color: "var(--muted)",
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
              borderTop: "1px solid var(--line)",
              borderBottom: "1px solid var(--line)",
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              textAlign: "center",
            }}
          >
            {/* Col 1: Rating */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 16, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.01em" }}>
                <span style={{ color: "#f59e0b", fontSize: 14 }}>★</span>
                {eatery.rating != null ? Number(eatery.rating).toFixed(1) : "-"}
              </div>
              <div style={{ fontSize: 10.5, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 3 }}>
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
                borderLeft: "1px solid var(--line)",
                borderRight: "1px solid var(--line)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 16, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.01em" }}>
                <Icon name="trophy" size={13} width={2.2} color="#6366f1" />
                {formattedReviews}
              </div>
              <div style={{ fontSize: 10.5, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 3 }}>
                {eatery.ratingCount ? "Reviews" : "Votes"}
              </div>
            </div>

            {/* Col 3: Cost for Two */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.01em" }}>
                {costLabel}
              </div>
              <div style={{ fontSize: 10.5, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 3 }}>
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
                <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--violet-deep)", lineHeight: 1.35 }}>
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
                background: "var(--violet-wash)",
                border: "none",
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
                <div style={{ background: "#ffffff", borderRadius: 14, padding: "10px 12px", border: "none" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "#c2410c", display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--violet-deep)" }} />
                      District by Zomato
                    </span>
                    {offersData.district.url && (
                      <a
                        href={offersData.district.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: 11, fontWeight: 700, color: "var(--violet-deep)", textDecoration: "none" }}
                      >
                        Book Table →
                      </a>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {offersData.district.offers.map((off, i) => (
                      <div key={i} style={{ fontSize: 11.5, color: "var(--ink)", display: "flex", alignItems: "baseline", gap: 6 }}>
                        <span style={{ fontWeight: 700, color: "#9a3412" }}>{off.title}</span>
                        {off.desc && <span style={{ color: "var(--muted)", fontSize: 11 }}>· {off.desc}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Swiggy Dineout Block */}
              {offersData.swiggy?.hasOffers && (
                <div style={{ background: "#ffffff", borderRadius: 14, padding: "10px 12px", border: "none" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "var(--violet-deep)", display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#fc8019" }} />
                      Swiggy Dineout
                    </span>
                    {offersData.swiggy.url && (
                      <a
                        href={offersData.swiggy.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: 11, fontWeight: 700, color: "var(--violet-deep)", textDecoration: "none" }}
                      >
                        Pay Bill & Save →
                      </a>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {offersData.swiggy.offers.map((off, i) => (
                      <div key={i} style={{ fontSize: 11.5, color: "var(--ink)", display: "flex", alignItems: "baseline", gap: 6 }}>
                        <span style={{ fontWeight: 700, color: "var(--violet-deep)" }}>{off.title}</span>
                        {off.desc && <span style={{ color: "var(--muted)", fontSize: 11 }}>· {off.desc}</span>}
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
                color: "var(--ink-soft)",
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
                color: "var(--muted)",
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
                color="var(--muted)"
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
                    background: voted ? "var(--violet-wash)" : "var(--cream)",
                    border: `1.5px solid ${voted ? "#a78bfa" : "var(--line)"}`,
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
                      background: voted ? "var(--violet)" : "#ffffff",
                      color: voted ? "#ffffff" : "var(--ink)",
                      fontWeight: 700,
                      fontSize: 12.5,
                      cursor: "pointer",
                      boxShadow: voted ? "none" : "0 2px 6px rgba(0,0,0,0.06)",
                      flexShrink: 0,
                    }}
                  >
                    <Icon name="heart" size={13} width={voted ? 0 : 2} color={voted ? "#ffffff" : "var(--violet)"} />
                    {voted ? "Voted" : "Vote"}
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 12.5, color: voted ? "var(--violet-deep)" : "var(--ink)" }}>
                      {voteCount > 0 ? `${voteCount} vote${voteCount === 1 ? "" : "s"}` : "Be the first to vote"}
                    </div>
                    {weekVotes > 0 && (
                      <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 500 }}>
                        {weekVotes} this week
                      </div>
                    )}
                  </div>
                </div>

                {/* Dish Sticker Button */}
                <button
                  onClick={() => onAddSticker?.(eatery)}
                  className="sheet-btn"
                  style={{
                    background: "var(--violet-wash)",
                    color: "var(--violet-deep)",
                    border: "none",
                    fontSize: 12.5,
                  }}
                >
                  <Icon name="ticket" size={14} width={2} /> Make a dish sticker
                </button>

                {/* Theme Voting */}
                {themeActive && (
                  <div>
                    {themeVotePending && (
                      <div style={{ fontSize: 13, color: "var(--ink)", background: "#fdf3d6", border: "1.5px solid var(--yellow)", borderRadius: 14, padding: "9px 12px", marginBottom: 6, fontWeight: 600, lineHeight: 1.4 }}>
                        Switch theme vote to <b>{eatery.name}</b>?
                        <button
                          onClick={() => setThemeVotePending(false)}
                          style={{ display: "block", marginTop: 4, border: "none", background: "transparent", color: "var(--ink)", textDecoration: "underline", fontSize: 11.5, fontWeight: 600, cursor: "pointer", padding: 0 }}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                    <button
                      onClick={handleThemeVote}
                      disabled={votedForThis || themeCasting}
                      className={`sheet-btn${votedForThis ? " vote-stamped" : ""}`}
                      style={{
                        width: "100%",
                        fontSize: 12.5,
                        background: votedForThis ? "var(--violet-wash)" : themeVotePending ? "var(--yellow)" : "var(--violet)",
                        color: votedForThis ? "var(--violet-deep)" : themeVotePending ? "var(--ink)" : "#ffffff",
                        border: votedForThis ? "1.5px solid var(--violet)" : "none",
                        opacity: themeCasting ? 0.6 : 1,
                      }}
                    >
                      <Icon name="crown" size={14} width={2} color={votedForThis ? "var(--violet)" : themeVotePending ? "var(--ink)" : "#ffffff"} />
                      {votedForThis ? `Voted · ${currentTheme.title}` : themeVotePending ? "Confirm vote switch" : `Vote for "${currentTheme.title}"`}
                    </button>
                    {themeVoteFailed && (
                      <p role="status" style={{ margin: "6px 0 0", fontSize: 13, color: "var(--ink-soft)" }}>
                        That vote didn’t go through. Try again.
                      </p>
                    )}
                    {themeJustVoted && <div style={{ margin: "0 -16px" }}><VoteFollowUp themeTitle={currentTheme.title} source="spot-sheet" /></div>}
                  </div>
                )}

                {/* Opening Hours */}
                {eatery.hours?.length > 0 && (
                  <details style={{ marginTop: 2 }}>
                    <summary style={{ fontSize: 12, fontWeight: 600, cursor: "pointer", color: "var(--ink-soft)" }}>
                      Weekly opening hours
                    </summary>
                    <div style={{ marginTop: 6, paddingLeft: 4 }}>
                      {eatery.hours.map((h, i) => (
                        <div key={i} style={{ fontSize: 11.5, color: "var(--muted)", padding: "1.5px 0", fontWeight: 500 }}>
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

        {/* Footer, the Spot mockup: Directions is the one purple button, Save
            and Share sit beside it, "I ate here" is a quiet row above. */}
        <div className="sheet-footer">
          <button
            type="button"
            className={`sheet-ate${visited ? " is-done" : ""}`}
            onClick={() => (visited || !onAteHere ? onToggleVisited(eatery.id) : onAteHere(eatery.id))}
          >
            <Icon name={visited ? "check" : "ticket"} size={18} width={2.2} color="currentColor" />
            {visited ? "You ate here" : `I ate here · stamp your passport${tier ? ` (+${tier.points} pts)` : ""}`}
          </button>
          <div className="sheet-actions">
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${eatery.lat},${eatery.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent("directions")}
              className="sheet-primary"
            >
              Directions
            </a>
            <button
              type="button"
              onClick={() => onToggleSaved(eatery.id)}
              aria-label={saved ? "Remove from saved" : "Save spot"}
              aria-pressed={saved}
              className={`sheet-icon${saved ? " is-on" : ""}`}
            >
              <Icon name="bookmark" size={20} width={2} color="currentColor" />
            </button>
            <button
              type="button"
              onClick={handleShareClick}
              aria-label={shareCopied ? "Link copied" : "Share place"}
              className={`sheet-icon${shareCopied ? " is-on" : ""}`}
            >
              <Icon name={shareCopied ? "check" : "share"} size={20} width={2} color="currentColor" />
            </button>
          </div>
          <div className="sheet-more">
            {eatery.phone && (
              <a href={`tel:${eatery.phone.replace(/\s/g, "")}`} onClick={() => trackEvent("call")}>Call</a>
            )}
            <a href={`/spot/${encodeURIComponent(eatery.id)}`}>Full page</a>
          </div>
        </div>
      </div>
    </div>
  );
}
