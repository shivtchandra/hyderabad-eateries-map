"use client";

// Soft map banner: keep the weekly vote in sight without a login wall.
import { useEffect, useState } from "react";
import { hasThemeVoted } from "../../lib/themeVoting.js";
import { Icon } from "./Icons.jsx";

// Closing it hides the banner for this theme only (per device); next week's shows again.
const DISMISS_KEY = "hyd-theme-nudge-dismissed";
const isDismissed = (id) => { try { return localStorage.getItem(DISMISS_KEY) === id; } catch { return false; } };

export default function ThemeNudge({ theme, onVote }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!theme?.id || theme.winnerId) {
      setShow(false);
      return;
    }
    const check = () => setShow(!hasThemeVoted(theme.id) && !isDismissed(theme.id));
    check();
    const onFocus = () => check();
    window.addEventListener("focus", onFocus);
    const id = window.setInterval(check, 2500);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.clearInterval(id);
    };
  }, [theme?.id, theme?.winnerId]);

  if (!show || !theme) return null;

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, theme.id); } catch {}
    setShow(false);
  };

  return (
    <div className="vote-card" role="region" aria-label="This week's vote">
      <button type="button" onClick={onVote} className="vote-card-main">
        <span className="vote-card-kicker"><span className="vote-card-dot" />Live vote</span>
        <span className="vote-card-title">{hook(theme.title)}</span>
      </button>
      <button type="button" onClick={onVote} className="vote-card-go pressable-sm" aria-label={`Vote: ${theme.title}`}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M7 17L17 7M9 7h8v8" />
        </svg>
      </button>
      <button type="button" onClick={dismiss} aria-label="Hide this week's vote" className="vote-card-close pressable-sm">
        <Icon name="close" size={15} width={2.2} color="currentColor" />
      </button>
    </div>
  );
}

// "Best Ice Cream in Hyderabad" reads as a label; the reels open on a question
// ("Hyderabad's best ice cream?") and that is what gets the tap.
function hook(title = "") {
  const m = title.match(/^best (.+?) in hyderabad$/i);
  return m ? `Hyderabad’s best ${m[1].toLowerCase()}?` : title;
}
