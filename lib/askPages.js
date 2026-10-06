import fs from "node:fs";
import path from "node:path";
import { getRecommendations } from "./recommendations.js";
import { mustTry } from "./recommendationShared.js";

// /ask/[slug]: question pages built from r/hyderabad (scripts/reddit-questions.mjs).
// Every sentence here is a template filled with counts from the data, so a page never
// claims more than the comments support. No em-dashes in any copy (house rule).

let cached;
function data() {
  if (!cached) {
    try { cached = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "reddit-questions.json"), "utf8")); }
    catch { cached = { pages: [], brands: {} }; }
  }
  return cached;
}

const COMPLAINT_LABEL = { bones: "bony mutton", price: "prices", hygiene: "hygiene", wait: "long waits", consistency: "quality slipping", oily: "oily or overly spicy food", portion: "small portions" };
const PRAISE_LABEL = { meat: "tender meat", value: "value for money", flavour: "flavour", consistency: "consistency", portion: "big portions" };
export const complaintLabel = (k) => COMPLAINT_LABEL[k] || k;
export const praiseLabel = (k) => PRAISE_LABEL[k] || k;

export function askUpdated() {
  const at = data().updatedAt ? new Date(data().updatedAt) : new Date();
  return { iso: at.toISOString(), label: at.toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "Asia/Kolkata" }) };
}
export const askStats = () => ({ threads: data().threads || 0, comments: data().comments || 0, months: data().months || 18 });

// The best branch for a brand on our map (most Google reviews), with its recommendation data.
function placeFor(ids = []) {
  const byId = new Map(getRecommendations().places.map((p) => [p.id, p]));
  return ids.map((id) => byId.get(id)).filter(Boolean).sort((a, b) => (b.ratingCount || 0) - (a.ratingCount || 0))[0] || null;
}
const tidyDish = (name) => name.replace(/\s*\/\s*/g, " and ");

export function brandView(key) {
  const b = data().brands[key];
  if (!b) return null;
  const place = placeFor(b.ids);
  const tries = place ? mustTry({ ...place, localDishes: (b.dishes || []).map((d) => ({ name: d.dish, people: d.people })) }, 4) : (b.dishes || []).slice(0, 4).map((d) => ({ name: d.dish, count: d.people }));
  // Only themes enough people raised count as "the main complaint" or "known for".
  const topComplaint = Object.entries(b.complaints || {}).find(([, n]) => n >= 2) || null;
  const topPraise = Object.entries(b.praise || {}).find(([, n]) => n >= 3) || null;
  return { key, ...b, place, branches: b.ids.length, tries: tries.map((t) => ({ ...t, name: tidyDish(t.name) })), topComplaint, topPraise };
}

function titleFor(p, names) {
  const [a, b] = names;
  if (p.type === "what-to-order") return { h1: `What to order at ${a}`, title: `What to order at ${a}, Hyderabad: what locals recommend` };
  if (p.type === "worth-it" && p.overrated) return { h1: `Is ${a} overrated?`, title: `Is ${a} overrated? What r/hyderabad says` };
  if (p.type === "worth-it") return { h1: `Is ${a} worth it?`, title: `Is ${a} worth it? What r/hyderabad says` };
  if (p.type === "vs") return { h1: `${a} vs ${b}: which is better?`, title: `${a} vs ${b}: which is better? Hyderabad locals compare` };
  if (p.need === "fewer bones") return { h1: "Mutton biryani with fewer bones in Hyderabad", title: "Mutton biryani with fewer bones in Hyderabad: where locals go" };
  if (p.need === "pure veg") return { h1: "Pure veg restaurants Hyderabad locals love", title: "Pure veg restaurants in Hyderabad that locals love" };
  if (p.need === "late night") return { h1: "Late-night food in Hyderabad locals recommend", title: "Late-night food in Hyderabad: where locals go" };
  if (p.need === "date") return { h1: "Date spots in Hyderabad under ₹1500 for two", title: "Date spots in Hyderabad under ₹1500 for two" };
  if (p.need === "haleem all year") return { h1: "Where to get haleem outside Ramzan in Hyderabad", title: "Haleem outside Ramzan in Hyderabad: where locals go" };
  return { h1: p.slug, title: p.slug };
}

// One short, quotable answer per page: verdict + numbers + source + month.
function answerFor(p, views, when) {
  const [a, b] = views;
  const src = `(r/hyderabad, ${when})`;
  const dish = (v, i = 0) => v.tries[i]?.name.toLowerCase();
  if (p.type === "what-to-order") {
    const [d1, d2] = a.tries;
    const lead = d1 ? `Order the ${d1.name.toLowerCase()}${d1.count ? `, the dish ${d1.count} locals name most` : ""}` : `Start with the house specials`;
    return `${lead}${d2 ? `, then the ${d2.name.toLowerCase()}` : ""}. ${a.locals} people on r/hyderabad recommend ${a.name}${a.topPraise ? `, often for its ${praiseLabel(a.topPraise[0])}` : ""} ${src}.`;
  }
  if (p.type === "worth-it") {
    const share = a.negatives / Math.max(1, a.locals + a.negatives);
    const complaint = a.topComplaint ? ` The most common complaint is ${complaintLabel(a.topComplaint[0])} (${a.topComplaint[1]} people).` : "";
    if (p.overrated) {
      const critics = a.overrated + a.negatives;
      const lead = critics / Math.max(1, a.locals) < 0.15
        ? `Mostly no. ${a.locals} people on r/hyderabad still recommend ${a.name}, though a vocal few (${a.overrated}) call it overrated and ${a.negatives} say skip it.`
        : `Locals are split. ${a.locals} people still recommend ${a.name}, while ${a.overrated} call it overrated and ${a.negatives} say skip it.`;
      return `${lead}${complaint} If you go, get the ${dish(a) || "signature dish"} ${src}.`;
    }
    return `${share < 0.08 ? "Yes" : "Mostly yes"}. ${a.locals} people on r/hyderabad recommend ${a.name} and ${a.negatives} advise against it.${complaint} The pick to order is the ${dish(a) || "signature dish"} ${src}.`;
  }
  if (p.type === "vs") {
    const prefA = p.prefer?.[a.key] || 0, prefB = p.prefer?.[b.key] || 0;
    const lead = prefA !== prefB ? `${prefA > prefB ? a.name : b.name} wins direct comparisons (${Math.max(prefA, prefB)} to ${Math.min(prefA, prefB)}).` : `${a.name} gets more recommendations overall (${a.locals} locals vs ${b.locals}).`;
    const da = dish(a) || "biryani", db = dish(b) === da ? dish(b, 1) || da : dish(b) || "biryani";
    const pickLine = da === db ? `Both are mostly ordered for ${da}` : `Pick ${a.name} for the ${da}, ${b.name} for the ${db}`;
    return `${lead} ${p.together} people have named both in the same comment. ${pickLine}${b.topComplaint && (!a.topComplaint || b.topComplaint[1] > a.topComplaint[1]) ? `; ${b.name} draws more complaints about ${complaintLabel(b.topComplaint[0])}` : a.topComplaint ? `; ${a.name} draws more complaints about ${complaintLabel(a.topComplaint[0])}` : ""} ${src}.`;
  }
  const top = p.places.slice(0, 3).map((x) => `${data().brands[x.brand].name} (${x.people})`);
  return `${top.slice(0, -1).join(", ")} and ${top[top.length - 1]} come up most when locals talk about ${p.need === "pure veg" ? "pure veg food" : p.need}, counting the people who name each ${src}.`;
}

function pollFor(p, views) {
  if (p.type === "worth-it") return { question: p.overrated ? `Is ${views[0].name} overrated?` : `Is ${views[0].name} worth it?`, options: [{ id: "yes", label: "Yes, still worth it" }, { id: "slipped", label: "Used to be better" }, { id: "overrated", label: "Overrated" }] };
  if (p.type === "vs") return { question: `${views[0].name} or ${views[1].name}?`, options: [{ id: "a", label: views[0].name }, { id: "b", label: views[1].name }, { id: "neither", label: "Neither" }] };
  if (p.type === "what-to-order") return { question: `The one thing to order at ${views[0].name}?`, options: views[0].tries.slice(0, 3).map((t, i) => ({ id: `d${i}`, label: t.name })).concat({ id: "other", label: "Something else" }) };
  return { question: "Where would you send a friend?", options: p.places.slice(0, 4).map((x, i) => ({ id: `p${i}`, label: data().brands[x.brand].name })).concat({ id: "other", label: "Somewhere else" }) };
}

export function askPages() { return data().pages || []; }
export function askPage(slug) {
  const p = askPages().find((x) => x.slug === slug);
  if (!p) return null;
  const views = p.brands.map(brandView).filter(Boolean);
  if (!views.length) return null;
  const when = askUpdated().label;
  const t = titleFor(p, views.map((v) => v.name));
  const related = askPages().filter((x) => x.slug !== slug && x.brands.some((b) => p.brands.includes(b))).slice(0, 3)
    .concat(askPages().filter((x) => x.slug !== slug && x.type === p.type).slice(0, 3)).filter((x, i, arr) => arr.findIndex((y) => y.slug === x.slug) === i).slice(0, 4)
    .map((x) => ({ slug: x.slug, ...titleFor(x, x.brands.map((b) => data().brands[b]?.name || b)) }));
  return { ...p, ...t, views, answer: answerFor(p, views, when), poll: pollFor(p, views), related,
    places: p.places?.map((x) => ({ ...x, view: brandView(x.brand) })) };
}
export function askList() {
  return askPages().map((p) => ({ slug: p.slug, type: p.type, ...titleFor(p, p.brands.map((b) => data().brands[b]?.name || b)) }));
}
// "/ask" pages about a place, for links from its card and spot page.
export function askLinksFor(placeId) {
  const brands = Object.entries(data().brands).filter(([, b]) => b.ids.includes(placeId)).map(([k]) => k);
  return askList().filter((x) => askPages().find((p) => p.slug === x.slug).brands.some((b) => brands.includes(b)));
}
