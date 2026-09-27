import { getAdminDb } from "../../../../lib/firebaseAdmin.js";
import { revalidateTag } from "next/cache";
import { ACTIONS, STATUSES } from "../../../../lib/inspectionsServer.js";

export const dynamic = "force-dynamic";

function authOk(req) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("Authorization") || "";
  return auth === `Bearer ${secret}`;
}

const str = (v, n) => String(v ?? "").trim().slice(0, n);
const list = (v, n, each) => (Array.isArray(v) ? v : String(v ?? "").split(","))
  .map((x) => str(x, each)).filter(Boolean).slice(0, n);

// GET, list all drives newest first (including unsourced drafts, admin only).
export async function GET(req) {
  if (!authOk(req)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const db = await getAdminDb();
  if (!db) return Response.json({ drives: [] });
  const snap = await db.collection("inspectionDrives").orderBy("date", "desc").limit(200).get();
  return Response.json({ drives: snap.docs.map((d) => ({ id: d.id, ...d.data() })) });
}

// POST, create or update a drive. Body: { id?, date, title, areas, authority, inspected, samples,
// summary, sources: [{label,url}], entries: [{name, area, spotId, action, findings, status, statusNote, statusDate}] }
export async function POST(req) {
  if (!authOk(req)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(b.date || "") || !str(b.title, 140)) {
    return Response.json({ error: "date (YYYY-MM-DD) and title required" }, { status: 400 });
  }
  const sources = (Array.isArray(b.sources) ? b.sources : [])
    .map((s) => ({ label: str(s?.label, 80), url: str(s?.url, 500) }))
    .filter((s) => /^https?:\/\//.test(s.url)).slice(0, 10);
  const entries = (Array.isArray(b.entries) ? b.entries : [])
    .map((e) => ({
      name: str(e?.name, 120),
      area: str(e?.area, 60),
      spotId: str(e?.spotId, 80) || null,
      action: ACTIONS[e?.action] ? e.action : "notice",
      findings: list(e?.findings, 12, 80),
      status: STATUSES[e?.status] ? e.status : "action-taken",
      statusNote: str(e?.statusNote, 240),
      statusDate: /^\d{4}-\d{2}-\d{2}$/.test(e?.statusDate || "") ? e.statusDate : "",
    }))
    .filter((e) => e.name).slice(0, 100);

  const db = await getAdminDb();
  if (!db) return Response.json({ error: "unavailable" }, { status: 503 });
  const ref = b.id ? db.collection("inspectionDrives").doc(str(b.id, 80)) : db.collection("inspectionDrives").doc();
  const existing = await ref.get();
  const now = Date.now();
  await ref.set({
    date: b.date,
    title: str(b.title, 140),
    areas: list(b.areas, 12, 60),
    authority: str(b.authority, 120) || "TG SAFE (Commissioner of Food Safety, Telangana)",
    inspected: Math.max(0, parseInt(b.inspected, 10) || 0),
    samples: Math.max(0, parseInt(b.samples, 10) || 0),
    summary: str(b.summary, 600),
    sources,
    entries,
    createdAt: existing.exists ? existing.data().createdAt || now : now,
    updatedAt: now,
  });
  revalidateTag("inspections");
  return Response.json({ ok: true, id: ref.id, published: sources.length > 0 });
}

// DELETE, remove a drive. Body: { id }
export async function DELETE(req) {
  if (!authOk(req)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await req.json().catch(() => ({}));
  if (!id) return Response.json({ error: "id required" }, { status: 400 });
  const db = await getAdminDb();
  if (!db) return Response.json({ error: "unavailable" }, { status: 503 });
  await db.collection("inspectionDrives").doc(String(id)).delete();
  revalidateTag("inspections");
  return Response.json({ ok: true });
}
