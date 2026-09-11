"use client";

import { useState, useCallback } from "react";
import { trackEvent } from "../../lib/engagement-client.js";
import { TAGS, TIERS, isOpenNow, validTagsFor } from "../../lib/eateryUtils.js";
import { Icon, CategoryIcon, TagIcon, TierIcon } from "./Icons.jsx";
import { hasVoted } from "../../lib/voting.js";
import { getThemeVoteSpot, castThemeVote } from "../../lib/themeVoting.js";

const CAT_META = {
  restaurant: { label: "Restaurant", color: "var(--restaurant)" },
  "restro-bar": { label: "Restro Bar", color: "var(--restro-bar)" },
  cafe: { label: "Cafe", color: "var(--cafe)" },
  bakery: { label: "Bakery", color: "var(--bakery)" },
  "ice-cream": { label: "Ice Cream", color: "var(--ice-cream)" },
  local: { label: "Local Eats", color: "var(--local)" },
};
const PRICE = { 1: "₹", 2: "₹₹", 3: "₹₹₹", 4: "₹₹₹₹" };

export default function DetailSheet({
  eatery, isMobile, photoUrl, dist, featured = false,
  passportState, onToggleVisited, onToggleSaved, onAddSticker, onClose,
  voteData, onVote, currentTheme, detailPending = false, pick,
}) {
  const [themeVotePending, setThemeVotePending] = useState(false);
  const [themeCasting, setThemeCasting] = useState(false);
  const [themeVoteSpotLocal, setThemeVoteSpotLocal] = useState(null);

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

  // Overlay lives in the map pane (above bottom nav). Cap height to 100% of
  // that pane with padding, never 88dvh, or the card kisses the nav.
  const cardWidth = isMobile ? "min(420px, 100%)" : "min(400px, 100%)";

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
        background: "rgba(30, 22, 16, 0.42)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: isMobile ? "12px 16px 16px" : "20px 24px",
        boxSizing: "border-box",
        animation: "fade-in .18s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: cardWidth,
          maxWidth: "100%",
          maxHeight: "100%",
          minHeight: 0,
          background: "var(--cream-hi)",
          borderRadius: 22,
          border: "1.5px solid var(--line)",
          boxShadow: "var(--shadow-pop)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          animation: "detail-card-in .28s cubic-bezier(.22,1,.36,1)",
        }}
      >
        {/* Hero */}
        <div
          style={{
            height: isMobile ? 140 : 168,
            background: photoUrl ? `url(${photoUrl}) center/cover no-repeat` : cat.color,
            position: "relative",
            flexShrink: 0,
          }}
        >
          {visited && (
            <div
              style={{
                position: "absolute", top: 12, left: 12,
                background: "var(--pop)", color: "var(--ink)",
                borderRadius: 20, padding: "5px 12px",
                fontSize: 11.5, fontWeight: 700,
                display: "flex", alignItems: "center", gap: 5,
                boxShadow: "0 2px 8px rgba(44,36,24,.25)",
              }}
            >
              <Icon name="check" size={13} width={2.6} /> Collected
            </div>
          )}
          <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={() => onToggleSaved(eatery.id)}
              aria-label={saved ? "Remove save" : "Want to go"}
              style={overlayBtn}
            >
              <Icon name="bookmark" size={16} width={2} color="#fff" />
            </button>
            <button type="button" onClick={onClose} style={overlayBtn} aria-label="Close">
              <Icon name="close" size={16} width={2.2} color="#fff" />
            </button>
          </div>
          {(eatery.rating != null || open != null) && (
            <div
              style={{
                position: "absolute", left: 12, right: 12, bottom: 12,
                display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap",
              }}
            >
              {open != null && (
                <span style={{
                  background: open ? "rgba(226,238,222,0.95)" : "rgba(248,227,221,0.95)",
                  color: open ? "var(--forest)" : "var(--restro-bar)",
                  borderRadius: 11, padding: "4px 10px",
                  fontSize: 12, fontWeight: 700,
                  display: "inline-flex", alignItems: "center", gap: 4,
                }}>
                  <Icon name="clock" size={12} width={2.1} /> {open ? "Open now" : "Closed"}
                </span>
              )}
              {eatery.rating != null && (
                <span style={{
                  background: "rgba(255,255,255,0.94)", color: "var(--ink)",
                  borderRadius: 11, padding: "4px 10px",
                  fontSize: 12.5, fontWeight: 700,
                  display: "inline-flex", alignItems: "center", gap: 4,
                }}>
                  <Icon name="star" size={12} width={2} color="var(--pop-deep)" />
                  {eatery.rating}
                  {eatery.ratingCount != null && (
                    <span style={{ color: "var(--muted)", fontWeight: 500 }}>
                      ({eatery.ratingCount.toLocaleString()})
                    </span>
                  )}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Scrollable body */}
        <div style={{ padding: "14px 16px 12px", overflowY: "auto", flex: 1, WebkitOverflowScrolling: "touch" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span
              style={{
                background: "var(--cream)", border: `1.5px solid ${cat.color}`,
                borderRadius: 13, width: 44, height: 44, minWidth: 44,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <CategoryIcon category={eatery.category} size={23} width={1.85} color={cat.color} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 className="t-title-s" style={{ margin: "0 0 3px" }}>
                {eatery.name}
                {featured && (
                  <span style={{
                    display: "inline-block", verticalAlign: "middle", marginLeft: 8,
                    background: "var(--pop)", color: "#fff", fontSize: 10, fontWeight: 800,
                    letterSpacing: "0.03em", padding: "3px 7px", borderRadius: 20,
                  }}>★ Story</span>
                )}
              </h2>
              {detailPending ? (
                <span className="detail-skeleton" aria-label="Loading restaurant details" role="status" />
              ) : eatery.address ? (
                <div className="t-foot" style={{ color: "var(--muted)", fontWeight: 500 }}>{eatery.address}</div>
              ) : null}
            </div>
          </div>

          {eatery.blurb && (
            <p style={{ margin: "11px 0 0", fontSize: 13.5, lineHeight: 1.5, color: "var(--ink-soft)" }}>
              {eatery.blurb}
            </p>
          )}

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "12px 0" }}>
            {tier && (
              <span style={{ ...chip, background: "var(--pop-wash)", color: "var(--pop-deep)", borderColor: "transparent" }} title={`${tier.hint}, worth +${tier.points} pts in the Race`}>
                <TierIcon tier={eatery.tier} size={13} width={2} /> {tier.label} · +{tier.points} pts
              </span>
            )}
            {eatery.priceLevel && <span style={chip}>{PRICE[eatery.priceLevel]}</span>}
            {dist != null && (
              <span style={{ ...chip, background: "#dfe6f7", color: "var(--cafe)", borderColor: "transparent" }}>
                <Icon name="navigate" size={13} width={2} />
                {dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`}
              </span>
            )}
          </div>

          {tier && (
            <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500, lineHeight: 1.45, margin: "-4px 0 12px" }}>
              Stamp it while you&apos;re here to claim <strong style={{ color: "var(--pop-deep)" }}>+{tier.points} pts</strong> for the Race.{" "}
              {eatery.tier === "hidden-gem"
                ? "Hidden gems (under 200 reviews) score highest, this is a deep cut."
                : eatery.tier === "landmark"
                ? "Landmarks (1000+ reviews) score least, everyone already knows this one."
                : "Mid-tier pickup, 200+ reviews, not yet a household name."}
            </div>
          )}

          {eatery.tags?.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 13 }}>
              {validTagsFor(eatery.category, eatery.tags).map((t) => {
                const meta = TAGS[t];
                if (!meta) return null;
                return (
                  <span key={t} style={{ ...chip, fontSize: 12, background: "var(--cream)" }}>
                    <TagIcon tag={t} size={13} width={1.9} color="var(--ink-soft)" /> {meta.label}
                  </span>
                );
              })}
            </div>
          )}

          {pick && (
            <div
              style={{
                display: "flex", alignItems: "flex-start", gap: 9,
                background: "var(--violet-wash)",
                border: "1px solid var(--violet)",
                borderRadius: "var(--r-md)",
                padding: "11px 13px",
                marginBottom: 13,
              }}
            >
              <Icon name="utensils" size={16} width={2} color="var(--violet-deep)" style={{ marginTop: 1, flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--violet-deep)", lineHeight: 1.35 }}>
                  {pick.dishes}
                </div>
                {(pick.curator || pick.note) && (
                  <div style={{ fontSize: 11.5, color: "var(--ink-soft)", fontWeight: 500, marginTop: 2, lineHeight: 1.4 }}>
                    {pick.curator && <span>{pick.curator}</span>}
                    {pick.curator && pick.note && <span> · </span>}
                    {pick.note}
                  </div>
                )}
              </div>
            </div>
          )}

          <a
            href={`/spot/${encodeURIComponent(eatery.id)}`}
            style={{ ...btn, width: "100%", background: "var(--cream)", color: "var(--ink-soft)", border: "1.5px solid var(--line)", textDecoration: "none", fontSize: 13, marginBottom: 8 }}
          >
            <Icon name="book" size={15} width={1.9} /> View full page
          </a>

          <div style={{ display: "flex", gap: 7, marginBottom: 8 }}>
            {eatery.website && (
              <a href={eatery.website} target="_blank" rel="noopener noreferrer"
                 style={{ ...btn, flex: 1, background: "var(--cream)", color: "var(--ink-soft)", border: "1.5px solid var(--line)", textDecoration: "none", fontSize: 13 }}>
                <Icon name="globe" size={15} width={1.9} /> Website
              </a>
            )}
            {eatery.phone && (
              <a href={`tel:${eatery.phone.replace(/\s/g, "")}`}
                 onClick={() => trackEvent("call")}
                 style={{ ...btn, flex: 1, background: "var(--cream)", color: "var(--ink-soft)", border: "1.5px solid var(--line)", textDecoration: "none", fontSize: 13 }}>
                <Icon name="phone" size={15} width={1.9} /> Call
              </a>
            )}
          </div>

          <button
            onClick={() => onAddSticker?.(eatery)}
            style={{ ...btn, width: "100%", marginBottom: 8, background: "var(--pop-wash)", color: "var(--pop-deep)", border: "1.5px solid var(--pop)" }}
          >
            <Icon name="ticket" size={16} width={2} /> Make a dish sticker
          </button>

          <div style={{
            marginBottom: 8,
            background: voted ? "var(--violet-wash)" : "var(--cream)",
            border: `1.5px solid ${voted ? "var(--violet)" : "var(--line)"}`,
            borderRadius: "var(--r-md)",
            padding: "12px 14px",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <button
              onClick={() => onVote?.(eatery.id)}
              title={voted ? "Tap to remove your vote" : "Vote for this spot"}
              style={{
                border: "none", borderRadius: "var(--r-pill)",
                padding: "7px 14px 7px 11px",
                display: "flex", alignItems: "center", gap: 5,
                background: voted ? "var(--violet)" : "var(--cream-hi)",
                color: voted ? "#fff" : "var(--ink)",
                fontWeight: 700, fontSize: 13.5, cursor: "pointer",
                boxShadow: voted ? "none" : "var(--e1)",
                flexShrink: 0,
              }}
            >
              <Icon name="heart" size={15} width={voted ? 0 : 2} color={voted ? "#fff" : "var(--restro-bar)"} />
              {voted ? "Voted" : "Vote"}
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13.5, color: voted ? "var(--violet-deep)" : "var(--ink)" }}>
                {voteCount > 0 ? `${voteCount} vote${voteCount === 1 ? "" : "s"} all time` : "Be the first to vote"}
              </div>
              {weekVotes > 0 && (
                <div style={{ fontSize: 11.5, color: "var(--muted)", fontWeight: 500, marginTop: 2 }}>
                  {weekVotes} this week
                </div>
              )}
              {voted && (
                <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 500, marginTop: 2 }}>
                  Tap Voted to remove
                </div>
              )}
            </div>
          </div>

          {themeActive && (
            <div style={{ marginBottom: 8 }}>
              {themeVotePending && (
                <div style={{ fontSize: 12.5, color: "#92400e", background: "#fef3c7", border: "1.5px solid #f59e0b", borderRadius: "var(--r-md)", padding: "8px 12px", marginBottom: 6, fontWeight: 600, lineHeight: 1.4 }}>
                  You already voted for a different spot in this theme. Switch your vote to <b>{eatery.name}</b>?
                  <button
                    onClick={() => setThemeVotePending(false)}
                    style={{ display: "block", marginTop: 6, border: "none", background: "transparent", color: "#92400e", textDecoration: "underline", fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0 }}
                  >
                    Cancel
                  </button>
                </div>
              )}
              <button
                onClick={handleThemeVote}
                disabled={votedForThis || themeCasting}
                style={{
                  ...btn, width: "100%",
                  background: votedForThis ? "var(--violet-wash)" : themeVotePending ? "#fde68a" : "var(--violet)",
                  color: votedForThis ? "var(--violet-deep)" : themeVotePending ? "#92400e" : "#fff",
                  border: votedForThis ? "1.5px solid var(--violet)" : "none",
                  opacity: themeCasting ? 0.6 : 1,
                }}
              >
                <Icon name="crown" size={16} width={1.9} color={votedForThis ? "var(--violet)" : themeVotePending ? "#92400e" : "#fff"} />
                {votedForThis
                  ? `Voted · ${currentTheme.title}`
                  : themeVotePending
                  ? "Tap again to confirm"
                  : themeCasting
                  ? "Voting…"
                  : votedForOther
                  ? `Change my vote to "${currentTheme.title}"`
                  : `Vote for "${currentTheme.title}"`}
              </button>
              {votedForOther && !themeVotePending && (
                <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 500, marginTop: 5, textAlign: "center" }}>
                  You voted for another spot, tapping this will move your vote here
                </div>
              )}
            </div>
          )}

          {eatery.hours?.length > 0 && (
            <details style={{ marginTop: 4, marginBottom: 4 }}>
              <summary style={{ fontSize: 13, fontWeight: 600, cursor: "pointer", color: "var(--ink-soft)" }}>
                Opening hours
              </summary>
              <div style={{ marginTop: 7 }}>
                {eatery.hours.map((h, i) => (
                  <div key={i} style={{ fontSize: 12, color: "var(--muted)", padding: "2px 0", fontWeight: 500 }}>{h}</div>
                ))}
              </div>
            </details>
          )}
        </div>

        {/* Sticky action bar */}
        <div
          style={{
            flexShrink: 0,
            padding: "10px 14px 14px",
            borderTop: "1.5px solid var(--line)",
            background: "var(--cream-hi)",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <button
            onClick={() => onToggleVisited(eatery.id)}
            style={{
              ...btn, width: "100%", height: 48, fontSize: 15,
              background: visited ? "var(--pop-wash)" : "var(--pop)",
              color: visited ? "var(--pop-deep)" : "var(--ink)",
              border: `2px solid ${visited ? "var(--pop)" : "transparent"}`,
            }}
          >
            <Icon name={visited ? "check" : "ticket"} size={18} width={2.1} />
            {visited ? "Collected, tap to undo" : "Stamp this spot"}
          </button>
          <div style={{ display: "flex", gap: 7 }}>
            <button
              onClick={() => onToggleSaved(eatery.id)}
              style={{
                ...btn, flex: 1,
                background: saved ? "#dfe6f7" : "var(--cream)",
                color: saved ? "var(--cafe)" : "var(--ink-soft)",
                border: `1.5px solid ${saved ? "var(--cafe)" : "var(--line)"}`,
              }}
            >
              <Icon name="bookmark" size={16} width={2} />
              {saved ? "Saved" : "Want to go"}
            </button>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${eatery.lat},${eatery.lng}`}
              target="_blank" rel="noopener noreferrer"
              onClick={() => trackEvent("directions")}
              style={{ ...btn, flex: 1, background: "var(--cafe)", color: "var(--cream-hi)", textDecoration: "none" }}
            >
              <Icon name="navigate" size={16} width={2} /> Directions
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

const chip = {
  background: "var(--cream)",
  color: "var(--ink)",
  border: "1.5px solid var(--line)",
  borderRadius: 11,
  padding: "4px 10px",
  fontSize: 12.5,
  fontWeight: 600,
  whiteSpace: "nowrap",
  display: "flex",
  alignItems: "center",
  gap: 5,
};

const btn = {
  border: "none",
  borderRadius: 13,
  height: 42,
  padding: "0 12px",
  fontFamily: "Outfit, sans-serif",
  fontWeight: 600,
  fontSize: 13.5,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
};

const overlayBtn = {
  background: "rgba(38,48,92,.45)",
  backdropFilter: "blur(8px)",
  border: "none",
  borderRadius: "50%",
  width: 34,
  height: 34,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
