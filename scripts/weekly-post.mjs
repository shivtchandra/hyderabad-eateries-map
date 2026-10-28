#!/usr/bin/env node
// Drafts the weekly r/hyderabad vote post for a theme, using how many different
// people on the sub have recommended each ballot candidate. Prints Markdown to
// paste into Reddit; nothing is posted.
//   node scripts/weekly-post.mjs "Best Biryani in Hyderabad"
import fs from "fs";
import { editorialRanking } from "../lib/siteData.js";
import { SEO_THEME_PICKS, slugFromTitle } from "../lib/rankings.js";

const title = process.argv[2];
if (!title) {
  console.error('usage: node scripts/weekly-post.mjs "Best Biryani in Hyderabad"');
  process.exit(1);
}
const picks = JSON.parse(fs.readFileSync(new URL("../data/reddit-picks.json", import.meta.url), "utf8"));
const slug = slugFromTitle(title);
const pick = SEO_THEME_PICKS.find((p) => p.title === title) || { title };
const ballot = editorialRanking(pick, slug, 8);

// Same dish match as the ballot: the longest byDish key named in the title.
const topic = title.toLowerCase().replace(/\bcaf[eé]s?\b/g, "coffee");
const dishKey = Object.keys(picks.byDish || {})
  .filter((d) => d.toLowerCase().split(" / ").some((part) => topic.includes(part)))
  .sort((a, b) => b.length - a.length)[0];
const people = (id) => {
  if (dishKey) return Math.max(0, ...picks.byDish[dishKey].filter((r) => r.ids?.includes(id)).map((r) => r.people || 0));
  return picks.spots?.[id]?.locals || 0;
};
const months = picks.months || 18;
const what = dishKey ? `for ${dishKey.toLowerCase()}` : "";
const subject = title.replace(/^Best\s+/i, "").replace(/\s+in\s+Hyderabad$/i, "").toLowerCase();

const lines = ballot
  .map((b) => ({ ...b, n: people(b.spotId) }))
  .map((b) => `- **${b.name}**${b.area ? ` (${b.area})` : ""}${b.n ? `: recommended ${what} by ${b.n} different people here` : ""}`);

console.log(`**Title:** This week we're ranking the best ${subject} in Hyderabad. The ballot is inside.

I went through ${months} months of this sub (${picks.threads.toLocaleString("en-IN")} threads, ${picks.comments.toLocaleString("en-IN")} comments) and counted how many different people recommended each place ${what}. These made the ballot:

${lines.join("\n")}

Mentions only decide who is on the ballot. The ranking is decided by your votes, and the standings update live:
https://eats.mapmyhyd.com/rankings/${slug}

Missing a place? Comment it and I'll add it to the ballot. (Disclosure: I run the site.)
`);
