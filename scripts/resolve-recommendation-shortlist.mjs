import fs from 'node:fs';
import { config } from 'dotenv';
config({ path: '.env.local', quiet: true });
const names = JSON.parse(fs.readFileSync('.mini/requested-names.json'));
const eateries = JSON.parse(fs.readFileSync('data/eateries.json'));
const normalize = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const aliases = { 'Seven Sisters': '7 sisters', 'Creamstone': 'cream stone', 'Panchakattu': 'pancha kattu|panchakattu', 'Vac': 'vacs pastries|vac s pastries', 'Sura': 'sura matcha', 'Bawarchi': '^bawarchi restaurant$', 'Roastery': '^roastery coffee house', 'Pizza Den': '^pizza den$', 'Jamun': '^jamun$', 'Taaza': '^taaza kitchen', 'Blue Sea': '^blue sea (cafe|tea)', 'Rika': '^rika$', 'Istah': '^istah', 'Taro': '^taro' };
const results = [];
for (const name of names) {
  const re = new RegExp('(?:^|\\b)(?:' + (aliases[name] || normalize(name)) + ')(?:\\b|$)');
  const matches = eateries.filter(e => e.status === 'approved' && re.test(normalize(e.name)) && e.lat > 16.9 && e.lat < 17.9 && e.lng > 78 && e.lng < 79);
  if (matches.length) { results.push({ name, existing: matches.map(e => e.id) }); continue; }
  const url = new URL('https://maps.googleapis.com/maps/api/place/findplacefromtext/json');
  url.searchParams.set('input', `${name} restaurant Hyderabad`);
  url.searchParams.set('inputtype', 'textquery');
  url.searchParams.set('fields', 'place_id,name,geometry,formatted_address,business_status,rating,user_ratings_total');
  url.searchParams.set('key', process.env.GOOGLE_MAPS_API_KEY || '');
  try {
    const data = await fetch(url, { signal: AbortSignal.timeout(15000) }).then(r => r.json());
    results.push({ name, status: data.status, candidates: data.candidates || [] });
    console.log(name, data.status, data.candidates?.[0]?.name || '');
  } catch (e) { results.push({ name, status: 'FAILED' }); console.log(name, 'FAILED'); }
  fs.writeFileSync('.mini/shortlist-resolved.json', JSON.stringify(results, null, 2));
}
fs.writeFileSync('.mini/shortlist-resolved.json', JSON.stringify(results, null, 2));
console.log('resolved', results.length);
