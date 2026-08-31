"use client";

import { useEffect, useState, useCallback } from "react";
import { ensureUser, getUid, getName, setName as saveName } from "../../lib/identity.js";
import { fetchLeaderboard } from "../../lib/leaderboard.js";
import ThemeVoting from "./ThemeVoting.jsx";
import { Icon, Wave, Squiggles } from "./Icons.jsx";

// The gameboard. Ranks players by points earned checking in at spots. Points
// favour discovery (hidden gems > landmarks), so the race rewards exploring the
// city, not just ticking the famous names.
export default function LeaderboardPanel({ refreshTick = 0 }) {
  const [innerTab, setInnerTab] = useState("race"); // "race" | "theme"
  const [uid, setUid] = useState(null);
  const [data, setData] = useState({ players: [], me: null });
  const [status, setStatus] = useState("loading"); // loading | ready | unavailable
  const [name, setNameState] = useState("");
  const [editingName, setEditingName] = useState(false);


  const load = useCallback(async (id) => {
    const res = await fetchLeaderboard(id);
    if (res.unavailable) { setStatus("unavailable"); return; }
    setData(res);
    setStatus("ready");
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      setNameState(getName());
      await ensureUser();
      const id = await getUid();
      if (!alive) return;
      setUid(id);
      await load(id);
    })();
    return () => { alive = false; };
  }, [load, refreshTick]);

  const commitName = () => {
    const clean = saveName(name);
    setNameState(clean);
    setEditingName(false);
  };

  const me = data.me;
  const players = data.players || [];
  const top3 = players.slice(0, 3);
  const rest = players.slice(3);

  return (
    <div style={{ flex: 1, overflowY: "auto", background: "var(--cream)" }}>
      {/* Hero */}
      <div style={{ background: "var(--violet)", position: "relative", paddingTop: 24, overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: "-10% -5% 30%", opacity: 0.26, pointerEvents: "none" }}>
          <Squiggles color="var(--cream-hi)" opacity={1} />
        </div>
        <div style={{ textAlign: "center", padding: "0 16px 4px", position: "relative" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--cream-hi)" }}>
            <Icon name="trophy" size={22} width={1.9} />
            <span className="groovy" style={{ fontSize: 30, lineHeight: 1 }}>The Race</span>
          </div>

          {/* Your standing */}
          <div style={{ marginTop: 16, marginBottom: 4 }}>
            {me ? (
              <>
                <div className="groovy" style={{ fontSize: 60, lineHeight: 0.9, color: "var(--cream-hi)", textShadow: "0 3px 0 rgba(38,48,92,.2)" }}>
                  #{me.rank}
                </div>
                <div style={{ fontSize: 12.5, color: "var(--cream-hi)", opacity: 0.9, marginTop: 6, fontWeight: 600 }}>
                  {me.score} pts · {me.covered} claimed · {topArea(me.areas)}
                </div>
              </>
            ) : (
              <div style={{ color: "var(--cream-hi)", padding: "8px 20px 4px" }}>
                <div className="groovy" style={{ fontSize: 26, lineHeight: 1.05 }}>Not in the race yet</div>
                <div style={{ fontSize: 12.5, opacity: 0.9, marginTop: 8, fontWeight: 500, lineHeight: 1.4 }}>
                  Check in at any spot on the map — you have to be there — to claim it and score your first points.
                </div>
              </div>
            )}
          </div>
        </div>
        <Wave height={44} color="var(--cream)" style={{ marginTop: 10 }} />
      </div>

      {/* Tab switcher */}
      <div style={{ display: "flex", gap: 6, padding: "10px 16px 2px" }}>
        {[["race", "trophy", "The Race"], ["theme", "crown", "This Week"]].map(([key, icon, label]) => (
          <button
            key={key}
            onClick={() => setInnerTab(key)}
            style={{
              flex: 1, height: 38, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              border: "none", borderRadius: "var(--r-pill)",
              background: innerTab === key ? "var(--violet)" : "var(--cream)",
              color: innerTab === key ? "#fff" : "var(--muted)",
              fontWeight: 700, fontSize: 13, cursor: "pointer",
              boxShadow: innerTab === key ? "0 2px 8px rgba(124,58,237,0.3)" : "var(--e1)",
            }}
          >
            <Icon name={icon} size={15} width={1.9} />
            {label}
          </button>
        ))}
      </div>

      {innerTab === "theme" && <div style={{ paddingBottom: 120, paddingTop: 8 }}><ThemeVoting /></div>}

      {innerTab === "race" && <div style={{ padding: "4px 16px 120px" }}>
        {/* Name row */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10, marginBottom: 18,
          background: "var(--cream-hi)", borderRadius: "var(--r-md)", padding: "12px 14px",
          boxShadow: "var(--e1)",
        }}>
          <span style={{
            width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
            background: "var(--violet-wash)", color: "var(--violet-deep)",
            display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 15,
          }}>
            {(name || "?").slice(0, 1).toUpperCase()}
          </span>
          {editingName ? (
            <>
              <input
                autoFocus
                value={name}
                maxLength={24}
                onChange={(e) => setNameState(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && commitName()}
                placeholder="Your name"
                style={{
                  flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent",
                  fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: 15, color: "var(--ink)",
                }}
              />
              <button onClick={commitName} className="pressable-sm" style={miniBtn(true)}>Save</button>
            </>
          ) : (
            <>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)" }}>
                  {name || "Set your name"}
                </div>
                <div style={{ fontSize: 11.5, color: "var(--muted)", fontWeight: 500 }}>
                  This is how you appear on the board
                </div>
              </div>
              <button onClick={() => setEditingName(true)} className="pressable-sm" style={miniBtn(false)}>
                {name ? "Edit" : "Add"}
              </button>
            </>
          )}
        </div>



        {status === "loading" && (
          <Empty icon="trophy" title="Loading the board…" />
        )}
        {status === "unavailable" && (
          <Empty icon="flame" title="Race is warming up" sub="The leaderboard backend isn't reachable right now. Your claims are still saved on this device." />
        )}
        {status === "ready" && players.length === 0 && (
          <Empty icon="sparkle" title="Be the first" sub="Nobody's claimed a spot yet. Check in somewhere and you'll top the board." />
        )}

        {status === "ready" && top3.length > 0 && (
          <Podium top3={top3} meUid={uid} />
        )}

        {status === "ready" && rest.length > 0 && (
          <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 8 }}>
            {rest.map((p) => (
              <Row key={p.uid} p={p} me={p.uid === uid} />
            ))}
          </div>
        )}

        {/* How scoring works */}
        {status === "ready" && (
          <div style={{ marginTop: 22, background: "var(--violet-wash)", borderRadius: "var(--r-md)", padding: "14px 16px" }}>
            <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 14.5, color: "var(--violet-deep)", marginBottom: 8 }}>
              How points work
            </div>
            {[
              ["gem", "Hidden gem", "25 pts"],
              ["star", "Established spot", "15 pts"],
              ["landmark", "Landmark", "10 pts"],
            ].map(([ic, label, pts]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 9, padding: "3px 0", fontSize: 13, color: "var(--ink-soft)", fontWeight: 500 }}>
                <Icon name={ic} size={15} width={1.9} color="var(--violet)" />
                <span style={{ flex: 1 }}>{label}</span>
                <span style={{ fontWeight: 700, color: "var(--violet-deep)" }}>{pts}</span>
              </div>
            ))}
            <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 9, lineHeight: 1.4, fontWeight: 500 }}>
              Explore beyond the famous names — the deeper cuts are worth more.
            </div>
          </div>
        )}
      </div>}
    </div>
  );
}

function Podium({ top3, meUid }) {
  // Order for display: 2nd, 1st, 3rd — classic podium.
  const order = [top3[1], top3[0], top3[2]].filter(Boolean);
  const heights = { 1: 96, 2: 74, 3: 60 };
  const medal = { 1: "#e8b23a", 2: "#b8bccb", 3: "#cd8b5a" };
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 10, marginTop: 6 }}>
      {order.map((p) => (
        <div key={p.uid} style={{ flex: p.rank === 1 ? 1.1 : 1, maxWidth: 130, textAlign: "center" }}>
          {p.rank === 1 && (
            <Icon name="crown" size={22} width={1.7} color={medal[1]} style={{ margin: "0 auto 4px" }} />
          )}
          <div style={{
            width: p.rank === 1 ? 56 : 46, height: p.rank === 1 ? 56 : 46, borderRadius: "50%",
            margin: "0 auto 8px", background: "var(--violet)", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 800, fontSize: p.rank === 1 ? 22 : 18,
            border: `3px solid ${medal[p.rank]}`,
            boxShadow: p.uid === meUid ? "0 0 0 3px var(--violet-wash)" : "var(--e1)",
          }}>
            {(p.name || "?").slice(0, 1).toUpperCase()}
          </div>
          <div style={{ fontWeight: 700, fontSize: 13, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {p.uid === meUid ? "You" : p.name}
          </div>
          <div style={{ fontSize: 11.5, color: "var(--muted)", fontWeight: 600, marginBottom: 6 }}>{p.score} pts</div>
          <div style={{
            height: heights[p.rank], borderRadius: "12px 12px 0 0",
            background: `linear-gradient(var(--violet), var(--violet-deep))`,
            display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 8,
            color: "#fff", fontWeight: 800, fontSize: 18,
          }}>
            {p.rank}
          </div>
        </div>
      ))}
    </div>
  );
}

function Row({ p, me }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      background: me ? "var(--violet-wash)" : "var(--cream-hi)",
      borderRadius: "var(--r-md)", padding: "10px 14px",
      boxShadow: me ? "none" : "var(--e1)",
    }}>
      <span style={{ width: 22, textAlign: "center", fontWeight: 800, fontSize: 14, color: me ? "var(--violet-deep)" : "var(--muted)" }}>
        {p.rank}
      </span>
      <span style={{
        width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
        background: me ? "var(--violet)" : "var(--paper)", color: me ? "#fff" : "var(--ink-soft)",
        display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14,
      }}>
        {(p.name || "?").slice(0, 1).toUpperCase()}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {me ? "You" : p.name}
        </div>
        <div style={{ fontSize: 11.5, color: "var(--muted)", fontWeight: 500 }}>
          {p.covered} claimed · {topArea(p.areas)}
        </div>
      </div>
      <span style={{ fontWeight: 800, fontSize: 15, color: "var(--violet-deep)" }}>{p.score}</span>
    </div>
  );
}

function Empty({ icon, title, sub }) {
  return (
    <div style={{ textAlign: "center", padding: "28px 24px", color: "var(--muted)" }}>
      <Icon name={icon} size={30} width={1.6} color="var(--periwinkle)" style={{ margin: "0 auto 12px" }} />
      <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 16, color: "var(--ink-soft)" }}>{title}</div>
      {sub && <div style={{ fontSize: 12.5, marginTop: 6, lineHeight: 1.45, fontWeight: 500 }}>{sub}</div>}
    </div>
  );
}

function topArea(areas) {
  if (!areas || typeof areas !== "object") return "—";
  const entries = Object.entries(areas);
  if (!entries.length) return "—";
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}

function miniBtn(primary) {
  return {
    border: "none",
    borderRadius: "var(--r-pill)",
    padding: "7px 14px",
    fontSize: 12.5,
    fontWeight: 700,
    cursor: "pointer",
    background: primary ? "var(--violet)" : "rgba(124,58,237,0.1)",
    color: primary ? "#fff" : "var(--violet-deep)",
  };
}
