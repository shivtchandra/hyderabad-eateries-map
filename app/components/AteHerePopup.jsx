"use client";

import { Icon } from "./Icons.jsx";

// Shown after "I ate here": the sheet has closed, this confirms what just happened
// (stamp + Race points + rank) and offers the optional next steps.
// result: { state: "claiming" | "claimed" | "already" | "failed", awarded?, rank?, reason? }
export default function AteHerePopup({ spot, result, onOrder, onShare, onRetry, onClose }) {
  const s = result?.state || "claiming";
  const title =
    s === "claiming" ? "Adding to the Race…" :
    s === "claimed" ? `+${result.awarded} pts` :
    s === "already" ? "Already yours" :
    "Stamped to your passport";

  return (
    <div className="ate-backdrop" onClick={onClose}>
      <div className="ate-card" role="dialog" aria-label="You ate here" onClick={(e) => e.stopPropagation()}>
        <span className={`ate-badge ${s}`} aria-hidden="true">
          <Icon name={s === "failed" ? "check" : "trophy"} size={30} width={1.9} color="#fff" />
        </span>
        <div className="ate-title">{title}</div>
        <div className="ate-spot">{spot.name}{s === "claimed" ? " is yours" : ""}</div>
        <div className="ate-sub">
          {s === "claiming" && "Stamped to your passport. Counting your Race points…"}
          {(s === "claimed" || s === "already") && (result.rank ? `You're #${result.rank} in the Race` : "Counted on the Race board")}
          {s === "failed" && `Race points didn't go through (${result.reason || "network"}).`}
        </div>

        {s === "failed" ? (
          <button type="button" className="ate-primary" onClick={onRetry}>Try the Race claim again</button>
        ) : (
          <button type="button" className="ate-primary" onClick={onOrder} disabled={s === "claiming"}>
            What did you order?
          </button>
        )}
        <div className="ate-row">
          {(s === "claimed" || s === "already") && (
            <button type="button" onClick={onShare}>
              <Icon name="share" size={14} width={2} color="var(--violet-deep)" /> Share
            </button>
          )}
          <button type="button" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}
