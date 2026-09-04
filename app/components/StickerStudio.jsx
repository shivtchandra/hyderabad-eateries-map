"use client";

import { useRef, useState, useEffect } from "react";
import { makeSticker } from "../../lib/stickers.js";
import { Icon } from "./Icons.jsx";

// Capture → cutout → save. The cutout runs on-device and can take a while on a
// CPU-only phone, so the wait is framed as a Polaroid "developing" moment
// rather than a dead spinner, the raw photo sits under a shimmer while the
// model works, then the finished sticker springs in.
export default function StickerStudio({ spot, onDone, onCancel }) {
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dish, setDish] = useState("");
  const [phase, setPhase] = useState("pick"); // pick | developing | done
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState(null);

  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const u = URL.createObjectURL(file);
    setPreview(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  async function develop() {
    if (!file) { fileRef.current?.click(); return; }
    setPhase("developing");
    try {
      const rec = await makeSticker({
        spotId: spot?.id,
        spotName: spot?.name,
        dish,
        file,
        onProgress: (_k, cur, total) => total && setProgress(cur / total),
      });
      const { getStickerBlob } = await import("../../lib/stickers.js");
      const blob = await getStickerBlob(rec.id);
      if (blob) setResultUrl(URL.createObjectURL(blob));
      setPhase("done");
      // Give the reveal a beat before handing back.
      setTimeout(() => onDone?.(rec), 1400);
    } catch (e) {
      setPhase("pick");
      alert("Couldn't make the sticker, try a clearer photo.");
    }
  }

  return (
    <div style={backdrop} onClick={phase === "pick" ? onCancel : undefined}>
      <div style={sheet} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={kicker}>Dish sticker</div>
            <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 16, lineHeight: 1.2 }}>
              {spot?.name ?? "Your collection"}
            </div>
          </div>
          {phase === "pick" && (
            <button onClick={onCancel} className="pressable-sm" style={iconBtn} aria-label="Cancel">
              <Icon name="close" size={16} width={2.2} color="var(--ink-soft)" />
            </button>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          style={{ display: "none" }}
        />

        {/* Stage */}
        <div style={stage}>
          {phase === "done" && resultUrl ? (
            <img src={resultUrl} alt="sticker" className="sticker-pop" style={{ maxWidth: "78%", maxHeight: "78%", objectFit: "contain" }} />
          ) : preview ? (
            <>
              <img
                src={preview}
                alt="dish"
                style={{
                  maxWidth: "100%", maxHeight: "100%", objectFit: "cover",
                  filter: phase === "developing" ? "saturate(0.8) brightness(0.96)" : "none",
                  transition: "filter .4s",
                }}
              />
              {phase === "developing" && <div className="develop-shimmer" />}
            </>
          ) : (
            <button onClick={() => fileRef.current?.click()} style={emptyPick}>
              <Icon name="ticket" size={26} width={1.6} color="var(--muted)" />
              <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink-soft)" }}>Take or pick a photo of the dish</span>
              <span style={{ fontSize: 11.5, color: "var(--muted)" }}>We&apos;ll cut it into a sticker, right on your phone</span>
            </button>
          )}
        </div>

        {phase === "developing" && (
          <div style={{ marginTop: 12 }}>
            <div className="progress-track"><div className="progress-fill" style={{ width: `${Math.round(progress * 100)}%` }} /></div>
            <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 8, textAlign: "center", fontWeight: 600 }}>
              Developing your sticker…
            </div>
          </div>
        )}

        {phase === "pick" && preview && (
          <label style={{ display: "block", marginTop: 12 }}>
            <span style={kicker}>What is it?</span>
            <input
              value={dish}
              onChange={(e) => setDish(e.target.value)}
              placeholder="Chicken haleem"
              style={input}
            />
          </label>
        )}

        {phase === "pick" && (
          <button onClick={develop} disabled={!file} style={{ ...cta, opacity: file ? 1 : 0.5 }}>
            <Icon name="sparkle" size={17} width={2} /> Make sticker
          </button>
        )}
        {phase === "done" && (
          <div style={{ textAlign: "center", marginTop: 10, fontFamily: "Fraunces, serif", fontWeight: 600, color: "var(--pop-deep)" }}>
            Added to your book
          </div>
        )}
      </div>
    </div>
  );
}

const backdrop = {
  position: "absolute", inset: 0, zIndex: 1600,
  background: "rgba(38,48,92,0.4)",
  display: "flex", alignItems: "flex-end", justifyContent: "center",
  animation: "fade-in .18s ease",
};
const sheet = {
  width: "100%", maxWidth: 460, background: "var(--cream-hi)",
  borderTopLeftRadius: 24, borderTopRightRadius: 24,
  border: "1.5px solid var(--line)", padding: "16px 16px 20px",
  animation: "sheet-up .28s cubic-bezier(.22,1,.36,1)",
};
const stage = {
  position: "relative", width: "100%", aspectRatio: "1",
  borderRadius: 18, overflow: "hidden",
  background: "repeating-conic-gradient(#e7ddc9 0% 25%, #f1e9d6 0% 50%) 0 0/24px 24px",
  display: "flex", alignItems: "center", justifyContent: "center",
};
const emptyPick = {
  width: "100%", height: "100%", border: "none",
  background: "transparent", cursor: "pointer",
  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: 20, textAlign: "center",
};
const kicker = { fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted)" };
const input = {
  height: 42, width: "100%", marginTop: 5, borderRadius: 12,
  border: "1.5px solid var(--line)", background: "var(--cream)",
  padding: "0 12px", fontFamily: "Outfit, sans-serif", fontSize: 14.5, fontWeight: 500, color: "var(--ink)", outline: "none",
};
const cta = {
  width: "100%", height: 48, marginTop: 14, border: "none", borderRadius: 14,
  background: "var(--pop)", color: "var(--cream-hi)",
  fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: 15, cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
};
const iconBtn = {
  width: 34, height: 34, minWidth: 34, borderRadius: "50%",
  border: "1.5px solid var(--line)", background: "var(--cream)",
  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
};
