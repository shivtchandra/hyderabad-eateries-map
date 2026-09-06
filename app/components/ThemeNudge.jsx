"use client";

// Soft map banner: keep the weekly vote in sight without a login wall.
import { useEffect, useState } from "react";
import { hasThemeVoted } from "../../lib/themeVoting.js";
import { Icon } from "./Icons.jsx";

export default function ThemeNudge({ theme, onVote }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!theme?.id || theme.winnerId) {
      setShow(false);
      return;
    }
    const check = () => setShow(!hasThemeVoted(theme.id));
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

  return (
    <button
      type="button"
      onClick={onVote}
      className="pressable-sm"
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
        gap: 10,
        padding: "11px 14px",
        border: "1.5px solid var(--line)",
        borderRadius: 16,
        background: "var(--cream-hi)",
        boxShadow: "var(--shadow-soft)",
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
  );
}
