import assert from "node:assert/strict";
import test from "node:test";

import { slugFromTitle } from "../lib/rankings.js";
import {
  getEateries,
  getEateryBySlugOrId,
  spotSlug,
  spotSlugBase,
} from "../lib/siteData.js";

function oldBase(spot) {
  const area = spot.discoveredIn && !String(spot.discoveredIn).startsWith("text:")
    ? spot.discoveredIn
    : "";
  return slugFromTitle([spot.name, area].filter(Boolean).join(" ")) || slugFromTitle(spot.id || "spot");
}

test("area already present in a venue name is not duplicated in its canonical slug", () => {
  const glens = getEateries().find((spot) => spot.id === "ChIJFQOGvnOXyzsRaISRRzvIzdE");
  assert(glens);
  assert.equal(spotSlugBase(glens), "glens-bakehouse-film-nagar");
  assert.equal(spotSlug(glens), "glens-bakehouse-film-nagar");
});

test("clean, old duplicated, and place-id links all resolve to the same venue", () => {
  const glens = getEateries().find((spot) => spot.id === "ChIJFQOGvnOXyzsRaISRRzvIzdE");
  for (const link of [
    "glens-bakehouse-film-nagar",
    "glens-bakehouse-film-nagar-film-nagar",
    glens.id,
  ]) {
    assert.equal(getEateryBySlugOrId(link)?.id, glens.id, link);
  }
});

test("every previous canonical spot URL remains resolvable", () => {
  const used = new Set();
  for (const spot of getEateries()) {
    const base = oldBase(spot);
    let oldSlug = base;
    if (used.has(oldSlug)) {
      const tail = String(spot.id).replace(/[^a-zA-Z0-9]/g, "").slice(-8).toLowerCase();
      oldSlug = `${base}-${tail}`;
      let n = 2;
      while (used.has(oldSlug)) oldSlug = `${base}-${tail}-${n++}`;
    }
    used.add(oldSlug);
    assert.equal(getEateryBySlugOrId(oldSlug)?.id, spot.id, oldSlug);
  }
});

test("all generated canonical spot URLs are unique and resolvable", () => {
  const seen = new Set();
  for (const spot of getEateries()) {
    const slug = spotSlug(spot);
    assert(!seen.has(slug), `duplicate canonical slug: ${slug}`);
    seen.add(slug);
    assert.equal(getEateryBySlugOrId(slug)?.id, spot.id, slug);
  }
});
