import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { cookieSecret, signVoter, verifyVoter } from "../../../lib/recommendationCookie.js";
import { getRecommendations } from "../../../lib/recommendations.js";
import { recommendationsEnabled } from "../../../lib/recommendationShared.js";
import { getAdminDb } from "../../../lib/firebaseAdmin.js";
import { validateVote, voteTarget, voterHash, writeRecommendationVote } from "../../../lib/recommendationVotes.js";
import { getPublicDishSummary } from "../../../lib/recommendationDishes.js";
import { askLinksFor } from "../../../lib/askPages.js";
import { communityPicks, findRecommendation, rankedAddedPlaces, rankedPlaces, withRankings } from "../../../lib/recommendationPicks.js";

export const dynamic = "force-dynamic";
const COOKIE = "hyd-recommendation-voter";
const cookieId = (req) => {
  return verifyVoter(req.cookies.get(COOKIE)?.value, cookieSecret());
};
function reply(data, voter, status = 200) {
  const res = NextResponse.json(data, { status, headers: { "Cache-Control": "private, no-store" } });
  if (voter && cookieSecret()) res.cookies.set(COOKIE, signVoter(voter, cookieSecret()), { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 31_536_000 });
  return res;
}
// Dishes people added (public once 2+ agree), approved community picks and places our
// weekly rankings put on top all ride along on the list payload.
async function withCommunityDishes(model) {
  let summary = {}, picks = [], ranked = new Map();
  try { const db = await getAdminDb(); if (db) [summary, picks, ranked] = await Promise.all([getPublicDishSummary(db), communityPicks(), rankedPlaces()]); } catch {}
  if (!Object.keys(summary).length && !picks.length && !ranked.size) return model;
  try { picks = [...picks, ...(await rankedAddedPlaces(ranked, new Set(picks.map((p) => p.id))))]; } catch {}
  return { ...model, places: [...model.places, ...picks].map((p) => {
    const q = withRankings(p, ranked.get(p.id));
    return summary[p.id] ? { ...q, communityDishes: summary[p.id] } : q;
  }) };
}
export async function GET(req) {
  if (!recommendationsEnabled()) return reply({ error: "Not available" }, null, 404);
  const id = new URL(req.url).searchParams.get("spot");
  if (!id) return reply(await withCommunityDishes(getRecommendations()));
  const place = await findRecommendation(id);
  if (!place) return reply({ error: "Place not found" }, null, 404);
  const voter = cookieId(req) || randomUUID();
  const targets = [null, ...place.dishes.map((d) => d.id)];
  let votes = {};
  try {
    const db = await getAdminDb();
    if (!db || !cookieSecret()) return reply({ votes, available: false, ask: askLinksFor(place.id).map((x) => ({ slug: x.slug, h1: x.h1 })) }, voter);
    await Promise.all(targets.map(async (dish) => {
      const key = voteTarget(id, dish);
      const [counts, mine] = await Promise.all([
        db.collection("recommendation_totals").doc(key).get(),
        db.collection("recommendation_voters").doc(voterHash(voter)).collection("ballots").doc(key).get(),
      ]);
      votes[dish || "place"] = { up: counts.data()?.up || 0, down: counts.data()?.down || 0, vote: mine.data()?.vote || 0 };
    }));
    return reply({ votes, available: place.recommended, ask: askLinksFor(place.id).map((x) => ({ slug: x.slug, h1: x.h1 })) }, voter);
  } catch { return reply({ votes: {}, available: false }, voter); }
}
export async function POST(req) {
  if (!recommendationsEnabled()) return reply({ error: "Not available" }, null, 404);
  if (req.headers.get("origin") !== new URL(req.url).origin || req.headers.get("sec-fetch-site") === "cross-site") return reply({ error: "Invalid origin" }, null, 403);
  const voter = cookieId(req);
  if (!voter) return reply({ error: "Refresh recommendations to enable voting. Cookies must be allowed." }, null, 401);
  const text = await req.text();
  if (text.length > 2048) return reply({ error: "Request too large" }, null, 413);
  let body;
  try { body = JSON.parse(text); } catch { return reply({ error: "Invalid request" }, null, 400); }
  const place = await findRecommendation(body?.placeId);
  if (!validateVote(body || {}, place)) return reply({ error: "Invalid vote target" }, null, 400);
  try {
    const db = await getAdminDb();
    if (!db) return reply({ error: "Voting is temporarily unavailable" }, null, 503);
    const result = await writeRecommendationVote(db, { voter, placeId: place.id, dishId: body.dishId || null, vote: body.vote });
    return reply(result);
  } catch (e) { return reply({ error: e.status === 429 ? e.message : "Vote could not be saved. Please retry." }, null, e.status || 503); }
}
