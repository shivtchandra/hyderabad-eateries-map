/**
 * Delete Firestore docs that aren't in the curated local set.
 *
 * Leftovers from the v1 seed (random-uuid doc ids, no `discoveredIn`, never
 * enriched) survived later purges and inflate the live count. data/eateries.json
 * is the source of truth for what the curated set is.
 *
 * Run: node scripts/prune-orphans.mjs        # dry run, lists what it would delete
 *      APPLY=1 node scripts/prune-orphans.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, "..", ".env.local") });

const APPLY = process.env.APPLY === "1";
const local = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "data", "eateries.json"), "utf-8")
);
const keep = new Set(local.map((e) => e.id));

const { initializeApp, cert } = await import("firebase-admin/app");
const { getFirestore } = await import("firebase-admin/firestore");
const app = initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
const db = getFirestore(app);
const col = db.collection("eateries");

const snap = await col.get();
const orphans = snap.docs.filter((d) => !keep.has(d.id));

console.log(`firestore ${snap.size} | curated ${local.length} | orphans ${orphans.length}`);
for (const d of orphans.slice(0, 10)) console.log(`  - ${d.data().name}`);
if (orphans.length > 10) console.log(`  … and ${orphans.length - 10} more`);

if (!APPLY) {
  console.log("\nDry run. Re-run with APPLY=1 to delete.");
  process.exit(0);
}

for (let i = 0; i < orphans.length; i += 400) {
  const batch = db.batch();
  for (const d of orphans.slice(i, i + 400)) batch.delete(d.ref);
  await batch.commit();
}
console.log(`Deleted ${orphans.length}. Collection now ${snap.size - orphans.length}.`);
