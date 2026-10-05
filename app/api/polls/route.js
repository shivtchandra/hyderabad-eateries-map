import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { cookieSecret, signVoter, verifyVoter } from "../../../lib/recommendationCookie.js";
import { getAdminDb } from "../../../lib/firebaseAdmin.js";
import { askPage } from "../../../lib/askPages.js";
import { readPoll, writePollVote } from "../../../lib/polls.js";

// Live polls on /ask pages.
//   GET  ?id=<ask slug>              -> { counts, total, mine, available }
//   POST { id, option | null }       -> { counts, total, mine }
export const dynamic = "force-dynamic";
const COOKIE = "hyd-recommendation-voter";

function reply(data, voter, status = 200) {
  const res = NextResponse.json(data, { status, headers: { "Cache-Control": "private, no-store" } });
  if (voter && cookieSecret()) res.cookies.set(COOKIE, signVoter(voter, cookieSecret()), { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 31_536_000 });
  return res;
}
const cookieId = (req) => verifyVoter(req.cookies.get(COOKIE)?.value, cookieSecret());

export async function GET(req) {
  const page = askPage(new URL(req.url).searchParams.get("id") || "");
  if (!page) return reply({ error: "Poll not found" }, null, 404);
  const voter = cookieId(req) || randomUUID();
  try {
    const db = await getAdminDb();
    if (!db || !cookieSecret()) return reply({ counts: {}, total: 0, mine: null, available: false }, voter);
    return reply({ ...(await readPoll(db, page.slug, voter)), available: true }, voter);
  } catch { return reply({ counts: {}, total: 0, mine: null, available: false }, voter); }
}

export async function POST(req) {
  if (req.headers.get("origin") !== new URL(req.url).origin || req.headers.get("sec-fetch-site") === "cross-site") return reply({ error: "Invalid origin" }, null, 403);
  const voter = cookieId(req);
  if (!voter) return reply({ error: "Refresh the page and try again. Cookies must be allowed." }, null, 401);
  const text = await req.text();
  if (text.length > 512) return reply({ error: "Request too large" }, null, 413);
  let body;
  try { body = JSON.parse(text); } catch { return reply({ error: "Invalid request" }, null, 400); }
  const page = askPage(typeof body?.id === "string" ? body.id : "");
  if (!page) return reply({ error: "Poll not found" }, null, 404);
  try {
    const db = await getAdminDb();
    if (!db) return reply({ error: "Voting is unavailable right now." }, null, 503);
    const result = await writePollVote(db, { voter, pollId: page.slug, option: body.option ?? null, options: page.poll.options.map((o) => o.id) });
    return reply(result);
  } catch (e) { return reply({ error: e.status ? e.message : "Could not save. Please retry." }, null, e.status || 503); }
}
