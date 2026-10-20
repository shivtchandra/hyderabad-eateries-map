import test from "node:test";
import assert from "node:assert/strict";
import { itemListJsonLd, rankingAnswer } from "../lib/rankings.js";

const theme = {
  title: "Best Ramen in Hyderabad",
  results: [
    { spotId: "hibacci", name: "Hibacci", count: 8 },
    { spotId: "haiku", name: "Haiku", count: 5 },
  ],
};

test("ranking GEO answer names the leader, vote share and runner-up", () => {
  assert.equal(
    rankingAnswer(theme),
    "Hibacci is currently #1 for ramen in Hyderabad with 8 of 13 local votes, followed by Haiku.",
  );
});

test("ranking ItemList identifies Hyderabad, entities and freshness", () => {
  const ld = itemListJsonLd(theme, "https://eats.mapmyhyd.com", (id) => `/spot/${id}`, "2026-10-20");
  assert.equal(ld.about.name, "Hyderabad");
  assert.equal(ld.spatialCoverage.containedInPlace.name, "Telangana");
  assert.equal(ld.dateModified, "2026-10-20");
  assert.equal(ld.itemListElement[0].item["@type"], "FoodEstablishment");
  assert.equal(ld.itemListElement[0].item.url, "https://eats.mapmyhyd.com/spot/hibacci");
});
