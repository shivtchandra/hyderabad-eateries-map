import { getAllRankingsThemes, getRankingBySlug } from "../../../lib/themesServer.js";
import { rankingsBySpot } from "../../../lib/recommendationPicks.js";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");

  if (slug) {
    const theme = await getRankingBySlug(slug);
    if (!theme) return Response.json({ error: "not-found" }, { status: 404 });
    return Response.json({ theme });
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
