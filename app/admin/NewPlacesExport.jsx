"use client";

import { useEffect, useMemo, useState } from "react";
import { newPlacesCaption } from "../../lib/newPlaces.js";

const escapeXml = (value = "") => String(value).replace(/[<>&'"]/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[char]));

const titleLines = (value, max = 18) => {
  const words = String(value || "").split(/\s+/);
  const lines = [];
  for (const word of words) {
    const last = lines.at(-1);
    if (!last || `${last} ${word}`.length > max) lines.push(word);
    else lines[lines.length - 1] = `${last} ${word}`;
  }
  return lines.slice(0, 4);
};

function slideSvg({ kind, count, index = 1, place }) {
  const isPlace = kind === "place";
  const lines = titleLines(isPlace ? place.name : kind === "end" ? "Find every new pin on the map." : "Fresh Hyderabad food spots, this week.");
  const titleSize = isPlace ? (place.name.length > 34 ? 72 : 88) : 92;
  const lineHeight = Math.round(titleSize * 1.04);
  const title = lines.map((line, i) => `<text x="72" y="${470 + i * lineHeight}" font-family="Arial, sans-serif" font-size="${titleSize}" font-weight="900" fill="#172554">${escapeXml(line)}</text>`).join("");
  const kicker = isPlace ? "NEW THIS WEEK" : "HYDERABAD SERIES";
  const eyebrow = isPlace ? escapeXml((place.category || "restaurant").replace(/-/g, " ").toUpperCase()) : kind === "end" ? "ONE LAYER AT A TIME." : "NEW ON THE MAP";
  const sub = isPlace ? escapeXml(place.area || "Hyderabad") : kind === "end" ? "eats.mapmyhyd.com" : `${Math.max(0, count - 2)} reviewed places`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
    <rect width="1080" height="1350" fill="#F6F0E5"/>
    <circle cx="980" cy="340" r="260" fill="#FB9B76" opacity=".2"/>
    <circle cx="-30" cy="1280" r="300" fill="none" stroke="#5EEAD4" stroke-width="30" opacity=".24"/>
    <text x="72" y="105" font-family="Arial, sans-serif" font-size="25" font-weight="800" letter-spacing="4" fill="#1D4ED8">MAPPING HYD.</text>
    <text x="1008" y="105" text-anchor="end" font-family="Arial, sans-serif" font-size="22" font-weight="800" letter-spacing="3" fill="#172554">${kicker}</text>
    <text x="72" y="365" font-family="Arial, sans-serif" font-size="28" font-weight="800" letter-spacing="4" fill="#7C3AED">${eyebrow}</text>
    ${title}
    <text x="72" y="${470 + lines.length * lineHeight + 48}" font-family="Arial, sans-serif" font-size="34" font-weight="500" fill="#475569">${sub}</text>
    <rect x="72" y="${470 + lines.length * lineHeight + 105}" width="210" height="12" rx="6" fill="#1D4ED8"/>
    <text x="72" y="1278" font-family="Arial, sans-serif" font-size="24" font-weight="700" fill="#172554">@mapmyhyd</text>
    <text x="1008" y="1278" text-anchor="end" font-family="Arial, sans-serif" font-size="24" font-weight="700" fill="#172554">${index}/${count}</text>
  </svg>`;
}

function svgToPng(svg) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const href = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1080; canvas.height = 1350;
      canvas.getContext("2d").drawImage(image, 0, 0);
      URL.revokeObjectURL(href);
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("PNG export failed")), "image/png");
    };
    image.onerror = reject;
    image.src = href;
  });
}

export default function NewPlacesExport() {
  const [places, setPlaces] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/new-places").then((res) => res.json()).then((data) => setPlaces(data.places || [])).catch(() => setPlaces([]));
  }, []);

  const slides = useMemo(() => {
    const count = places.length + 2;
    return [
      { name: "01-cover.png", svg: slideSvg({ kind: "cover", count, index: 1 }) },
      ...places.map((place, i) => ({
        name: `${String(i + 2).padStart(2, "0")}-${place.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "place"}.png`,
        svg: slideSvg({ kind: "place", count, index: i + 2, place }),
      })),
      { name: `${String(count).padStart(2, "0")}-map.png`, svg: slideSvg({ kind: "end", count, index: count }) },
    ];
  }, [places]);

  const downloadAll = async () => {
    setMessage("Preparing slides…");
    for (const slide of slides) {
      const blob = await svgToPng(slide.svg);
      const href = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = href; link.download = slide.name; link.click();
      URL.revokeObjectURL(href);
    }
    setMessage(`${slides.length} slides downloaded.`);
  };

  const copyCaption = async () => {
    await navigator.clipboard.writeText(newPlacesCaption(places));
    setMessage("Caption copied.");
  };

  return (
    <section style={{ marginTop: 28 }}>
      <h2 style={{ fontFamily: "var(--font-display), system-ui, sans-serif", fontSize: 20, margin: "0 0 4px" }}>New this week · Instagram export</h2>
      <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 12px" }}>Uses places approved in the last seven days. Review the list before downloading; nothing is posted automatically.</p>
      {places.length === 0 ? <p style={{ fontSize: 13, color: "var(--muted)" }}>No newly approved places this week.</p> : (
        <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
          <img src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(slides[0].svg)}`} alt="New places carousel cover" width="162" height="203" style={{ borderRadius: 14, border: "1px solid var(--line)", objectFit: "cover" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <b>{places.length} reviewed place{places.length === 1 ? "" : "s"} · {slides.length} slides</b>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={downloadAll} style={{ height: 36, padding: "0 14px", borderRadius: 999, border: "none", background: "var(--violet)", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Download carousel</button>
              <button onClick={copyCaption} style={{ height: 36, padding: "0 14px", borderRadius: 999, border: "1.5px solid var(--line)", background: "var(--cream-hi)", fontWeight: 700, cursor: "pointer" }}>Copy caption</button>
            </div>
            {message && <span style={{ fontSize: 12.5, color: "var(--muted)" }}>{message}</span>}
          </div>
        </div>
      )}
    </section>
  );
}
