import crypto from "crypto";
import { getAdminDb } from "../../../lib/firebaseAdmin.js";

// Email sign-ups from the "after you vote" card (VoteFollowUp.jsx).
//   POST /api/subscribe { email, topics: ["weekly", "picks"], source, theme }
//   GET  /api/subscribe?unsubscribe=<token>   one-click unsubscribe (link in every email)
// One Firestore doc per address in `subscribers` (id = sha256 of the address), so
// signing up twice just updates the topics. Consent is recorded with its time and
// where it came from. Sending the emails is separate (needs an email service).

export const dynamic = "force-dynamic";

const TOPICS = new Set(["weekly", "picks"]);
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,24}$/i;
const idFor = (email) => crypto.createHash("sha256").update(email).digest("hex").slice(0, 40);

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  if (body.website) return Response.json({ ok: true }); // honeypot: bots fill every field
  const email = String(body.email || "").trim().toLowerCase();
  if (!EMAIL.test(email)) return Response.json({ error: "bad-email" }, { status: 400 });
  const topics = (Array.isArray(body.topics) ? body.topics : []).filter((t) => TOPICS.has(t));
  if (!topics.length) return Response.json({ error: "no-topics" }, { status: 400 });

  const db = await getAdminDb();
  if (!db) return Response.json({ error: "unavailable" }, { status: 503 });

  const ref = db.collection("subscribers").doc(idFor(email));
  const now = Date.now();
  const prev = await ref.get();
  await ref.set({
    email,
    topics,
    status: "subscribed",
    unsubscribeToken: prev.exists && prev.data().unsubscribeToken ? prev.data().unsubscribeToken : crypto.randomBytes(18).toString("hex"),
    consent: { at: now, source: String(body.source || "vote").slice(0, 40), theme: String(body.theme || "").slice(0, 120) },
    createdAt: prev.exists ? prev.data().createdAt || now : now,
    updatedAt: now,
  }, { merge: true });
  return Response.json({ ok: true });
}

export async function GET(req) {
  const token = new URL(req.url).searchParams.get("unsubscribe");
  const page = (msg) => new Response(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Hyderabad Eats</title><body style="font-family:system-ui;background:#f4f2ee;color:#141414;display:grid;place-items:center;min-height:90vh;margin:0"><div style="max-width:420px;padding:24px;text-align:center"><h1 style="font-size:28px">${msg}</h1><p><a href="/" style="color:#5b21b6;font-weight:700">Back to Hyderabad Eats</a></p></div>`, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  if (!token || !/^[a-f0-9]{36}$/.test(token)) return page("That link doesn't look right.");
  const db = await getAdminDb();
  if (!db) return page("Couldn't reach our list right now. Try again soon.");
  const snap = await db.collection("subscribers").where("unsubscribeToken", "==", token).limit(1).get();
  if (snap.empty) return page("You're not on our list.");
  await snap.docs[0].ref.set({ status: "unsubscribed", topics: [], updatedAt: Date.now() }, { merge: true });
  return page("You're unsubscribed. No more emails.");
}
