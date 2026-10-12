"use client";

import { useEffect, useLayoutEffect, useState, useCallback, useRef } from "react";
import { ensureUser, getUid, getName, setName as saveName } from "../../lib/identity.js";
import { fetchLeaderboard } from "../../lib/leaderboard.js";
import ThemeVoting from "./ThemeVoting.jsx";
import { fetchCurrentTheme } from "../../lib/themeVoting.js";
import { Icon } from "./Icons.jsx";
import { TIERS } from "../../lib/eateryUtils.js";

// The gameboard. Ranks players by points earned checking in at spots. Points
// favour discovery (hidden gems > landmarks), so the race rewards exploring the
// city, not just ticking the famous names.
export default function LeaderboardPanel({
  refreshTick = 0,
  initialInnerTab = "theme",
  onInnerTabChange,
  initialDishSlug = null,
  stampCount = 0,
  onOpenClaim,
}) {
  const [innerTab, setInnerTab] = useState(initialInnerTab); // "race" | "theme"
  const scrollRef = useRef(null);
  const tabsRef = useRef(null);
  const [uid, setUid] = useState(null);
  const [data, setData] = useState({ players: [], me: null });
  const [status, setStatus] = useState("loading"); // loading | ready | unavailable
  const [name, setNameState] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [weekTitle, setWeekTitle] = useState("");

  useEffect(() => {
    setInnerTab(initialInnerTab);
  }, [initialInnerTab]);

  useEffect(() => {
    let alive = true;
    fetchCurrentTheme().then((cur) => {
      if (!alive) return;
      setWeekTitle(cur?.theme?.title || "");
    });
    return () => { alive = false; };
  }, [refreshTick]);

  const selectInnerTab = (nextTab) => {
    setInnerTab(nextTab);
    onInnerTabChange?.(nextTab);
  };

  // Both tabs keep the purple top band visible; reset scroll on switch.
  useLayoutEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    scroller.scrollTop = 0;
  }, [innerTab]);

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
    <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", background: "var(--cream)", scrollPaddingTop: 56 }}>
      {/* Plain segments on paper (Vote mockup), no colour band. */}
      <div ref={tabsRef} className="vote-switch" role="tablist" aria-label="Vote">
        {[["theme", "This week"], ["race", "The race"]].map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={innerTab === key}
            onClick={() => selectInnerTab(key)}
            className={`vote-switch-tab${innerTab === key ? " is-active" : ""}`}
          >
            {label}
          </button>
        ))}
      </div>

      {innerTab === "race" && (
        <div className="race-hero">
          <h2 className="race-title">The race</h2>
          {me ? (
            <>
              <div className="race-rank">#{me.rank}</div>
              <p className="race-meta">{me.score} pts · {me.covered} claimed · {topArea(me.areas)}</p>
            </>
          ) : (
            <>
              <p className="race-meta">Open any spot you ate at and tap <b>I ate here</b>. One tap stamps your passport and scores race points.</p>
              {onOpenClaim && (
                <button type="button" onClick={onOpenClaim} className="race-claim">Claim a spot you ate at</button>
              )}
            </>
          )}
          <RaceShare me={me} />
        </div>
      )}

      {innerTab === "theme" && <div style={{ paddingBottom: 120, paddingTop: 8 }}><ThemeVoting initialDishSlug={initialDishSlug} /></div>}

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
                  fontFamily: "var(--font-ui), sans-serif", fontWeight: 600, fontSize: 15, color: "var(--ink)",
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
        {status === "ready" && !me && stampCount > 0 && (
          <div style={{
            marginBottom: 14,
            background: "var(--cream-hi)",
            border: "1.5px solid var(--line)",
            borderRadius: "var(--r-md)",
            padding: "14px 16px",
            boxShadow: "var(--e1)",
          }}>
            <div style={{ fontFamily: "var(--font-display), system-ui, sans-serif", fontWeight: 700, fontSize: 16, color: "var(--ink)", marginBottom: 6 }}>
              Why you are not on this board
            </div>
            <div style={{ fontSize: 13.5, color: "var(--ink-soft)", fontWeight: 500, lineHeight: 1.5 }}>
              Your {stampCount} earlier stamp{stampCount === 1 ? " was" : "s were"} saved before the Race became one tap, so {stampCount === 1 ? "it didn't" : "they didn't"} score points.
            </div>
            <div style={{ fontSize: 12.5, color: "var(--muted)", fontWeight: 500, marginTop: 8, lineHeight: 1.4 }}>
              Open a spot you ate at and tap <b>I ate here</b> to get on the board.
            </div>
            {onOpenClaim && (
              <button
                type="button"
                onClick={onOpenClaim}
                className="pressable-sm"
                style={{
                  marginTop: 12,
                  background: "var(--violet)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "var(--r-pill)",
                  padding: "9px 18px",
                  fontWeight: 700,
                  fontSize: 13.5,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Icon name="trophy" size={15} width={2.2} color="#fff" />
                Claim a spot now
              </button>
            )}
          </div>
        )}

        {status === "ready" && players.length === 0 && (
          <div style={{ textAlign: "center" }}>
            <Empty
              icon="sparkle"
              title={stampCount > 0 ? "No Race claims yet" : "Be the first"}
              sub={stampCount > 0
                ? "Earlier stamps didn't score. Tap I ate here on a spot to get on the board."
                : "Nobody is on the board yet. Open a spot you ate at and tap I ate here."}
            />
            {onOpenClaim && (
              <button
                type="button"
                onClick={onOpenClaim}
                className="pressable-sm"
                style={{
                  marginTop: 8,
                  background: "var(--violet)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "var(--r-pill)",
                  padding: "9px 20px",
                  fontWeight: 700,
                  fontSize: 13.5,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Icon name="trophy" size={15} width={2.2} color="#fff" />
                Claim a spot now
              </button>
            )}
          </div>
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
            <div style={{ fontFamily: "var(--font-display), system-ui, sans-serif", fontWeight: 600, fontSize: 14.5, color: "var(--violet-deep)", marginBottom: 8 }}>
              How points work
            </div>
            {[
              ["gem", "hidden-gem"],
              ["star", "established"],
              ["landmark", "landmark"],
            ].map(([ic, key]) => (
              <div key={key} style={{ display: "flex", alignItems: "flex-start", gap: 9, padding: "5px 0", fontSize: 13, color: "var(--ink-soft)", fontWeight: 500 }}>
                <Icon name={ic} size={15} width={1.9} color="var(--violet)" style={{ marginTop: 2 }} />
                <span style={{ flex: 1 }}>
                  {TIERS[key].label}
                  <span style={{ display: "block", fontSize: 11, color: "var(--muted)", fontWeight: 500 }}>
                    {TIERS[key].hint} · e.g. {TIERS[key].eg}
                  </span>
                </span>
                <span style={{ fontWeight: 700, color: "var(--violet-deep)", whiteSpace: "nowrap" }}>{TIERS[key].points} pts</span>
              </div>
            ))}
            <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 9, lineHeight: 1.45, fontWeight: 500 }}>
              A spot&apos;s tier comes from its Google review count. Famous places score least, deeper cuts score more.
              Tap I ate here on a spot and these points land on the board right away.
            </div>
          </div>
        )}

        {/* Floating Claim Action on Race screen */}
        {onOpenClaim && (
          <div
            style={{
              position: "fixed",
              bottom: "calc(74px + env(safe-area-inset-bottom, 0px))",
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "center",
              pointerEvents: "none",
              zIndex: 1200,
            }}
          >
            <button
              type="button"
              onClick={onOpenClaim}
              className="pressable-sm"
              style={{
                pointerEvents: "auto",
                height: 44,
                padding: "0 22px",
                background: "var(--violet)",
                color: "#fff",
                borderRadius: "var(--r-pill)",
                border: "2px solid rgba(255,255,255,0.9)",
                boxShadow: "0 8px 24px rgba(124,58,237,0.45)",
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 14,
                fontWeight: 750,
                cursor: "pointer",
              }}
            >
              <Icon name="trophy" size={17} width={2.2} color="#fff" />
              Claim a spot (+pts)
            </button>
          </div>
        )}
      </div>}
    </div>
  );
}

// Share the Race board: your rank if you have one, an invite otherwise.
// Native share sheet on phones; WhatsApp or copy-link as the fallback.
function RaceShare({ me }) {
  const [state, setState] = useState("idle"); // idle | copied
  const text = me
    ? `I'm #${me.rank} in Hyderabad's food race with ${me.score} pts. Can you beat me?`
    : "Hyderabad's food race: claim the spots you eat at and climb the board.";

  const share = async () => {
    const url = `${window.location.origin}/race`;
    if (navigator.share) {
      try { await navigator.share({ title: "The Race, Hyderabad Eats", text, url }); } catch {}
      return;
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setState("copied");
      setTimeout(() => setState("idle"), 1800);
    } catch {
      window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <button
      type="button"
      onClick={share}
      style={{
        marginTop: 12, marginBottom: 2, height: 34, padding: "0 16px",
        display: "inline-flex", alignItems: "center", gap: 6,
        border: "none", borderRadius: "var(--r-pill)",
        background: "var(--cream-hi)", color: "var(--ink)", boxShadow: "var(--e1)",
        fontWeight: 700, fontSize: 13, cursor: "pointer",
      }}
    >
      <Icon name={state === "copied" ? "check" : "share"} size={14} width={2} color="currentColor" />
      {state === "copied" ? "Link copied" : me ? "Share my rank" : "Invite friends"}
    </button>
  );
}

function Podium({ top3, meUid }) {
  // Order for display: 2nd, 1st, 3rd, classic podium.
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
            background: "var(--violet)",
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
      <div style={{ fontFamily: "var(--font-display), system-ui, sans-serif", fontWeight: 600, fontSize: 16, color: "var(--ink-soft)" }}>{title}</div>
      {sub && <div style={{ fontSize: 12.5, marginTop: 6, lineHeight: 1.45, fontWeight: 500 }}>{sub}</div>}
    </div>
  );
}

function topArea(areas) {
  if (!areas || typeof areas !== "object") return ", ";
  const entries = Object.entries(areas);
  if (!entries.length) return ", ";
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
