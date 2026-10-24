"use client";

import { useEffect, useRef, useState } from "react";
import { photoUrl } from "../../lib/spotlight.js";
import { Icon } from "./Icons.jsx";

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
  spots, total, activeId, onActivate, onOpen, passport, featuredIds, voteMap = {}, onVote, distMap = {}, picksMap = {}, starOfWeek = null,
  open: openProp, onOpenChange,
}) {
  const railRef = useRef(null);
  const suppress = useRef(false);
  const shownId = useRef(null); // card last tapped to show on the map
  useEffect(() => { if (activeId !== shownId.current) shownId.current = null; }, [activeId]);
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

  // Collapsed: a small pill, tap to bring the rail back.
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="rail-pill pressable-sm">
        <Icon name="chevronDown" size={14} width={2.3} color="var(--muted)" style={{ transform: "rotate(180deg)" }} />
        {total ?? spots.length} spot{(total ?? spots.length) === 1 ? "" : "s"} here
      </button>
    );
  }

  // Compact cards (photo, name, one line of type + area, one signal). The map
  // leads; the rail is a quick index. Points, votes and the rest live in the
  // spot sheet, one tap away.
  return (
    <>
      <button type="button" onClick={() => setOpen(false)} aria-label="Hide cards" className="rail-hide pressable-sm">
        <Icon name="chevronDown" size={14} width={2.3} color="var(--muted)" />
      </button>

      <div ref={railRef} onScroll={onScroll} data-map-rail="" className="rail">
        {spots.map((e) => {
          const active = e.id === activeId;
          const cat = CAT_META[e.c ?? e.category] ?? CAT_META.cafe;
          const area = e.discoveredIn && !String(e.discoveredIn).startsWith("text:") ? e.discoveredIn : "";
          const distKm = distMap[e.id] ?? null;
          const signal = [
            e.rating ? `Google ★ ${Number(e.rating).toFixed(1)}` : "",
            PRICE_ESTIMATE[e.priceLevel] || "",
            distKm != null ? (distKm < 1 ? `${Math.round(distKm * 1000)} m` : `${distKm.toFixed(1)} km`) : "",
          ].filter(Boolean).join(" · ");
          const collected = !!passport?.visited?.[e.id];
          return (
            <button
              key={e.id}
              data-id={e.id}
              type="button"
              className={`rail-card${active ? " is-active" : ""}`}
              onClick={() => {
                // First tap shows the spot on the map (fly to its pin, no sheet);
                // tapping the same card again opens its details.
                if (shownId.current === e.id) { onOpen?.(e.id); return; }
                shownId.current = e.id;
                onActivate(e.id, { fromRail: true, fly: true });
              }}
              aria-label={`${e.name}, ${cat.label}${area ? `, ${area}` : ""}`}
            >
              <span className="rail-card-photo" style={{ background: cat.color }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoUrl(e.id)} alt="" loading="lazy" onError={(ev) => { ev.currentTarget.style.display = "none"; }} />
                {collected && <span className="rail-card-stamp" aria-hidden="true"><Icon name="check" size={12} width={2.6} color="#fff" /></span>}
              </span>
              <span className="rail-card-text">
                <b>{e.name}</b>
                <span>{cat.label}{area ? ` · ${area}` : ""}</span>
                {signal && <span className="rail-card-signal">{signal}</span>}
              </span>
            </button>
          );
        })}
        {total > spots.length && (
          <div className="rail-more" aria-live="polite">
            <b>+{total - spots.length}</b>
            <span>more here. Zoom in to see them.</span>
          </div>
        )}
      </div>
    </>
  );
}
