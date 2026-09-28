/**
 * Refresh curated dining offers from District (by Zomato), via Jina Reader.
 *
 * District's page (2026 layout) renders offers like this:
 *   ## Offers
 *   ## FLAT 10% OFF          <- time-slot deal (pre-book)
 *   From 5:00 PM, today      <- when it applies
 *   66 slots left
 *   ## Additional offers
 *   ## 25% OFF for up to ₹5,000 using RBL Bank LUMIÈRE Credit Card
 *   Valid on final payable amount of ₹2000 or more
 *
 * We keep every deal for a spot on one record: slot deals with their time window,
 * and bank/card offers with their minimum bill. Pages that 404 or show no offers
 * are stored with hasOffers:false so the site never shows a deal we didn't read.
 *
 * Swiggy Dineout lives in fetch-swiggy-dineout.mjs; this script never touches `swiggy`.
 *
 * Run:  node scripts/refresh-curated-offers.mjs
 *       LIMIT=10 node scripts/refresh-curated-offers.mjs      (quick sample)
 *       ONLY="prost" node scripts/refresh-curated-offers.mjs  (name filter)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OFFERS_FILE = path.join(__dirname, "..", "data", "curated-offers.json");
const LIMIT = Number(process.env.LIMIT || Infinity);
const ONLY = (process.env.ONLY || "").toLowerCase();
const DELAY_MS = Number(process.env.DELAY_MS || 3200); // Jina free tier: ~20 req/min
const JINA_KEY = process.env.JINA_API_KEY;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchJinaText(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`https://r.jina.ai/${url}`, {
        headers: { Accept: "text/plain", ...(JINA_KEY ? { Authorization: `Bearer ${JINA_KEY}` } : {}) },
        signal: AbortSignal.timeout(45000),
      });
      if (res.status === 429) { await sleep(15000 * (attempt + 1)); continue; }
      if (!res.ok) return { text: null, status: res.status };
      return { text: await res.text(), status: 200 };
    } catch {
      await sleep(4000);
    }
  }
  return { text: null, status: 0 };
}

const OFFERISH = /(\d+\s*%\s*off|₹\s?[\d,]+\s*off|flat\s|cashback|bogo|buy\s*\d+\s*get|complimentary|free\s)/i;

// "5:00 PM" -> 1020 (minutes after midnight)
function toMinutes(t) {
  const m = t.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (!m) return null;
  let h = Number(m[1]) % 12;
  if (/pm/i.test(m[3])) h += 12;
  return h * 60 + Number(m[2] || 0);
}

// "From 5:00 PM, today" | "12:00 PM - 4:00 PM, tomorrow" | "Till 11:00 PM"
function parseWhen(line) {
  const TIME = "\\d{1,2}(?::\\d{2})?\\s*(?:AM|PM)";
  const range = line.match(new RegExp(`(${TIME})\\s*(?:-|–|to)\\s*(${TIME})`, "i"));
  const from = line.match(new RegExp(`from\\s*(${TIME})`, "i"));
  const till = line.match(new RegExp(`(?:till|until|before)\\s*(${TIME})`, "i"));
  const day = (line.match(/\b(today|tomorrow|mon|tue|wed|thu|fri|sat|sun)[a-z]*\b/i) || [])[0] || null;
  const out = { label: line.replace(/\s+/g, " ").trim(), day: day ? day.toLowerCase() : null, from: null, to: null };
  if (range) { out.from = toMinutes(range[1]); out.to = toMinutes(range[2]); }
  else if (from) out.from = toMinutes(from[1]);
  else if (till) out.to = toMinutes(till[1]);
  return out.from != null || out.to != null || out.day ? out : null;
}

function pctOf(title) {
  const m = title.match(/(\d{1,2})\s*%/);
  return m ? Number(m[1]) : null;
}
function flatOf(title) {
  const m = title.match(/₹\s?([\d,]+)\s*off/i);
  return m ? Number(m[1].replace(/,/g, "")) : null;
}
function capOf(title) {
  const m = title.match(/up\s*to\s*₹\s?([\d,]+)/i);
  return m ? Number(m[1].replace(/,/g, "")) : null;
}
function bankOf(title) {
  const m = title.match(/(?:using|on|with)\s+(.+?)\s*(?:credit|debit)?\s*cards?\b/i);
  if (!m) return null;
  const name = m[1].replace(/\s+(credit|debit)$/i, "").trim();
  return /^(credit|debit|premier|visa infinite and signature)$/i.test(name) ? null : name; // generic "on Credit Cards"
}

export function parseDistrict(md) {
  const lines = md.split("\n").map((l) => l.trim());
  const hours = (md.match(/Open\s*•\s*([^\n]+)/) || [])[1]?.trim() || null;
  const start = lines.findIndex((l) => /^#{2,4}\s*Offers\s*$/i.test(l));
  if (start < 0) return { hours, deals: [], bankOffers: [] };

  const deals = [];
  const bankOffers = [];
  let section = "deals";
  for (let i = start + 1; i < lines.length; i++) {
    const l = lines[i];
    if (!/^#{2,4}\s/.test(l)) continue;
    const head = l.replace(/^#+\s*/, "").trim();
    if (/^additional offers$/i.test(head)) { section = "bank"; continue; }
    if (!OFFERISH.test(head)) break; // left the offers block

    // Collect the plain lines under this heading, up to the next heading.
    const body = [];
    for (let j = i + 1; j < lines.length && !/^#{2,4}\s/.test(lines[j]); j++) {
      if (lines[j] && !lines[j].startsWith("![")) body.push(lines[j]);
    }

    const title = head.replace(/\s+/g, " ");
    if (section === "deals") {
      const whenLine = body.find((b) => /\b(AM|PM|today|tomorrow)\b/i.test(b));
      const slots = (body.join(" ").match(/(\d+)\s*slots?\s*left/i) || [])[1];
      deals.push({
        title,
        pct: pctOf(title),
        flat: flatOf(title),
        when: whenLine ? parseWhen(whenLine) : null,
        slotsLeft: slots ? Number(slots) : null,
      });
    } else {
      const min = (body.join(" ").match(/₹\s?([\d,]+)\s*or more/i) || [])[1];
      bankOffers.push({
        title,
        pct: pctOf(title),
        flat: flatOf(title),
        cap: capOf(title),
        bank: bankOf(title),
        minBill: min ? Number(min.replace(/,/g, "")) : null,
      });
    }
  }
  return { hours, deals: deals.slice(0, 6), bankOffers: bankOffers.slice(0, 30) };
}

// Old consumers (map sheet, spot page) read district.offers as {type,title,desc}.
function legacyOffers(deals, bankOffers) {
  const fromDeals = deals.map((d) => ({ type: "PRE_BOOK", title: d.title, desc: d.when?.label || "Pre-book on District" }));
  const fromBank = bankOffers.slice(0, 3).map((b) => ({
    type: "BANK",
    title: b.title,
    desc: b.minBill ? `On bills of ₹${b.minBill.toLocaleString("en-IN")} or more` : "Bank card offer",
  }));
  return [...fromDeals, ...fromBank].slice(0, 5);
}

export async function refreshCuratedOffers() {
  const current = fs.existsSync(OFFERS_FILE) ? JSON.parse(fs.readFileSync(OFFERS_FILE, "utf8")) : { spots: {} };
  const spots = current.spots || {};
  const entries = Object.entries(spots)
    .filter(([, e]) => e.district?.url && (!ONLY || (e.name || "").toLowerCase().includes(ONLY)))
    .slice(0, LIMIT);

  console.log(`Refreshing District offers for ${entries.length} spots`);
  let withOffers = 0;
  let dead = 0;
  for (const [i, [, entry]] of entries.entries()) {
    // Cheap direct status check first: most guessed URLs 404, no need to spend a Jina call.
    let direct = 0;
    try {
      const r = await fetch(entry.district.url, { method: "GET", redirect: "follow", headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(15000) });
      direct = r.status;
    } catch {}
    if (direct === 404) {
      entry.district = { url: null, hasOffers: false, fetchedAt: new Date().toISOString(), hours: null, deals: [], bankOffers: [], offers: [] };
      dead++;
      console.log(`[${i + 1}/${entries.length}] ${entry.name}: page missing`);
      continue;
    }
    const { text, status } = await fetchJinaText(entry.district.url);
    const gone = !text || /Target URL returned error 404/i.test(text);
    const parsed = gone ? { hours: null, deals: [], bankOffers: [] } : parseDistrict(text);
    const has = parsed.deals.length + parsed.bankOffers.length > 0;
    entry.district = {
      url: gone && status !== 0 ? null : entry.district.url,
      hasOffers: has,
      fetchedAt: new Date().toISOString(),
      hours: parsed.hours,
      deals: parsed.deals,
      bankOffers: parsed.bankOffers,
      offers: legacyOffers(parsed.deals, parsed.bankOffers),
    };
    if (has) withOffers++;
    if (gone) dead++;
    console.log(`[${i + 1}/${entries.length}] ${entry.name}: ${gone ? "page missing" : `${parsed.deals.length} slot deals, ${parsed.bankOffers.length} card offers`}`);
    await sleep(DELAY_MS);
  }

  // Re-read and merge only `district`, so a Swiggy run that wrote meanwhile is kept.
  const latest = fs.existsSync(OFFERS_FILE) ? JSON.parse(fs.readFileSync(OFFERS_FILE, "utf8")) : { spots: {} };
  const merged = latest.spots || {};
  for (const [id, entry] of entries) merged[id] = { ...(merged[id] || entry), district: entry.district };
  const payload = {
    ...latest,
    updatedAt: new Date().toISOString(),
    totalSpotsWithOffers: Object.values(merged).filter((s) => s.district?.hasOffers || s.swiggy?.hasOffers).length,
    spots: merged,
  };
  fs.writeFileSync(OFFERS_FILE, JSON.stringify(payload, null, 2), "utf8");
  console.log(`\nDone: ${withOffers} with offers, ${dead} missing pages, of ${entries.length} checked.`);
}

if (process.argv[1] && process.argv[1].endsWith("refresh-curated-offers.mjs")) {
  refreshCuratedOffers().catch((e) => { console.error(e); process.exit(1); });
}
