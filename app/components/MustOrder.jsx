"use client";

import { useEffect, useState } from "react";
import { fetchDishes, dishSourceLabel } from "../../lib/dishVotes.js";

// Source-labelled dishes at a spot: locals' reorder votes first, then editorial
// and reviewed r/hyderabad picks.
// Renders nothing until there is at least one dish, so empty spots stay clean.
export default function MustOrder({ spotId, initial = null, limit = 4 }) {
  const [dishes, setDishes] = useState(initial);

  useEffect(() => {
    let live = true;
    fetchDishes(spotId).then((d) => { if (live) setDishes(d); });
    return () => { live = false; };
  }, [spotId]);

  if (!dishes?.length) return null;
  return (
    <section className="must-order" aria-label="What to order">
      <div className="must-order-head">
        <h3>What to order</h3>
        <span>Each dish is labelled by source</span>
      </div>
      <ol>
        {dishes.slice(0, limit).map((d, i) => (
          <li key={d.name}>
            <span className="must-order-rank">{i + 1}</span>
            <span className="must-order-name">{d.name}</span>
            <span className={`must-order-src ${d.up > 0 ? "locals" : d.source}`}>{dishSourceLabel(d)}</span>
          </li>
        ))}
      </ol>
      <p className="must-order-foot">Been here? Stamp it and tell us what to order.</p>
    </section>
  );
}
