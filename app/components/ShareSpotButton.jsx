"use client";

import { useState } from "react";
import { Icon } from "./Icons.jsx";

export default function ShareSpotButton({ spotName, spotPath, style, variant = "pill" }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? `${window.location.origin}${spotPath}` : spotPath;
    const shareData = {
      title: `${spotName} — Hyderabad Eats`,
      text: `Check out ${spotName} on Hyderabad Eats!`,
      url,
    };

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (e) {
        if (e?.name === "AbortError") return;
      }
    }

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch {}
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: "8px 15px",
        borderRadius: 999,
        background: copied ? "#15803d" : "#f8fafc",
        color: copied ? "#ffffff" : "#334155",
        border: "1.5px solid rgba(0,0,0,0.08)",
        fontSize: 12.5,
        fontWeight: 700,
        cursor: "pointer",
        transition: "all 0.2s ease",
        WebkitTapHighlightColor: "transparent",
        ...style,
      }}
      title="Share place card"
    >
      <Icon name={copied ? "check" : "share"} size={14} width={2.2} color={copied ? "#ffffff" : "var(--violet-deep)"} />
      <span>{copied ? "Link Copied!" : "Share Place"}</span>
    </button>
  );
}
