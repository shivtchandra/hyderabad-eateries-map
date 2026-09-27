/**
 * Full & Resumable Restaurant Verification Pipeline for Hyderabad Eateries Map
 * Verifies spots against Zomato, District by Zomato, and Swiggy.
 * Supports:
 *   --pilot        Verify the 50 representative spots first
 *   (default)      Verify all 3,697 approved spots in batches of 200
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const EATERIES_FILE = path.join(ROOT, 'data', 'eateries.json');
const ZOMATO_INDEX_FILE = path.join(ROOT, 'data', 'zomato-index.json');
const VERIF_DIR = path.join(ROOT, 'data', 'verification');
const JSONL_OUT = path.join(VERIF_DIR, 'verification.jsonl');
const SUMMARY_OUT = path.join(VERIF_DIR, 'summary.md');
const QUEUE_OUT = path.join(VERIF_DIR, 'review-queue.csv');

if (!fs.existsSync(VERIF_DIR)) {
  fs.mkdirSync(VERIF_DIR, { recursive: true });
}

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const CONCURRENCY = process.env.CONCURRENCY ? parseInt(process.env.CONCURRENCY, 10) : 6;
const IS_PILOT_ONLY = process.argv.includes('--pilot');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const STOP_WORDS = new Set([
  'hotel', 'restaurant', 'cafe', 'food', 'court', 'tiffin', 'tiffins',
  'center', 'centre', 'bakers', 'bakery', 'diner', 'dhaba', 'bar',
  'kitchen', 'family', 'house', 'and', '&', 'the', 'point', 'corner'
]);

function getBrandRoot(name) {
  const clean = (name || '').replace(/\s*[@|·\-].*$/, '');
  const tokens = clean.toLowerCase().split(/[^a-z0-9]+/).filter(t => t && !STOP_WORDS.has(t));
  return tokens.join(' ');
}

function haversineKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function cleanPhone(p) {
  if (!p) return '';
  const digits = String(p).replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

function slugify(s) {
  return (s || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[''`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeName(s) {
  return (s || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]/g, '');
}

function nameSimilarity(name1, name2) {
  const root1 = getBrandRoot(name1);
  const root2 = getBrandRoot(name2);
  if (root1 && root2 && (root1 === root2 || root1.includes(root2) || root2.includes(root1))) {
    return 0.95;
  }

  const n1 = normalizeName(name1);
  const n2 = normalizeName(name2);
  if (!n1 || !n2) return 0;
  if (n1 === n2) return 1.0;
  if (n1.includes(n2) || n2.includes(n1)) {
    const minLen = Math.min(n1.length, n2.length);
    const maxLen = Math.max(n1.length, n2.length);
    return minLen / maxLen > 0.4 ? 0.85 : 0.6;
  }

  const tokens1 = (name1 || '').toLowerCase().split(/[^a-z0-9]+/).filter(t => t.length > 2);
  const tokens2 = (name2 || '').toLowerCase().split(/[^a-z0-9]+/).filter(t => t.length > 2);
  if (!tokens1.length || !tokens2.length) return 0;
  const overlap = tokens1.filter(t => tokens2.includes(t));
  if (overlap.length === 0) return 0;
  return overlap.length / Math.max(tokens1.length, tokens2.length);
}

// Select Pilot Spots
function selectPilotSpots(allApproved) {
  const chains = [
    'Paradise', 'Pista House', 'Cafe Niloufer', 'Shah Ghouse', 'Bawarchi',
    'Cream Stone', 'The Rameshwaram Cafe', 'Chutneys', 'Minerva Coffee Shop',
    'Almond House', 'Santosh Dhaba', 'Barbeque Nation', 'Subhan Bakery', 'Karachi Bakery', 'Peshawar'
  ];

  const selected = [];
  const seenIds = new Set();

  for (const brand of chains) {
    const match = allApproved.find(e => !seenIds.has(e.id) && e.name.toLowerCase().includes(brand.toLowerCase()));
    if (match) { seenIds.add(match.id); selected.push({ ...match, pilotGroup: 'chain' }); }
  }

  const cafeCandidates = allApproved.filter(e => !seenIds.has(e.id) && (e.category === 'cafe' || e.name.toLowerCase().includes('cafe') || e.name.toLowerCase().includes('coffee') || e.name.toLowerCase().includes('roaster')));
  for (const c of cafeCandidates) {
    if (selected.filter(s => s.pilotGroup === 'cafe').length >= 12) break;
    seenIds.add(c.id);
    selected.push({ ...c, pilotGroup: 'cafe' });
  }

  const bakeryCandidates = allApproved.filter(e => !seenIds.has(e.id) && (e.category === 'bakery' || e.name.toLowerCase().includes('bakery') || e.name.toLowerCase().includes('bakers') || e.name.toLowerCase().includes('cake')));
  for (const b of bakeryCandidates) {
    if (selected.filter(s => s.pilotGroup === 'bakery').length >= 10) break;
    seenIds.add(b.id);
    selected.push({ ...b, pilotGroup: 'bakery' });
  }

  const localCandidates = allApproved.filter(e => !seenIds.has(e.id) && (e.category === 'local' || e.name.toLowerCase().includes('tiffin') || e.name.toLowerCase().includes('mess') || e.name.toLowerCase().includes('bandi') || e.name.toLowerCase().includes('hotel') || e.name.toLowerCase().includes('dhaba')));
  for (const l of localCandidates) {
    if (selected.filter(s => s.pilotGroup === 'local').length >= 13) break;
    seenIds.add(l.id);
    selected.push({ ...l, pilotGroup: 'local' });
  }

  return selected;
}

// Swiggy Search
async function querySwiggy(spot) {
  const brandRoot = getBrandRoot(spot.name) || spot.name;
  const searchStr = brandRoot.split(' ').slice(0, 3).join(' ');
  const url = `https://www.swiggy.com/dapi/restaurants/search/v3?lat=${spot.lat}&lng=${spot.lng}&str=${encodeURIComponent(searchStr)}&trackingId=undefined&submitAction=ENTER&queryUniqueId=${Math.random().toString(36).substring(7)}`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': UA,
        'Accept': 'application/json, text/plain, */*',
        'Referer': 'https://www.swiggy.com/search'
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!res.ok) return { found: false, url: null, rating: null, status: 'unknown', match: 0 };

    const json = await res.json();
    const cards = json.data?.cards?.find(c => c.groupedCard)?.groupedCard?.cardGroupMap?.RESTAURANT?.cards || [];
    if (!cards.length) return { found: false, url: null, rating: null, status: 'unknown', match: 0 };

    let bestMatch = null;
    let highestScore = 0;

    const spotAddressTokens = (spot.address || '').toLowerCase().split(/[^a-z0-9]+/).filter(t => t.length > 3 && !/hyderabad|telangana|road|street|opp|near/.test(t));
    const spotArea = (spot.discoveredIn || '').toLowerCase().replace(/^text:.*$/, '');

    for (const card of cards.slice(0, 15)) {
      const info = card.card?.card?.info;
      if (!info) continue;

      const sim = nameSimilarity(spot.name, info.name);
      if (sim < 0.45) continue;

      const cardArea = (info.areaName || '').toLowerCase();
      const cardLoc = (info.locality || '').toLowerCase();
      const cardAddr = (info.address || '').toLowerCase();

      let localityMatch = false;
      if (spotArea && (cardArea.includes(spotArea) || cardLoc.includes(spotArea) || cardAddr.includes(spotArea))) {
        localityMatch = true;
      }
      for (const tok of spotAddressTokens) {
        if (cardArea.includes(tok) || cardLoc.includes(tok) || cardAddr.includes(tok)) {
          localityMatch = true;
          break;
        }
      }

      let score = sim * 0.7 + (localityMatch ? 0.3 : 0.0);
      if (sim >= 0.8 && localityMatch) score = Math.max(score, 0.95);

      if (score > highestScore) {
        highestScore = score;
        bestMatch = info;
      }
    }

    if (!bestMatch || highestScore < 0.6) {
      return { found: false, url: null, rating: null, status: 'unknown', match: 0 };
    }

    const swiggyUrl = `https://www.swiggy.com/city/hyderabad/${bestMatch.slugs?.restaurant || ''}-rest${bestMatch.id}`;
    const rating = bestMatch.avgRating ? parseFloat(bestMatch.avgRating) : null;
    const isOpened = bestMatch.availability?.opened ?? true;
    const status = isOpened ? 'open' : 'temporarily_closed';

    return {
      found: true,
      url: swiggyUrl,
      rating,
      status,
      match: Math.round(highestScore * 100) / 100
    };
  } catch {
    return { found: false, url: null, rating: null, status: 'unknown', match: 0 };
  }
}

// Zomato candidate generator
function generateZomatoCandidates(e, zomatoIndex) {
  const cands = [];
  if (e.zomatoSlugUrl) {
    const slug = e.zomatoSlugUrl.split('/').pop().replace(/[?#].*$/, '');
    if (slug) cands.push(slug);
  }

  const raw = (e.name || '').trim();
  const clean = raw.replace(/\s*[@|·\-].*$/, '').trim();
  const brandRoot = getBrandRoot(raw);

  const names = [...new Set([slugify(clean), slugify(raw), slugify(brandRoot)])].filter(Boolean);

  const area = slugify((e.discoveredIn || '').replace(/^text:.*$/, ''));
  const parts = (e.address || '')
    .split(',')
    .map(s => slugify(s))
    .filter(s => s && s.length > 2 && !/^\d/.test(s) && !/hyderabad|telangana|india|road|rd|street|floor|plot|opp|near|beside|lane/.test(s));

  const localities = [...new Set([area, ...parts])].filter(Boolean);

  for (const n of names) {
    cands.push(n);
    for (const loc of localities) {
      if (!n.endsWith(loc)) {
        cands.push(`${n}-${loc}`);
        cands.push(`${n}-1-${loc}`);
      }
    }
  }

  if (zomatoIndex) {
    for (const zSlug of Object.keys(zomatoIndex)) {
      for (const n of names) {
        if (zSlug.startsWith(n) || zSlug.includes(n)) {
          cands.push(zSlug);
        }
      }
    }
  }

  return [...new Set(cands)].slice(0, 8);
}

// Zomato verification
async function verifyZomatoCandidate(slug, spot) {
  const url = `https://www.zomato.com/hyderabad/${slug}`;
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      headers: {
        'User-Agent': UA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-IN,en;q=0.9',
      },
      signal: AbortSignal.timeout(10000)
    });

    if (res.status !== 200) return null;

    const html = await res.text();
    const ldMatches = html.match(/<script[^>]*type=[\"']application\/ld\+json[\"'][^>]*>([\s\S]*?)<\/script>/gi) || [];
    let restLd = null;

    for (const m of ldMatches) {
      const raw = m.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');
      try {
        const parsed = JSON.parse(raw);
        if (parsed['@type'] === 'Restaurant') {
          restLd = parsed;
          break;
        } else if (parsed['@graph'] && Array.isArray(parsed['@graph'])) {
          const r = parsed['@graph'].find(g => g['@type'] === 'Restaurant');
          if (r) { restLd = r; break; }
        }
      } catch {}
    }

    if (!restLd) return null;

    const zLat = parseFloat(restLd.geo?.latitude);
    const zLng = parseFloat(restLd.geo?.longitude);
    const distKm = haversineKm(spot.lat, spot.lng, zLat, zLng);

    const spotPhone = cleanPhone(spot.phone);
    const zPhone = cleanPhone(restLd.telephone);
    const phoneMatch = spotPhone && zPhone && (spotPhone === zPhone);

    const nameSim = nameSimilarity(spot.name, restLd.name);

    let costForTwo = null;
    if (restLd.priceRange) {
      const m = restLd.priceRange.match(/[₹\s]*([0-9,]+)/);
      if (m) costForTwo = parseInt(m[1].replace(/,/g, ''), 10);
    }

    const rating = restLd.aggregateRating?.ratingValue ? parseFloat(restLd.aggregateRating.ratingValue) : null;
    const votes = restLd.aggregateRating?.ratingCount ? parseInt(restLd.aggregateRating.ratingCount, 10) : null;

    const isClosed = html.includes('This place is marked as closed') || html.includes('Permanently Closed');
    const isTempClosed = html.includes('Temporarily Closed');
    let status = 'open';
    if (isClosed) status = 'permanently_closed';
    else if (isTempClosed) status = 'temporarily_closed';

    let matchScore = 0;
    if (phoneMatch) {
      matchScore = 1.0;
    } else if (distKm <= 0.35) {
      matchScore = nameSim >= 0.7 ? 0.95 : 0.85;
    } else if (distKm <= 0.8) {
      matchScore = nameSim >= 0.7 ? 0.80 : 0.70;
    } else if (distKm <= 1.5) {
      matchScore = 0.65;
    } else {
      matchScore = 0.3;
    }

    return {
      slug,
      url,
      name: restLd.name,
      rating,
      votes,
      costForTwo,
      status,
      match: matchScore,
      distKm,
      phoneMatch
    };
  } catch {
    return null;
  }
}

// District verification
async function queryDistrict(zomatoSlug) {
  if (!zomatoSlug) return { found: false, url: null, rating: null, status: 'unknown', match: 0 };
  const url = `https://www.district.in/dining/hyderabad/${zomatoSlug}`;
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      headers: {
        'User-Agent': UA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-IN,en;q=0.9',
      },
      signal: AbortSignal.timeout(10000)
    });

    if (res.status !== 200) {
      return { found: false, url: null, rating: null, status: 'unknown', match: 0 };
    }

    const html = await res.text();
    const ldMatches = html.match(/<script[^>]*type=[\"']application\/ld\+json[\"'][^>]*>([\s\S]*?)<\/script>/gi) || [];
    let hasRest = false;
    let rating = null;

    for (const m of ldMatches) {
      const raw = m.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');
      try {
        const parsed = JSON.parse(raw);
        if (parsed['@type'] === 'Restaurant' || (parsed['@graph'] && parsed['@graph'].some(g => g['@type'] === 'Restaurant'))) {
          hasRest = true;
          const r = parsed['@type'] === 'Restaurant' ? parsed : parsed['@graph'].find(g => g['@type'] === 'Restaurant');
          if (r.aggregateRating?.ratingValue) {
            rating = parseFloat(r.aggregateRating.ratingValue);
          }
          break;
        }
      } catch {}
    }

    if (!hasRest) {
      return { found: false, url: null, rating: null, status: 'unknown', match: 0 };
    }

    return {
      found: true,
      url,
      rating,
      status: 'open',
      match: 0.95
    };
  } catch {
    return { found: false, url: null, rating: null, status: 'unknown', match: 0 };
  }
}

function checkDuplicate(spot, allApproved) {
  for (const other of allApproved) {
    if (other.id === spot.id) continue;
    const dist = haversineKm(spot.lat, spot.lng, other.lat, other.lng);
    if (dist < 0.05) {
      const sim = nameSimilarity(spot.name, other.name);
      if (sim > 0.7) {
        const myVotes = spot.ratingCount || 0;
        const otherVotes = other.ratingCount || 0;
        if (myVotes <= otherVotes) {
          return `duplicate_of:${other.id}`;
        }
      }
    }
  }
  return null;
}

function checkNotARestaurant(spot) {
  const nonRestKeywords = [/banquet/i, /caterer/i, /catering/i, /function hall/i, /hostel/i, /pg\b/i, /supermarket/i, /mart\b/i];
  for (const kw of nonRestKeywords) {
    if (kw.test(spot.name)) return true;
  }
  return false;
}

async function verifySingleSpot(spot, approved, zomatoIndex) {
  const flags = [];
  const notesArr = [];

  const dupFlag = checkDuplicate(spot, approved);
  if (dupFlag) {
    flags.push(dupFlag);
    notesArr.push('Potential duplicate of higher-reviewed spot at same coordinates');
  }
  if (checkNotARestaurant(spot)) {
    flags.push('not_a_restaurant');
    notesArr.push('Identified as non-restaurant by name');
  }

  // Zomato
  const cands = generateZomatoCandidates(spot, zomatoIndex);
  let bestZomato = null;

  for (const c of cands) {
    const zRes = await verifyZomatoCandidate(c, spot);
    if (zRes) {
      if (!bestZomato || zRes.match > bestZomato.match) {
        bestZomato = zRes;
        if (zRes.match >= 0.85) break;
      }
    }
    await sleep(250);
  }

  const zomatoRecord = bestZomato ? {
    found: true,
    url: bestZomato.url,
    rating: bestZomato.rating,
    votes: bestZomato.votes,
    costForTwo: bestZomato.costForTwo,
    status: bestZomato.status,
    match: bestZomato.match
  } : {
    found: false,
    url: null,
    rating: null,
    votes: null,
    costForTwo: null,
    status: 'unknown',
    match: 0
  };

  if (bestZomato && bestZomato.status === 'permanently_closed') {
    flags.push('closed');
    notesArr.push('Marked permanently closed on Zomato');
  }
  if (bestZomato && bestZomato.distKm > 2.0 && !bestZomato.phoneMatch) {
    flags.push('wrong_location');
    notesArr.push(`Distance discrepancy of ${bestZomato.distKm.toFixed(1)}km`);
  }

  // District
  const districtRecord = bestZomato ? await queryDistrict(bestZomato.slug) : {
    found: false,
    url: null,
    rating: null,
    status: 'unknown',
    match: 0
  };

  // Swiggy
  const swiggyRes = await querySwiggy(spot);
  const swiggyRecord = {
    found: swiggyRes.found,
    url: swiggyRes.url,
    rating: swiggyRes.rating,
    status: swiggyRes.status,
    match: swiggyRes.match
  };

  if (swiggyRes.found && swiggyRes.match < 0.7) {
    notesArr.push('Low confidence Swiggy match');
  }

  return {
    id: spot.id,
    name: spot.name,
    zomato: zomatoRecord,
    district: districtRecord,
    swiggy: swiggyRecord,
    flags,
    notes: notesArr.join('; '),
    checkedAt: new Date().toISOString()
  };
}

function updateSummaryAndQueue(allApproved) {
  if (!fs.existsSync(JSONL_OUT)) return;
  const lines = fs.readFileSync(JSONL_OUT, 'utf8').trim().split('\n').filter(Boolean);
  const results = lines.map(l => JSON.parse(l));
  const total = results.length;

  let zomatoFound = 0, districtFound = 0, swiggyFound = 0;
  let platformsCount = { 0: 0, 1: 0, 2: 0, 3: 0 };
  let flagsCount = { closed: 0, not_a_restaurant: 0, duplicate: 0, wrong_location: 0, renamed: 0 };
  let lowConfidence = 0;
  const reviewQueue = [];

  for (const r of results) {
    let pCount = 0;
    if (r.zomato?.found) { zomatoFound++; pCount++; }
    if (r.district?.found) { districtFound++; pCount++; }
    if (r.swiggy?.found) { swiggyFound++; pCount++; }
    platformsCount[pCount]++;

    for (const f of r.flags || []) {
      if (f === 'closed') flagsCount.closed++;
      else if (f === 'not_a_restaurant') flagsCount.not_a_restaurant++;
      else if (f.startsWith('duplicate_of')) flagsCount.duplicate++;
      else if (f === 'wrong_location') flagsCount.wrong_location++;
      else if (f.startsWith('renamed')) flagsCount.renamed++;
    }

    const hasLowConf = (r.zomato?.found && r.zomato.match < 0.7) ||
                       (r.district?.found && r.district.match < 0.7) ||
                       (r.swiggy?.found && r.swiggy.match < 0.7);
    if (hasLowConf) lowConfidence++;

    if (hasLowConf || (r.flags && r.flags.length > 0) || pCount === 0) {
      const original = allApproved.find(e => e.id === r.id);
      reviewQueue.push({
        id: r.id,
        name: r.name,
        area: original?.discoveredIn || '',
        flag: (r.flags || []).join('|') || (pCount === 0 ? 'unlisted' : 'low_confidence'),
        zomatoUrl: r.zomato?.url || '',
        districtUrl: r.district?.url || '',
        swiggyUrl: r.swiggy?.url || '',
        notes: r.notes || (pCount === 0 ? 'Not found on any platform' : '')
      });
    }
  }

  // Top 50 highest-review spots not found on any platform
  const verifiedMap = new Map(results.map(r => [r.id, r]));
  const unlistedSpots = allApproved
    .filter(e => {
      const r = verifiedMap.get(e.id);
      return r && !r.zomato?.found && !r.district?.found && !r.swiggy?.found;
    })
    .sort((a, b) => (b.ratingCount || 0) - (a.ratingCount || 0))
    .slice(0, 50);

  let summary = `# Dataset Verification Summary

Generated at: ${new Date().toISOString()}

## 1. Overall Platform Coverage
- Total Spots Processed: ${total} of ${allApproved.length} (${Math.round(total / allApproved.length * 100)}%)
- Found on Zomato: ${zomatoFound} (${Math.round(zomatoFound / total * 100)}%)
- Found on District by Zomato: ${districtFound} (${Math.round(districtFound / total * 100)}%)
- Found on Swiggy: ${swiggyFound} (${Math.round(swiggyFound / total * 100)}%)

## 2. Multi-Platform Distribution
- Found on all 3 platforms: ${platformsCount[3]} (${Math.round(platformsCount[3] / total * 100)}%)
- Found on 2 platforms: ${platformsCount[2]} (${Math.round(platformsCount[2] / total * 100)}%)
- Found on 1 platform: ${platformsCount[1]} (${Math.round(platformsCount[1] / total * 100)}%)
- Found on 0 platforms (unlisted): ${platformsCount[0]} (${Math.round(platformsCount[0] / total * 100)}%)

## 3. Data Integrity & Flags
- Permanently Closed: ${flagsCount.closed}
- Not a Restaurant: ${flagsCount.not_a_restaurant}
- Duplicate Outlets: ${flagsCount.duplicate}
- Wrong Location / Branch Discrepancy: ${flagsCount.wrong_location}
- Low Confidence Matches (< 0.7): ${lowConfidence}

## 4. Top 50 Unlisted Spots (Highest Google Reviews)
These spots have significant review counts on Google but were not matched on Zomato or Swiggy:
| Spot Name | Area | Google Rating | Reviews | Phone |
| :--- | :--- | :--- | :--- | :--- |
`;

  for (const s of unlistedSpots) {
    summary += `| ${s.name.replace(/\|/g, '-')} | ${s.discoveredIn || '-'} | ${s.rating || '-'} | ${s.ratingCount || 0} | ${s.phone || '-'} |\n`;
  }

  summary += `\n## 5. Review Queue
Total items in review queue: ${reviewQueue.length} (see \`data/verification/review-queue.csv\`)\n`;

  fs.writeFileSync(SUMMARY_OUT, summary, 'utf8');

  // Write CSV
  const csvHeaders = ['id', 'name', 'area', 'flag', 'zomatoUrl', 'districtUrl', 'swiggyUrl', 'notes'];
  const csvRows = [csvHeaders.join(',')];
  for (const q of reviewQueue) {
    csvRows.push([
      JSON.stringify(q.id),
      JSON.stringify(q.name),
      JSON.stringify(q.area),
      JSON.stringify(q.flag),
      JSON.stringify(q.zomatoUrl),
      JSON.stringify(q.districtUrl),
      JSON.stringify(q.swiggyUrl),
      JSON.stringify(q.notes)
    ].join(','));
  }
  fs.writeFileSync(QUEUE_OUT, csvRows.join('\n'), 'utf8');
}

async function run() {
  const all = JSON.parse(fs.readFileSync(EATERIES_FILE, 'utf8'));
  const approved = all.filter(e => e.status === 'approved');
  const zomatoIndex = fs.existsSync(ZOMATO_INDEX_FILE) ? JSON.parse(fs.readFileSync(ZOMATO_INDEX_FILE, 'utf8')) : {};

  // Existing verified IDs
  const existingIds = new Set();
  if (fs.existsSync(JSONL_OUT)) {
    const lines = fs.readFileSync(JSONL_OUT, 'utf8').trim().split('\n').filter(Boolean);
    for (const l of lines) {
      try { existingIds.add(JSON.parse(l).id); } catch {}
    }
  }

  const pilotSpots = selectPilotSpots(approved);
  const pilotSet = new Set(pilotSpots.map(s => s.id));
  const remainingSpots = approved.filter(s => !pilotSet.has(s.id));

  // Determine queue
  let queue = [];
  if (IS_PILOT_ONLY) {
    queue = pilotSpots.filter(s => !existingIds.has(s.id));
    console.log(`Running Pilot Mode: ${queue.length} of 50 spots remaining.`);
  } else {
    // Process pilot spots first, then remainder
    queue = [...pilotSpots, ...remainingSpots].filter(s => !existingIds.has(s.id));
    console.log(`Running Full Pipeline: ${existingIds.size} already done, ${queue.length} spots remaining.`);
  }

  if (queue.length === 0) {
    console.log('All requested spots are already verified!');
    updateSummaryAndQueue(approved);
    return;
  }

  let processedCount = existingIds.size;
  let cursor = 0;

  // Worker runner
  async function worker(workerId) {
    while (cursor < queue.length) {
      const idx = cursor++;
      const spot = queue[idx];
      try {
        const res = await verifySingleSpot(spot, approved, zomatoIndex);
        fs.appendFileSync(JSONL_OUT, JSON.stringify(res) + '\n');
        processedCount++;

        const zFound = res.zomato.found ? 'Z' : '-';
        const dFound = res.district.found ? 'D' : '-';
        const sFound = res.swiggy.found ? 'S' : '-';
        console.log(`[W${workerId}] [${processedCount}/${approved.length}] ${spot.name.slice(0, 32).padEnd(32)} [${zFound}|${dFound}|${sFound}]`);

        if (processedCount % 100 === 0 || processedCount === 50) {
          updateSummaryAndQueue(approved);
          console.log(`>>> Checkpointed progress at ${processedCount} spots`);
        }
      } catch (err) {
        console.error(`[W${workerId}] Error on ${spot.name}:`, err.message);
      }
      await sleep(1200); // 1.2s delay between spots for this worker
    }
  }

  const workers = [];
  for (let i = 0; i < CONCURRENCY; i++) {
    workers.push(worker(i + 1));
    await sleep(400); // stagger start
  }

  await Promise.all(workers);
  updateSummaryAndQueue(approved);
  console.log(`\nVerification run complete! Total verified: ${processedCount}`);
}

run().catch(console.error);
