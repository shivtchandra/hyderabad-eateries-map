"use client";

import { useState } from "react";
import { Icon } from "./Icons.jsx";

export default function ShareRankingButton({ title, slug, leaderName, style }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = typeof window !== "undefined"
      ? `${window.location.origin}/rankings/${slug}`
      : `/rankings/${slug}`;
    const shareText = leaderName
      ? `${title}, live community ranking: ${leaderName} is leading right now! Check out the standings & vote:`
      : `${title}, live community ranking on Hyderabad Eats. Vote your favorite:`;
    const shareData = {
      title: `${title} — Hyderabad Eats`,
      text: shareText,
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
        await navigator.clipboard.writeText(`${shareText}\n${url}`);
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
        padding: "10px 18px",
        borderRadius: "var(--r-pill, 999px)",
        background: copied ? "#15803d" : "rgba(91, 33, 182, 0.08)",
        color: copied ? "#ffffff" : "var(--violet-deep, var(--violet-deep))",
        border: "1.5px solid " + (copied ? "#15803d" : "rgba(91, 33, 182, 0.2)"),
        fontSize: 13,
        fontWeight: 700,
        cursor: "pointer",
        transition: "all 0.2s ease",
        WebkitTapHighlightColor: "transparent",
        ...style,
      }}
      title="Share ranking"
    >
      <Icon name={copied ? "check" : "share"} size={14} width={2.2} color={copied ? "#ffffff" : "var(--violet-deep, var(--violet-deep))"} />
      <span>{copied ? "Link Copied!" : "Share Ranking"}</span>
    </button>
  );
}
