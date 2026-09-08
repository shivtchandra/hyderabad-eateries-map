"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { fetchCurrentTheme, fetchThemeHistory, castThemeVote, getThemeVoteSpot, getThemePicks } from "../../lib/themeVoting.js";
import Link from "next/link";
import { Icon } from "./Icons.jsx";
import { slugFromTitle } from "../../lib/rankings.js";
import { isPastEndDate } from "../../lib/themeCrown.js";
import ThemeSuggest from "./ThemeSuggest.jsx";

export default function ThemeVoting({ initialDishSlug = null }) {
  const [current, setCurrent] = useState({ theme: null, results: [] });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openPast, setOpenPast] = useState(null);
  const [votedSpotId, setVotedSpotId] = useState(null);
  const [localCounts, setLocalCounts] = useState({});
  const [localResults, setLocalResults] = useState(null);
  const [voteTick, setVoteTick] = useState(0);

  const load = useCallback(async () => {
    const [cur, hist] = await Promise.all([fetchCurrentTheme(), fetchThemeHistory(12)]);
    setCurrent(cur);
    setLocalResults(null);
    const past = hist.themes || [];
    setHistory(past);
    setLoading(false);
    if (cur.theme) setVotedSpotId(getThemeVoteSpot(cur.theme.id));

    const fromUrl = (() => {
      try {
        return new URLSearchParams(window.location.search).get("dish") || initialDishSlug;
      } catch {
        return initialDishSlug;
      }
    })();
    if (fromUrl && cur.theme && (cur.theme.slug || slugFromTitle(cur.theme.title)) === fromUrl) {
      setOpenPast(null);
    } else if (fromUrl) {
      const match = past.find((th) => (th.slug || slugFromTitle(th.title)) === fromUrl);
      if (match) setOpenPast(match.id);
    }
  }, [initialDishSlug]);

  useEffect(() => { load(); }, [load]);

  const handleVote = async (spotId, name, themeOverride = null) => {
    const theme = themeOverride || current.theme;
    if (!theme) return;
    const isCurrent = current.theme && theme.id === current.theme.id;
    const prevSpotId = getThemeVoteSpot(theme.id);
    const result = await castThemeVote(theme.id, spotId, name, { title: theme.title });
    if (!result.ok) return;

    if (isCurrent) {
      setVotedSpotId(spotId);
      setLocalCounts((prev) => {
        const next = { ...prev, [spotId]: result.count };
        if (prevSpotId && prevSpotId !== spotId) {
          const prevBase = (current.results || []).find((r) => r.spotId === prevSpotId);
          const prevCount = prev[prevSpotId] ?? prevBase?.count ?? 0;
          next[prevSpotId] = Math.max(0, prevCount - 1);
        }
        return next;
      });
      setLocalResults((prev) => {
        const base = prev ?? current.results ?? [];
        let list = base.map((r) => {
          if (r.spotId === spotId) return { ...r, count: result.count };
          if (prevSpotId && r.spotId === prevSpotId) return { ...r, count: Math.max(0, (r.count || 0) - 1) };
          return r;
        });
        if (!list.find((r) => r.spotId === spotId)) list = [...list, { spotId, name, count: result.count }];
        return list.sort((a, b) => (b.count || 0) - (a.count || 0));
      });
    }

    const hist = await fetchThemeHistory(12);
    setHistory(hist.themes || []);
    setVoteTick((n) => n + 1);
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
        <div style={{ fontSize: 12.5, marginTop: 6, lineHeight: 1.45, fontWeight: 500 }}>Check back soon, or tell us what next week&apos;s challenge should be.</div>
      </div>
      <ThemeSuggest />
    </div>
  );

  const displayResults = localResults ?? current.results ?? [];

  return (
    <div style={{ paddingBottom: 8 }}>
      {current.theme && (
        <CurrentTheme
          theme={current.theme}
          results={displayResults}
          votedSpotId={votedSpotId}
          onVote={handleVote}
          localCounts={localCounts}
          lastClosed={history[0] || null}
        />
      )}

      {history.length > 0 && (
        <div style={{ marginTop: current.theme ? 20 : 0 }}>
          <div style={{ padding: "0 16px 10px", fontSize: 11, fontWeight: 700, color: "var(--muted)", letterSpacing: "0.07em", textTransform: "uppercase" }}>
            Previous weeks
          </div>
          {history.map((th) => (
            <PastTheme
              key={`${th.id}-${voteTick}`}
              theme={th}
              open={openPast === th.id}
              onToggle={() => setOpenPast(openPast === th.id ? null : th.id)}
              votedSpotId={getThemeVoteSpot(th.id)}
              onVote={(spotId, name) => handleVote(spotId, name, th)}
            />
          ))}
        </div>
      )}

      <YourPicks
        current={current.theme}
        history={history}
        votedSpotId={current.theme ? votedSpotId : null}
        results={displayResults}
      />

      <ThemeSuggest />
    </div>
  );
}

function CurrentTheme({ theme, results, votedSpotId, onVote, localCounts, lastClosed }) {
  const [searchQ, setSearchQ] = useState("");
  const [suggestions, setSuggestions] = useState([]);
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
    if (spot.spotId === votedSpotId) return; // already your vote, nothing to do
    onVote(spot.spotId, spot.name);
  };

  const shareTheme = async () => {
    const url = `${window.location.origin}/race/this-week`;
    const payload = {
      title: `${theme.title}, Hyderabad Eats`,
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
      {lastClosed && (lastClosed.winnerName || lastClosed.winnerId) && (
        <div style={{
          margin: "0 16px 12px",
          padding: "12px 14px",
          borderRadius: "var(--r-md)",
          background: "var(--cream-hi)",
          border: "1.5px solid var(--line)",
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>
            Last week
          </div>
          <div style={{ fontSize: 13.5, fontWeight: 650, color: "var(--ink)", lineHeight: 1.4 }}>
            {lastClosed.winnerName || "A favourite"} won {lastClosed.title}.
            {" "}This week is <b>{theme.title}</b>{votedSpotId ? ". You already voted." : ". Your turn."}
          </div>
        </div>
      )}
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
        <a
          href={`/rankings/${slugFromTitle(theme.title)}`}
          style={{ display: "inline-block", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.88)", textDecoration: "underline", textUnderlineOffset: 3, marginBottom: 8 }}
        >
          Full ranking page →
        </a>
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

      {/* Crown phase after endDate: still votable, crown follows live #1 */}
      {(theme.winnerId || isPastEndDate(theme)) && (results[0] || theme.winnerName) && (
        <div style={{
          margin: "0 16px 14px",
          background: "linear-gradient(135deg, #f59e0b, #d97706)",
          borderRadius: "var(--r-md)", padding: "12px 14px",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <Icon name="trophy" size={22} width={1.8} color="#fff" />
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.8)", letterSpacing: "0.07em", textTransform: "uppercase" }}>Crowned</div>
            <div style={{ fontFamily: "Fraunces, serif", fontWeight: 700, fontSize: 15, color: "#fff" }}>{results[0]?.name || theme.winnerName || ", "}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", marginTop: 2 }}>Votes stay open. Crown follows the live #1</div>
          </div>
        </div>
      )}

      {/* Search first: find your spot, then scan standings. Stays open past endDate. */}
      <div style={{ margin: "0 16px 16px", position: "relative", zIndex: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "var(--ink)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>
            {votedSpotId ? "Search to switch" : "Search to vote"}
          </div>
          <div style={{ position: "relative" }}>
            <span style={{
              position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
              display: "flex", pointerEvents: "none", opacity: 0.55,
            }}>
              <Icon name="search" size={16} width={2} color="var(--muted)" />
            </span>
            <input
              value={searchQ}
              onChange={(e) => searchSpots(e.target.value)}
              placeholder="Restaurant name…"
              autoComplete="off"
              style={{
                width: "100%", boxSizing: "border-box",
                border: "1.5px solid var(--line)", borderRadius: "var(--r-md)",
                padding: "12px 14px 12px 38px", fontSize: 14.5,
                fontFamily: "Outfit, sans-serif", background: "var(--cream-hi)",
                color: "var(--ink)", outline: "none",
                boxShadow: "var(--e1)",
              }}
              onFocus={(e) => { e.target.style.borderColor = "var(--violet)"; }}
              onBlur={(e) => { e.target.style.borderColor = "var(--line)"; }}
            />
            {suggestions.length > 0 && (
              <div style={{
                position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
                background: "var(--cream-hi)", border: "1.5px solid var(--line)",
                borderRadius: "var(--r-md)", zIndex: 40,
                boxShadow: "0 8px 24px rgba(44,36,24,0.14)", overflow: "hidden",
              }}>
                {suggestions.map((s, i) => (
                  <button
                    key={s.spotId}
                    type="button"
                    onClick={() => pickSpot(s)}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
                      width: "100%", textAlign: "left",
                      padding: "12px 14px", border: "none", background: "transparent",
                      cursor: "pointer",
                      borderBottom: i < suggestions.length - 1 ? "1px solid var(--line)" : "none",
                    }}
                  >
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: "block", fontWeight: 700, fontSize: 13.5, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
                      {s.area && <span style={{ display: "block", color: "var(--muted)", fontSize: 11.5, marginTop: 2 }}>{s.area}</span>}
                    </span>
                    <span style={{ flexShrink: 0, fontSize: 12, fontWeight: 800, color: "var(--violet)" }}>
                      {votedSpotId ? "Switch" : "Vote"}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

      {/* Current standings */}
      {results.length > 0 && (
        <div style={{ padding: "0 16px 8px", fontSize: 12, fontWeight: 700, color: "var(--muted)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
          Live standings
        </div>
      )}
      {results.length === 0 && (
        <div style={{ margin: "0 16px 16px", padding: "14px 16px", borderRadius: "var(--r-md)", background: "var(--cream-hi)", boxShadow: "var(--e1)", fontSize: 13, color: "var(--muted)", fontWeight: 500, lineHeight: 1.45 }}>
          No votes yet. Search a spot above and cast the first one.
        </div>
      )}
      {results.length > 0 && (
        <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          {results.map((r, i) => {
            const count = localCounts[r.spotId] ?? r.count;
            const crowned = theme.winnerId || isPastEndDate(theme);
            const isCrown = crowned && i === 0;
            const isLead = i === 0;
            return (
              <div key={r.spotId} style={{
                display: "flex", alignItems: "center", gap: 10,
                background: isCrown ? "linear-gradient(135deg,#fef3c7,#fde68a)" : isLead ? "var(--violet-wash)" : "var(--cream-hi)",
                borderRadius: "var(--r-md)", padding: "10px 13px",
                boxShadow: "var(--e1)",
                border: isCrown ? "1.5px solid #f59e0b" : "none",
              }}>
                <span style={{ width: 26, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, color: isCrown ? "#d97706" : isLead ? "var(--violet)" : "var(--muted)", flexShrink: 0 }}>
                  {isCrown ? <Icon name="crown" size={16} width={2} color="#d97706" /> : `#${i + 1}`}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</div>
                  <div style={{ fontSize: 11.5, color: "var(--muted)", fontWeight: 500, marginTop: 1 }}>{count} vote{count !== 1 ? "s" : ""}</div>
                </div>
                {r.spotId === votedSpotId ? (
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
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}


function PastTheme({ theme, open, onToggle, votedSpotId, onVote }) {
  const [searchQ, setSearchQ] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const debounceRef = useRef(null);
  const leader = theme.results?.[0];
  const crowned = theme.winnerId || isPastEndDate(theme);

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
    if (spot.spotId === votedSpotId) return;
    onVote?.(spot.spotId, spot.name);
  };

  return (
    <div style={{ margin: "0 16px 8px", background: "var(--cream-hi)", borderRadius: "var(--r-md)", boxShadow: "var(--e1)", overflow: "hidden" }}>
      <button
        type="button"
        onClick={onToggle}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", border: "none", background: "transparent", cursor: "pointer", textAlign: "left" }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 13.5, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {theme.title}
          </div>
          {leader && (
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: crowned ? "#d97706" : "var(--muted)", fontWeight: 600, marginTop: 2 }}>
              {crowned && <Icon name="crown" size={12} width={2} color="#d97706" />}
              {leader.name}
              {leader.count != null && <span style={{ fontWeight: 500, color: "var(--muted)" }}>· {leader.count}v</span>}
            </div>
          )}
          <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 500, marginTop: 2 }}>
            Votes still open{theme.endDate ? ` · week of ${theme.endDate}` : ""}
          </div>
        </div>
        <Icon name={open ? "close" : "navigate"} size={16} width={2} color="var(--muted)" />
      </button>

      {open && (
        <div style={{ padding: "0 14px 12px", borderTop: "1.5px solid var(--line)" }}>
          <div style={{ marginTop: 10, marginBottom: 10, position: "relative", zIndex: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "var(--ink)", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 6 }}>
              {votedSpotId ? "Search to switch" : "Search to vote"}
            </div>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", display: "flex", pointerEvents: "none", opacity: 0.55 }}>
                <Icon name="search" size={14} width={2} color="var(--muted)" />
              </span>
              <input
                value={searchQ}
                onChange={(e) => searchSpots(e.target.value)}
                placeholder="Restaurant name…"
                autoComplete="off"
                style={{
                  width: "100%", boxSizing: "border-box",
                  border: "1.5px solid var(--line)", borderRadius: "var(--r-md)",
                  padding: "10px 12px 10px 34px", fontSize: 13.5,
                  fontFamily: "Outfit, sans-serif", background: "var(--cream)",
                  color: "var(--ink)", outline: "none",
                }}
              />
              {suggestions.length > 0 && (
                <div style={{
                  position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
                  background: "var(--cream-hi)", border: "1.5px solid var(--line)",
                  borderRadius: "var(--r-md)", zIndex: 40,
                  boxShadow: "0 8px 24px rgba(44,36,24,0.14)", overflow: "hidden",
                }}>
                  {suggestions.map((s, i) => (
                    <button
                      key={s.spotId}
                      type="button"
                      onClick={() => pickSpot(s)}
                      style={{
                        display: "flex", width: "100%", textAlign: "left",
                        padding: "10px 12px", border: "none", background: "transparent",
                        cursor: "pointer",
                        borderBottom: i < suggestions.length - 1 ? "1px solid var(--line)" : "none",
                      }}
                    >
                      <span style={{ fontWeight: 700, fontSize: 13, color: "var(--ink)" }}>{s.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {(theme.results || []).length === 0 ? (
            <div style={{ fontSize: 12.5, color: "var(--muted)", padding: "6px 0", fontWeight: 500 }}>No votes yet. Be the first.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {theme.results.map((r, i) => {
                const isCrown = crowned && i === 0;
                return (
                  <div key={r.spotId} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                    <span style={{ width: 22, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: isCrown ? "#d97706" : "var(--muted)", fontSize: 12 }}>
                      {isCrown ? <Icon name="crown" size={13} width={2} color="#d97706" /> : `#${i + 1}`}
                    </span>
                    <span style={{ flex: 1, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</span>
                    <span style={{ color: "var(--muted)", fontWeight: 500, fontSize: 12 }}>{r.count}v</span>
                    {r.spotId === votedSpotId ? (
                      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--violet-deep)" }}>Voted</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => pickSpot(r)}
                        style={{ border: "none", borderRadius: "var(--r-pill)", padding: "4px 10px", fontSize: 11.5, fontWeight: 700, background: "var(--violet)", color: "#fff", cursor: "pointer" }}
                      >
                        Vote
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <div style={{ marginTop: 10 }}>
            <Link href={`/rankings/${theme.slug || slugFromTitle(theme.title)}`} style={{ fontSize: 12, fontWeight: 700, color: "var(--violet)", textDecoration: "none" }}>
              Full ranking page →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function YourPicks({ current, history, votedSpotId, results = [] }) {
  const trail = typeof window === "undefined" ? [] : getThemePicks();
  const byTheme = Object.fromEntries(trail.map((p) => [p.themeId, p]));

  const rows = [];
  if (current && votedSpotId) {
    const fromTrail = byTheme[current.id];
    const fromResults = results.find((r) => r.spotId === votedSpotId);
    rows.push({
      key: current.id,
      title: current.title,
      name: fromTrail?.name || fromResults?.name || "Your pick",
      status: "open",
      statusLabel: "This week",
    });
  }
  for (const t of history) {
    const spotId = getThemeVoteSpot(t.id) || byTheme[t.id]?.spotId;
    if (!spotId) continue;
    const fromResults = t.results?.find((r) => r.spotId === spotId);
    const name = byTheme[t.id]?.name || fromResults?.name || "Your pick";
    const won = t.winnerId && t.winnerId === spotId;
    rows.push({
      key: t.id,
      title: t.title,
      name,
      status: won ? "won" : "done",
      statusLabel: won ? "Won" : (t.winnerName ? "Not this time" : "Voted"),
    });
  }

  if (rows.length === 0) return null;

  return (
    <div style={{ marginTop: current ? 20 : 0, marginBottom: 8 }}>
      <div style={{ padding: "0 16px 10px", fontSize: 11, fontWeight: 700, color: "var(--muted)", letterSpacing: "0.07em", textTransform: "uppercase" }}>
        Your picks
      </div>
      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 8 }}>
        {rows.slice(0, 8).map((r) => (
          <div
            key={r.key}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "11px 13px",
              borderRadius: "var(--r-md)",
              background: r.status === "won" ? "linear-gradient(135deg,#fef3c7,#fde68a)" : "var(--cream-hi)",
              border: "1.5px solid var(--line)",
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {r.title}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {r.name}
              </div>
            </div>
            <span style={{
              flexShrink: 0,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              color: r.status === "won" ? "#b45309" : r.status === "open" ? "var(--violet)" : "var(--muted)",
            }}>
              {r.statusLabel}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
