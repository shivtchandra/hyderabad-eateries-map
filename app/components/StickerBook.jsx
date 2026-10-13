"use client";

import { useEffect, useMemo, useState } from "react";
import { stickerList, getStickerBlob, removeSticker } from "../../lib/stickers.js";
import { Icon, Wave } from "./Icons.jsx";

// The 4th tab: a wall of every dish you've collected, each a die-cut sticker
// tagged with the place and date. This is the shareable artifact, "my
// Hyderabad in N dishes", and the visual counterpart to the passport's stamps.
export default function StickerBook({ onAddSticker, onOpenSpot, refreshTick = 0 }) {
  const [items, setItems] = useState([]);
  const [urls, setUrls] = useState({});
  const [selectedSticker, setSelectedSticker] = useState(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps -- refreshTick re-reads
  const list = useMemo(() => stickerList(), [refreshTick]);

  useEffect(() => setItems(list), [list]);

  // Pull the PNG blobs out of IndexedDB into object URLs for display.
  useEffect(() => {
    let alive = true;
    const made = [];
    (async () => {
      const next = {};
      for (const s of list) {
        const blob = await getStickerBlob(s.id);
        if (!blob) continue;
        const u = URL.createObjectURL(blob);
        next[s.id] = u;
        made.push(u);
      }
      if (alive) setUrls(next);
      else made.forEach((u) => URL.revokeObjectURL(u));
    })();
    return () => { alive = false; made.forEach((u) => URL.revokeObjectURL(u)); };
  }, [list]);

  async function del(id) {
    await removeSticker(id);
    setItems((prev) => prev.filter((s) => s.id !== id));
    if (selectedSticker?.id === id) setSelectedSticker(null);
  }

  const count = items.length;

  return (
    <div style={{ flex: 1, overflowY: "auto", background: "var(--cream)" }}>
      {/* Header Banner */}
      <div style={{ background: "var(--pop)", position: "relative", paddingTop: 24, overflow: "hidden" }}>
        <div style={{ textAlign: "center", padding: "0 16px 4px", position: "relative" }}>
          <div className="groovy" style={{ fontSize: 60, lineHeight: 0.92, color: "var(--cream-hi)", textShadow: "0 3px 0 rgba(20, 20, 20,.18)" }}>
            {count}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--cream-hi)", marginTop: 6 }}>
            {count === 1 ? "dish sticker collected" : "dish stickers collected"}
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", marginTop: 3 }}>
            Die-cut stickers cut directly from your phone camera
          </div>
        </div>
        <Wave height={44} color="var(--cream)" style={{ marginTop: 12 }} />
      </div>

      <div style={{ padding: "8px 14px 110px" }}>
        {count === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 18px", color: "var(--muted)" }}>
            <Icon name="ticket" size={48} width={1.4} color="var(--line)" style={{ margin: "0 auto 12px" }} />
            <div style={{ fontFamily: "var(--font-display), system-ui, sans-serif", fontWeight: 600, fontSize: 17, color: "var(--ink)" }}>
              Your sticker book is empty
            </div>
            <div style={{ fontSize: 13.5, marginTop: 6, lineHeight: 1.5, maxWidth: 300, margin: "6px auto 0" }}>
              Snap a dish you loved, we cut it into a sticker, right on your phone, and it lands here.
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(108px,1fr))", gap: 14 }}>
            {items.map((s) => (
              <div key={s.id} style={{ position: "relative", textAlign: "center" }}>
                {/* Sticker Card Button */}
                <button
                  type="button"
                  onClick={() => setSelectedSticker(s)}
                  style={{
                    width: "100%", aspectRatio: "1", border: "1px solid rgba(0,0,0,0.06)",
                    background: "#ffffff",
                    borderRadius: 18, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", padding: 8,
                    boxShadow: "0 4px 12px rgba(15,23,42,0.06)",
                    transition: "transform 120ms ease, box-shadow 120ms ease",
                  }}
                >
                  {urls[s.id] ? (
                    <img
                      src={urls[s.id]}
                      alt={s.dish ?? "sticker"}
                      style={{
                        maxWidth: "100%",
                        maxHeight: "100%",
                        objectFit: "contain",
                        filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.15))",
                      }}
                    />
                  ) : (
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--line)" }} />
                  )}
                </button>

                {/* Direct Download Button */}
                {urls[s.id] && (
                  <a
                    href={urls[s.id]}
                    download={`${(s.dish || "dish-sticker").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`}
                    title="Download sticker PNG"
                    aria-label="Download sticker"
                    onClick={(ev) => ev.stopPropagation()}
                    style={downloadBtn}
                  >
                    <Icon name="download" size={11} width={2.4} color="#ffffff" />
                  </a>
                )}

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={(ev) => { ev.stopPropagation(); del(s.id); }}
                  aria-label="Remove sticker"
                  title="Remove sticker"
                  style={delBtn}
                >
                  <Icon name="close" size={11} width={2.6} color="#ffffff" />
                </button>

                {/* Labels */}
                <div style={{ marginTop: 6, fontSize: 12, fontWeight: 700, fontFamily: "var(--font-outfit), sans-serif", color: "var(--ink)", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {s.dish ?? "Dish"}
                </div>
                {s.spotName && (
                  <div style={{ fontSize: 10.5, color: "var(--muted)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.spotName}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Enlarged Sticker Preview & Download Modal */}
      {selectedSticker && (
        <div
          onClick={() => setSelectedSticker(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2000,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(340px, 92vw)",
              background: "#ffffff",
              borderRadius: 24,
              padding: "24px 20px 20px",
              textAlign: "center",
              boxShadow: "0 24px 50px rgba(0,0,0,0.3)",
              animation: "detail-card-in .25s cubic-bezier(.2,1,.3,1)",
              position: "relative",
            }}
          >
            {/* Close */}
            <button
              onClick={() => setSelectedSticker(null)}
              style={{
                position: "absolute", top: 14, right: 14,
                width: 30, height: 30, borderRadius: "50%",
                background: "var(--cream)", border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <Icon name="close" size={14} width={2.2} color="var(--muted)" />
            </button>

            {/* Sticker Image */}
            <div style={{ width: 180, height: 180, margin: "10px auto 16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {urls[selectedSticker.id] && (
                <img
                  src={urls[selectedSticker.id]}
                  alt={selectedSticker.dish}
                  style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.2))" }}
                />
              )}
            </div>

            <h3 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700, color: "var(--ink)" }}>
              {selectedSticker.dish || "Dish Sticker"}
            </h3>
            {selectedSticker.spotName && (
              <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--muted)", fontWeight: 500 }}>
                {selectedSticker.spotName}
              </p>
            )}

            {/* Actions: Download Sticker & View on Map */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {urls[selectedSticker.id] && (
                <a
                  href={urls[selectedSticker.id]}
                  download={`${(selectedSticker.dish || "dish-sticker").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`}
                  style={{
                    height: 46,
                    borderRadius: 999,
                    background: "var(--violet)",
                    color: "#ffffff",
                    fontSize: 14,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 7,
                    textDecoration: "none",
                    boxShadow: "0 6px 18px rgba(15,23,42,0.25)",
                  }}
                >
                  <Icon name="download" size={16} width={2.2} color="#ffffff" />
                  Download Sticker (PNG)
                </a>
              )}

              {selectedSticker.spotId && onOpenSpot && (
                <button
                  type="button"
                  onClick={() => {
                    const spotId = selectedSticker.spotId;
                    setSelectedSticker(null);
                    onOpenSpot(spotId);
                  }}
                  style={{
                    height: 42,
                    borderRadius: 999,
                    background: "var(--cream)",
                    border: "1px solid var(--line)",
                    color: "var(--ink)",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <Icon name="map" size={15} width={2} color="var(--muted)" />
                  View Restaurant on Map
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating add button */}
      <button onClick={onAddSticker} className="pressable" style={fab}>
        <Icon name="ticket" size={18} width={2.2} color="#ffffff" />
        <span style={{ fontFamily: "var(--font-outfit), var(--font-ui), sans-serif", fontWeight: 700, fontSize: 14 }}>
          Snap New Sticker
        </span>
      </button>
    </div>
  );
}

const fab = {
  position: "absolute", bottom: 76, left: "50%", transform: "translateX(-50%)",
  border: "none", borderRadius: "var(--r-pill)",
  background: "var(--violet)",
  color: "#ffffff",
  padding: "12px 22px", cursor: "pointer",
  display: "flex", alignItems: "center", gap: 8,
  boxShadow: "0 8px 24px rgba(184,72,26,0.45)", zIndex: 1200,
};

const delBtn = {
  position: "absolute", top: -5, right: 6,
  width: 22, height: 22, borderRadius: "50%",
  background: "#dc2626", border: "1.5px solid #ffffff", cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
  boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
  zIndex: 3,
};

const downloadBtn = {
  position: "absolute", top: -5, left: 6,
  width: 22, height: 22, borderRadius: "50%",
  background: "var(--ink)", border: "1.5px solid #ffffff", cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
  boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
  textDecoration: "none",
  zIndex: 3,
};
