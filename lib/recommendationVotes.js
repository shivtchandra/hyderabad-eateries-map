import { createHash } from "node:crypto";

export const voterHash = (id) => createHash("sha256").update(id).digest("hex");
export function voteTarget(placeId, dishId = null) {
  return createHash("sha256").update(JSON.stringify([placeId, dishId])).digest("hex");
}
export function updateCounts(counts = {}, previous = 0, next = 0) {
  return { up: Math.max(0, (counts.up || 0) - Number(previous === 1) + Number(next === 1)),
    down: Math.max(0, (counts.down || 0) - Number(previous === -1) + Number(next === -1)) };
}
export function validateVote(body, place) {
  return !!place?.recommended && [-1, 0, 1].includes(body.vote)
    && (body.dishId == null || place.dishes.some((d) => d.id === body.dishId));
}
export async function writeRecommendationVote(db, { voter, placeId, dishId = null, vote, now = Date.now() }) {
  const target = voteTarget(placeId, dishId);
  const totalRef = db.collection("recommendation_totals").doc(target);
  const userRef = db.collection("recommendation_voters").doc(voterHash(voter));
  const ballotRef = userRef.collection("ballots").doc(target);
  return db.runTransaction(async (tx) => {
    const [totalDoc, ballotDoc, userDoc] = await Promise.all([tx.get(totalRef), tx.get(ballotRef), tx.get(userRef)]);
    const previous = ballotDoc.exists ? ballotDoc.data().vote : 0;
    const counts = totalDoc.exists ? totalDoc.data() : {};
    if (previous === vote) return { ...updateCounts(counts), vote, unchanged: true };
    const rate = userDoc.exists ? userDoc.data() : {};
    const fresh = !rate.windowAt || now - rate.windowAt >= 60_000;
    if (!fresh && rate.writes >= 30) throw Object.assign(new Error("Please wait a minute before voting again."), { status: 429 });
    const next = updateCounts(counts, previous, vote);
    tx.set(totalRef, { ...next, placeId, dishId, updatedAt: now });
    tx.set(ballotRef, { vote, updatedAt: now });
    tx.set(userRef, { windowAt: fresh ? now : rate.windowAt, writes: fresh ? 1 : rate.writes + 1 });
    return { ...next, vote };
  });
}
