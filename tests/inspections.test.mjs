import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const drives = JSON.parse(fs.readFileSync(new URL("../data/inspection-drives.json", import.meta.url), "utf8"));
const locations = JSON.parse(fs.readFileSync(new URL("../data/inspection-places.json", import.meta.url), "utf8")).places;
const links = JSON.parse(fs.readFileSync(new URL("../data/inspection-links.json", import.meta.url), "utf8")).links;

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

test("29 October TG SAFE Pre-Diwali Sweets drive preserves official action counts and links", () => {
  const drive = drives.find((d) => d.id === "2026-10-29-sweets-pre-diwali-cure");
  assert.ok(drive);
  assert.equal(drive.inspected, 16);
  assert.equal(drive.samples, 16);
  assert.equal(drive.entries.length, 16);
  assert.equal(drive.entries.filter((e) => e.action === "closed").length, 5);
  assert.equal(drive.entries.filter((e) => e.action === "licence-suspended").length, 5);
  assert.equal(drive.entries.filter((e) => e.action === "notice").length, 6);

  // Spot link for Hameedi Confectioners in MJ Market
  const hameediLink = links.find((l) => l.date === "2026-10-29" && l.name === "Hameedi Confectionaries");
  assert.ok(hameediLink);
  assert.equal(hameediLink.spotId, "ChIJbW6zMX6XyzsR7Z4re69VMos");
});

test("31 October TG SAFE Golconda and Charminar restaurants drive preserves official action counts and links", () => {
  const drive = drives.find((d) => d.id === "2026-10-31-golconda-charminar-restaurants");
  assert.ok(drive);
  assert.equal(drive.inspected, 22);
  assert.equal(drive.samples, 21);
  assert.equal(drive.entries.length, 22);
  assert.equal(drive.entries.filter((e) => e.action === "licence-suspended").length, 14);
  assert.equal(drive.entries.filter((e) => e.action === "notice").length, 8);

  // Spot links for Hotel Nayaab, Dine Hill, Sohail, Pista House, Taj Falaknuma
  const oct31Links = links.filter((l) => l.date === "2026-10-31");
  assert.ok(oct31Links.some((l) => l.name === "Hotel Nayaab" && l.spotId === "ChIJNUS44SeYyzsRQl6GqHS92tg"));
  assert.ok(oct31Links.some((l) => l.name === "Dine Hill Restaurant" && l.spotId === "ChIJz7gUnD-XyzsR7SZKFa8nnEs"));
  assert.ok(oct31Links.some((l) => l.name === "Sohail Restaurant" && l.spotId === "ChIJw-MCKzSYyzsRNGvxUsetab0"));
  assert.ok(oct31Links.some((l) => l.name === "Pista House" && l.spotId === "ChIJOQniFvWXyzsRQ1K83DNOYIE"));
  assert.ok(oct31Links.some((l) => l.name === "Taj Falaknuma Palace" && l.spotId === "ChIJ8R2WrVe9yzsRKaWWzqU2RVM"));
});
