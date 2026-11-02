import test from "node:test";
import assert from "node:assert/strict";
import { shareCardCopy, SHARE_CARD_SIZE } from "../lib/shareCard.js";

test("one social-card aspect ratio is used for all page families", () => {
  assert.deepEqual(SHARE_CARD_SIZE, { width: 1200, height: 630 });
});

test("missing and long page data remain bounded without undefined text", () => {
  assert.equal(shareCardCopy({}).title, "Explore Hyderabad Eats");
  const copy = shareCardCopy({ title: "A long restaurant name ".repeat(20), sub: "Extra context ".repeat(30), label: "A very long section label ".repeat(5) });
  assert.ok(copy.title.length <= 112);
  assert.ok(copy.sub.length <= 122);
  assert.ok(copy.label.length <= 32);
  assert.ok(copy.title.endsWith("…"));
});

test("a long unbroken venue name cannot overflow a short-title font size", () => {
  const word = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const copy = shareCardCopy({ title: word });
  assert.ok(copy.fontSize * word.length * 0.68 <= 640);
});

test("title highlights survive copy fitting without changing the page's words", () => {
  const copy = shareCardCopy({ title: "Best *biryani* in Hyderabad", label: "Community ranking" });
  assert.equal(copy.title, "Best *biryani* in Hyderabad");
  assert.equal(copy.label, "Community ranking");
});
