#!/usr/bin/env node
// Prints a Cloudflare Pages `_redirects` file from next.config.mjs redirects().
// Static hosting ignores Next's redirects, so scripts/build-static.sh writes
// this into out/. Host-conditional and regex rules only matter on Vercel and
// are skipped.
import config from "../next.config.mjs";

const rules = (await config.redirects?.()) ?? [];
const lines = [];
for (const r of rules) {
  if (r.has || r.missing || /[()]/.test(r.source)) continue;
  // Next `:name*` catch-alls become Cloudflare's `*` / `:splat`.
  const source = r.source.replace(/:\w+\*$/, "*");
  const destination = r.destination.replace(/:\w+\*/, ":splat");
  lines.push(`${source} ${destination} ${r.permanent ? 308 : 307}`);
}
process.stdout.write(lines.join("\n") + "\n");
