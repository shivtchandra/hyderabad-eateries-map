import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { DISHES, matchesDish, filterRecommendations, groupRecommendations, parseMapState, mapSearch, publishableDishes } from "../lib/recommendationShared.js";
import { buildRecommendations, getRecommendations } from "../lib/recommendations.js";
import { updateCounts, validateVote, writeRecommendationVote } from "../lib/recommendationVotes.js";
import { signVoter, verifyVoter } from "../lib/recommendationCookie.js";
import { safeEvent } from "../lib/engagement.js";
import { cleanDishName, writeDishAdd, visibleDishes, PUBLIC_AT, DAY_LIMIT } from "../lib/recommendationDishes.js";
import { mustTry, dishPageEligible, dishMentions } from "../lib/recommendationShared.js";
import { dishSeedsFor } from "../lib/dishSeeds.js";

test("one shared curated set, distinct brands and qualified dish pages", () => {
  const m = getRecommendations();
  const shortlist = JSON.parse(fs.readFileSync("data/recommendation-shortlist.json", "utf8"));
  for (const b of shortlist.brands.filter((b) => b.status === "shortlisted")) {
    assert(b.branchIds.some((id) => m.places.some((p) => p.id === id && p.recommended)), b.name);
  }
  for (const p of m.places.filter((p) => p.reviewStatus === "shortlisted")) {
    assert.equal(p.seoEligible, false);
    assert(p.research.evidence.length > 0);
  }
  assert.equal(m.brands.subhan.dishes[0].accounts, 3);
  // Dish pages: earlier reviewed dishes keep their pages; others need 5+ brands and 20+ people.
  assert(m.dishes.some((d) => d.id === "osmania-biscuits"));
  assert(!m.dishes.some((d) => d.id === "sushi"));
  for (const d of m.dishes) assert(d.brands >= 3, d.id);
  for (const d of m.dishes.filter((x) => !publishableDishes(m.places).some((r) => r.id === x.id))) assert(dishPageEligible(m.places, d), d.id);
  const groups = groupRecommendations(m.places.filter((p) => p.recommended));
  assert(groups.some((g) => g.branches.length > 1));
  for (const p of m.places.filter((p) => p.redditBrandId)) assert(m.brands[p.redditBrandId]);
});
test("unverified Joint Mandi content is not published", () => {
  const id = "reddit_779b421301aa7d69346f";
  const eateries = JSON.parse(fs.readFileSync("data/eateries.json", "utf8"));
  const seeds = JSON.parse(fs.readFileSync("data/dish-seeds.json", "utf8"));
  assert(!eateries.some((place) => place.id === id));
  assert.equal(seeds[id], undefined);
  assert(!getRecommendations().places.some((place) => place.id === id));
});
test("reviewed Reddit associations really have three distinct source authors", () => {
  const reviews = JSON.parse(fs.readFileSync("data/recommendation-reviews.json", "utf8"));
  const rawPath = "data/reddit/raw.json";
  if (!fs.existsSync(rawPath)) return; // Raw collection is intentionally excluded from deploys.
  const raw = JSON.parse(fs.readFileSync(rawPath, "utf8"));
  const comments = new Map(raw.comments.map((c) => [c.id, c]));
  for (const b of reviews.brands) for (const d of b.dishes) {
    const sources = d.evidence.map((e) => comments.get(e.commentId));
    assert(sources.every(Boolean));
    assert.equal(new Set(sources.map((c) => c.author)).size, d.accounts);
    assert(sources.every((c) => c.body.toLowerCase().includes(b.id)));
  }
});
test("dish boundaries exclude Chaitanya and broad Japanese associations", () => {
  assert(!matchesDish("Japanese ramen", DISHES.find((d) => d.id === "sushi")));
  assert(!matchesDish("Chaitanya", DISHES.find((d) => d.id === "irani-chai")));
  assert(matchesDish("Mutton Dum Biryani", DISHES[0]));
});
test("unreviewed candidates, missing sources, weak sentiment and invalid coordinates are rejected", () => {
  const e = { id: "p", name: "Place", lat: 17.4, lng: 78.4, category: "restaurant" };
  const c = { spots: { p: { brand: "place", locals: 20, negatives: 0, score: 1 } } };
  assert(!buildRecommendations([e], [], { brands: [] }, c).places[0].recommended);
  assert.equal(buildRecommendations([{ ...e, lat: NaN }], ["p"], {}, c).places.length, 0);
  assert.equal(publishableDishes([{ brandId: "one", recommended: true, dishes: [{ id: "sushi" }] }]).length, 0);
  const r = { brands: [{ id: "place", status: "approved", branches: [{ id: "p", status: "approved" }], dishes: [{ id: "sushi", accounts: 5, evidence: [] }] }] };
  assert(!buildRecommendations([e], [], r, c).places[0].recommended);
  assert(!buildRecommendations([e], [], r, { spots: { p: { ...c.spots.p, negatives: 15 } } }).places[0].recommended);
});
test("dish, name, area and viewport filters produce the same source rows for map and list", () => {
  const m = getRecommendations();
  const s = parseMapState("dish=osmania-biscuits&mode=recommended");
  const results = filterRecommendations(m.places, s);
  // Reviewed tags (4) plus places locals name for the dish.
  assert(results.length >= 4);
  assert.equal(results.filter((p) => p.dishes.some((d) => d.id === "osmania-biscuits")).length, 4);
  assert(results.every((p) => p.recommended));
  assert.equal(groupRecommendations(results).flatMap((g) => g.branches).length, results.length);
  assert(filterRecommendations(m.places, { ...s, q: "Niloufer" }).length >= 2);
  assert.equal(filterRecommendations(m.places, { ...s, q: "no-such-dish" }).length, 0);
  const p = results[0];
  assert(filterRecommendations(m.places, { ...s, q: p.area }).some((x) => x.id === p.id));
  assert.equal(filterRecommendations(m.places, { ...s, bounds: { south: 17, north: 17.01, west: 78, east: 78.01 } }).length, 0);
});
test("new first-hand picks appear in Recommended and their dish filters", () => {
  const model = getRecommendations();
  const byId = Object.fromEntries(model.places.map((place) => [place.id, place]));
  const expected = {
    ChIJrcVnHhCayzsRyl7sbG3gTgg: "pizza",
    ChIJQX3oRACTyzsRYITnjwROO9U: "mandi",
    ChIJT9Bwx1qRyzsRFJNCT5djjzU: "biryani",
  };
  for (const [id, dish] of Object.entries(expected)) {
    assert.equal(byId[id]?.recommended, true, id);
    assert(byId[id].dishes.some((item) => item.id === dish), `${id}: ${dish}`);
    assert(filterRecommendations(model.places, { mode: "recommended", dish, q: "" }).some((place) => place.id === id), id);
  }
  assert.equal(byId.ChIJFQOGvnOXyzsRaISRRzvIzdE?.recommended, true);
  assert.equal(byId.ChIJFQOGvnOXyzsRaISRRzvIzdE?.signature?.name, "Rainbow Cake");
  assert.deepEqual(mustTry(byId.ChIJrcVnHhCayzsRyl7sbG3gTgg).slice(0, 2).map((dish) => dish.name), ["Spicy Paneer Pizza", "Softy"]);
  assert.deepEqual(mustTry(byId.ChIJFQOGvnOXyzsRaISRRzvIzdE).map((dish) => dish.name), ["Rainbow Cake", "Fudge Brownie", "Mini Cupcakes", "Red Velvet Cupcake"]);
  assert(filterRecommendations(model.places, { mode: "recommended", dish: "", q: "softy" }).some((place) => place.id === "ChIJrcVnHhCayzsRyl7sbG3gTgg"));
});
test("Panchakattu Dosa publishes the first-hand Neyyi Kaaram Palyam Dosa recommendation", () => {
  const id = "ChIJia4xz3KRyzsRoVKZLnQUo7c";
  const place = getRecommendations().places.find((item) => item.id === id);
  assert.equal(place?.recommended, true);
  assert.equal(place?.signature?.name, "Neyyi Kaaram Palyam Dosa");
  assert.equal(mustTry(place)[0]?.name, "Neyyi Kaaram Palyam Dosa");
  assert(dishSeedsFor({ id, name: "Panchakattu Dosa" }).some((dish) => dish.name === "Neyyi Kaaram Palyam Dosa" && dish.source === "editor"));
  assert(dishSeedsFor({ id: "ChIJeWjmMQCTyzsR1KLSg3XmaTI", name: "Panchakattu Dosa" }).some((dish) => dish.name === "Neyyi Kaaram Palyam Dosa" && dish.source === "editor"));
});
test("URL round trip preserves mode, dish, area, branch, view and bounds", () => {
  const s = parseMapState("mode=all&dish=dosa&area=Madhapur&spot=p&list=1&q=masala&view=17.4,78.4,14&bounds=17.3,17.5,78.3,78.5");
  assert.deepEqual(parseMapState(mapSearch(s)), s);
  assert.equal(parseMapState("view=99,99,30&dish=unknown").view, null);
});
test("cookie signatures reject forged identities", () => {
  const id = "12345678-1234-1234-1234-123456789012";
  const value = signVoter(id, "test-secret");
  assert.equal(verifyVoter(value, "test-secret"), id);
  assert.equal(verifyVoter(value, "another-secret"), null);
  assert.equal(verifyVoter(id, "test-secret"), null);
});
test("vote validation and totals support switching and clearing", () => {
  const p = { recommended: true, dishes: [{ id: "dosa" }] };
  assert(validateVote({ vote: -1, dishId: "dosa" }, p));
  assert(!validateVote({ vote: 1, dishId: "sushi" }, p));
  assert(!validateVote({ vote: "1" }, p));
  assert.deepEqual(updateCounts({ up: 1, down: 0 }, 1, -1), { up: 0, down: 1 });
  assert.deepEqual(updateCounts({ up: 0, down: 1 }, -1, 0), { up: 0, down: 0 });
});
function fakeDb() {
  const data = new Map(); let tail = Promise.resolve();
  const ref = (path) => ({ path, doc: (id) => ref(`${path}/${id}`), collection: (id) => ref(`${path}/${id}`) });
  return { collection: ref, data, runTransaction(fn) {
    const run = tail.then(async () => {
      const writes = [];
      const result = await fn({ get: async (r) => ({ exists: data.has(r.path), data: () => data.get(r.path) }), set: (r, d) => writes.push([r.path, d]) });
      for (const [k, v] of writes) data.set(k, v);
      return result;
    });
    tail = run.catch(() => {}); return run;
  } };
}
test("transactional voting is idempotent, concurrent-safe, switchable and rate limited", async () => {
  const db = fakeDb(); const input = { voter: "v", placeId: "p", vote: 1, now: 1000 };
  const results = await Promise.all(Array.from({ length: 8 }, () => writeRecommendationVote(db, input)));
  assert(results.every((r) => r.up === 1));
  assert.equal((await writeRecommendationVote(db, { ...input, vote: -1 })).down, 1);
  assert.equal((await writeRecommendationVote(db, { ...input, vote: 0 })).down, 0);
  for (let i = 0; i < 27; i++) await writeRecommendationVote(db, { ...input, placeId: `p${i}` });
  await assert.rejects(() => writeRecommendationVote(db, { ...input, placeId: "extra" }), (e) => e.status === 429);
  assert.equal((await writeRecommendationVote(db, { ...input, placeId: "extra", now: 62000 })).up, 1);
});
test("analytics discards visitor coordinates and arbitrary search strings", () => {
  const event = safeEvent({ event: "rec_dish", session: "12345678-1234-1234-1234-123456789012", variant: "curated", dish: "sushi", q: "my address", lat: 17, lng: 78, bounds: "private" });
  assert.equal(event.context.dish, "sushi");
  assert(!JSON.stringify(event).includes("my address"));
  assert(!("lat" in event.context));
});

test("dish names are validated", () => {
  assert.equal(cleanDishName("  mutton   biryani "), "Mutton biryani");
  assert.equal(cleanDishName("Ghee podi idli"), "Ghee podi idli");
  for (const bad of ["a", "http://spam.com", "www.x", "<b>", "123", "x".repeat(41), "fuck this"]) assert.equal(cleanDishName(bad), null, bad);
});
test("dish adds dedupe per visitor, go public at the threshold, and are rate limited", async () => {
  const db = fakeDb(); const base = { placeId: "p1", name: "Mutton biryani", now: Date.UTC(2026, 9, 5) };
  const first = await writeDishAdd(db, { ...base, voter: "a" });
  assert.equal(first.count, 1); assert.equal(first.public, false);
  assert.equal((await writeDishAdd(db, { ...base, voter: "a", name: "mutton  BIRYANI" })).unchanged, true);
  const dishes = db.data.get("recommendation_dishes/p1").dishes;
  assert.equal(visibleDishes(dishes).length, 0);
  assert.equal(visibleDishes(dishes, new Set(Object.keys(dishes))).length, 1);
  const second = await writeDishAdd(db, { ...base, voter: "b" });
  assert.equal(second.count, PUBLIC_AT); assert.equal(second.public, true);
  assert.deepEqual(db.data.get("recommendation_dishes_public/summary").places.p1, [{ name: "Mutton biryani", count: 2 }]);
  assert.equal((await writeDishAdd(db, { ...base, voter: "b", add: false })).count, 1);
  assert.equal(db.data.get("recommendation_dishes_public/summary").places.p1, undefined);
  for (let i = 0; i < DAY_LIMIT; i++) await writeDishAdd(db, { ...base, voter: "c", placeId: `q${i}`, now: base.now + i * 61_000 });
  await assert.rejects(() => writeDishAdd(db, { ...base, voter: "c", placeId: "extra", now: base.now + 30 * 61_000 }), (e) => e.status === 429);
});
test("must-try merges editorial, community and Reddit dishes by name", () => {
  const t = mustTry({ signature: { name: "Ghee podi idli" }, dishes: [{ id: "dosa", name: "Dosa" }], localDishes: [{ name: "Dosa", people: 12 }], communityDishes: [{ name: "Filter coffee", count: 3 }] });
  assert.deepEqual(t.map((d) => [d.name, d.count, !!d.star]), [["Ghee podi idli", 0, true], ["Dosa", 12, false], ["Filter coffee", 3, false]]);
  assert.equal(t[1].id, "dosa");
  const folded = mustTry({ signature: { name: "Mutton Dum Biryani" }, dishes: [{ id: "biryani", name: "Biryani" }], localDishes: [{ name: "Biryani", people: 61 }, { name: "Mutton biryani", people: 38 }, { name: "Haleem", people: 4 }] });
  assert.deepEqual(folded.map((d) => [d.name, d.count]), [["Mutton Dum Biryani", 99], ["Haleem", 4]]);
});
test("ranked places: every published standing is recommended with its category and position", async () => {
  const { rankingsBySpot, resolveRankedPlaces } = await import("../lib/recommendationPicks.js");
  const m = rankingsBySpot([
    { title: "Best Dosa in Hyderabad", slug: "best-dosa-in-hyderabad", active: true, results: [{ spotId: "a", count: 9 }, { spotId: "b", count: 1 }, { spotId: "c", count: 4 }, { spotId: "d", count: 8 }, { spotId: "e", count: 0 }] },
    { title: "Best Restaurants in Hyderabad", slug: "best-restaurants", winnerId: "z", results: [{ spotId: "a", count: 3 }, { spotId: "z", count: 1 }] },
  ]);
  assert.deepEqual([...m.keys()].sort(), ["a", "b", "c", "d", "z"]);
  assert.equal(m.get("a")[0].dishId, "dosa");
  assert.equal(m.get("a")[0].rank, 1);
  assert.equal(m.get("b")[0].rank, 2);
  assert.equal(m.get("d")[0].rank, 4);
  assert.equal(m.get("z")[0].winner, true);
  assert.equal(m.get("z")[0].rank, 1);

  const visitorRanking = rankingsBySpot([
    { title: "Best Ice Cream in Hyderabad", slug: "best-ice-cream-in-hyderabad", active: true, results: [{ spotId: "user-vindour-qc9u", name: "Vindour", count: 2 }] },
  ]);
  const resolved = resolveRankedPlaces(visitorRanking, [
    { id: "known-vindour", name: "Vindour Madhapur" },
    { id: "another-place", name: "Another Place" },
  ]);
  assert(!resolved.has("user-vindour-qc9u"));
  assert.equal(resolved.get("known-vindour")[0].rank, 1);
  assert.equal(resolved.get("known-vindour")[0].spotName, "Vindour");
});

test("dish mentions don't double count umbrella labels; ranking votes add", () => {
  const dish = DISHES.find((d) => d.id === "biryani");
  const p = { localDishes: [{ name: "Biryani", people: 61 }, { name: "Mutton biryani", people: 38 }], communityDishes: [{ name: "Chicken biryani", count: 2 }], rankings: [{ dishId: "biryani", votes: 5 }] };
  assert.equal(dishMentions(p, dish), 61 + 2 + 5);
});
test("matcher drops chat words, movie titles and landmarks", async () => {
  const { offTopic, brands } = await import("../scripts/lib/redditMatch.mjs");
  for (const word of ["okati", "anthe", "aunty", "girlfriend"]) assert(!brands.has(word), word);
  assert(offTopic("the paradise movie trailer is out", "the paradise movie trailer is out", 4, "paradise"));
  assert(offTopic("meet me near paradise metro", "meet me near paradise metro", 13, "paradise"));
  assert(!offTopic("paradise biryani is still good", "paradise biryani is still good", 0, "paradise"));
});
test("polls: one switchable vote per browser, clearing works, options validated, rate limited", async () => {
  const { writePollVote } = await import("../lib/polls.js");
  const db = fakeDb(); const base = { pollId: "is-paradise-overrated", options: ["yes", "slipped", "overrated"], now: 1000 };
  assert.equal((await writePollVote(db, { ...base, voter: "a", option: "yes" })).total, 1);
  assert.equal((await writePollVote(db, { ...base, voter: "a", option: "yes" })).unchanged, true);
  const sw = await writePollVote(db, { ...base, voter: "a", option: "overrated" });
  assert.deepEqual([sw.counts.yes, sw.counts.overrated, sw.total], [0, 1, 1]);
  assert.equal((await writePollVote(db, { ...base, voter: "b", option: "slipped" })).total, 2);
  assert.equal((await writePollVote(db, { ...base, voter: "a", option: null })).total, 1);
  await assert.rejects(() => writePollVote(db, { ...base, voter: "a", option: "nope" }), (e) => e.status === 400);
  for (let i = 0; i < 30; i++) await writePollVote(db, { ...base, voter: "c", pollId: `p${i}`, option: "yes" });
  await assert.rejects(() => writePollVote(db, { ...base, voter: "c", pollId: "extra", option: "yes" }), (e) => e.status === 429);
});
test("question pages are evidence-gated", () => {
  const q = JSON.parse(fs.readFileSync("data/reddit-questions.json", "utf8"));
  for (const p of q.pages) {
    const b = p.brands.map((k) => q.brands[k]);
    if (p.type === "what-to-order") assert(b[0].locals >= 8 && b[0].dishes.filter((d) => d.people >= 2).length >= 2, p.slug);
    if (p.type === "worth-it") assert(b[0].locals >= 15, p.slug);
    if (p.type === "vs") assert(p.together >= 10, p.slug);
    if (p.type === "need") assert(p.places.length >= 4, p.slug);
    for (const x of b) for (const quote of [...x.quotes.praise, ...x.quotes.complaints]) { assert(quote.text.length <= 161); assert(/^https:\/\/www\.reddit\.com\//.test(quote.url)); }
  }
});
