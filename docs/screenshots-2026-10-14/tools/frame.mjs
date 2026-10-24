import { chromium } from "playwright";
import { pathToFileURL } from "url";
const [, , SHOTS, OUT, FRAME] = process.argv;
const items = [
  ["01-map", "Every good plate in Hyderabad, <em>on one map</em>", "Pins from locals' picks, not ads.", "#efe8dc"],
  ["02-food-safety", "See which kitchens <em>got flagged</em>", "Food safety inspection records, right on the map.", "#efe8dc"],
  ["03-search-ask-eats", "Can't decide? <em>Ask Eats</em>", "A chatbot that knows the city's favourites.", "#efe8dc"],
  ["04-ask-eats-chat", "Tell it what <em>you crave</em>", "Biryani near you, Irani chai, a cafe to work from.", "#efe8dc"],
  ["05-spot-sheet", "Hidden gems, with <em>what matters</em>", "Directions, saves and your food passport.", "#65666f", 1],
  ["06-vote", "Hyderabad votes <em>on its best</em>", "A new dish every week. Locals pick the crown.", "#f4f2ee"],
  ["07-you", "Stamp every spot <em>you eat at</em>", "Fill your food passport, area by area.", "#f4f2ee"],
  ["08-guides", "Guides by people <em>who live here</em>", "Rankings, dish guides and neighbourhood picks.", "#f4f2ee"],
  ["09-ranking-biryani", "The city picks <em>the crown</em>", "Live rankings voted by locals.", "#f4f2ee"],
];
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 3 });
for (const [f, t, s, bg, dark] of items) {
  const img = pathToFileURL(`${SHOTS}/${f}.png`).href;
  const qs = new URLSearchParams({ t, s, bg, img, dark: dark ? "1" : "0" });
  await p.goto(`${pathToFileURL(FRAME).href}?${qs}`, { waitUntil: "networkidle" });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(300);
  await p.screenshot({ path: `${OUT}/${f}.png` });
  console.log("ok", f);
}
await b.close();
