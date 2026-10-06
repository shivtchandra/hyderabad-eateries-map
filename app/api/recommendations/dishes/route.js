import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { cookieSecret, signVoter, verifyVoter } from "../../../../lib/recommendationCookie.js";
import { findRecommendation } from "../../../../lib/recommendationPicks.js";
import { recommendationsEnabled } from "../../../../lib/recommendationShared.js";
import { getAdminDb } from "../../../../lib/firebaseAdmin.js";
import { dishAddRef, visibleDishes, writeDishAdd } from "../../../../lib/recommendationDishes.js";

// "What's good here?" for a recommended place.
//   GET  ?place=<id>             -> { dishes: [{ name, count, public, mine }], available }
//   POST { placeId, name, add }  -> { name, count, public, mine }
export const dynamic = "force-dynamic";
const COOKIE = "hyd-recommendation-voter";

function reply(data, voter, status = 200) {
  const res = NextResponse.json(data, { status, headers: { "Cache-Control": "private, no-store" } });
  if (voter && cookieSecret()) res.cookies.set(COOKIE, signVoter(voter, cookieSecret()), { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 31_536_000 });
  return res;
}
const cookieId = (req) => verifyVoter(req.cookies.get(COOKIE)?.value, cookieSecret());

export async function GET(req) {
  if (!recommendationsEnabled()) return reply({ error: "Not available" }, null, 404);
  const place = await findRecommendation(new URL(req.url).searchParams.get("place"));
  if (!place?.recommended) return reply({ error: "Place not found" }, null, 404);
  const voter = cookieId(req) || randomUUID();
  try {
    const db = await getAdminDb();
    if (!db || !cookieSecret()) return reply({ dishes: [], available: false }, voter);
    const [placeDoc, mineDoc] = await Promise.all([
      db.collection("recommendation_dishes").doc(place.id).get(),
      dishAddRef(db, voter, place.id).get(),
    ]);
    const mine = new Set(Object.keys((mineDoc.exists && mineDoc.data().keys) || {}));
    return reply({ dishes: visibleDishes((placeDoc.exists && placeDoc.data().dishes) || {}, mine), available: true }, voter);
  } catch { return reply({ dishes: [], available: false }, voter); }
}

export async function POST(req) {
  if (!recommendationsEnabled()) return reply({ error: "Not available" }, null, 404);
  if (req.headers.get("origin") !== new URL(req.url).origin || req.headers.get("sec-fetch-site") === "cross-site") return reply({ error: "Invalid origin" }, null, 403);
  const voter = cookieId(req);
  if (!voter) return reply({ error: "Refresh the page and try again. Cookies must be allowed." }, null, 401);
  const text = await req.text();
  if (text.length > 1024) return reply({ error: "Request too large" }, null, 413);
  let body;
  try { body = JSON.parse(text); } catch { return reply({ error: "Invalid request" }, null, 400); }
  const place = await findRecommendation(body?.placeId);
  if (!place?.recommended || typeof body.name !== "string") return reply({ error: "Invalid request" }, null, 400);
  try {
    const db = await getAdminDb();
    if (!db) return reply({ error: "Adding dishes is unavailable right now." }, null, 503);
    return reply(await writeDishAdd(db, { voter, placeId: place.id, name: body.name, add: body.add !== false }));
  } catch (e) { return reply({ error: e.status ? e.message : "Could not save. Please retry." }, null, e.status || 503); }
}
