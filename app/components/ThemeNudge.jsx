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
    <div
      style={{
        position: "absolute",
        top: 12,
        left: 12,
        right: 12,
        zIndex: 1000,
        maxWidth: 420,
        margin: "0 auto",
        display: "flex",
        alignItems: "center",
        border: "1.5px solid var(--line)",
        borderRadius: 16,
        background: "var(--cream-hi)",
        boxShadow: "var(--shadow-soft)",
      }}
    >
    <button
      type="button"
      onClick={onVote}
      className="pressable-sm"
      style={{
        flex: 1,
        minWidth: 0,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "11px 4px 11px 14px",
        border: "none",
        borderRadius: 16,
        background: "transparent",
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <span
        style={{
          width: 34,
          height: 34,
          borderRadius: 12,
          background: "var(--violet-wash)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon name="trophy" size={17} width={1.9} color="var(--violet)" />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
          This week
        </span>
        <span style={{ display: "block", fontSize: 13.5, fontWeight: 750, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {theme.title}
        </span>
      </span>
      <span style={{ flexShrink: 0, fontSize: 12.5, fontWeight: 800, color: "var(--violet)" }}>
        Vote
      </span>
    </button>
    <button
      type="button"
      onClick={dismiss}
      aria-label="Hide this week's vote banner"
      className="pressable-sm"
      style={{ flexShrink: 0, width: 40, height: 44, marginRight: 4, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <Icon name="close" size={15} width={2.2} color="var(--muted)" />
    </button>
    </div>
  );
}
