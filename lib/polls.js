import { voterHash, voteTarget } from "./recommendationVotes.js";

// Live polls on /ask pages. One switchable vote per browser (signed anonymous cookie, the
// same one recommendation votes use). Firestore:
//   polls/{pollId}                 { counts: { optionId: n }, total }
//   poll_votes/{voter_poll}        { pollId, option }
//   poll_voters/{voter}            { windowAt, writes }   rate limit, 30 changes a minute
export const POLL_MIN_SHOWN = 20; // below this, totals aren't shown as percentages

const pollRef = (db, pollId) => db.collection("polls").doc(voteTarget(pollId).slice(0, 40));
const ballotRef = (db, voter, pollId) => db.collection("poll_votes").doc(`${voterHash(voter).slice(0, 32)}_${voteTarget(pollId).slice(0, 32)}`);

export async function readPoll(db, pollId, voter = null) {
  const [p, b] = await Promise.all([pollRef(db, pollId).get(), voter ? ballotRef(db, voter, pollId).get() : null]);
  const d = (p.exists && p.data()) || {};
  return { counts: d.counts || {}, total: d.total || 0, mine: (b?.exists && b.data().option) || null };
}

// option null clears the vote; picking the same option again is a no-op.
export async function writePollVote(db, { voter, pollId, option, options, now = Date.now() }) {
  if (option !== null && !options.includes(option)) throw Object.assign(new Error("Pick one of the options."), { status: 400 });
  const pRef = pollRef(db, pollId), bRef = ballotRef(db, voter, pollId);
  const uRef = db.collection("poll_voters").doc(voterHash(voter));
  return db.runTransaction(async (tx) => {
    const [pDoc, bDoc, uDoc] = await Promise.all([tx.get(pRef), tx.get(bRef), tx.get(uRef)]);
    const cur = (pDoc.exists && pDoc.data()) || {};
    const counts = { ...(cur.counts || {}) };
    const previous = (bDoc.exists && bDoc.data().option) || null;
    if (previous === option) return { counts, total: cur.total || 0, mine: option, unchanged: true };
    const rate = uDoc.exists ? uDoc.data() : {};
    const fresh = !rate.windowAt || now - rate.windowAt >= 60_000;
    if (!fresh && rate.writes >= 30) throw Object.assign(new Error("Please wait a minute and try again."), { status: 429 });
    if (previous) counts[previous] = Math.max(0, (counts[previous] || 0) - 1);
    if (option) counts[option] = (counts[option] || 0) + 1;
    const total = Object.values(counts).reduce((s, n) => s + n, 0);
    tx.set(pRef, { pollId, counts, total, updatedAt: now });
    tx.set(bRef, { pollId, option, updatedAt: now });
    tx.set(uRef, { windowAt: fresh ? now : rate.windowAt, writes: fresh ? 1 : rate.writes + 1 });
    return { counts, total, mine: option };
  });
}
