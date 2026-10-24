import test from "node:test";
import assert from "node:assert/strict";
import { newPlacesCaption, recentApprovedPlaces } from "../lib/newPlaces.js";

const NOW = Date.parse("2026-10-20T12:00:00Z");

test("recentApprovedPlaces keeps only approvals from the last seven days", () => {
  const places = recentApprovedPlaces([
    { name: "Today", status: "approved", approvedAt: "2026-10-20T08:00:00Z" },
    { name: "Last week", status: "approved", approvedAt: "2026-10-13T13:00:00Z" },
    { name: "Too old", status: "approved", approvedAt: "2026-10-13T11:59:59Z" },
    { name: "Pending", status: "pending", createdAt: "2026-10-20T10:00:00Z" },
  ], NOW);
  assert.deepEqual(places.map((place) => place.name), ["Today", "Last week"]);
});

test("newPlacesCaption includes the reviewed list and map URL", () => {
  const caption = newPlacesCaption([{ name: "Cafe One", area: "Jubilee Hills" }]);
  assert.match(caption, /1\. Cafe One — Jubilee Hills/);
  assert.match(caption, /eats\.mapmyhyd\.com/);
});
