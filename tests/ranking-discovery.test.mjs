import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { rankingDiscovery, rankingVisitOptions } from "../lib/rankingDiscovery.js";
import { rankingAnswer, rankingMeta, SEO_THEME_PICKS, slugFromTitle } from "../lib/rankings.js";
import { GEO_GUIDE_SLUGS } from "../lib/geoGuides.js";

test("every canonical topic has tailored guidance and only real related destinations", () => {
  const slugs = SEO_THEME_PICKS.map((p) => slugFromTitle(p.title));
  for (const slug of slugs) {
    const discovery = rankingDiscovery(slug);
    assert.notEqual(discovery.heading, "Plan your visit", slug);
    assert.ok(discovery.faqs.length > 0, slug);
    assert.ok(!discovery.related.includes(slug), slug);
    for (const related of discovery.related) assert.ok(slugs.includes(related), related);
    for (const guide of discovery.guides) {
      assert.ok(GEO_GUIDE_SLUGS.includes(guide) || existsSync(new URL(`../app/guides/${guide}/page.jsx`, import.meta.url)), guide);
    }
  }
});

test("visit comparisons exclude unvoted/unresolved places and invalid budget estimates", () => {
  const results = [{ spotId: "none", count: 0 }, { spotId: "missing", count: 9 },
    { spotId: "valid", count: 4, name: "Real branch" }, { spotId: "valid", count: 4 },
    { spotId: "unknown-budget", count: 1 }];
  const venues = { valid: { costForTwo: 1200, discoveredIn: "Wrong discovery bucket", address: "Actual branch address" },
    "unknown-budget": { name: "Other branch", costForTwo: -1 } };
  const options = rankingVisitOptions(results, (id) => venues[id], (id) => `/spot/${id}`);
  assert.equal(options.length, 2);
  assert.equal(options[0].budget, 1200);
  assert.equal(options[0].address, "Actual branch address");
  assert.equal(options[1].budget, null);
  assert.equal(options[1].address, null);
  assert.deepEqual(rankingVisitOptions([{ spotId: "valid", count: 0 }], (id) => venues[id], () => "", () => null), []);
});

test("biryani search title retains the actual best-biryani query", () => {
  const meta = rankingMeta({ title: "Best Biryani in Hyderabad", results: [] });
  assert.ok(meta.title.startsWith("Best Biryani in Hyderabad"));
  assert.ok(meta.description.includes("No voted standings yet"));
  assert.ok(!meta.description.includes("Local leader"));
});

test("tied leaders never become a sole winner in the answer or snippet", () => {
  const theme = { title: "Best Shawarma in Hyderabad", winnerId: "a", results: [
    { spotId: "a", name: "Alpha", count: 3 }, { spotId: "b", name: "Beta", count: 3 },
  ] };
  assert.match(rankingAnswer(theme), /Alpha and Beta are tied for #1/);
  assert.match(rankingMeta(theme).description, /2 places tied for #1/);
});

test("recency-weighted leaders retain their position even with fewer raw votes", () => {
  const theme = { title: "Best Cafe in Hyderabad", results: [
    { spotId: "old", name: "Older favourite", count: 20, fresh: 3 },
    { spotId: "new", name: "Recent favourite", count: 8, fresh: 7 },
  ] };
  assert.match(rankingAnswer(theme), /^Recent favourite is currently #1/);
  assert.match(rankingMeta(theme).description, /^Recent favourite leads/);
  const sameCount = { ...theme, results: theme.results.map((r) => ({ ...r, count: 8 })) };
  assert.ok(!rankingAnswer(sameCount).includes("tied for #1"));
});

test("a stale crown and unsorted zero-vote candidates cannot control the search answer", () => {
  const theme = { title: "Best Momos in Hyderabad", winnerId: "old", results: [
    { spotId: "suggested", name: "Unvoted", count: 0 },
    { spotId: "old", name: "Old winner", count: 1 },
    { spotId: "new", name: "New leader", count: 5 },
  ] };
  assert.match(rankingAnswer(theme), /^New leader is currently #1/);
  assert.match(rankingMeta(theme).description, /^New leader leads/);
  assert.ok(!rankingMeta(theme).description.includes("Unvoted"));
});
