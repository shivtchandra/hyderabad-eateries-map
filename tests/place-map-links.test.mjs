import test from "node:test";
import assert from "node:assert/strict";
import { googleMapsPlaceUrl } from "../lib/placeMapLinks.js";

test("Google Maps fallback identifies a known branch by its place ID", () => {
  const url = new URL(googleMapsPlaceUrl("ChIJ123_test", "Persian shawarma & more"));
  assert.equal(url.origin, "https://www.google.com");
  assert.equal(url.pathname, "/maps/search/");
  assert.equal(url.searchParams.get("api"), "1");
  assert.equal(url.searchParams.get("query_place_id"), "ChIJ123_test");
  assert.equal(url.searchParams.get("query"), "Persian shawarma & more, Hyderabad");
});

test("new community places use a name search rather than a fabricated place ID", () => {
  const url = new URL(googleMapsPlaceUrl("user-new", "Cafe #1 & More"));
  assert.equal(url.searchParams.get("query_place_id"), null);
  assert.equal(url.searchParams.get("query"), "Cafe #1 & More, Hyderabad");
  assert.equal(url.hash, "");
});
