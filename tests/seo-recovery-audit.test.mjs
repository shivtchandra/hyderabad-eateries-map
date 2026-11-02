import test from "node:test";
import assert from "node:assert/strict";
import { inspectHtml, inspectRedirect } from "../scripts/seo-recovery-audit.mjs";

const url = "https://eats.mapmyhyd.com/rankings/best-biryani-in-hyderabad";
const good = `<title>Biryani vote</title><link href='${url}' rel='canonical'>`;

test("accepts the direct permanent biryani migration", () => {
  assert.deepEqual(inspectRedirect(308, "Location: /rankings/best-biryani-in-hyderabad", "/rankings/best-biryani-in-hyderabad").issues, []);
});
test("flags soft redirects and incorrect legacy destinations", () => {
  assert.ok(inspectRedirect(200, "", "/rankings/best-biryani-in-hyderabad").issues.includes("missing-permanent-redirect"));
  assert.ok(inspectRedirect(308, "Location: /", "/rankings/best-biryani-in-hyderabad").issues.includes("redirect-destination-mismatch"));
});

test("accepts reordered attributes and self canonicals", () => {
  assert.deepEqual(inspectHtml(good, url).issues, []);
});
test("detects Googlebot-only noindex and HTTP noindex", () => {
  assert.ok(inspectHtml(`${good}<meta content='noindex,follow' name='googlebot'>`, url).issues.includes("noindex"));
  assert.ok(inspectHtml(good, url, "X-Robots-Tag: noindex\r\n").issues.includes("noindex"));
});
test("flags canonical pointing to another page", () => {
  assert.ok(inspectHtml(good.replace(url, "https://example.com/"), url).issues.includes("canonical-mismatch"));
});
test("normalizes homepage trailing slash and relative canonicals", () => {
  assert.deepEqual(inspectHtml("<title>Map</title><link rel='canonical' href='/'>", "https://eats.mapmyhyd.com").issues, []);
});
test("catches an error/challenge document instead of treating HTTP 200 as success", () => {
  assert.deepEqual(inspectHtml("Access denied", url).issues, ["missing-canonical", "missing-title"]);
});
