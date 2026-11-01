import test from "node:test";
import assert from "node:assert/strict";
import { parseQuery, mergeSlots, findCandidates, formatFacts, buildSystemPrompt, cardFor, EMPTY_LIVE } from "../lib/askAiServer.js";
import { haversineKm, buildAreaCentroids } from "../lib/eateryUtils.js";
import { getEateries } from "../lib/siteData.js";

const turn = (...msgs) => msgs.reduce((prev, m) => mergeSlots(prev, parseQuery(m)), null);
const ask = (slots, opts = {}) => findCandidates(slots, { live: EMPTY_LIVE, ...opts });
const names = (r) => r.list.map((c) => c.e.name).join(" | ");

test("work cafe questions return only real cafes in the asked area", () => {
  const s = turn("Best quiet cafes to work from with good coffee in Jubilee Hills");
  assert.equal(s.craving?.id, "cafe");
  assert.equal(s.area, "Jubilee Hills");
  const r = ask(s);
  assert.ok(r.list.length >= 3, names(r));
  const centre = buildAreaCentroids(getEateries()).find((a) => a.area === "Jubilee Hills");
  for (const c of r.list) {
    assert.ok(["cafe", "bakery"].includes(c.e.category), c.e.name);
    assert.doesNotMatch(c.e.name, /biryani|mandi|pub|bar\b|kebab/i);
    assert.ok(haversineKm(centre, c.e) <= 10.5, `${c.e.name} too far`);
  }
});

test("vegetarian bhojanam never returns meat houses", () => {
  const s = turn("Where can I get authentic Telugu vegetarian bhojanam?");
  assert.equal(s.craving?.id, "meals");
  assert.equal(s.veg, "veg");
  const r = ask(s);
  assert.ok(r.list.length > 0);
  for (const c of r.list) {
    assert.doesNotMatch(c.e.name, /chicken|mutton|biryani|mandi|kebab|arabian/i);
    assert.ok((c.e.tags || []).some((t) => t === "veg-friendly" || t === "pure-veg") || /veg|bhavan|udupi/i.test(c.e.name), c.e.name);
  }
});

test("biryani answers are biryani places, not cafes or bakeries", () => {
  const r = ask(turn("best biryani in hyderabad"));
  assert.ok(r.list.length >= 3);
  for (const c of r.list) assert.ok(!["cafe", "bakery", "ice-cream"].includes(c.e.category), c.e.name);
});

test("named venues route to spot and compare intents", () => {
  const cmp = turn("Is Bawarchi at RTC X Roads better than Paradise?");
  assert.equal(cmp.intent, "compare");
  const r = ask(cmp);
  assert.match(names(r), /bawarchi/i);
  assert.match(names(r), /paradise/i);

  const spot = turn("What should I order at Cafe Niloufer?");
  assert.equal(spot.intent, "spot");
  assert.match(names(ask(spot)), /niloufer/i);
});

test("follow-ups keep the craving and area, new asks replace them", () => {
  const cheaper = turn("best biryani in Kondapur", "cheaper");
  assert.equal(cheaper.craving?.id, "biryani");
  assert.equal(cheaper.area, "Kondapur");
  assert.equal(cheaper.cheap, true);

  const moved = turn("best biryani in Kondapur", "what about Gachibowli?");
  assert.equal(moved.craving?.id, "biryani");
  assert.equal(moved.area, "Gachibowli");

  const fresh = turn("best biryani in Kondapur", "best momos in Kondapur");
  assert.equal(fresh.craving?.id, "asian");

  const pronoun = turn("What should I order at Cafe Niloufer?", "is it open now?");
  assert.equal(pronoun.intent, "spot");
  assert.match(pronoun.spots[0].key, /niloufer/);
});

test("area-only and off-topic questions are classified sanely", () => {
  const area = turn("best food in Kondapur");
  assert.equal(area.intent, "recommend");
  assert.equal(area.keywords.length, 0);
  assert.ok(ask(area).list.length > 0);

  for (const q of ["write me a python script", "hi", "who will win the election"]) {
    const s = turn(q);
    assert.equal(s.intent, "general", q);
    assert.equal(ask(s).list.length, 0, q);
  }
});

test("open now and late night filters are hard filters", () => {
  const r = ask(turn("late night shawarma near Madhapur"));
  for (const c of r.list) assert.notEqual(c.open, false, `${c.e.name} closed`);
});

test("a ranking for another dish gives no boost or badge", () => {
  const base = ask(turn("best biryani in hyderabad"));
  const target = base.list[base.list.length - 1].e.id;
  const live = { ...EMPTY_LIVE, rankBySpot: { [target]: [{ title: "Best Momos", rank: 1, votes: 99, winner: true, live: false, dishId: null }] } };
  const c = ask(turn("best biryani in hyderabad"), { live }).list.find((x) => x.e.id === target);
  if (c) {
    assert.notEqual(c.band, 0);
    assert.equal(c.topRank, null);
  }
});

test("food safety records are reported as enforcement, never as clean", () => {
  const s = turn("What should I order at Cafe Niloufer?");
  const first = ask(s).list[0];
  const live = { ...EMPTY_LIVE, safety: { [first.e.id]: { label: "Notice issued", date: "2026-10-31", dateLabel: "31 Oct 2026", findings: ["Expired stock"] } } };
  const c = ask(s, { live }).list[0];
  const facts = formatFacts(c, "spot");
  assert.match(facts, /TG SAFE Notice issued/);
  assert.doesNotMatch(facts, /verified clean|clean audit/i);
  assert.match(cardFor(c).safety, /Notice issued/);
});

test("prompt and facts carry no em-dashes", () => {
  for (const q of ["What should I order at Cafe Niloufer?", "best biryani in hyderabad", "any offers at Paradise?"]) {
    const s = turn(q);
    const prompt = buildSystemPrompt(s, ask(s));
    assert.doesNotMatch(prompt, /—/, q);
  }
});
