import { chromium } from "playwright";
import { pathToFileURL } from "url";
const [, , SHOTS, OUT, FRAME] = process.argv;
const items = [
  ["02-food-safety", "Did your favourite kitchen <em>get flagged?</em>", "Hyderabad food safety inspection records, pinned on one map.", "#efe8dc", 0, "1-cover-food-safety"],
  ["01-map", "Then find a spot <em>worth eating at</em>", "Every good plate in the city, picked by locals, not ads.", "#efe8dc", 0, "2-map"],
  ["05-spot-sheet", "Tap a place, <em>see what matters</em>", "Ratings, price for two, directions. Safety record if it has one.", "#65666f", 1, "3-spot"],
  ["04-ask-eats-chat", "Or just <em>ask Eats</em>", "Tell the chatbot what you crave. It finds spots near you.", "#efe8dc", 0, "4-ask-eats"],
];
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 3 });
for (const [f, t, s, bg, dark, name] of items) {
  const img = pathToFileURL(`${SHOTS}/${f}.png`).href;
  const qs = new URLSearchParams({ t, s, bg, img, dark: dark ? "1" : "0" });
  await p.goto(`${pathToFileURL(FRAME).href}?${qs}`, { waitUntil: "networkidle" });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(300);
  await p.screenshot({ path: `${OUT}/${name}.png` });
  console.log("ok", f);
}
await b.close();
