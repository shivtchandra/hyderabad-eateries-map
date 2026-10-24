import test from "node:test";
import assert from "node:assert/strict";
import {
  isRankingPeriod,
  previousRankingPeriod,
  rankingAreaQualification,
  rankingInsights,
  rankingPeriod,
  rankingPeriodLabel,
} from "../lib/rankings.js";

test("ranking month uses the Hyderabad calendar at the UTC month boundary", () => {
  assert.equal(rankingPeriod(new Date("2026-10-31T18:29:59.000Z")), "2026-10");
  assert.equal(rankingPeriod(new Date("2026-10-31T18:30:00.000Z")), "2026-11");
  assert.equal(previousRankingPeriod("2026-01"), "2025-12");
  assert.equal(rankingPeriodLabel("2026-10"), "October 2026");
});

test("ranking periods reject malformed and future values", () => {
  assert.equal(isRankingPeriod("2026-10", "2026-10"), true);
  assert.equal(isRankingPeriod("2026-11", "2026-10"), false);
  assert.equal(isRankingPeriod("2026-1", "2026-10"), false);
});

test("ranking insights expose confidence, share, margin and month movement", () => {
  const current = [
    { spotId: "a", count: 12 },
    { spotId: "b", count: 10 },
    { spotId: "c", count: 3 },
  ];
  const previous = [
    { spotId: "b", count: 8 },
    { spotId: "a", count: 7 },
  ];
  const result = rankingInsights(current, previous);
  assert.equal(result.totalVotes, 25);
  assert.equal(result.confidence, "Established local signal");
  assert.equal(result.leaderShare, 48);
  assert.equal(result.winningMargin, 2);
  assert.equal(result.closeRace, true);
  assert.deepEqual(result.movement.a, { status: "up", rank: 1, previousRank: 2, delta: 1 });
  assert.deepEqual(result.movement.c, { status: "new", rank: 3, previousRank: null, delta: null });
});

test("area pages become indexable only after every quality gate passes", () => {
  const qualifying = rankingAreaQualification([
    { spotId: "a", count: 4 },
    { spotId: "b", count: 3 },
    { spotId: "c", count: 3 },
    { spotId: "d", count: 0 },
    { spotId: "e", count: 0 },
  ]);
  assert.equal(qualifying.indexable, true);

  assert.equal(rankingAreaQualification([
    { spotId: "a", count: 8 },
    { spotId: "b", count: 2 },
    { spotId: "c", count: 0 },
    { spotId: "d", count: 0 },
    { spotId: "e", count: 0 },
  ]).indexable, false);
});

test("zero-vote rankings do not manufacture a leader signal", () => {
  const result = rankingInsights([{ spotId: "a", count: 0 }]);
  assert.equal(result.totalVotes, 0);
  assert.equal(result.leaderShare, 0);
  assert.equal(result.confidence, "No votes yet");
  assert.deepEqual(result.movement, {});
});
