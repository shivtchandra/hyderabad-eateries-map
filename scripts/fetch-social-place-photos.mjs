import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
config({ path: path.join(root, ".env.local"), quiet: true });

const key = process.env.GOOGLE_MAPS_API_KEY;
if (!key) throw new Error("GOOGLE_MAPS_API_KEY missing");

const venues = [
  { slug: "anaganaga", query: "Anaganaga Telugu Culinary Tales Road Number 45 Jubilee Hills Hyderabad" },
  { slug: "foxie", query: "Foxie Cocktail Bar Road Number 45 Jubilee Hills Hyderabad" },
  { slug: "pickle-district", query: "Pickle District Madikeri Khajaguda Hyderabad" },
];
const out = path.join(root, "public", "social", "new-on-hyd-map", "october-2026", "source");
fs.mkdirSync(out, { recursive: true });

async function json(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

for (const venue of venues) {
  const search = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
  search.searchParams.set("query", venue.query);
  search.searchParams.set("key", key);
  const found = await json(search);
  const place = found.results?.[0];
  if (!place?.place_id) throw new Error(`${venue.slug}: place not found (${found.status})`);

  const details = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  details.searchParams.set("place_id", place.place_id);
  details.searchParams.set("fields", "name,formatted_address,geometry,photos,url");
  details.searchParams.set("key", key);
  const record = (await json(details)).result;
  const refs = (record?.photos || []).slice(0, 6);

  const dir = path.join(out, venue.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "place.json"), JSON.stringify({
    placeId: place.place_id,
    name: record?.name || place.name,
    address: record?.formatted_address || place.formatted_address,
    location: record?.geometry?.location || place.geometry?.location,
    mapsUrl: record?.url || null,
    photoCount: refs.length,
  }, null, 2) + "\n");

  for (let i = 0; i < refs.length; i++) {
    const photo = new URL("https://maps.googleapis.com/maps/api/place/photo");
    photo.searchParams.set("maxwidth", "1600");
    photo.searchParams.set("photo_reference", refs[i].photo_reference);
    photo.searchParams.set("key", key);
    const response = await fetch(photo, { redirect: "follow" });
    if (!response.ok) throw new Error(`${venue.slug} photo ${i + 1}: HTTP ${response.status}`);
    fs.writeFileSync(path.join(dir, `${i + 1}.jpg`), Buffer.from(await response.arrayBuffer()));
  }
  console.log(JSON.stringify({ slug: venue.slug, name: record?.name, photos: refs.length }));
}
