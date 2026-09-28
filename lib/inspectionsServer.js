import { unstable_cache } from "next/cache";
import { getAdminDb } from "./firebaseAdmin.js";

// Food safety inspection drives (TG SAFE / FSSAI), curated in /admin.
// One Firestore doc per drive in `inspectionDrives`, restaurants embedded as `entries`.
// Reads are cached and tagged "inspections"; the admin route revalidates the tag on write.
// Any Firestore failure returns [] so pages still render (same stance as the rankings SSR).

export const ACTIONS = {
  "licence-suspended": "Licence suspended",
  closed: "Operations stopped",
  notice: "Notice issued",
  penalty: "Penalty",
  "no-action": "No action",
};
export const STATUSES = {
  "action-taken": "Action taken",
  "reinspection-due": "Re-inspection due",
  resumed: "Resumed after re-inspection",
};

const readDrives = unstable_cache(
  async () => {
    const db = await getAdminDb();
    if (!db) return [];
    const snap = await db.collection("inspectionDrives").orderBy("date", "desc").limit(200).get();
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      // Never publish a drive without an official source.
      .filter((d) => Array.isArray(d.sources) && d.sources.some((s) => s?.url));
  },
  ["inspection-drives"],
  // Admin edits bust "inspections" by tag, so this is a safety net.
  { revalidate: 86400, tags: ["inspections"] }
);

export async function getInspectionDrives() {
  try {
    return await readDrives();
  } catch (err) {
    console.error("[inspections] read failed:", err?.message || err);
    return [];
  }
}

// Records for one spot, newest first: [{ drive, entry }].
export async function getInspectionsForSpot(spotId) {
  if (!spotId) return [];
  const drives = await getInspectionDrives();
  const out = [];
  for (const drive of drives) {
    for (const entry of drive.entries || []) {
      if (entry.spotId === spotId) out.push({ drive, entry });
    }
  }
  return out;
}

export function driveStats(drives) {
  let inspected = 0, samples = 0, suspended = 0;
  for (const d of drives) {
    inspected += Number(d.inspected) || 0;
    samples += Number(d.samples) || 0;
    suspended += (d.entries || []).filter((e) => e.action === "licence-suspended").length;   // unlicensed closures are not suspensions
  }
  return { drives: drives.length, inspected, samples, suspended };
}

export function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00+05:30`);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
}
