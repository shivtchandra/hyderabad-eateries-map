"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  debateLineFromCounts,
  rankingInsights,
  rankingPeriodLabel,
  rankingWeekLabel,
  previousRankingPeriod,
} from "../../lib/rankings.js";

// Ranking pages ship as static HTML (rebuilt once a day), so the server render
// is only a snapshot. These read the live standings from /api/rankings and
// redraw over it. One request per page, shared by every component below.
const live = new Map();
function fetchLive(slug, area = "", period = "all-time") {
  const key = [slug, area, period].join(":");
  if (!live.has(key)) {
    const params = new URLSearchParams({ slug, period });
    if (area) params.set("area", area);
    live.set(key, fetch(`/api/rankings?${params.toString()}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => json?.theme || null)
      .catch(() => null));
  }
  return live.get(key);
}

function useLiveTheme(slug, enabled, area = "", period = "all-time") {
  const [theme, setTheme] = useState(null);
  useEffect(() => {
    setTheme(null);
    if (!enabled) return undefined;
    let on = true;
    fetchLive(slug, area, period).then((t) => { if (on && t) setTheme(t); });
    return () => { on = false; };
  }, [slug, enabled, area, period]);
  return theme;
}

const voted = (rows = []) => rows.filter((r) => (r.count || 0) > 0);

export function LiveDebate({ slug, initialCounts = [], isPlaceholder = false }) {
  const theme = useLiveTheme(slug, !isPlaceholder);
  if (isPlaceholder) return <>Voting opens soon. Suggested candidates below are not standings.</>;
  const counts = theme ? voted(theme.results).map((r) => r.count || 0) : initialCounts;
  return <>{debateLineFromCounts(counts)}</>;
}

export default function LiveRankingStandings({
  slug,
  areaSlug = "",
  initialResults = [],
  initialCurrentResults = [],
  initialPreviousResults = [],
  initialCurrentWeekResults = [],
  initialPreviousWeekResults = [],
  initialCurrentPeriod = "",
  initialPreviousPeriod = "",
  initialCurrentWeek = "",
  initialPreviousWeek = "",
  initialWinnerId = null,
  initialContenders = [],
  initialInsights = null,
  meta = {},
  voteHref,
  isPlaceholder = false,
}) {
  const [period, setPeriod] = useState("all-time");
  const theme = useLiveTheme(slug, !isPlaceholder, areaSlug, period);
  const currentPeriod = theme?.currentPeriod || initialCurrentPeriod;
  const previousPeriod = theme?.previousPeriod || initialPreviousPeriod;
  const currentWeek = theme?.currentWeek || initialCurrentWeek;
  const previousWeek = theme?.previousWeek || initialPreviousWeek;
  const initialForPeriod = period === "current" ? initialCurrentResults
    : period === "previous" ? initialPreviousResults
      : period === "week-current" ? initialCurrentWeekResults
        : period === "week-previous" ? initialPreviousWeekResults
      : period === "all-time" ? initialResults : [];
  const comparison = period === "current" ? initialPreviousResults
    : period === "week-current" ? initialPreviousWeekResults : [];
  const voteRows = theme?.selectedResults || initialForPeriod;
  const allRows = theme?.results || initialResults;
  const insights = theme?.selectedInsights || (
    period === "all-time" && initialInsights?.allTime
      ? initialInsights.allTime
      : rankingInsights(voteRows, comparison)
  );
  const winnerId = period === "all-time" ? (theme ? theme.winnerId || null : initialWinnerId) : null;
  const isCrowned = Boolean(winnerId);

  const board = voted(voteRows);
  const totalVotes = insights.totalVotes;
  const leader = board.find((r) => r.spotId === winnerId) || board[0] || null;
  const rest = board.filter((r) => r !== leader);
  const onBoard = new Set(board.map((r) => r.spotId));
  const contenders = [];
  const seen = new Set();
  for (const r of [...allRows, ...initialContenders]) {
    if (onBoard.has(r.spotId) || seen.has(r.spotId)) continue;
    seen.add(r.spotId);
    contenders.push(r);
  }
  contenders.splice(12);
  const runnerUp = rest[0] || null;
  const leadLine = !leader ? "" : !runnerUp
    ? "The only spot with votes so far"
    : leader.count > runnerUp.count ? `${leader.count - runnerUp.count} ahead of ${runnerUp.name}` : `Tied with ${runnerUp.name}`;

  const hrefOf = (id) => meta[id]?.href || `/spot/${encodeURIComponent(id)}`;
  const photoOf = (id) => meta[id]?.photo || null;
  const nameOf = (r) => (r.spotId.startsWith("user-")
    ? <span className="rk-nm">{r.name} <span className="new-place-chip">New</span></span>
    : <Link href={hrefOf(r.spotId)} className="rk-nm">{r.name}</Link>);
  const topDishOf = (id) => meta[id]?.topDish || null;
  // Separate from votes: how many r/hyderabad users recommend the spot.
  const redditOf = (id) => ((meta[id]?.reddit || 0) >= 3 ? meta[id].reddit : 0);
  const redditLine = (id) => redditOf(id) ? <span className="rk-reddit">Reddit pick · {redditOf(id)} locals</span> : null;
  const movementOf = (id) => {
    const move = insights.movement?.[id];
    if (!move || !["current", "week-current"].includes(period)) return "";
    const unit = period === "week-current" ? "week" : "month";
    if (move.status === "new") return `New this ${unit}`;
    if (move.status === "same") return "No change";
    return `${move.status === "up" ? "↑" : "↓"}${Math.abs(move.delta || 0)} this ${unit}`;
  };
  const olderPeriods = [];
  let cursor = previousPeriod;
  for (let i = 0; cursor && i < 5; i += 1) {
    olderPeriods.push(cursor);
    cursor = previousRankingPeriod(cursor);
  }
  return (
    <>
      {!isPlaceholder && currentPeriod && (
        <div className="rk-periods" aria-label="Ranking period">
          <button type="button" className={period === "all-time" ? "active" : ""} onClick={() => setPeriod("all-time")}>All time</button>
          <button type="button" className={period === "current" ? "active" : ""} onClick={() => setPeriod("current")}>This month</button>
          <button type="button" className={period === "week-current" ? "active" : ""} onClick={() => setPeriod("week-current")}>This week</button>
          <select
            aria-label="Earlier month"
            value={period === "all-time" || period === "current" ? "" : period === "previous" ? previousPeriod : period}
            onChange={(event) => setPeriod(event.target.value || "all-time")}
          >
            <option value="">Earlier month</option>
            {olderPeriods.map((value) => <option key={value} value={value}>{rankingPeriodLabel(value)}</option>)}
          </select>
        </div>
      )}

      {!isPlaceholder && (
        <p className="rk-window">
          {period === "week-current" && currentWeek
            ? `This week: ${rankingWeekLabel(currentWeek)} · Monday–Sunday, Hyderabad time.`
            : period === "week-previous" && previousWeek
              ? `Week: ${rankingWeekLabel(previousWeek)} · Monday–Sunday, Hyderabad time.`
              : period === "current" && currentPeriod
                ? `This month: ${rankingPeriodLabel(currentPeriod)} · Hyderabad calendar month.`
                : period === "all-time"
                  ? "All-time preference board · older votes gradually carry less weight."
                  : rankingPeriodLabel(period)}
        </p>
      )}

      {!leader && !isPlaceholder && period !== "all-time" && (
        <div className="rk-period-empty">
          <b>No votes for {period === "week-current" ? rankingWeekLabel(currentWeek) : rankingPeriodLabel(period === "current" ? currentPeriod : period)} yet.</b>
          <span>Your vote starts this {period === "week-current" ? "week’s" : "month’s"} board without erasing the all-time ranking.</span>
        </div>
      )}

      {leader && (
        <Link href={leader.spotId.startsWith("user-") ? voteHref : hrefOf(leader.spotId)} className="ticket rk-ticket">
          {photoOf(leader.spotId) && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="ticket-photo" src={photoOf(leader.spotId)} alt="" width={72} height={72} />
          )}
          <span className="ticket-body">
            <span className="ticket-kicker"><span className="ring">#1</span> · {isCrowned ? "Winner" : "Leading"}</span>
            <span className="ticket-name">{leader.name}</span>
            <span className="ticket-line">{leader.count} of {totalVotes} votes · {leadLine}</span>
            {topDishOf(leader.spotId) && (
              <span className="rk-dish">Order: {topDishOf(leader.spotId).name} · {topDishOf(leader.spotId).label}</span>
            )}
            {redditLine(leader.spotId)}
            {movementOf(leader.spotId) && <span className="rk-move">{movementOf(leader.spotId)}</span>}
          </span>
          <span className="ticket-arrow" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M9 7h8v8" /></svg>
          </span>
        </Link>
      )}

      {rest.length > 0 && (
        <section className="rk-section" aria-label="Standings">
          <ol className="rk-rows">
            {rest.map((r, i) => {
              const above = i === 0 ? leader : rest[i - 1];
              const need = (above?.count || 0) - (r.count || 0) + 1;
              return (
                <li key={r.spotId} className="rk-row2">
                  <span className="rk-n">{i + 2}</span>
                  {photoOf(r.spotId)
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img className="rk-ph" src={photoOf(r.spotId)} alt="" loading="lazy" width={60} height={60} />
                    : <span className="rk-ph rk-ph--empty" aria-hidden="true">{(r.name || "?").charAt(0)}</span>}
                  <span className="rk-txt">
                    {nameOf(r)}
                    <span className="rk-v">{`${r.count} ${r.count === 1 ? "vote" : "votes"} · ${need} to pass #${i + 1}`}</span>
                    {topDishOf(r.spotId) && <span className="rk-dish">Order: {topDishOf(r.spotId).name} · {topDishOf(r.spotId).label}</span>}
                    {redditLine(r.spotId)}
                    {movementOf(r.spotId) && <span className="rk-move">{movementOf(r.spotId)}</span>}
                  </span>
                  {!isPlaceholder && <Link href={voteHref} className="rk-vote">Vote</Link>}
                </li>
              );
            })}
          </ol>
        </section>
      )}
      {!isPlaceholder && (
        <Link href={voteHref} className="rk-action rk-action--add">
          <span className="rk-action-tile" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          </span>
          <span className="rk-action-text"><b>Can&rsquo;t see your pick?</b><span>Add it to the ballot</span></span>
        </Link>
      )}

      {/* Unvoted spots are not standings: their own compact list, apart from the ranked one. */}
      {contenders.length > 0 && (
        <section className="rk-section rk-ballot" aria-label={isPlaceholder ? "Suggested ballot candidates" : "On the ballot, no votes yet"}>
          <h2 className="rk-title">{isPlaceholder ? "Suggested ballot candidates" : "On the ballot, no votes yet"}</h2>
          <p className="rk-lede">{isPlaceholder ? "These are unranked suggestions. Voting creates the order." : "One vote puts any of these on the board."}</p>
          <ul className="rk-ballot-grid">
            {contenders.map((r) => (
              <li key={r.spotId}>
                <Link href={hrefOf(r.spotId)} className="rk-ballot-card">
                  {photoOf(r.spotId)
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={photoOf(r.spotId)} alt="" loading="lazy" width={44} height={44} />
                    : <span className="rk-ballot-empty" aria-hidden="true">{(r.name || "?").charAt(0)}</span>}
                  <span>
                    {r.name}
                    {redditOf(r.spotId) > 0 && <small className="rk-reddit">Reddit pick · {redditOf(r.spotId)} locals</small>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {!isPlaceholder && (
            <Link href={voteHref} className="rk-action">
              <span className="rk-action-text"><b>Vote for one of these</b><span>Put it on the board</span></span>
              <span className="rk-action-tile rk-action-tile--go" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </span>
            </Link>
          )}
        </section>
      )}
    </>
  );
}
