import test from "node:test";
import assert from "node:assert/strict";
import { parseDistrict } from "../scripts/refresh-curated-offers.mjs";
import {
  buildDealWeek,
  comparisonResult,
  coverageStats,
  districtStatus,
  hyderabadNow,
  mealPeriod,
  updateOfferHistory,
} from "../lib/offerIntelligence.js";
import offers from "../data/curated-offers.json" with { type: "json" };

test("District parser keeps pre-book and no-booking offers separate", () => {
  const parsed = parseDistrict(`
## Offers
### FLAT 50% OFF
From 3:30 PM, today
18 slots left
### FLAT 10% OFF
No booking required
Valid all day
## Menu
`);

  assert.equal(parsed.deals.length, 2);
  assert.deepEqual(parsed.deals[0].when, {
    label: "From 3:30 PM, today",
    day: "today",
    from: 15 * 60 + 30,
    to: null,
  });
  assert.equal(parsed.deals[0].bookingMode, "prebook");
  assert.equal(parsed.deals[1].when, null);
  assert.equal(parsed.deals[1].bookingMode, "walkin");
});

test("District parser keeps tomorrow, time range and minimum bill terms", () => {
  const parsed = parseDistrict(`
## Offers
### FLAT 40% OFF
12:00 PM - 4:00 PM, tomorrow
9 slots left
### Additional Offers
### 10% OFF up to ₹1,000 using HDFC Credit Card
Applicable on bills of ₹3,500 or more
## Menu
`);
  assert.deepEqual(parsed.deals[0].when, { label: "12:00 PM - 4:00 PM, tomorrow", day: "tomorrow", from: 720, to: 960 });
  assert.equal(parsed.bankOffers[0].minBill, 3500);
  assert.equal(parsed.bankOffers[0].cap, 1000);
});

test("Hyderabad midnight and meal periods are stable", () => {
  assert.deepEqual(hyderabadNow("2026-10-25T18:30:00.000Z"), { day: "2026-10-26", min: 0 });
  assert.equal(mealPeriod(13 * 60), "afternoon");
  assert.equal(mealPeriod(19 * 60), "evening");
});

test("confirmed tomorrow is not marked live today", () => {
  const status = districtStatus({ bookingMode: "prebook", when: { day: "tomorrow", from: 900, to: 1020 } }, "2026-10-26T05:00:00Z", { day: "2026-10-26", min: 800 });
  assert.equal(status.state, "later");
  assert.match(status.label, /Tomorrow/);
});

test("comparator refuses unlike booking and meal terms", () => {
  const base = { branchVerified: true, available: true, deal: { pct: 20 } };
  assert.equal(comparisonResult([{ ...base, mode: "prebook", period: "afternoon" }, { ...base, mode: "walkin", period: "afternoon" }], 2000).reason, "booking-mode");
  assert.equal(comparisonResult([{ ...base, mode: "prebook", period: "afternoon" }, { ...base, mode: "prebook", period: "evening" }], 2000).reason, "meal-period");
});

test("history deduplicates same-day observations and prunes after 28 days", () => {
  const current = { spots: { one: { district: { url: "https://district.example/one", hasOffers: true, fetchedAt: "2026-10-26T01:00:00Z", deals: [{ title: "20% off", pct: 20, bookingMode: "walkin" }] } } } };
  const once = updateOfferHistory(null, current, "2026-10-26T01:00:00Z");
  const twice = updateOfferHistory(once, current, "2026-10-26T10:00:00Z");
  const record = Object.values(twice.spots.one.district)[0];
  assert.deepEqual(record.dates, ["2026-10-26"]);
  const later = updateOfferHistory(twice, { spots: {} }, "2026-11-24T01:00:00Z");
  assert.equal(later.spots.one, undefined);
});

test("seven-day strip labels history observed only after two distinct observations", () => {
  const item = { spotId: "one" };
  const offer = { pct: 20, platform: "district", kind: "restaurant", venue: { match: { status: "verified" } } };
  const one = { spots: { one: { district: { sig: { offer, dates: ["2026-10-16"] } } } } };
  const two = { spots: { one: { district: { sig: { offer, dates: ["2026-10-16", "2026-10-23"] } } } } };
  assert.equal(buildDealWeek(item, one, "2026-10-26")[4].state, "none");
  assert.equal(buildDealWeek(item, two, "2026-10-26")[4].state, "observed");
});

test("Vivaha Bhojanambu branches remain distinct exact records", () => {
  const branches = Object.entries(offers.spots).filter(([, value]) => /vivaha bhojanam/i.test(value.name));
  const jubilee = branches.find(([, value]) => value.area === "Jubilee Hills");
  const secunderabad = branches.find(([, value]) => value.area === "Secunderabad");
  assert.ok(jubilee && secunderabad);
  assert.notEqual(jubilee[0], secunderabad[0]);
  assert.notEqual(jubilee[1].district.url, secunderabad[1].district.url);
});

test("coverage reports matched and single-platform totals", () => {
  const verified = { status: "verified" };
  const stats = coverageStats({ a: { district: { url: "d", match: verified }, swiggy: { url: "s", match: verified } }, b: { district: { url: "d2", match: verified } } });
  assert.deepEqual(stats.matched, { district: 2, swiggy: 1, both: 1 });
  assert.deepEqual(stats.singlePlatform, { district: 1, swiggy: 0 });
});
