"use client";

import { Children, useEffect, useRef, useState } from "react";

// A row of cards you swipe sideways (scroll-snap), with dots and, on wider
// screens, prev/next buttons. Children are server-rendered cards, so every
// card's text is in the HTML for search.
export default function SwipeDeck({ children, label = "Cards" }) {
  const ref = useRef(null);
  const [active, setActive] = useState(0);
  const count = Children.count(children);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      const w = el.firstElementChild?.getBoundingClientRect().width || el.clientWidth;
      setActive(Math.max(0, Math.min(count - 1, Math.round(el.scrollLeft / (w + 12)))));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [count]);

  const go = (i) => {
    const el = ref.current;
    const card = el?.children[Math.max(0, Math.min(count - 1, i))];
    if (card) el.scrollTo({ left: card.offsetLeft - el.offsetLeft, behavior: "smooth" });
  };

  return (
    <section className="deck" aria-label={label} aria-roledescription="carousel">
      <div className="deck-track" ref={ref}>
        {Children.map(children, (c, i) => (
          <div className="deck-slide" aria-roledescription="slide" aria-label={`${i + 1} of ${count}`}>{c}</div>
        ))}
      </div>
      <div className="deck-foot">
        <button type="button" className="deck-btn" onClick={() => go(active - 1)} disabled={active === 0} aria-label="Previous">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        <div className="deck-dots" role="tablist" aria-label="Go to card">
          {Array.from({ length: count }, (_, i) => (
            <button key={i} type="button" role="tab" aria-selected={i === active} aria-label={`Card ${i + 1}`} className={`deck-dot${i === active ? " is-on" : ""}`} onClick={() => go(i)} />
          ))}
        </div>
        <button type="button" className="deck-btn" onClick={() => go(active + 1)} disabled={active === count - 1} aria-label="Next">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
    </section>
  );
}
