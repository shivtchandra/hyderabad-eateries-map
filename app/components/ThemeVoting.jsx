"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { fetchCurrentTheme, fetchThemeHistory, castThemeVote, getThemeVoteSpot } from "../../lib/themeVoting.js";
import { Icon } from "./Icons.jsx";
import ThemeSuggest from "./ThemeSuggest.jsx";

export default function ThemeVoting() {
  const [current, setCurrent] = useState({ theme: null, results: [] });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openPast, setOpenPast] = useState(null);
  // The spotId this device currently has voted for (or null) — not just a
  // yes/no flag, so standings rows can tell "this is my vote" from "not yet".
  const [votedSpotId, setVotedSpotId] = useState(null);
  const [localCounts, setLocalCounts] = useState({});
  const [localResults, setLocalResults] = useState(null);

  const load = useCallback(async () => {
    const [cur, hist] = await Promise.all([fetchCurrentTheme(), fetchThemeHistory(8)]);
    setCurrent(cur);
    setLocalResults(null);
    setHistory(hist.themes || []);
    setLoading(false);
    if (cur.theme) setVotedSpotId(getThemeVoteSpot(cur.theme.id));
  }, []);

  useEffect(() => { load(); }, [load]);

  // Casts a vote, or SWITCHES an existing one to a different spot — mirrors
  // the count move server-side, then optimistically reflects it here too.
  const handleVote = async (spotId, name) => {
    if (!current.theme) return;
    const prevSpotId = votedSpotId;
    const result = await castThemeVote(current.theme.id, spotId, name);
    if (result.ok) {
      setVotedSpotId(spotId);
      setLocalCounts((prev) => {
        const next = { ...prev, [spotId]: result.count };
        if (prevSpotId && prevSpotId !== spotId) {
          const prevBase = current.results.find((r) => r.spotId === prevSpotId);
          const prevCount = prev[prevSpotId] ?? prevBase?.count ?? 0;
          next[prevSpotId] = Math.max(0, prevCount - 1);
        }
        return next;
      });
      setLocalResults((prev) => {
        const base = prev ?? current.results;
        let list = base.map((r) => {
          if (r.spotId === spotId) return { ...r, count: result.count };
          if (prevSpotId && r.spotId === prevSpotId) return { ...r, count: Math.max(0, (r.count || 0) - 1) };
          return r;
        });
        if (!list.find((r) => r.spotId === spotId)) list = [...list, { spotId, name, count: result.count }];
        return list.sort((a, b) => (b.count || 0) - (a.count || 0));
      });
    }
  };

  if (loading) return (
    <div style={{ textAlign: "center", padding: "40px 16px", color: "var(--muted)" }}>
      <Icon name="sparkle" size={28} width={1.6} color="var(--violet)" style={{ margin: "0 auto 10px" }} />
      <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 15 }}>Loading themes…</div>
    </div>
  );

  if (!current.theme && history.length === 0) return (
    <div>
      <div style={{ textAlign: "center", padding: "40px 16px 8px", color: "var(--muted)" }}>
        <Icon name="crown" size={28} width={1.6} color="var(--violet)" style={{ margin: "0 auto 10px" }} />
        <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 16, color: "var(--ink-soft)" }}>No theme set yet</div>
        <div style={{ fontSize: 12.5, marginTop: 6, lineHeight: 1.45, fontWeight: 500 }}>Check back soon — or tell us what next week's challenge should be.</div>
      </div>
      <ThemeSuggest />
    </div>
  );

  const displayResults = localResults ?? current.results;

  return (
    <div style={{ paddingBottom: 8 }}>
      {current.theme && (
        <CurrentTheme
          theme={current.theme}
          results={displayResults}
          votedSpotId={votedSpotId}
          onVote={handleVote}
          localCounts={localCounts}
        />
      )}

      {history.length > 0 && (
        <div style={{ marginTop: current.theme ? 24 : 0 }}>
          <div style={{ padding: "0 16px 10px", fontSize: 11, fontWeight: 700, color: "var(--muted)", letterSpacing: "0.07em", textTransform: "uppercase" }}>
            Past themes
          </div>
          {history.map((t) => (
            <PastTheme key={t.id} theme={t} open={openPast === t.id} onToggle={() => setOpenPast(openPast === t.id ? null : t.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function CurrentTheme({ theme, results, votedSpotId, onVote, localCounts }) {
  const [searchQ, setSearchQ] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [pending, setPending] = useState(null); // spot waiting for confirm
  const [mismatchWarn, setMismatchWarn] = useState(false);
  const [shareState, setShareState] = useState("idle");
  const debounceRef = useRef(null);

  const searchSpots = (q) => {
    setSearchQ(q);
    clearTimeout(debounceRef.current);
    if (q.length < 2) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/spots/search?q=${encodeURIComponent(q)}`).catch(() => null);
      if (res?.ok) setSuggestions(await res.json());
    }, 250);
  };

  const pickSpot = (spot) => {
    setSuggestions([]);
    setSearchQ("");
    if (spot.spotId === votedSpotId) return; // already your vote — nothing to do
    // Warn if the spot category seems off for the theme
    const themeLower = theme.title.toLowerCase();
    const offCategories = {
      "ice cream": ["cafe", "bakery"],
      "dessert": ["cafe", "bakery"],
      "biryani": ["local"],
      "chai": ["cafe", "local"],
      "coffee": ["cafe"],
      "bar": ["restro-bar"],
    };
    let expectedCats = null;
    for (const [keyword, cats] of Object.entries(offCategories)) {
      if (themeLower.includes(keyword)) { expectedCats = cats; break; }
    }
    // Standings-list votes come from Firestore vote docs, which never stored
    // category — only the search path has it. Empty/unknown category must
    // never read as "wrong category", or every standings Vote click false-warns.
    const isMismatch = expectedCats && !!spot.category && !expectedCats.includes(spot.category);
    setPending(spot);
    setMismatchWarn(isMismatch);
  };

  const confirmVote = () => {
    if (pending) { onVote(pending.spotId, pending.name); setPending(null); setMismatchWarn(false); }
  };

  const cancelVote = () => { setPending(null); setMismatchWarn(false); };

  const shareTheme = async () => {
    const url = `${window.location.origin}/race/this-week`;
    const payload = {
      title: `${theme.title} — Hyderabad Eats`,
      text: `Vote in this week's Hyderabad Eats challenge: ${theme.title}`,
      url,
    };

    try {
      if (navigator.share) {
        await navigator.share(payload);
        setShareState("shared");
      } else {
        await navigator.clipboard.writeText(url);
        setShareState("copied");
      }
      window.setTimeout(() => setShareState("idle"), 1800);
    } catch (error) {
      if (error?.name !== "AbortError") setShareState("failed");
    }
  };

  return (
    <div>
      {/* Hero banner */}
      <div style={{
        margin: "0 16px 16px",
        background: "linear-gradient(135deg, var(--violet-deep), var(--violet))",
        borderRadius: "var(--r-lg)", padding: "16px",
        boxShadow: "0 4px 20px rgba(91,33,182,0.28)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 4 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            This week's challenge
          </div>
          <button
            type="button"
            onClick={shareTheme}
            aria-label="Share this week's challenge"
            style={{
              border: "1px solid rgba(255,255,255,0.28)",
              borderRadius: "var(--r-pill)",
              background: "rgba(255,255,255,0.16)",
              color: "#fff",
              minWidth: 70,
              height: 30,
              padding: "0 10px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <Icon name={shareState === "copied" || shareState === "shared" ? "check" : "share"} size={13} width={2} color="#fff" />
            {shareState === "copied" ? "Copied" : shareState === "shared" ? "Shared" : shareState === "failed" ? "Try again" : "Share"}
          </button>
        </div>
        <div style={{ fontFamily: "Fraunces, serif", fontWeight: 700, fontSize: 20, color: "#fff", lineHeight: 1.2, marginBottom: 6 }}>
          {theme.title}
        </div>
        {theme.description && (
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.82)", lineHeight: 1.4, fontWeight: 500 }}>
            {theme.description}
          </div>
        )}
        {votedSpotId && (
          <div style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.18)", borderRadius: "var(--r-pill)", padding: "5px 11px", fontSize: 12, fontWeight: 700, color: "#fff" }}>
            <Icon name="check" size={12} width={2.5} color="#fff" /> Voted
          </div>
        )}
      </div>

      {/* Winner banner */}
      {theme.winnerId && (
        <div style={{
          margin: "0 16px 14px",
          background: "linear-gradient(135deg, #f59e0b, #d97706)",
          borderRadius: "var(--r-md)", padding: "12px 14px",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <Icon name="trophy" size={22} width={1.8} color="#fff" />
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.8)", letterSpacing: "0.07em", textTransform: "uppercase" }}>Winner</div>
            <div style={{ fontFamily: "Fraunces, serif", fontWeight: 700, fontSize: 15, color: "#fff" }}>{theme.winnerName || "—"}</div>
          </div>
        </div>
      )}

      {/* Confirm vote dialog */}
      {pending && (
        <div style={{ margin: "0 16px 14px", background: mismatchWarn ? "#fef3c7" : "var(--violet-wash)", borderRadius: "var(--r-md)", padding: "14px 16px", border: mismatchWarn ? "1.5px solid #f59e0b" : "none" }}>
          {mismatchWarn ? (
            <div style={{ fontSize: 13, fontWeight: 600, color: "#92400e", marginBottom: 10, lineHeight: 1.45 }}>
              ⚠️ <b>{pending.name}</b> doesn't look like it fits this week's theme ({theme.title}). Vote for it anyway?
            </div>
          ) : votedSpotId ? (
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--violet-deep)", marginBottom: 10, lineHeight: 1.45 }}>
              You already voted for a different spot. Switch your vote to <b>{pending.name}</b>?
            </div>
          ) : (
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--violet-deep)", marginBottom: 10 }}>
              Vote for <b>{pending.name}</b>?
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={confirmVote} style={{ flex: 1, border: "none", borderRadius: "var(--r-pill)", padding: "8px 0", fontSize: 13, fontWeight: 700, background: "var(--violet)", color: "#fff", cursor: "pointer" }}>
              {votedSpotId ? "Yes, switch" : "Yes, vote"}
            </button>
            <button onClick={cancelVote} style={{ flex: 1, border: "1.5px solid var(--line)", borderRadius: "var(--r-pill)", padding: "8px 0", fontSize: 13, fontWeight: 700, background: "transparent", color: "var(--muted)", cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Current standings */}
      {results.length > 0 && (
        <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          {results.map((r, i) => {
            const count = localCounts[r.spotId] ?? r.count;
            const isWinner = r.spotId === theme.winnerId;
            return (
              <div key={r.spotId} style={{
                display: "flex", alignItems: "center", gap: 10,
                background: isWinner ? "linear-gradient(135deg,#fef3c7,#fde68a)" : i === 0 && !theme.winnerId ? "var(--violet-wash)" : "var(--cream-hi)",
                borderRadius: "var(--r-md)", padding: "10px 13px",
                boxShadow: "var(--e1)",
                border: isWinner ? "1.5px solid #f59e0b" : "none",
              }}>
                <span style={{ width: 24, textAlign: "center", fontWeight: 800, fontSize: 15, color: isWinner ? "#d97706" : i === 0 && !theme.winnerId ? "var(--violet)" : "var(--muted)", flexShrink: 0 }}>
                  {isWinner ? "🏆" : `#${i + 1}`}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</div>
                  <div style={{ fontSize: 11.5, color: "var(--muted)", fontWeight: 500, marginTop: 1 }}>{count} vote{count !== 1 ? "s" : ""}</div>
                </div>
                {!theme.winnerId && (
                  r.spotId === votedSpotId ? (
                    <span style={{ display: "flex", alignItems: "center", gap: 4, borderRadius: "var(--r-pill)", padding: "6px 12px", fontSize: 12, fontWeight: 700, background: "var(--violet-wash)", color: "var(--violet-deep)", flexShrink: 0 }}>
                      <Icon name="check" size={12} width={2.5} color="var(--violet-deep)" /> Voted
                    </span>
                  ) : (
                    <button
                      onClick={() => pickSpot({ spotId: r.spotId, name: r.name, category: r.category || "" })}
                      style={{ border: "none", borderRadius: "var(--r-pill)", padding: "6px 13px", fontSize: 12.5, fontWeight: 700, background: "var(--violet)", color: "#fff", cursor: "pointer", flexShrink: 0 }}
                    >
                      {votedSpotId ? "Switch" : "Vote"}
                    </button>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Search to vote for any spot */}
      {!theme.winnerId && (
        <div style={{ margin: "0 16px 8px" }}>
          {/* OR divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "14px 0 12px" }}>
            <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
            <span style={{ fontSize: 11, fontWeight: 800, color: "var(--muted)", letterSpacing: "0.1em" }}>OR SEARCH ANY SPOT</span>
            <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", marginBottom: 10 }}>
            {votedSpotId ? "Change my vote" : "Not on the list? Find it and vote 👇"}
          </div>
          <div style={{ position: "relative" }}>
            <span style={{
              position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
              fontSize: 15, pointerEvents: "none", opacity: 0.5,
            }}>🔍</span>
            <input
              value={searchQ}
              onChange={(e) => searchSpots(e.target.value)}
              placeholder="Type a restaurant name…"
              style={{
                width: "100%", boxSizing: "border-box",
                border: "2px solid var(--purple)", borderRadius: "var(--r-md)",
                padding: "11px 14px 11px 36px", fontSize: 14,
                fontFamily: "Outfit, sans-serif", background: "var(--cream-hi)",
                color: "var(--ink)", outline: "none",
              }}
            />
            {suggestions.length > 0 && (
              <div style={{
                position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
                background: "var(--cream-hi)", border: "1.5px solid var(--line)",
                borderRadius: "var(--r-md)", zIndex: 30,
                boxShadow: "0 4px 16px rgba(0,0,0,0.12)", overflow: "hidden",
              }}>
                {suggestions.map((s) => (
                  <button
                    key={s.spotId}
                    onClick={() => pickSpot(s)}
                    style={{
                      display: "block", width: "100%", textAlign: "left",
                      padding: "11px 14px", border: "none", background: "transparent",
                      cursor: "pointer", borderBottom: "1px solid var(--line)",
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: 13.5, color: "var(--ink)" }}>{s.name}</span>
                    <span style={{ color: "var(--muted)", marginLeft: 8, fontSize: 11.5 }}>{s.area}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <ThemeSuggest />
    </div>
  );
}

function PastTheme({ theme, open, onToggle }) {
  return (
    <div style={{ margin: "0 16px 8px", background: "var(--cream-hi)", borderRadius: "var(--r-md)", boxShadow: "var(--e1)", overflow: "hidden" }}>
      <button
        onClick={onToggle}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", border: "none", background: "transparent", cursor: "pointer", textAlign: "left" }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 13.5, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {theme.title}
          </div>
          {theme.winnerName && (
            <div style={{ fontSize: 11.5, color: "#d97706", fontWeight: 600, marginTop: 2 }}>
              🏆 {theme.winnerName}
            </div>
          )}
          {theme.startDate && (
            <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 500, marginTop: 2 }}>{theme.startDate}</div>
          )}
        </div>
        <Icon name={open ? "close" : "navigate"} size={16} width={2} color="var(--muted)" />
      </button>

      {open && (
        <div style={{ padding: "0 14px 12px", borderTop: "1.5px solid var(--line)" }}>
          {theme.results?.length === 0 ? (
            <div style={{ fontSize: 12.5, color: "var(--muted)", padding: "10px 0", fontWeight: 500 }}>No votes recorded.</div>
          ) : (
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
              {theme.results?.map((r, i) => (
                <div key={r.spotId} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                  <span style={{ width: 20, fontWeight: 700, color: i === 0 ? "#d97706" : "var(--muted)", fontSize: 12 }}>
                    {r.spotId === theme.winnerId ? "🏆" : `#${i + 1}`}
                  </span>
                  <span style={{ flex: 1, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</span>
                  <span style={{ color: "var(--muted)", fontWeight: 500, fontSize: 12 }}>{r.count}v</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
