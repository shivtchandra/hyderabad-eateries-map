/**
 * Append the current verified restaurant deals to a compact rolling 28-day
 * observation file. Repeated runs on the same Hyderabad date are deduplicated.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { coverageStats, updateOfferHistory } from "../lib/offerIntelligence.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const offersPath = process.env.OFFERS_FILE || path.join(root, "data", "curated-offers.json");
const historyPath = process.env.OFFER_HISTORY_FILE || path.join(root, "data", "offer-history.json");
const coveragePath = process.env.OFFER_COVERAGE_FILE || path.join(root, "data", "offer-coverage.json");
const eateriesPath = path.join(root, "data", "eateries.json");

const offers = JSON.parse(fs.readFileSync(offersPath, "utf8"));
const previous = fs.existsSync(historyPath) ? JSON.parse(fs.readFileSync(historyPath, "utf8")) : null;
const observedAt = offers.updatedAt || new Date().toISOString();
const eateries = fs.existsSync(eateriesPath) ? JSON.parse(fs.readFileSync(eateriesPath, "utf8")) : [];
const eateriesById = new Map(eateries.map((eatery) => [eatery.id, eatery]));
const stop = new Set(["the", "restaurant", "cafe", "bar", "kitchen", "hotel", "hyderabad", "and", "by"]);
const words = (value) => new Set(String(value || "").toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, " ").split(/\s+/).filter((word) => word.length > 1 && !stop.has(word)));
const strictLegacyDistrictMatch = (source, entry, eatery) => {
  const slugWords = words(source.url?.split("/").filter(Boolean).pop());
  const nameWords = words(entry.name || eatery?.name);
  const localityWords = words(entry.area || eatery?.area || eatery?.discoveredIn);
  const nameHits = [...nameWords].filter((word) => slugWords.has(word)).length;
  const localityHit = [...localityWords].some((word) => slugWords.has(word));
  return nameWords.size > 0 && nameHits / nameWords.size >= 0.8 && localityWords.size > 0 && localityHit;
};

for (const [spotId, entry] of Object.entries(offers.spots || {})) {
  const eatery = eateriesById.get(spotId);
  for (const platform of ["district", "swiggy"]) {
    if (!entry[platform]) continue;
    // Normalization is computed by the API/UI. Do not duplicate it into the
    // main payload, which is sent to every offers visitor.
    delete entry[platform].normalizedOffers;
    const source = entry[platform];
    const fallbackId = platform === "district" ? source.url?.split("/").filter(Boolean).pop() : source.id;
    source.venue ||= {
      id: fallbackId || null,
      name: source.name || entry.name || eatery?.name || null,
      locality: source.locality || entry.area || eatery?.area || eatery?.discoveredIn || null,
      lat: source.lat ?? eatery?.lat ?? null,
      lng: source.lng ?? eatery?.lng ?? null,
      url: source.url || null,
    };
    if (!source.match || source.match.method === "legacy-verified-url") {
      const verifiedLegacy = platform === "swiggy" || strictLegacyDistrictMatch(source, entry, eatery);
      source.match = {
        status: verifiedLegacy ? "verified" : "uncertain",
        method: platform === "swiggy" ? "legacy-coordinates-name" : verifiedLegacy ? "legacy-name-locality" : "legacy-url-unverified",
        matchedAt: source.fetchedAt || observedAt,
      };
    }
  }
}

const history = updateOfferHistory(previous, offers, observedAt);

const coverage = {
  updatedAt: observedAt,
  ...coverageStats(offers.spots, offers.coverage || {}),
};
offers.coverage = coverage;

fs.writeFileSync(offersPath, JSON.stringify(offers, null, 2) + "\n", "utf8");
fs.writeFileSync(historyPath, JSON.stringify(history, null, 2) + "\n", "utf8");
fs.writeFileSync(coveragePath, JSON.stringify(coverage, null, 2) + "\n", "utf8");

console.log(`Offer history: ${Object.keys(history.spots).length} spots, retained ${history.retentionDays} days.`);
console.log(`Coverage: District ${coverage.matched.district}, Swiggy ${coverage.matched.swiggy}, both ${coverage.matched.both}.`);
