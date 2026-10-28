#!/usr/bin/env node
// Prints a Cloudflare Pages `_redirects` file from next.config.mjs redirects().
// Static hosting ignores Next's redirects, so scripts/build-static.sh writes
// this into out/. Host-conditional and regex rules only matter on Vercel and
// are skipped.
import config from "../next.config.mjs";
import { legacySpotSlugAliases } from "../lib/siteData.js";

const rules = (await config.redirects?.()) ?? [];
const lines = [];
for (const r of rules) {
  if (r.has || r.missing || /[()]/.test(r.source)) continue;
  // Next `:name*` catch-alls become Cloudflare's `*` / `:splat`.
  const source = r.source.replace(/:\w+\*$/, "*");
  const destination = r.destination.replace(/:\w+\*/, ":splat");
  lines.push(`${source} ${destination} ${r.permanent ? 308 : 307}`);
}
// Old spot slugs (area appended twice, e.g. ...-madhapur-madhapur) are still
// indexed. On Vercel the spot page redirects them; static pages cannot.
for (const [alias, slug] of legacySpotSlugAliases()) {
  lines.push(`/spot/${encodeURI(alias)} /spot/${encodeURI(slug)} 308`);
}
// Cloudflare Pages caps static rules at 2,000.
if (lines.length > 2000) {
  console.error(`_redirects has ${lines.length} rules, over Cloudflare's 2,000 limit.`);
  process.exit(1);
}
process.stdout.write(lines.join("\n") + "\n");
