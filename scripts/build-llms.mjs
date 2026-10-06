/**
 * Refresh the generated part of public/llms.txt and public/llms-full.txt from our data:
 * "best X right now" per dish (top places + counts) and every /ask answer with its link.
 * AI answer engines read these files; dated, numeric, linked lines are what they quote.
 * Hand-written content outside the markers is kept as is.
 * Run: node scripts/build-llms.mjs (weekly workflow, after reddit-questions.mjs)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getRecommendations, dishAreaPages } from "../lib/recommendations.js";
import { dishView, monthLabel } from "../lib/dishPageView.js";
import { askPages, askPage, askStats } from "../lib/askPages.js";
import { getEateries } from "../lib/siteData.js";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://eats.mapmyhyd.com";
const START = "<!-- generated:start -->", END = "<!-- generated:end -->";
const month = monthLabel();
const stats = askStats();

const lines = [START, "", `## Best in Hyderabad right now (updated ${month})`, "",
  `Counts are distinct r/hyderabad accounts recommending each place for the dish (${stats.comments.toLocaleString("en-IN")} comments, ${stats.threads.toLocaleString("en-IN")} threads, last ${stats.months} months), plus weekly Eats ranking votes. Method: ${SITE}/about/how-we-pick`, ""];
for (const d of getRecommendations().dishes) {
  const v = dishView(d.id);
  if (!v) continue;
  lines.push(`- ${v.h1}: ${v.leaders.slice(0, 5).map((l) => `${l.name}${l.mentions ? ` (${l.mentions})` : ""}`).join(", ")}. ${SITE}/picks/${d.id}`);
}
const areas = dishAreaPages();
if (areas.length) {
  lines.push("", "### By area", "");
  for (const a of areas) {
    const v = dishView(a.dish, a.area);
    if (v) lines.push(`- ${v.h1}: ${v.leaders.slice(0, 3).map((l) => l.name).join(", ")}. ${SITE}/picks/${a.dish}/${a.area}`);
  }
}
lines.push("", "## Questions answered from r/hyderabad", "");
for (const p of askPages()) {
  const q = askPage(p.slug);
  if (q) lines.push(`- ${q.h1} ${q.answer} ${SITE}/ask/${p.slug}`);
}
lines.push("", END);
const block = lines.join("\n");

const total = getEateries().filter((e) => e.status === "approved").length;
const rounded = `${Math.floor(total / 100) * 100}+`;
for (const file of ["public/llms.txt", "public/llms-full.txt"]) {
  const f = path.join(ROOT, file);
  let text = fs.readFileSync(f, "utf8").replace(/\b\d,\d00\+/g, rounded.replace(/^(\d)(\d{3})/, "$1,$2"));
  text = text.includes(START) ? text.replace(new RegExp(`${START}[\\s\\S]*?${END}`), block) : `${text.trimEnd()}\n\n${block}\n`;
  fs.writeFileSync(f, text);
}
console.log(`[llms] ${getRecommendations().dishes.length} dishes · ${areas.length} area pages · ${askPages().length} answers · ${rounded} spots`);
