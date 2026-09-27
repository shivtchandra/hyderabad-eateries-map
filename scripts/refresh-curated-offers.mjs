/**
 * Refresh Curated Dual-Platform Offers (District by Zomato & Swiggy Dineout)
 * 
 * Takes curated dining venues from verification.jsonl or eateries.json,
 * fetches live offers via Jina Reader, and writes to data/curated-offers.json.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OFFERS_FILE = path.join(ROOT, 'data', 'curated-offers.json');
const VERIF_FILE = path.join(ROOT, 'data', 'verification', 'verification.jsonl');
const EATERIES_FILE = path.join(ROOT, 'data', 'eateries.json');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchJinaText(url) {
  try {
    const res = await fetch(`https://r.jina.ai/${url}`, {
      headers: { Accept: 'text/plain' },
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function parseDistrictOffers(md) {
  if (!md) return [];
  const lines = md.split('\n');
  const offers = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (/^#{2,4}\s*(PRE-?BOOK OFFER|BANK OFFER|SURPRISE|FLAT DEAL|OFFER|EXCLUSIVE OFFER|INSTANT OFFER)\s*$/i.test(line)) {
      const type = line.replace(/^#+\s*/, '').trim().toUpperCase();
      let body = [];
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        const l = lines[j].trim();
        if (!l) continue;
        if (/^#+/.test(l)) {
          body.push(l.replace(/^#+\s*/, ''));
        } else {
          body.push(l);
          break;
        }
      }
      const title = body[0] || type;
      const desc = body.slice(1).join(' — ') || '';
      offers.push({ type, title, desc });
    }
  }

  // Fallback pattern if header blocks not detected
  if (!offers.length) {
    const fallbackMatches = md.match(/\b(?:flat\s*)?\d{1,2}%\s*off[^.\n]{0,44}|\bflat\s*₹\s?\d+\s*off[^.\n]{0,30}/gi) || [];
    for (const m of [...new Set(fallbackMatches)].slice(0, 3)) {
      offers.push({ type: 'OFFER', title: m.trim(), desc: 'Special dining discount' });
    }
  }

  return offers.slice(0, 5);
}

function parseSwiggyOffers(md) {
  if (!md) return [];
  const lines = md.split('\n');
  const offers = [];

  for (const l of lines) {
    const clean = l.trim().replace(/^[\*\-\#]+\s*/, '');
    if (/(\d+%\s*(?:off|cashback)|flat\s*(?:₹?\s*\d+|₹\d+)\s*off|bogo|pay bill|cashback)/i.test(clean) &&
        clean.length < 80 && clean.length > 4 &&
        !clean.includes('http') && !clean.includes('![') && !clean.includes('©')) {
      let type = 'OFFER';
      if (/cashback/i.test(clean)) type = 'CASHBACK';
      else if (/flat\s*₹/i.test(clean)) type = 'FLAT';
      else if (/bank/i.test(clean)) type = 'BANK';
      offers.push({ type, title: clean, desc: 'Swiggy Dineout Pay perk' });
    }
  }

  // Deduplicate by title
  const seen = new Set();
  const deduped = [];
  for (const o of offers) {
    if (!seen.has(o.title.toLowerCase())) {
      seen.add(o.title.toLowerCase());
      deduped.push(o);
    }
  }
  return deduped.slice(0, 5);
}

export async function refreshCuratedOffers() {
  console.log('Refreshing curated dual-platform offers...');
  const currentData = fs.existsSync(OFFERS_FILE) ? JSON.parse(fs.readFileSync(OFFERS_FILE, 'utf8')) : { spots: {} };

  const spots = currentData.spots || {};
  let updatedCount = 0;

  for (const [spotId, entry] of Object.entries(spots)) {
    console.log(`\nChecking offers for: ${entry.name}`);

    // 1. District / Zomato
    if (entry.district?.url) {
      console.log(`  Fetching District: ${entry.district.url}`);
      const dMd = await fetchJinaText(entry.district.url);
      const dOffers = parseDistrictOffers(dMd);
      entry.district.offers = dOffers;
      entry.district.hasOffers = dOffers.length > 0;
      console.log(`    Found ${dOffers.length} District offers`);
      await sleep(2000);
    }

    // 2. Swiggy Dineout
    if (entry.swiggy?.url) {
      console.log(`  Fetching Swiggy: ${entry.swiggy.url}`);
      const sMd = await fetchJinaText(entry.swiggy.url);
      const sOffers = parseSwiggyOffers(sMd);
      entry.swiggy.offers = sOffers;
      entry.swiggy.hasOffers = sOffers.length > 0;
      console.log(`    Found ${sOffers.length} Swiggy offers`);
      await sleep(2000);
    }

    updatedCount++;
  }

  const payload = {
    updatedAt: new Date().toISOString(),
    totalSpotsWithOffers: Object.values(spots).filter(s => s.district?.hasOffers || s.swiggy?.hasOffers).length,
    spots
  };

  fs.writeFileSync(OFFERS_FILE, JSON.stringify(payload, null, 2), 'utf8');
  console.log(`\nSuccessfully updated curated offers for ${updatedCount} spots at ${payload.updatedAt}`);
}

// Run if called directly
if (process.argv[1] && process.argv[1].endsWith('refresh-curated-offers.mjs')) {
  refreshCuratedOffers().catch(console.error);
}
