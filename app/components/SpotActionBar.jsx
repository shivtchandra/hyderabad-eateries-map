"use client";

import { useEffect, useState } from "react";
import * as passportStore from "../../lib/passport.js";

// The spot page's one bar (DESIGN.md, Spot page): Directions in violet, then
// Save and Share as quiet square tiles. Save writes the same passport store as
// the app, so a spot saved here shows up under You > Saved.
export default function SpotActionBar({ spotId, name, path, directionsUrl }) {
  const [saved, setSaved] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    setSaved(!!passportStore.getState().saved[spotId]);
  }, [spotId]);

  const flash = (msg) => { setNote(msg); window.setTimeout(() => setNote(""), 1800); };

  const toggleSave = () => {
    const next = passportStore.toggleSaved(spotId);
    const on = !!next.saved[spotId];
    setSaved(on);
    flash(on ? "Saved to You" : "Removed from saved");
  };

  const share = async () => {
    const url = `${window.location.origin}${path}`;
    try {
      if (navigator.share) { await navigator.share({ title: name, url }); return; }
      await navigator.clipboard.writeText(url);
      flash("Link copied");
    } catch {}
  };

  return (
    <div className="sp-bar" role="region" aria-label="Spot actions">
      {note && <p className="sp-bar-note" role="status">{note}</p>}
      <div className="sp-bar-inner">
        <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="sp-bar-go">Directions</a>
        <button type="button" className="sp-bar-tile" aria-pressed={saved} aria-label={saved ? "Saved" : "Save"} onClick={toggleSave}>
          <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M6 3h12v18l-6-4-6 4z" /></svg>
        </button>
        <button type="button" className="sp-bar-tile" aria-label="Share" onClick={share}>
          <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12M7 8l5-5 5 5M5 14v6h14v-6" /></svg>
        </button>
      </div>
    </div>
  );
}
