/**
 * Share cards (Open Graph / X) for the static site, rendered at build time.
 *
 * The site is a static export, so there is no /api/og renderer. This script draws one
 * 1200x630 PNG per shareable page with Next's bundled ImageResponse (satori + resvg),
 * writes them to public/og/<kind>/<slug>.png and a manifest that lib/og.js reads.
 * Look: the Eats app itself (warm paper, ink, violet, Bricolage Grotesque / Space Grotesk), one big
 * page-specific headline that stays readable when X shrinks the card to ~500px.
 *
 * Run: node scripts/build-og.mjs            all cards
 *      node scripts/build-og.mjs --samples  3 sample cards into .mini/og-samples/
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { ImageResponse } from "next/og.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const W = 1200, H = 630;
const C = { cream: "#F4F2EE", creamHi: "#FFFFFF", ink: "#141414", inkSoft: "#4A4A4A", violet: "#7C3AED", violetWash: "#EDE9FE", pop: "#7C3AED", line: "#E3DFD6" };
const font = (f) => fs.readFileSync(path.join(ROOT, "public/fonts", f));
// Satori reads TTF/OTF/WOFF, not WOFF2, so the cards use .woff copies of the
// app's two faces (public/fonts/*.woff, from @fontsource).
const FONTS = [
  { name: "Display", data: font("bricolage-800.woff"), weight: 800, style: "normal" },
  { name: "UI", data: font("space-grotesk-500.woff"), weight: 500, style: "normal" },
  { name: "UI", data: font("space-grotesk-700.woff"), weight: 700, style: "normal" },
];
const dataUrl = (file, mime) => `data:${mime};base64,${fs.readFileSync(path.join(ROOT, file)).toString("base64")}`;
const ICON = dataUrl("public/icon.svg", "image/svg+xml");
const CHARMINAR = dataUrl("public/og/assets/charminar.png", "image/png");

// "*word*" marks the accent (violet) words in a headline.
function headline(text, size) {
  const parts = text.split("*");
  return h("div", { style: { display: "flex", flexWrap: "wrap", fontFamily: "Display", fontSize: size, lineHeight: 1.02, letterSpacing: -1.5, color: C.ink } },
    ...parts.flatMap((p, i) => p.split(/(\s+)/).filter(Boolean).map((w, j) => w.trim()
      ? h("span", { key: `${i}-${j}`, style: { color: i % 2 ? C.violet : C.ink, marginRight: 14 } }, w)
      : null)).filter(Boolean));
}

/** The shared frame: brand top-left, section label top-right, headline + sub left, visual right. */
function card({ label, title, sub, visual, size = 74 }) {
  return h("div", { style: { width: W, height: H, display: "flex", background: C.cream, fontFamily: "UI", position: "relative" } },
    h("div", { style: { display: "flex", flexDirection: "column", width: 740, padding: "48px 0 44px 64px", justifyContent: "space-between" } },
      h("div", { style: { display: "flex", alignItems: "center" } },
        h("img", { src: ICON, width: 46, height: 46, style: { borderRadius: 12 } }),
        h("div", { style: { fontFamily: "Display", fontSize: 32, color: C.violet, marginLeft: 14 } }, "Hyderabad Eats")),
      h("div", { style: { display: "flex", flexDirection: "column" } },
        headline(title, size),
        sub ? h("div", { style: { fontSize: 30, color: C.inkSoft, marginTop: 22, lineHeight: 1.25, maxWidth: 640 } }, sub) : null),
      h("div", { style: { display: "flex", fontSize: 24, fontWeight: 700, color: C.inkSoft, letterSpacing: 0.5 } }, "eats.mapmyhyd.com")),
    h("div", { style: { display: "flex", flex: 1, background: C.creamHi, borderLeft: `2px solid ${C.line}`, position: "relative", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: 40 } },
      h("div", { style: { position: "absolute", top: 50, right: 48, display: "flex", fontSize: 20, fontWeight: 700, letterSpacing: 3, color: C.inkSoft } }, label.toUpperCase()),
      visual));
}

const pill = (text, bg, fg) => h("div", { style: { display: "flex", background: bg, color: fg, borderRadius: 999, padding: "10px 22px", fontSize: 24, fontWeight: 700 } }, text);

// Right-panel visuals
const vLandmark = () => h("img", { src: CHARMINAR, width: 300, height: 454, style: { objectFit: "contain", marginTop: 40 } });
const vStat = (big, small, stamp) => h("div", { style: { display: "flex", flexDirection: "column", alignItems: "center" } },
  h("div", { style: { fontFamily: "Display", fontSize: 170, color: C.violet, lineHeight: 1 } }, big),
  h("div", { style: { fontSize: 30, color: C.ink, fontWeight: 700, marginTop: 6, textAlign: "center" } }, small),
  stamp ? h("div", { style: { display: "flex", marginTop: 30, border: `4px solid ${C.pop}`, color: C.pop, borderRadius: 14, padding: "8px 20px", fontSize: 26, fontWeight: 700, letterSpacing: 2, transform: "rotate(-6deg)" } }, stamp) : null);
const vList = (rows, unit) => h("div", { style: { display: "flex", flexDirection: "column", width: 360 } },
  ...rows.slice(0, 3).map((r, i) => h("div", { key: i, style: { display: "flex", alignItems: "center", background: "#fff", border: `2px solid ${C.line}`, borderRadius: 18, padding: "16px 18px", marginBottom: 14 } },
    h("div", { style: { display: "flex", width: 46, height: 46, borderRadius: 999, background: i === 0 ? C.violet : C.violetWash, color: i === 0 ? "#fff" : C.violet, alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700 } }, String(i + 1)),
    h("div", { style: { display: "flex", flexDirection: "column", marginLeft: 14, flex: 1 } },
      h("div", { style: { fontSize: 25, fontWeight: 700, color: C.ink, lineHeight: 1.1 } }, r.name.length > 22 ? r.name.slice(0, 21) + "…" : r.name),
      r.count ? h("div", { style: { fontSize: 19, color: C.inkSoft, marginTop: 2 } }, `${r.count} ${unit}`) : null))));

async function render(el, out) {
  const res = new ImageResponse(el, { width: W, height: H, fonts: FONTS });
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, Buffer.from(await res.arrayBuffer()));
}

// ── cards ─────────────────────────────────────────────────────────────────
try { (await import("dotenv")).config({ path: path.join(ROOT, ".env.local"), quiet: true }); } catch {}
const DRIVES = path.join(ROOT, "data/inspection-drives.json");
const drives = fs.existsSync(DRIVES) ? JSON.parse(fs.readFileSync(DRIVES, "utf8")) : [];
const latest = drives.map((d) => d.date).sort().pop();
const fmt = (iso) => new Date(iso + "T00:00:00Z").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const sizeFor = (t) => { const n = t.replace(/\*/g, "").length; return n < 26 ? 82 : n < 40 ? 74 : n < 56 ? 64 : 56; };
const clean = (s) => String(s || "").replace(/\s*[—|]\s*/g, ": ").trim();
const short = (s, n) => (s.length > n ? s.slice(0, s.lastIndexOf(" ", n)) + "…" : s);

const cards = []; // [path, file, element]
const add = (p, file, opts) => cards.push([p, file, card({ ...opts, size: opts.size || sizeFor(opts.title) })]);

add("/", "home", { label: "Food map", title: "What's *good where* in Hyderabad.", sub: "The places locals recommend, and what to order at each.", visual: vLandmark() });
add("/food-safety", "food-safety", { label: "Food safety", title: "Hyderabad food safety raids, *on the record.*", sub: latest ? `Every inspection drive, with dates and what was seized. Latest ${fmt(latest)}.` : "Every inspection drive, with dates and what was seized.", visual: drives.length ? vStat(String(drives.length), "inspection drives logged", "ON THE RECORD") : vLandmark() });
add("/rankings", "rankings", { label: "Weekly rankings", title: "Hyderabad's best, *voted by locals.*", sub: "One dish a week. You vote, the city decides.", visual: vLandmark() });
add("/race", "race", { label: "Food race", title: "The weekly *food race.*", sub: "Vote for your spot. Winners get crowned every week.", visual: vLandmark() });
add("/areas", "areas", { label: "Areas", title: "Where to eat, *area by area.*", sub: "Jubilee Hills, Gachibowli, Old City and more.", visual: vLandmark() });
add("/explore", "explore", { label: "Explore", title: "Explore Hyderabad, *by craving.*", sub: "Cafes, biryani, tiffins, late night and more.", visual: vLandmark() });
add("/offers", "offers", { label: "Deals", title: "Dining deals in Hyderabad, *today.*", sub: "Live offers from District and Swiggy Dineout.", visual: vLandmark() });
add("/stories", "stories", { label: "Stories", title: "Hyderabad food *stories.*", sub: "The places, people and dishes behind the map.", visual: vLandmark() });
add("/guides", "guides", { label: "Guides", title: "Read Hyderabad *before you go.*", sub: "Local rankings, dish guides, areas, deals and food safety.", visual: vLandmark() });
add("/picks", "picks", { label: "Dish guides", title: "Best food in Hyderabad, *dish by dish.*", sub: "Counted from what r/hyderabad actually recommends.", visual: vLandmark() });
add("/ask", "ask", { label: "Questions", title: "Hyderabad food questions, *answered by locals.*", visual: vLandmark() });
add("/about/how-we-pick", "how-we-pick", { label: "Method", title: "How we pick *what's good.*", sub: "People, not comments. Votes, not ads.", visual: vLandmark() });

for (const dir of fs.readdirSync(path.join(ROOT, "app/guides"))) {
  const f = path.join(ROOT, "app/guides", dir, "page.jsx");
  if (!fs.existsSync(f)) continue;
  const t = (fs.readFileSync(f, "utf8").match(/const TITLE = "([^"]+)"/) || [])[1];
  if (!t) continue;
  const [head] = clean(t).split(/:|\(/);
  add(`/guides/${dir}`, `guides/${dir}`, { label: "Guide", title: head.trim().replace(/^(.*?)(in Hyderabad|Hyderabad)(.*)$/i, "$1*$2*$3"), sub: short(clean(t).slice(head.length).replace(/^[:\s(]+|\)$/g, ""), 70) || null, visual: vLandmark() });
}

try {
  const { getRecommendations, dishAreaPages } = await import("../lib/recommendations.js");
  const { dishView } = await import("../lib/dishPageView.js");
  for (const d of getRecommendations().dishes) {
    const v = dishView(d.id); if (!v) continue;
    add(`/picks/${d.id}`, `picks/${d.id}`, { label: "Dish guide", title: `Best *${d.name.toLowerCase()}* in Hyderabad right now`, sub: `${v.month}. Ranked by how many locals recommend each place.`, visual: vList(v.leaders.map((l) => ({ name: l.name, count: l.mentions })), "locals") });
  }
  for (const a of dishAreaPages()) {
    const v = dishView(a.dish, a.area); if (!v) continue;
    add(`/picks/${a.dish}/${a.area}`, `picks/${a.dish}-${a.area}`, { label: "Dish guide", title: `Best *${v.dish.name.toLowerCase()}* in ${v.area.area}`, sub: `${v.month}. What locals recommend nearby.`, visual: vList(v.leaders.map((l) => ({ name: l.name, count: l.mentions })), "locals") });
  }
  const { askPages, askPage } = await import("../lib/askPages.js");
  for (const p of askPages()) {
    const q = askPage(p.slug); if (!q) continue;
    const rows = q.type === "vs" ? q.views.map((v) => ({ name: v.name, count: v.locals })) : q.type === "need" ? q.places.map((x) => ({ name: x.view?.name || x.brand, count: x.people })) : q.views[0].tries.map((t) => ({ name: t.name, count: t.count }));
    add(`/ask/${p.slug}`, `ask/${p.slug}`, { label: "Locals answer", title: q.h1.replace(/^(.*?)(\?)?$/, "$1$2"), sub: q.type === "vs" ? "What r/hyderabad says, side by side." : "What r/hyderabad actually says.", visual: vList(rows, q.type === "what-to-order" ? "locals" : "people") });
  }
} catch (e) { console.warn("[og] dish/ask cards skipped:", e.message); }

try {
  const { allAreaPages, getAreaBySlug } = await import("../lib/siteData.js");
  for (const a of allAreaPages()) {
    const area = getAreaBySlug(a.slug); if (!area) continue;
    const top = [...area.spots].sort((x, y) => (y.ratingCount || 0) - (x.ratingCount || 0)).slice(0, 3);
    add(`/areas/${a.slug}`, `areas/${a.slug}`, { label: "Area guide", title: `Where to eat in *${a.area}*`, sub: `${area.spots.length} places on the map, picked and rated.`, visual: vList(top.map((s) => ({ name: s.name.split(/\s[-|@]\s|,|\(/)[0].trim() })), "") });
  }
} catch (e) { console.warn("[og] area cards skipped:", e.message); }

try {
  const { getAllRankingsThemes } = await import("../lib/themesServer.js");
  const themes = await getAllRankingsThemes(100);
  const seen = new Set();
  for (const t of themes) {
    if (!t.slug || seen.has(t.slug)) continue; seen.add(t.slug);
    const live = t.active && !t.winnerId;
    const title = clean(t.title).replace(/^Best (.+?)( in Hyderabad)?$/i, (m, x, y) => `Best *${x.toLowerCase()}*${y || ""}`);
    const rows = (t.results || []).filter((r) => r.name).map((r) => ({ name: r.name, count: r.count || 0 }));
    const el = { label: live ? "Vote this week" : "Weekly ranking", title: title + (live ? "" : ": locals voted."), sub: live ? "Voting is open. Pick your spot." : t.winnerName ? `Winner: ${t.winnerName}` : "Hyderabad votes, weekly.", visual: rows.length ? vList(rows, "votes") : vLandmark() };
    add(`/rankings/${t.slug}`, `rankings/${t.slug}`, el);
    if (live) add("/race/this-week", "race-this-week", el);
  }
} catch (e) { console.warn("[og] ranking cards skipped:", e.message); }

const OUT = path.join(ROOT, "public/og");
const manifest = {};
let n = 0;
for (const [p, file, el] of cards) {
  try { await render(el, path.join(OUT, `${file}.png`)); manifest[p] = `/og/${file}.png`; n++; }
  catch (e) { console.warn("[og] failed", p, e.message); }
}
fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify(manifest, null, 1) + "\n");
console.log(`[og] ${n} cards → public/og (manifest.json)`);
process.exit(0);
