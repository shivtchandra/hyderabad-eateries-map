#!/usr/bin/env node
// Counts distinct r/hyderabad users who named each cafe in a post or comment,
// from data/reddit/raw.json (written by reddit-collect.mjs). Output feeds the
// table on /guides/best-cafes-hyderabad-reddit, so the guide's numbers and its
// "updated" date move with each weekly Reddit refresh.
//   node scripts/reddit-cafe-counts.mjs
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const raw = JSON.parse(fs.readFileSync(path.join(ROOT, "data/reddit/raw.json"), "utf8"));

// Chains are matched by brand, so every branch counts once.
const CAFES = [
  { name: "Conçu", pattern: /\bcon[cç]u\b/i, area: "Jubilee Hills, Begumpet, Film Nagar", href: "/spot/con-u-jubilee-hills" },
  { name: "Roastery Coffee House", pattern: /\broastery\b/i, area: "Jubilee Hills, Film Nagar, Kokapet", href: "/spot/roastery-coffee-house-jubilee-hills" },
  { name: "True Black", pattern: /true\s?black/i, area: "Jubilee Hills, HITEC City, Kompally", href: "/spot/true-black-speciality-coffee-jubilee-hills" },
  { name: "Roast CCX / Roast 24x7", pattern: /\broast\s?(ccx|24)/i, area: "Jubilee Hills, Banjara Hills", href: "/spot/roast-24-seven-jubilee-hills" },
  { name: "Feranoz", pattern: /feranoz/i, area: "Film Nagar, Banjara Hills", href: "/spot/feranoz-filmnagar-jubilee-hills" },
  { name: "Van Lavino", pattern: /van lavino/i, area: "Jubilee Hills, Nallagandla", href: "/spot/van-lavino-cafe-and-patisserie-jubilee-hills" },
  { name: "Karafa", pattern: /karafa/i, area: "Jubilee Hills, Banjara Hills", href: "/spot/karafa-jubilee-hills" },
  { name: "Aaromale", pattern: /aaromale/i, area: "Jubilee Hills", href: "/spot/aaromale-cafe-and-creative-community-jubilee-hills" },
  { name: "Third Wave Coffee", pattern: /third wave/i, area: "Jubilee Hills, Begumpet", href: "/spot/third-wave-coffee-jubilee-hills" },
  { name: "Sobremesa", pattern: /sobremesa/i, area: "Jubilee Hills", href: "/spot/sobremesa-cafe-bakehouse-kitchen-jubilee-hills" },
  { name: "Blue Tokai", pattern: /blue tokai/i, area: "Jubilee Hills, Gachibowli", href: "/spot/blue-tokai-coffee-roasters-origins-jubilee-hills" },
];

const items = [
  ...raw.posts.map((p) => ({ author: p.author, text: `${p.title || ""} ${p.body || ""}`, created: p.created })),
  ...raw.comments.map((c) => ({ author: c.author, text: c.body || "", created: c.created })),
];
const real = (a) => a && a !== "[deleted]" && a !== "AutoModerator";

const cafes = CAFES.map(({ pattern, ...cafe }) => {
  const people = new Set(items.filter((i) => real(i.author) && pattern.test(i.text)).map((i) => i.author));
  return { ...cafe, people: people.size };
}).sort((a, b) => b.people - a.people);

const month = (s) => new Date(s * 1000).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "Asia/Kolkata" });
const times = items.map((i) => i.created).filter(Boolean);
const out = {
  updatedAt: raw.fetchedAt,
  threads: raw.posts.length,
  comments: raw.comments.length,
  window: `${month(Math.min(...times))} to ${month(Math.max(...times))}`,
  cafes,
};
fs.writeFileSync(path.join(ROOT, "data/reddit-cafe-counts.json"), JSON.stringify(out, null, 2) + "\n");
console.log(`cafe counts: ${cafes.map((c) => `${c.name} ${c.people}`).join(", ")}`);
