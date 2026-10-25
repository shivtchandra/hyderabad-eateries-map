import test from "node:test";
import assert from "node:assert/strict";
import { GEO_GUIDES } from "../lib/geoGuides.js";
import { getEateryById } from "../lib/siteData.js";

test("GEO guides have unique, complete search-intent pages", () => {
  assert.equal(GEO_GUIDES.length, 17);
  assert.equal(new Set(GEO_GUIDES.map((guide) => guide.slug)).size, GEO_GUIDES.length);
  for (const guide of GEO_GUIDES) {
    assert.ok(guide.title && guide.description && guide.answer);
    assert.ok(guide.keywords?.length >= 3);
    assert.ok(guide.spots?.length >= 1);
  }
});

test("every venue referenced by a GEO guide resolves to a mapped spot", () => {
  for (const guide of GEO_GUIDES) {
    for (const spot of guide.spots) {
      if (spot.id) assert.ok(getEateryById(spot.id), `${guide.slug}: missing ${spot.id}`);
      else assert.ok(spot.name && spot.href, `${guide.slug}: non-venue entry needs a name and link`);
    }
  }
});

test("Japanese discovery keeps YouMee positioned as East Asian", () => {
  const guide = GEO_GUIDES.find((item) => item.slug === "best-japanese-east-asian-restaurants-hyderabad");
  const youmee = guide.spots.find((spot) => spot.id === "ChIJXVsG9IaRyzsRl7cElupPpKw");
  assert.match(youmee.tag, /East Asian/i);
  assert.match(youmee.verdict, /rather than as a sushi specialist/i);
});
