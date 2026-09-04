import { getAdminDb } from "../../../../lib/firebaseAdmin.js";

export const dynamic = "force-dynamic";

function authOk(req) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  return (req.headers.get("Authorization") || "") === `Bearer ${secret}`;
}

const COL = "themeSuggestions";

// GET, visitor theme requests for the admin to review (newest first).
export async function GET(req) {
  if (!authOk(req)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const db = await getAdminDb();
  if (!db) return Response.json({ suggestions: [] });
  const status = new URL(req.url).searchParams.get("status") || "new";
  try {
    const snap = await db.collection(COL).where("status", "==", status).limit(200).get();
    const suggestions = snap.docs
      .map((d) => ({ id: d.id, text: d.data().text, createdAt: d.data().createdAt || 0 }))
      .sort((a, b) => b.createdAt - a.createdAt);
    return Response.json({ suggestions });
  } catch {
    return Response.json({ suggestions: [] });
  }
}

// POST { id, action }, action "dismiss" | "restore" | "delete"
export async function POST(req) {
  if (!authOk(req)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const db = await getAdminDb();
  if (!db) return Response.json({ error: "unavailable" }, { status: 503 });

  const { id, action } = await req.json().catch(() => ({}));
  if (!id || !["dismiss", "restore", "delete"].includes(action)) {
    return Response.json({ error: "bad-request" }, { status: 400 });
  }
  const ref = db.collection(COL).doc(id);
  try {
    if (action === "delete") await ref.delete();
    else await ref.set({ status: action === "dismiss" ? "dismissed" : "new" }, { merge: true });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "backend" }, { status: 500 });
  }
}
