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
  }

  const count = items.length;

  return (
    <div style={{ flex: 1, overflowY: "auto", background: "var(--cream)" }}>
      <div style={{ background: "var(--pop)", position: "relative", paddingTop: 24, overflow: "hidden" }}>
        <div style={{ textAlign: "center", padding: "0 16px 4px", position: "relative" }}>
          <div className="groovy" style={{ fontSize: 60, lineHeight: 0.92, color: "var(--cream-hi)", textShadow: "0 3px 0 rgba(38,48,92,.18)" }}>
            {count}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--cream-hi)", marginTop: 6 }}>
            {count === 1 ? "dish collected" : "dishes collected"}
          </div>
        </div>
        <Wave height={44} color="var(--cream)" style={{ marginTop: 12 }} />
      </div>

      <div style={{ padding: "8px 14px 96px" }}>
        {count === 0 ? (
          <div style={{ textAlign: "center", padding: "26px 18px", color: "var(--muted)" }}>
            <Icon name="ticket" size={44} width={1.4} color="var(--line)" style={{ margin: "0 auto 12px" }} />
            <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 16, color: "var(--ink)" }}>
              Your sticker book is empty
            </div>
            <div style={{ fontSize: 13.5, marginTop: 6, lineHeight: 1.5, maxWidth: 300, margin: "6px auto 0" }}>
              Snap a dish you loved, we cut it into a sticker, right on your phone, and it lands here.
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(104px,1fr))", gap: 12 }}>
            {items.map((s) => (
              <div key={s.id} style={{ position: "relative", textAlign: "center" }}>
                <button
                  onClick={() => s.spotId && onOpenSpot?.(s.spotId)}
                  style={{
                    width: "100%", aspectRatio: "1", border: "none",
                    background: "repeating-conic-gradient(rgba(38,48,92,.03) 0% 25%, transparent 0% 50%) 0 0/16px 16px",
                    borderRadius: 16, cursor: s.spotId ? "pointer" : "default",
                    display: "flex", alignItems: "center", justifyContent: "center", padding: 6,
                  }}
                >
                  {urls[s.id]
                    ? <img src={urls[s.id]} alt={s.dish ?? "sticker"} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                    : <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--line)" }} />}
                </button>
                <div style={{ marginTop: 4, fontSize: 11.5, fontWeight: 600, fontFamily: "Fraunces, serif", color: "var(--ink)", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {s.dish ?? "Dish"}
                </div>
                {s.spotName && (
                  <div style={{ fontSize: 10, color: "var(--muted)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.spotName}
                  </div>
                )}
                <button onClick={() => del(s.id)} aria-label="Remove" style={delBtn}>
                  <Icon name="close" size={11} width={2.6} color="var(--cream-hi)" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating add button */}
      <button onClick={onAddSticker} className="pressable" style={fab}>
        <Icon name="ticket" size={19} width={2} color="var(--cream-hi)" />
        <span style={{ fontFamily: "Outfit", fontWeight: 700, fontSize: 14 }}>New sticker</span>
      </button>
    </div>
  );
}

const fab = {
  position: "absolute", bottom: 76, left: "50%", transform: "translateX(-50%)",
  border: "none", borderRadius: "var(--r-pill)",
  background: "var(--pop)", color: "var(--cream-hi)",
  padding: "12px 20px", cursor: "pointer",
  display: "flex", alignItems: "center", gap: 8,
  boxShadow: "0 6px 20px rgba(184,72,26,0.4)", zIndex: 1200,
};
const delBtn = {
  position: "absolute", top: -4, right: 8,
  width: 20, height: 20, borderRadius: "50%",
  background: "rgba(38,48,92,0.55)", border: "none", cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
};
