import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const drives = JSON.parse(fs.readFileSync(new URL("../data/inspection-drives.json", import.meta.url), "utf8"));
const locations = JSON.parse(fs.readFileSync(new URL("../data/inspection-places.json", import.meta.url), "utf8")).places;

test("13 October TG SAFE drive preserves the official action counts and map pins", () => {
  const drive = drives.find((d) => d.id === "2026-10-13-restaurants-canteens");
  assert.ok(drive);
  assert.equal(drive.inspected, 13);
  assert.equal(drive.samples, 16);
  assert.equal(drive.entries.length, 13);
  assert.equal(drive.entries.filter((e) => e.action === "licence-suspended").length, 4);
  assert.equal(drive.entries.filter((e) => e.action === "notice-proposed").length, 7);
  assert.equal(drive.entries.filter((e) => e.action === "no-action").length, 2);

  const pinned = new Set(locations.filter((p) => p.date === drive.date && p.verified).map((p) => p.name));
  assert.deepEqual([...drive.entries.map((e) => e.name).filter((name) => !pinned.has(name))], []);
});
