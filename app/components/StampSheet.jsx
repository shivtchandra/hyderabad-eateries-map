"use client";

import { useRef, useState, useEffect } from "react";
import { addEntry, putReceipt } from "../../lib/diary.js";
import { fetchDishes, voteDishes, hasVotedDishes } from "../../lib/dishVotes.js";
import { Icon, CategoryIcon } from "./Icons.jsx";

const CAT_COLOR = {
  "restro-bar": "var(--restro-bar)",
  cafe: "var(--cafe)",
  bakery: "var(--bakery)",
  "ice-cream": "var(--ice-cream)",
  local: "var(--local)",
};

// Shown when you stamp a spot. Everything here is optional, the stamp lands
// whether or not you fill anything in, because friction is what kills a
// journalling habit. But the receipt, the dish and the spend are what turn a
// checklist into a diary a year from now.
export default function StampSheet({ eatery, onDone, onCancel }) {
  const [dish, setDish] = useState(""); // free-text "something else"
  const [known, setKnown] = useState([]); // dishes others ordered here
  const [picked, setPicked] = useState([]);
  const [again, setAgain] = useState(null); // would you order it again?
  const alreadyVoted = typeof window !== "undefined" && hasVotedDishes(eatery.id);

  useEffect(() => {
    let live = true;
    fetchDishes(eatery.id).then((d) => { if (live) setKnown(d.slice(0, 8).map((x) => x.name)); });
    return () => { live = false; };
  }, [eatery.id]);

  const togglePick = (name) => setPicked((p) => (p.includes(name) ? p.filter((x) => x !== name) : [...p, name]));
  const allDishes = [...picked, ...(dish.trim() ? [dish.trim()] : [])];
  const [spend, setSpend] = useState("");
  const [note, setNote] = useState("");
  const [receipt, setReceipt] = useState(null);
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!receipt) { setPreview(null); return; }
    const url = URL.createObjectURL(receipt);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [receipt]);

  const color = CAT_COLOR[eatery.category] ?? "var(--muted)";

  async function save() {
    setSaving(true);
    const entry = addEntry(eatery.id, {
      dish: allDishes.join(", "),
      spend: spend ? Number(spend) : null,
      note: note.trim(),
      hasReceipt: !!receipt,
    });
    if (receipt) await putReceipt(entry.id, receipt);
    if (allDishes.length && again !== null && !alreadyVoted) await voteDishes(eatery.id, allDishes, again);
    setSaving(false);
    onDone(entry);
  }

  return (
    <div style={backdrop} onClick={onCancel}>
      <div style={sheet} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <span style={{ background: "var(--cream)", border: `1.5px solid ${color}`, borderRadius: 12, width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CategoryIcon category={eatery.category} size={21} width={1.9} color={color} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--muted)" }}>
              Stamping
            </div>
            <div style={{ fontFamily: "var(--font-display), system-ui, sans-serif", fontWeight: 600, fontSize: 16, lineHeight: 1.2 }}>
              {eatery.name}
            </div>
          </div>
          <button onClick={onCancel} style={iconBtn} aria-label="Cancel">
            <Icon name="close" size={16} width={2.2} color="var(--ink-soft)" />
          </button>
        </div>

        {/* Receipt, the proof and the keepsake */}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => setReceipt(e.target.files?.[0] ?? null)}
          style={{ display: "none" }}
        />
        <button
          onClick={() => fileRef.current?.click()}
          style={{
            width: "100%",
            border: `2px dashed ${receipt ? "var(--pop)" : "var(--line)"}`,
            background: receipt ? "var(--pop-wash)" : "var(--cream)",
            borderRadius: 14,
            padding: preview ? 8 : "18px 12px",
            cursor: "pointer",
            marginBottom: 12,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
          }}
        >
          {preview ? (
            <>
              <img src={preview} alt="Receipt" style={{ width: "100%", maxHeight: 150, objectFit: "cover", borderRadius: 9 }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--pop-deep)" }}>Receipt added, tap to change</span>
            </>
          ) : (
            <>
              <Icon name="ticket" size={24} width={1.7} color="var(--muted)" />
              <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink-soft)" }}>Snap the receipt</span>
              <span style={{ fontSize: 11.5, color: "var(--muted)" }}>Optional, but it&apos;s the bit you&apos;ll want later</span>
            </>
          )}
        </button>

        <div style={{ ...field, marginBottom: 10 }}>
          <span style={fieldLabel}>What did you have?</span>
          {known.length > 0 && (
            <div className="dish-chips">
              {known.map((name) => (
                <button key={name} type="button" className={picked.includes(name) ? "active" : undefined} aria-pressed={picked.includes(name)} onClick={() => togglePick(name)}>
                  {name}
                </button>
              ))}
            </div>
          )}
          <input
            value={dish}
            onChange={(e) => setDish(e.target.value)}
            placeholder={known.length ? "Something else? Type it" : "Filter coffee"}
            style={input}
            maxLength={48}
          />
        </div>

        {allDishes.length > 0 && !alreadyVoted && (
          <div className="dish-again">
            <span style={fieldLabel}>Would you order {allDishes.length > 1 ? "these" : "it"} again?</span>
            <div>
              <button type="button" className={again === true ? "yes active" : "yes"} aria-pressed={again === true} onClick={() => setAgain(again === true ? null : true)}>Yes, must order</button>
              <button type="button" className={again === false ? "no active" : "no"} aria-pressed={again === false} onClick={() => setAgain(again === false ? null : false)}>Skip it</button>
            </div>
            <small>Your answer helps others pick what to order here.</small>
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <label style={{ ...field, flex: 1 }}>
            <span style={fieldLabel}>Spend</span>
            <input
              value={spend}
              onChange={(e) => setSpend(e.target.value.replace(/[^\d]/g, ""))}
              placeholder="₹"
              inputMode="numeric"
              style={input}
            />
          </label>
        </div>

        <label style={{ ...field, marginBottom: 14 }}>
          <span style={fieldLabel}>Note to your future self</span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ask for the corner table. Skip the pasta."
            style={input}
          />
        </label>

        <button
          onClick={save}
          disabled={saving}
          style={{
            width: "100%", height: 48, border: "none", borderRadius: 14,
            background: "var(--pop)", color: "var(--cream-hi)",
            fontFamily: "var(--font-ui), sans-serif", fontWeight: 700, fontSize: 15,
            cursor: saving ? "default" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            opacity: saving ? 0.7 : 1,
          }}
        >
          <Icon name="check" size={18} width={2.6} />
          {saving ? "Saving…" : "Add to passport"}
        </button>
      </div>
    </div>
  );
}

const backdrop = {
  position: "absolute", inset: 0, zIndex: 1500,
  background: "rgba(20, 20, 20,0.35)",
  display: "flex", alignItems: "flex-end", justifyContent: "center",
  animation: "fade-in .18s ease",
};

const sheet = {
  width: "100%", maxWidth: 460,
  background: "var(--cream-hi)",
  borderTopLeftRadius: 24, borderTopRightRadius: 24,
  border: "1.5px solid var(--line)",
  padding: "16px 16px 20px",
  maxHeight: "92%", overflowY: "auto",
  animation: "sheet-up .28s cubic-bezier(.22,1,.36,1)",
};

const field = { display: "flex", flexDirection: "column", gap: 5 };
const fieldLabel = {
  fontSize: 11, fontWeight: 700, letterSpacing: "0.05em",
  textTransform: "uppercase", color: "var(--muted)",
};
const input = {
  height: 42, borderRadius: 12, border: "1.5px solid var(--line)",
  background: "var(--cream)", padding: "0 12px",
  fontFamily: "var(--font-ui), sans-serif", fontSize: 14.5, fontWeight: 500,
  color: "var(--ink)", outline: "none", width: "100%",
};
const iconBtn = {
  width: 34, height: 34, minWidth: 34, borderRadius: "50%",
  border: "1.5px solid var(--line)", background: "var(--cream)",
  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
};
