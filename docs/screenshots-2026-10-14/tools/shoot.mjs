import { chromium, devices } from "playwright";
const OUT = process.argv[2];
const BASE = "https://eats.mapmyhyd.com";
const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices["iPhone 14 Pro Max"], viewport: { width: 440, height: 894 }, screen: { width: 440, height: 956 }, deviceScaleFactor: 3 });
await ctx.addInitScript(() => { try { localStorage.setItem("loc_prompted", "1"); } catch {} });
const page = await ctx.newPage();
const wait = (ms) => page.waitForTimeout(ms);
const shot = async (name) => { await page.screenshot({ path: `${OUT}/${name}.png` }); console.log("ok", name); };
const go = async (path, ms = 6000) => { await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 60000 }).catch(() => {}); await wait(ms); };

try {
  // 1. Map, zoomed into an area so pins + card rail show
  await go("/", 7000);
  const area = page.getByText("Banjara Hills", { exact: true }).first();
  if (await area.count()) { await area.click().catch(() => {}); await wait(4000); }
  await shot("01-map");

  // 1b. Food safety view
  await go("/?filter=safety", 8000);
  await shot("02-food-safety");
  await go("/", 7000);
  // 2. Search open: Ask Eats chatbot card
  await page.locator(".topbar-search").click().catch(() => {});
  await wait(1200);
  await shot("03-search-ask-eats");

  // 3. Ask Eats chat sheet
  await page.locator(".ask-entry").first().click().catch(() => {});
  await wait(2000);
  await shot("04-ask-eats-chat");

  // 4. Spot detail sheet
  await go("/?spot=ChIJga9-gxO9yzsRaofluKIDNlA", 8000);
  await shot("05-spot-sheet");

  // 5. Vote tab
  await go("/?tab=race", 7000);
  await shot("06-vote");

  // 6. You tab
  await go("/?tab=you", 6000);
  await shot("07-you");

  // 7. Guides
  await go("/guides", 4000);
  await shot("08-guides");

  // 8. Ranking page
  await go("/rankings/best-biryani-in-hyderabad", 4000);
  await shot("09-ranking-biryani");
} finally {
  await browser.close();
}
