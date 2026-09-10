"use client";

import { useMemo } from "react";
import { progressByArea, stats, biryaniTrailCount, shareProgress } from "../../lib/passport.js";
import { diaryStats } from "../../lib/diary.js";
import { Icon, CategoryIcon, Wave, Squiggles } from "./Icons.jsx";

const CAT_META = {
  restaurant: { label: "Restaurants", color: "var(--restaurant)" },
  "restro-bar": { label: "Restro Bars", color: "var(--restro-bar)" },
  cafe: { label: "Cafes", color: "var(--cafe)" },
  bakery: { label: "Bakeries", color: "var(--bakery)" },
  "ice-cream": { label: "Ice Cream", color: "var(--ice-cream)" },
  local: { label: "Local Eats", color: "var(--local)" },
};

const MILESTONES = [
  { at: 1, label: "First stamp", icon: "leaf" },
  { at: 5, label: "Getting around", icon: "navigate" },
  { at: 10, label: "Regular", icon: "cafe" },
  { at: 25, label: "Explorer", icon: "map" },
  { at: 50, label: "Connoisseur", icon: "sparkle" },
  { at: 100, label: "City legend", icon: "landmark" },
];

export default function PassportPanel({ eateries, passport, onSelect, diaryTick = 0 }) {
  const s = useMemo(() => stats(eateries, passport), [eateries, passport]);
  const areas = useMemo(() => progressByArea(eateries, passport), [eateries, passport]);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- diaryTick forces a
  // re-read after a new entry is written to localStorage/IndexedDB.
  const d = useMemo(() => diaryStats(eateries), [eateries, diaryTick]);

  const nextMilestone = MILESTONES.find((m) => m.at > s.visitedCount);
  const biryaniCount = biryaniTrailCount(eateries, passport);
  const earned = MILESTONES.filter((m) => m.at <= s.visitedCount);
  const extraBadges = biryaniCount >= 5 ? [{ at: 5, label: "Biryani explorer", icon: "utensils" }] : [];
  const pct = s.totalCount ? (s.visitedCount / s.totalCount) * 100 : 0;

  return (
    <div style={{ flex: 1, overflowY: "auto", background: "var(--cream)" }}>
      {/* Hero, the poster moment. Squiggles behind the number give it depth so
          it reads as a printed cover rather than a flat colour block. */}
      <div style={{ background: "var(--pop)", position: "relative", paddingTop: 26, overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: "-10% -5% 30%", opacity: 0.28, pointerEvents: "none" }}>
          <Squiggles color="var(--cream-hi)" opacity={1} />
        </div>

        <div style={{ textAlign: "center", padding: "0 16px 6px", position: "relative" }}>
          <div className="groovy" style={{ fontSize: 68, lineHeight: 0.92, color: "var(--cream-hi)", textShadow: "0 3px 0 rgba(38,48,92,.18)" }}>
            {s.visitedCount}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--cream-hi)", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 7 }}>
            {s.visitedCount === 1 ? "spot collected" : "spots collected"}
          </div>
          <div style={{ fontSize: 12, color: "var(--cream-hi)", opacity: 0.82, marginTop: 4, fontWeight: 500 }}>
            {pct < 0.1 && s.visitedCount > 0 ? "<0.1" : pct.toFixed(1)}% of Hyderabad ·{" "}
            {s.areasExplored} {s.areasExplored === 1 ? "area" : "areas"}
          </div>
        </div>
        <Wave height={46} color="var(--cream)" style={{ marginTop: 12 }} />
      </div>

      {/* Generous bottom padding so the last section can scroll clear of the
          fixed bottom nav instead of dying against it. */}
      <div style={{ padding: "4px 14px 48px" }}>

        {s.visitedCount > 0 && (
          <div style={{ marginBottom: 18 }}>
            <button
              onClick={() => shareProgress(s).catch(() => {})}
              className="pressable-sm"
              style={{
                width: "100%", border: "1.5px solid var(--line)", borderRadius: 14,
                padding: "12px 16px", background: "var(--cream-hi)", color: "var(--ink)",
                fontSize: 14, fontWeight: 600, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              <Icon name="sparkle" size={16} width={2} color="var(--violet)" />
              Share my progress
            </button>
          </div>
        )}

        {nextMilestone && (
          <div style={{ background: "var(--cream-hi)", border: "1.5px solid var(--line)", borderRadius: 16, padding: "13px 15px", marginBottom: 18 }}>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${(s.visitedCount / nextMilestone.at) * 100}%` }} />
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 8, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name={nextMilestone.icon} size={15} width={2} color="var(--pop-deep)" />
              {nextMilestone.at - s.visitedCount} more to {nextMilestone.label}
            </div>
          </div>
        )}

        {s.visitedCount === 0 && (
          <div style={{ textAlign: "center", padding: "18px 14px 26px", color: "var(--muted)" }}>
            <Icon name="passport" size={44} width={1.4} color="var(--line)" style={{ margin: "0 auto 12px" }} />
            <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 16, color: "var(--ink)" }}>
              Start exploring, every stamp colours the map
            </div>
            <div style={{ fontSize: 13.5, marginTop: 6, lineHeight: 1.5, maxWidth: 280, margin: "6px auto 0" }}>
              Tap a spot you&apos;ve been to and hit{" "}
              <strong style={{ color: "var(--pop-deep)" }}>Stamp this spot</strong>, it blooms into colour.
            </div>
          </div>
        )}

        {/* The diary, the part no other app can write about you */}
        {d.entryCount > 0 && (
          <Section title="Your food diary">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
              <Stat label="Visits logged" value={d.entryCount} />
              <Stat label="Receipts kept" value={d.receiptCount} />
              {d.totalSpend > 0 && <Stat label="Total spend" value={`₹${d.totalSpend.toLocaleString("en-IN")}`} />}
              {d.avgSpend != null && <Stat label="Average visit" value={`₹${d.avgSpend.toLocaleString("en-IN")}`} />}
            </div>

            {(d.topDish || d.mostVisited?.place) && (
              <div style={{ background: "var(--cream-hi)", border: "1.5px solid var(--line)", borderRadius: 16, padding: "13px 15px", fontSize: 13.5, lineHeight: 1.6, color: "var(--ink-soft)" }}>
                {d.topDish && (
                  <div>
                    Most ordered:{" "}
                    <strong style={{ color: "var(--ink)" }}>{d.topDish.dish}</strong>
                    {d.topDish.times > 1 && <> · {d.topDish.times}×</>}
                  </div>
                )}
                {d.mostVisited?.place && d.mostVisited.times > 1 && (
                  <div>
                    You keep going back to{" "}
                    <strong style={{ color: "var(--ink)" }}>{d.mostVisited.place.name}</strong> · {d.mostVisited.times}×
                  </div>
                )}
              </div>
            )}
          </Section>
        )}

{(earned.length > 0 || extraBadges.length > 0) && (
          <Section title="Badges earned">
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[...earned, ...extraBadges.filter((b) => !earned.some((e) => e.label === b.label))].map((m) => (
                <div
                  key={m.at}
                  style={{
                    background: "var(--cream-hi)", border: "1.5px solid var(--pop)",
                    borderRadius: 20, padding: "7px 13px",
                    display: "flex", alignItems: "center", gap: 7,
                    fontSize: 12.5, fontWeight: 600, color: "var(--pop-deep)",
                  }}
                >
                  <Icon name={m.icon} size={15} width={2} /> {m.label}
                </div>
              ))}
            </div>
          </Section>
        )}

        {s.visitedCount > 0 && (
          <Section title="By category">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(62px,1fr))", gap: 8 }}>
              {Object.entries(CAT_META).map(([key, meta]) => (
                <div
                  key={key}
                  style={{
                    background: "var(--cream-hi)", borderRadius: 15, padding: "12px 5px",
                    textAlign: "center", border: "1.5px solid var(--line)",
                  }}
                >
                  <CategoryIcon category={key} size={19} width={1.9} color={meta.color} style={{ margin: "0 auto" }} />
                  <div style={{ fontSize: 19, fontWeight: 700, color: meta.color, marginTop: 6, lineHeight: 1 }}>
                    {s.byCategory[key] ?? 0}
                  </div>
                  <div style={{ fontSize: 9, color: "var(--muted)", fontWeight: 600, marginTop: 4, letterSpacing: "0.02em" }}>{meta.label}</div>
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section title="Neighbourhoods">
          {areas.slice(0, 12).map((a) => (
            <div key={a.area} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600 }}>{a.area}</span>
                <span style={{ fontSize: 11.5, color: "var(--muted)", fontWeight: 600 }}>
                  {a.visited}/{a.total}
                </span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${(a.visited / a.total) * 100}%` }} />
              </div>
            </div>
          ))}
        </Section>

        {s.visited.length > 0 && (
          <Section title={`Stamps (${s.visited.length})`}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {s.visited.map((e) => {
                const meta = CAT_META[e.category] ?? CAT_META.cafe;
                const area = e.discoveredIn && !String(e.discoveredIn).startsWith("text:")
                  ? e.discoveredIn
                  : null;
                return (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => onSelect(e)}
                    className="pressable-sm"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      width: "100%",
                      textAlign: "left",
                      border: "1.5px solid var(--line)",
                      borderRadius: "var(--r-md)",
                      background: "linear-gradient(155deg, #fdf4e6, var(--pop-wash))",
                      boxShadow: "var(--e1)",
                      padding: "12px 14px",
                      cursor: "pointer",
                    }}
                  >
                    <span
                      style={{
                        width: 42,
                        height: 42,
                        minWidth: 42,
                        borderRadius: 12,
                        background: "var(--cream-hi)",
                        border: `1.5px solid ${meta.color}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <CategoryIcon
                        category={e.category}
                        size={22}
                        width={1.9}
                        color={meta.color}
                      />
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span
                        style={{
                          display: "block",
                          fontWeight: 700,
                          fontSize: 14,
                          color: "var(--ink)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {e.name}
                      </span>
                      <span style={{ display: "block", fontSize: 12, color: "var(--muted)", fontWeight: 500, marginTop: 2 }}>
                        {meta.label}{area ? ` · ${area}` : ""}
                      </span>
                    </span>
                    <Icon name="navigate" size={16} width={2} color="var(--muted)" />
                  </button>
                );
              })}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}

// Outfit, not the display face: Bagel Fat One has no ₹ glyph, so "₹240"
// fell back mid-string and rendered as two mismatched fonts. The groovy face
// is reserved for the hero number and the wordmark.
function Stat({ label, value }) {
  return (
    <div style={{ background: "var(--cream-hi)", border: "1.5px solid var(--line)", borderRadius: 15, padding: "12px 14px" }}>
      <div style={{ fontSize: 22, lineHeight: 1, fontWeight: 700, color: "var(--pop-deep)", letterSpacing: "-0.01em" }}>
        {value}
      </div>
      <div style={{ fontSize: 10.5, color: "var(--muted)", fontWeight: 600, marginTop: 5, letterSpacing: "0.02em" }}>
        {label}
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <h3
        style={{
          margin: "0 0 10px", fontSize: 11, fontWeight: 700,
          textTransform: "uppercase", letterSpacing: "0.09em", color: "var(--muted)",
          fontFamily: "Outfit, sans-serif",
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}
