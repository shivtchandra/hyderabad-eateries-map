import {
  getAllRankingsThemes,
  getAreaRanking,
  getRankingBySlug,
  getRankingPeriodResults,
  getRankingWeekResults,
} from "../../../lib/themesServer.js";
import { rankingsBySpot } from "../../../lib/recommendationPicks.js";
import { isRankingPeriod, isRankingWeek, rankingInsights } from "../../../lib/rankings.js";
import { getAreaBySlug } from "../../../lib/siteData.js";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");

  if (slug) {
    const requestedPeriod = searchParams.get("period") || "all-time";
    if (!["all-time", "current", "previous", "week-current", "week-previous"].includes(requestedPeriod)
      && !isRankingPeriod(requestedPeriod) && !isRankingWeek(requestedPeriod)) {
      return Response.json({ error: "invalid-period" }, { status: 400 });
    }

    const areaSlug = searchParams.get("area");
    const areaRanking = areaSlug ? await getAreaRanking(slug, areaSlug) : null;
    if (areaSlug && !areaRanking) return Response.json({ error: "not-found" }, { status: 404 });
    const theme = areaRanking?.theme || await getRankingBySlug(slug);
    if (!theme) return Response.json({ error: "not-found" }, { status: 404 });

    let selectedPeriod = requestedPeriod;
    let selectedResults = theme.results;
    let comparisonResults = [];
    if (requestedPeriod === "current") {
      selectedPeriod = theme.currentPeriod;
      selectedResults = theme.currentPeriodResults || [];
      comparisonResults = theme.previousPeriodResults || [];
    } else if (requestedPeriod === "previous") {
      selectedPeriod = theme.previousPeriod;
      selectedResults = theme.previousPeriodResults || [];
    } else if (requestedPeriod === "week-current") {
      selectedPeriod = theme.currentWeek;
      selectedResults = theme.currentWeekResults || [];
      comparisonResults = theme.previousWeekResults || [];
    } else if (requestedPeriod === "week-previous") {
      selectedPeriod = theme.previousWeek;
      selectedResults = theme.previousWeekResults || [];
    } else if (isRankingWeek(requestedPeriod)) {
      selectedResults = await getRankingWeekResults(theme.id, requestedPeriod, theme.displayLimit);
      if (areaSlug) {
        const ids = new Set(getAreaBySlug(areaSlug)?.spots.map((spot) => spot.id) || []);
        selectedResults = selectedResults.filter((row) => ids.has(row.spotId));
      }
    } else if (requestedPeriod !== "all-time") {
      selectedResults = await getRankingPeriodResults(theme.id, requestedPeriod, theme.displayLimit);
      if (areaSlug) {
        const ids = new Set(getAreaBySlug(areaSlug)?.spots.map((spot) => spot.id) || []);
        selectedResults = selectedResults.filter((row) => ids.has(row.spotId));
      }
    }

    return Response.json({
      theme: {
        ...theme,
        selectedPeriod,
        selectedResults,
        selectedInsights: rankingInsights(selectedResults, comparisonResults),
      },
      ...(areaRanking ? { area: areaRanking.area, qualification: areaRanking.qualification } : {}),
    });
  }

  const themes = await getAllRankingsThemes(50);
  // Ask Eats: where each spot ranks ({ spotId: [{ title, slug, rank, votes, winner }] }).
  if (searchParams.get("bySpot")) {
    return Response.json({ bySpot: Object.fromEntries(rankingsBySpot(themes)) });
  }
  const lean = themes.map(({ id, title, slug, description, active, startDate, endDate, winnerId, winnerName, createdAt, results }) => ({
    id,
    title,
    slug,
    description,
    active,
    startDate,
    endDate,
    winnerId,
    winnerName,
    createdAt,
    totalVotes: (results || []).reduce((s, r) => s + (r.count || 0), 0),
    leader: results?.[0] ? { name: results[0].name, count: results[0].count } : null,
  }));

  return Response.json({ themes: lean });
}
