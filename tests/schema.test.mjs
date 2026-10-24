import test from "node:test";
import assert from "node:assert/strict";
import { getSpotFaqs, restaurantJsonLd } from "../lib/schema.js";

const baseSpot = {
  id: "test-place",
  name: "Test Place",
  category: "restaurant",
  lat: 17.4,
  lng: 78.4,
  rating: 4.9,
  ratingCount: 1200,
};

test("restaurant schema does not present third-party Google stars as our aggregate rating", () => {
  const schema = restaurantJsonLd(baseSpot, "https://eats.mapmyhyd.com", "Shiva");
  assert.equal(schema.aggregateRating, undefined);
});

test("dated first-hand review schema uses the visible author and publication date", () => {
  const schema = restaurantJsonLd({
    ...baseSpot,
    regularNote: "Visited and reviewed in person.",
    reviewedAt: "2025-09-27",
  }, "https://eats.mapmyhyd.com", "Shiva Chandra");

  assert.equal(schema.review.author.name, "Shiva Chandra");
  assert.equal(schema.review.datePublished, "2025-09-27");
  assert.equal(schema.review.reviewRating, undefined);
});

test("editorial verdict emits its own rating scale", () => {
  const schema = restaurantJsonLd({
    ...baseSpot,
    regularNote: "Visited and reviewed in person.",
    verdict: { score: 8, outOf: 10 },
  }, "https://eats.mapmyhyd.com", "Shiva");

  assert.equal(schema.review.reviewRating.ratingValue, 4);
  assert.equal(schema.review.reviewRating.bestRating, 5);
});

test("custom FAQ hours are replaced by canonical venue hours", () => {
  const faqs = getSpotFaqs({
    ...baseSpot,
    hours: ["Monday: 10:00 AM – 12:00 AM"],
    faq: [
      { q: "What are the opening timings?", a: "Open until 11 PM." },
      { q: "What is it known for?", a: "Chocolate." },
    ],
  });
  assert(!faqs.some((item) => item.a === "Open until 11 PM."));
  assert(faqs.some((item) => item.a.includes("Monday: 10:00 AM – 12:00 AM")));
});

test("generic FAQ does not manufacture popularity or quality claims", () => {
  const faqs = getSpotFaqs(baseSpot);
  const copy = faqs.map((item) => item.a).join(" ").toLowerCase();
  assert(!copy.includes("popular"));
  assert(!copy.includes("quality food"));
});
