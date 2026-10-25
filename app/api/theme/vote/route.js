import { getAdminDb } from "../../../../lib/firebaseAdmin.js";
import { revalidateTag } from "next/cache";
import { clearThemesMemo } from "../../../../lib/themesServer.js";
import { bumpScore, themeCreatedAt, voteWeight } from "../../../../lib/voteDecay.js";
import { rankingPeriod, rankingWeek } from "../../../../lib/rankings.js";

export const dynamic = "force-dynamic";

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const { themeId, spotId, name, uid } = body;
  if (!themeId || !spotId) return Response.json({ error: "bad-request" }, { status: 400 });

  const db = await getAdminDb();
  if (!db) return Response.json({ error: "unavailable" }, { status: 503 });

  // Rankings never close. `active` only marks the currently promoted topic.
  // Every vote updates the person's all-time preference and Hyderabad's current month.
  const themeRef = db.collection("themes").doc(themeId);
  const themeDoc = await themeRef.get();
  if (!themeDoc.exists) return Response.json({ error: "theme-missing" }, { status: 404 });
  const createdAt = themeCreatedAt(themeDoc.data());
  const period = rankingPeriod();
  const week = rankingWeek();

  const votesCol = themeRef.collection("votes");
  const voteRef = votesCol.doc(spotId);
  const voterRef = uid ? themeRef.collection("voters").doc(uid) : null;
  const monthRef = themeRef.collection("months").doc(period);
  const monthVotesCol = monthRef.collection("votes");
  const monthVoteRef = monthVotesCol.doc(spotId);
  const monthVoterRef = uid ? monthRef.collection("voters").doc(uid) : null;
  const weekRef = themeRef.collection("weeks").doc(week);
  const weekVotesCol = weekRef.collection("votes");
  const weekVoteRef = weekVotesCol.doc(spotId);
  const weekVoterRef = uid ? weekRef.collection("voters").doc(uid) : null;

  // One all-time preference and one current-month preference per uid.
  // A repeat in a new month leaves all-time unchanged while starting that month's board.
  const result = await db.runTransaction(async (tx) => {
    const voterDoc = voterRef ? await tx.get(voterRef) : null;
    const monthVoterDoc = monthVoterRef ? await tx.get(monthVoterRef) : null;
    const weekVoterDoc = weekVoterRef ? await tx.get(weekVoterRef) : null;
    const priorSpotId = voterDoc?.exists ? voterDoc.data().spotId : null;
    const priorMonthSpotId = monthVoterDoc?.exists ? monthVoterDoc.data().spotId : null;
    const priorWeekSpotId = weekVoterDoc?.exists ? weekVoterDoc.data().spotId : null;
    const oldVoteRef = priorSpotId && priorSpotId !== spotId ? votesCol.doc(priorSpotId) : null;
    const oldMonthVoteRef = priorMonthSpotId && priorMonthSpotId !== spotId ? monthVotesCol.doc(priorMonthSpotId) : null;
    const oldWeekVoteRef = priorWeekSpotId && priorWeekSpotId !== spotId ? weekVotesCol.doc(priorWeekSpotId) : null;

    const oldVoteDoc = oldVoteRef ? await tx.get(oldVoteRef) : null;
    const newVoteDoc = await tx.get(voteRef);
    const oldMonthVoteDoc = oldMonthVoteRef ? await tx.get(oldMonthVoteRef) : null;
    const newMonthVoteDoc = await tx.get(monthVoteRef);
    const oldWeekVoteDoc = oldWeekVoteRef ? await tx.get(oldWeekVoteRef) : null;
    const newWeekVoteDoc = await tx.get(weekVoteRef);
    const now = Date.now();
    const allTimeUnchanged = Boolean(voterRef && priorSpotId === spotId);
    const monthlyUnchanged = Boolean(monthVoterRef && priorMonthSpotId === spotId);
    const weeklyUnchanged = Boolean(weekVoterRef && priorWeekSpotId === spotId);

    if (oldVoteRef && oldVoteDoc?.exists) {
      const old = oldVoteDoc.data();
      const oldCount = Math.max(0, (old.count || 0) - 1);
      const oldScore = bumpScore(old, createdAt, -voteWeight(voterDoc.data().votedAt, now), now);
      tx.set(oldVoteRef, { ...old, count: oldCount, ...oldScore, updatedAt: now }, { merge: true });
    }

    const previousAllTime = newVoteDoc.exists ? newVoteDoc.data() : {};
    const allTimeCount = allTimeUnchanged ? previousAllTime.count || 0 : (previousAllTime.count || 0) + 1;
    if (!allTimeUnchanged) {
      const score = bumpScore(previousAllTime, createdAt, 1, now);
      tx.set(voteRef, { count: allTimeCount, ...score, name: (name || "").slice(0, 100), updatedAt: now }, { merge: true });
      if (voterRef) tx.set(voterRef, { spotId, votedAt: now });
    }

    if (oldMonthVoteRef && oldMonthVoteDoc?.exists) {
      const old = oldMonthVoteDoc.data();
      tx.set(oldMonthVoteRef, { ...old, count: Math.max(0, (old.count || 0) - 1), updatedAt: now }, { merge: true });
    }

    const previousMonth = newMonthVoteDoc.exists ? newMonthVoteDoc.data() : {};
    const monthlyCount = monthlyUnchanged ? previousMonth.count || 0 : (previousMonth.count || 0) + 1;
    if (!monthlyUnchanged) {
      tx.set(monthVoteRef, { count: monthlyCount, name: (name || "").slice(0, 100), updatedAt: now }, { merge: true });
      if (monthVoterRef) tx.set(monthVoterRef, { spotId, votedAt: now });
    }

    if (oldWeekVoteRef && oldWeekVoteDoc?.exists) {
      const old = oldWeekVoteDoc.data();
      tx.set(oldWeekVoteRef, { ...old, count: Math.max(0, (old.count || 0) - 1), updatedAt: now }, { merge: true });
    }

    const previousWeekVote = newWeekVoteDoc.exists ? newWeekVoteDoc.data() : {};
    const weeklyCount = weeklyUnchanged ? previousWeekVote.count || 0 : (previousWeekVote.count || 0) + 1;
    if (!weeklyUnchanged) {
      tx.set(weekVoteRef, { count: weeklyCount, name: (name || "").slice(0, 100), updatedAt: now }, { merge: true });
      if (weekVoterRef) tx.set(weekVoterRef, { spotId, votedAt: now });
    }

    tx.set(monthRef, { period, updatedAt: now }, { merge: true });
    tx.set(weekRef, { period: week, updatedAt: now }, { merge: true });
    tx.set(themeRef, {
      monthlyStartedAt: themeDoc.data().monthlyStartedAt || period,
      monthlyUpdatedAt: now,
      weeklyStartedAt: themeDoc.data().weeklyStartedAt || week,
      weeklyUpdatedAt: now,
    }, { merge: true });

    return {
      period,
      count: allTimeCount,
      allTimeCount,
      monthlyCount,
      week,
      weeklyCount,
      allTimeSwitched: Boolean(priorSpotId && priorSpotId !== spotId),
      monthlySwitched: Boolean(priorMonthSpotId && priorMonthSpotId !== spotId),
      weeklySwitched: Boolean(priorWeekSpotId && priorWeekSpotId !== spotId),
      switched: Boolean(priorSpotId && priorSpotId !== spotId),
      unchanged: allTimeUnchanged && monthlyUnchanged && weeklyUnchanged,
    };
  });

  if (!result.unchanged) { revalidateTag("themes"); clearThemesMemo(); }

  return Response.json(result);
}
