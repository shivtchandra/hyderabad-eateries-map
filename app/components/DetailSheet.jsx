"use client";

import { useRef, useState, useCallback } from "react";
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
// `half` is the default, so it has to land on a coherent block, photo, name,
// stat chips and the primary action, rather than slicing through a chip row.
const SNAPS = { peek: 30, half: 72, full: 94 };

export default function DetailSheet({
  eatery, isMobile, photoUrl, dist, featured = false,
  passportState, onToggleVisited, onToggleSaved, onAddSticker, onClose,
  voteData, onVote, currentTheme, detailPending = false, pick,
}) {
  const [snap, setSnap] = useState("half");
  const [themeVotePending, setThemeVotePending] = useState(false);
  const [themeCasting, setThemeCasting] = useState(false);
  const [themeVoteSpotLocal, setThemeVoteSpotLocal] = useState(null); // optimistic override after a vote/switch
  const dragStart = useRef(null);

  const cat = CAT_META[eatery.category] ?? CAT_META.cafe;
  const open = isOpenNow(eatery.hours);
  const tier = TIERS[eatery.tier];
  const visited = passportState === "visited";
  const saved = passportState === "saved";
  const voted = hasVoted(eatery.id);
  const voteCount = voteData?.total || 0;
  const weekVotes = voteData?.week_total || 0;

  const themeActive = currentTheme && !currentTheme.winnerId;
  // The spot this device currently has voted for in this theme (or null), // may differ from eatery.id, which is what makes "change my vote" possible.
  const themeVoteSpot = themeActive ? (themeVoteSpotLocal ?? getThemeVoteSpot(currentTheme.id)) : null;
  const votedForThis = !!themeVoteSpot && themeVoteSpot === eatery.id;
  const votedForOther = !!themeVoteSpot && themeVoteSpot !== eatery.id;

  const handleThemeVote = useCallback(async () => {
    if (!currentTheme || votedForThis || themeCasting) return;
    // Only confirm when switching an existing vote to this spot.
    if (votedForOther && !themeVotePending) { setThemeVotePending(true); return; }
    setThemeCasting(true);
    const result = await castThemeVote(currentTheme.id, eatery.id, eatery.name, { title: currentTheme.title });
    setThemeCasting(false);
    if (result.ok) { setThemeVoteSpotLocal(eatery.id); setThemeVotePending(false); }
  }, [currentTheme, votedForThis, votedForOther, themeCasting, themeVotePending, eatery.id, eatery.name]);

  const onTouchStart = (e) => (dragStart.current = e.touches[0].clientY);
  const onTouchEnd = (e) => {
    if (dragStart.current == null) return;
    const dy = e.changedTouches[0].clientY - dragStart.current;
    dragStart.current = null;
    const order = ["peek", "half", "full"];
    const i = order.indexOf(snap);
    if (dy < -40) setSnap(order[Math.min(i + 1, 2)]);
    else if (dy > 40) (i === 0 ? onClose() : setSnap(order[i - 1]));
  };

  const wrap = isMobile
    ? {
        position: "absolute", left: 0, right: 0, bottom: 0,
        height: `${SNAPS[snap]}%`,
        background: "var(--cream-hi)",
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        boxShadow: "0 -8px 30px rgba(44,36,24,.22)",
        borderTop: "1.5px solid var(--line)",
        zIndex: 1200,
        display: "flex", flexDirection: "column",
        animation: "sheet-up .3s cubic-bezier(.22,1,.36,1)",
        transition: "height .28s cubic-bezier(.22,1,.36,1)",
        overflow: "hidden",
      }
    : {
        position: "absolute", top: 14, right: 14,
        width: 348, maxHeight: "calc(100% - 28px)",
        background: "var(--cream-hi)", borderRadius: 24,
        border: "1.5px solid var(--line)",
        boxShadow: "var(--shadow-pop)",
        zIndex: 1200,
        display: "flex", flexDirection: "column",
        animation: "card-in .28s cubic-bezier(.22,1,.36,1)",
        overflow: "hidden",
      };

  const showPhoto = !isMobile || snap !== "peek";

  return (
    <div style={wrap}>
      {isMobile && (
        <div
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onClick={() => setSnap(snap === "full" ? "half" : "full")}
          style={{ padding: "10px 0 4px", display: "flex", justifyContent: "center", cursor: "grab", flexShrink: 0, touchAction: "none" }}
        >
          <div style={{ width: 44, height: 5, borderRadius: 3, background: "var(--line)" }} />
        </div>
      )}

      {showPhoto && (
        <div
          style={{
            height: isMobile ? 130 : 150,
            background: photoUrl ? `url(${photoUrl}) center/cover no-repeat` : cat.color,
            position: "relative", flexShrink: 0,
          }}
        >
          {visited && (
            <div
              style={{
                position: "absolute", top: 10, left: 10,
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
          {!isMobile && (
            <button onClick={onClose} style={closeBtn} aria-label="Close">
              <Icon name="close" size={16} width={2.2} color="var(--cream-hi)" />
            </button>
          )}
        </div>
      )}

      <div style={{ padding: "13px 16px 18px", overflowY: "auto", flex: 1 }}>
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
          {/* Always reachable. This used to render on desktop only, leaving the
              mobile sheet closable just by dragging or by a button buried at the
              bottom of the scroll. */}
          <button onClick={onClose} className="pressable-sm" style={headerClose} aria-label="Close">
            <Icon name="close" size={16} width={2.2} color="var(--ink-soft)" />
          </button>
        </div>

        {eatery.blurb && (
          <p style={{ margin: "11px 0 0", fontSize: 13.5, lineHeight: 1.5, color: "var(--ink-soft)" }}>
            {eatery.blurb}
          </p>
        )}

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "12px 0" }}>
          {open != null && (
            <span style={{ ...chip, background: open ? "#e2eede" : "#f8e3dd", color: open ? "var(--forest)" : "var(--restro-bar)", borderColor: "transparent" }}>
              <Icon name="clock" size={13} width={2.1} /> {open ? "Open now" : "Closed"}
            </span>
          )}
          {eatery.rating && (
            <span style={chip}>
              <Icon name="star" size={13} width={2} color="var(--pop-deep)" /> {eatery.rating}
              <span style={{ color: "var(--muted)", fontWeight: 500 }}>({eatery.ratingCount?.toLocaleString()})</span>
            </span>
          )}
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
            Stamp it while you're here to claim <strong style={{ color: "var(--pop-deep)" }}>+{tier.points} pts</strong> for the Race.{" "}
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

        {/* Top Pick, a hand-picked "what to order" note, only a few spots have one */}
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
                  {pick.curator && <span>, {pick.curator}</span>}
                  {pick.curator && pick.note && <span> · </span>}
                  {pick.note}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Collecting is the point of the product, this is the primary action */}
        <button
          onClick={() => onToggleVisited(eatery.id)}
          style={{
            ...btn, width: "100%", height: 48, fontSize: 15,
            background: visited ? "var(--pop-wash)" : "var(--pop)",
            color: visited ? "var(--pop-deep)" : "var(--ink)",
            border: `2px solid ${visited ? "var(--pop)" : "transparent"}`,
            marginBottom: 8,
          }}
        >
          <Icon name={visited ? "check" : "ticket"} size={18} width={2.1} />
          {visited ? "Collected, tap to undo" : "Stamp this spot"}
        </button>

        <div style={{ display: "flex", gap: 7, marginBottom: 8 }}>
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
            style={{ ...btn, flex: 1, background: "var(--cafe)", color: "var(--cream-hi)", textDecoration: "none" }}
          >
            <Icon name="navigate" size={16} width={2} /> Directions
          </a>
        </div>

        <a
          href={`/spot/${eatery.id}`}
          style={{ ...btn, width: "100%", background: "var(--cream)", color: "var(--ink-soft)", border: "1.5px solid var(--line)", textDecoration: "none", fontSize: 13 }}
        >
          <Icon name="book" size={15} width={1.9} /> View full page
        </a>

        <div style={{ display: "flex", gap: 7 }}>
          {eatery.website && (
            <a href={eatery.website} target="_blank" rel="noopener noreferrer"
               style={{ ...btn, flex: 1, background: "var(--cream)", color: "var(--ink-soft)", border: "1.5px solid var(--line)", textDecoration: "none", fontSize: 13 }}>
              <Icon name="globe" size={15} width={1.9} /> Website
            </a>
          )}
          {eatery.phone && (
            <a href={`tel:${eatery.phone.replace(/\s/g, "")}`}
               style={{ ...btn, flex: 1, background: "var(--cream)", color: "var(--ink-soft)", border: "1.5px solid var(--line)", textDecoration: "none", fontSize: 13 }}>
              <Icon name="phone" size={15} width={1.9} /> Call
            </a>
          )}
        </div>

        {/* Collect a dish sticker from this spot */}
        <button
          onClick={() => onAddSticker?.(eatery)}
          style={{ ...btn, width: "100%", marginTop: 8, background: "var(--pop-wash)", color: "var(--pop-deep)", border: "1.5px solid var(--pop)" }}
        >
          <Icon name="ticket" size={16} width={2} /> Make a dish sticker
        </button>

        {/* Community vote, no login, one per device */}
        <div style={{
          marginTop: 10,
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
          <div style={{ marginTop: 10 }}>
            {themeVotePending && (
              <div style={{ fontSize: 12.5, color: "#92400e", background: "#fef3c7", border: "1.5px solid #f59e0b", borderRadius: "var(--r-md)", padding: "8px 12px", marginBottom: 6, fontWeight: 600, lineHeight: 1.4 }}>
                <>You already voted for a different spot in this theme. Switch your vote to <b>{eatery.name}</b>?</>
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

        {eatery.hours?.length > 0 && (snap === "full" || !isMobile) && (
          <details style={{ marginTop: 13 }}>
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

const closeBtn = {
  position: "absolute", top: 10, right: 10,
  background: "rgba(38,48,92,.45)",
  backdropFilter: "blur(8px)",
  border: "none", borderRadius: "50%",
  width: 32, height: 32, cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
};

const headerClose = {
  width: 32, height: 32, minWidth: 32,
  borderRadius: "50%", border: "none",
  background: "rgba(38,48,92,0.06)",
  cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
};
