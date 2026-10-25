import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

test("Cloudflare receives real redirects for legacy picks pages", () => {
  const redirects = execFileSync(process.execPath, ["scripts/static-redirects.mjs"], { encoding: "utf8" });
  assert.match(redirects, /^\/picks \/guides\/dishes 308$/m);
  assert.match(redirects, /^\/picks\/biryani \/rankings\/best-biryani-in-hyderabad 308$/m);
  assert.match(redirects, /^\/picks\/pizza \/\?dish=pizza 308$/m);
  assert.match(redirects, /^\/picks\/ice-cream \/rankings\/best-ice-cream-in-hyderabad 308$/m);
  assert.match(redirects, /^\/picks\/biryani\/gachibowli \/\?dish=biryani&area=Gachibowli 308$/m);
  assert.match(redirects, /^\/picks\/coffee\/jubilee-hills \/\?dish=coffee&area=Jubilee\+Hills 308$/m);
});
